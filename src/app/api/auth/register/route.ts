import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserTypeValues, type UserType } from "@/types";
import { isValidCPF, isValidCNPJ } from "@/utils";
import { Preference } from "mercadopago";
import mercadoPagoConfig from "@/lib/mercadopago";
import { CURRENT_TERMS_VERSION } from '@/constants/legal'

const UserTypeArray = Object.values(UserTypeValues) as [
  UserType,
  ...UserType[]
];

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
  userType: z.enum(UserTypeArray),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(8, "Confirmação inválida"),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Deve aceitar os termos" }),
  }),
  // Campos opcionais adicionais (principalmente para prestador)
  personType: z.enum(["PF","PJ"]).optional(),
  selectedPlan: z.enum(["FREE","PREMIUM"]).optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  dateOfBirth: z.string().optional(), // ISO date
  hasDriverLicense: z.coerce.boolean().optional(),
  driverLicenseNumber: z.string().optional(),
  driverLicenseCategory: z.string().optional(),
  driverLicenseExpiresAt: z.string().optional(), // ISO date
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Parse + limpeza de dados
    const fullData = registerSchema.parse({
      ...body,
      email: body.email.trim().toLowerCase(),
      cpfCnpj: body.cpfCnpj.replace(/\D/g, ""),
    });

    // Extração sem confirmPassword
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword: _, acceptTerms: __, ...validatedData } = fullData;

    // Validação de CPF/CNPJ
    const isValidDocument =
      validatedData.cpfCnpj.length === 11
        ? isValidCPF(validatedData.cpfCnpj)
        : isValidCNPJ(validatedData.cpfCnpj);

    if (!isValidDocument) {
      return NextResponse.json({ error: "CPF/CNPJ inválido" }, { status: 400 });
    }

    // Verifica duplicidade
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { cpfCnpj: validatedData.cpfCnpj },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Usuário já cadastrado com este email ou CPF/CNPJ" },
        { status: 409 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Prestador precisa escolher o plano no passo final
    if (
      validatedData.userType === UserTypeValues.SERVICE_PROVIDER &&
      !fullData.selectedPlan
    ) {
      return NextResponse.json(
        { error: "Escolha um plano para continuar" },
        { status: 400 }
      );
    }

    // Regras PF/PJ x Plano (sem quebrar fluxos atuais)
    if (fullData.userType === UserTypeValues.SERVICE_PROVIDER) {
      const personType = fullData.personType || (fullData.cpfCnpj.replace(/\D/g, "").length > 11 ? 'PJ' : 'PF')
      const plan = fullData.selectedPlan
      if (personType === 'PJ' && plan !== 'PREMIUM') {
        return NextResponse.json({ error: 'Pessoa jurídica deve escolher o plano Profissional' }, { status: 400 })
      }
    }

    // Fluxo específico para prestador com plano pago: criar registro pendente + preferência Mercado Pago
    if (validatedData.userType === UserTypeValues.SERVICE_PROVIDER && fullData.selectedPlan && fullData.selectedPlan !== 'FREE') {
      const personType =
        fullData.personType ||
        (fullData.cpfCnpj.replace(/\D/g, "").length > 11 ? "PJ" : "PF");

      const pending = await prisma.pendingProviderRegistration.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          cpfCnpj: validatedData.cpfCnpj,
          passwordHash: hashedPassword,
          userType: validatedData.userType,
          personType,
          plan: fullData.selectedPlan,
          gender: validatedData.gender || null,
          maritalStatus: validatedData.maritalStatus || null,
          dateOfBirth: validatedData.dateOfBirth
            ? new Date(validatedData.dateOfBirth)
            : null,
          hasDriverLicense: !!validatedData.hasDriverLicense,
          driverLicenseNumber: validatedData.hasDriverLicense
            ? validatedData.driverLicenseNumber || null
            : null,
          driverLicenseCategory: validatedData.hasDriverLicense
            ? validatedData.driverLicenseCategory || null
            : null,
          driverLicenseExpiresAt:
            validatedData.hasDriverLicense && validatedData.driverLicenseExpiresAt
              ? new Date(validatedData.driverLicenseExpiresAt)
              : null,
          extraData: {
            selectedPlan: fullData.selectedPlan,
          },
        },
      });

      const preference = new Preference(mercadoPagoConfig);

      const premiumPlan = await prisma.plan.upsert({
        where: { name: "Premium" },
        update: {},
        create: {
          name: "Premium",
          description: "Plano mensal profissional",
          price: 39.9,
          billingCycle: "MONTHLY",
          features: JSON.stringify([
            "Propostas ilimitadas",
            "Agenda personalizada",
            "Gestão de clientes",
          ]),
        },
      });
      const s = await prisma.systemSettings.findUnique({
        where: { key: "PLAN_MONTHLY_PRICE" },
      });
      const unitPrice = Number(s?.value || premiumPlan.price || 39.9) || 39.9;
      const itemId = premiumPlan.id;
      const title = "MyServ Plano Mensal Profissional";

      const { id, init_point } = await preference.create({
        body: {
          items: [
            {
              id: itemId,
              title,
              quantity: 1,
              currency_id: "BRL",
              unit_price: unitPrice,
            },
          ],
          payer: {
            name: validatedData.name,
            email: validatedData.email,
          },
          notification_url: `${process.env.BASE_URL}/api/payments/webhook/subscription`,
          back_urls: {
            success: `${process.env.BASE_URL}/cadastrar/obrigado?pending=${pending.id}`,
            failure: `${process.env.BASE_URL}/cadastrar/obrigado?pending=${pending.id}&status=failure`,
            pending: `${process.env.BASE_URL}/cadastrar/obrigado?pending=${pending.id}&status=pending`,
          },
          auto_return: "approved",
          metadata: {
            pendingRegistrationId: pending.id,
            plan: {
              planId: itemId,
              planName: title,
              planType: 'PREMIUM',
            },
          },
          external_reference: `pending-registration:${pending.id}`,
        },
      });

      return NextResponse.json(
        {
          success: true,
          requiresPayment: true,
          preferenceId: id,
          initPoint: init_point,
          pendingId: pending.id,
        },
        { status: 200 }
      );
    }

    // Criação do usuário imediato (cliente ou prestador plano grátis)
    let user;

    try {
      user = await prisma.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          cpfCnpj: validatedData.cpfCnpj,
          userType: validatedData.userType,
          password: hashedPassword,
          isApproved: validatedData.userType === UserTypeValues.CLIENT,
          gender: validatedData.gender || null,
          maritalStatus: validatedData.maritalStatus || null,
          dateOfBirth: validatedData.dateOfBirth
            ? new Date(validatedData.dateOfBirth)
            : null,
          termsAcceptedAt: new Date(),
          termsVersion: CURRENT_TERMS_VERSION,
        },
      });
    } catch (err) {
      console.error("Erro ao criar usuário no banco:", err);
      throw err;
    }

    if (validatedData.userType === UserTypeValues.CLIENT) {
      await prisma.clientProfile.create({ data: { userId: user.id } });
    } else {
      await prisma.serviceProvider.create({
        data: {
          userId: user.id,
          hasScheduling: false,
          hasQuoting: true,
          chargesTravel: false,
          hasDriverLicense: !!validatedData.hasDriverLicense,
          driverLicenseNumber: validatedData.hasDriverLicense
            ? validatedData.driverLicenseNumber || null
            : null,
          driverLicenseCategory: validatedData.hasDriverLicense
            ? validatedData.driverLicenseCategory || null
            : null,
          driverLicenseExpiresAt:
            validatedData.hasDriverLicense && validatedData.driverLicenseExpiresAt
              ? new Date(validatedData.driverLicenseExpiresAt)
              : null,
        },
      });
    }

    const { password: _password, ...userWithoutSensitiveData } = user;

    return NextResponse.json(
      {
        success: true,
        message:
          validatedData.userType === UserTypeValues.CLIENT
            ? "Conta criada com sucesso! Você já pode fazer login."
            : "Cadastro realizado! Sua conta será analisada e aprovada em até 24 horas.",
        user: userWithoutSensitiveData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
}
