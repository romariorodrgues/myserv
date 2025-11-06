import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserTypeValues, type UserType } from "@/types";
import { isValidCPF, isValidCNPJ } from "@/utils";
import { Preference } from "mercadopago";
import { getMercadoPagoConfig } from "@/lib/mercadopago";
import { getCurrentTermsVersion } from '@/lib/legal'
import { parseImageDataUrl, saveProfileImage } from '@/lib/profile-image'

const UserTypeArray = Object.values(UserTypeValues) as [
  UserType,
  ...UserType[]
];

let ensuredUserTermsColumns = false;

async function ensureUserTermsColumns() {
  if (ensuredUserTermsColumns) return;

  const dbUrl = process.env.DATABASE_URL ?? '';
  const isSQLite = dbUrl.startsWith('file:') || dbUrl.startsWith('sqlite:') || dbUrl.includes('mode=memory');

  if (!isSQLite) {
    ensuredUserTermsColumns = true;
    return;
  }

  try {
    const columns = (await prisma.$queryRawUnsafe<any[]>("PRAGMA table_info('users')")) ?? [];
    const columnNames = new Set(columns.map((col) => String(col.name)));
    const pendingStatements: string[] = [];

    if (!columnNames.has("termsAcceptedAt")) {
      pendingStatements.push("ALTER TABLE users ADD COLUMN termsAcceptedAt DATETIME");
    }

    if (!columnNames.has("termsVersion")) {
      pendingStatements.push("ALTER TABLE users ADD COLUMN termsVersion TEXT");
    }

    for (const statement of pendingStatements) {
      await prisma.$executeRawUnsafe(statement);
    }

    ensuredUserTermsColumns = true;
  } catch (error) {
    console.error("Failed to ensure user terms columns", error);
  }
}

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
  profileImage: z.string().min(10, 'Foto de perfil obrigatória'),
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
    const { confirmPassword: _, acceptTerms: __, profileImage, ...validatedData } = fullData;

    let profileImageBuffer: Buffer
    try {
      const parsedImage = parseImageDataUrl(profileImage)
      profileImageBuffer = parsedImage.buffer
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Imagem de perfil inválida'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    let profileImagePath: string | null = null

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
    const currentTermsVersion = await getCurrentTermsVersion()

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
      console.info('[register] provider selected paid plan', {
        email: validatedData.email,
        plan: fullData.selectedPlan,
        personType: fullData.personType,
      })
      const mercadoPagoConfig = getMercadoPagoConfig();

      if (!mercadoPagoConfig) {
        console.error("Mercado Pago configuration missing while trying to create a paid provider registration preference");
        console.info('[register] preference created', { preferenceId: id, pendingId: pending.id })
        return NextResponse.json(
          {
            error: "Configuração de pagamento indisponível. Entre em contato com o suporte.",
          },
          { status: 503 }
        )
      }

      if (!profileImagePath) {
        profileImagePath = await saveProfileImage(profileImageBuffer)
      }

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
            termsVersion: currentTermsVersion,
            profileImagePath,
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
          price: 15.99,
          billingCycle: "MONTHLY",
          features: JSON.stringify([
            "Contatos desbloqueados automaticamente",
            "Solicitações ilimitadas durante todo o mês",
            "Suporte por chat",
            "Plano obrigatório para pessoa jurídica",
          ]),
        },
      });
      const s = await prisma.systemSettings.findUnique({
        where: { key: "PLAN_MONTHLY_PRICE" },
      });
      const unitPrice = Number(s?.value || premiumPlan.price || 15.99) || 15.99;
      const itemId = premiumPlan.id;
      const title = "MyServ Plano Mensal Profissional";

      try {
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
      } catch (mpError) {
        console.error("Mercado Pago preference creation failed:", mpError);
        await prisma.pendingProviderRegistration.delete({ where: { id: pending.id } }).catch(() => {
          console.warn("Unable to cleanup pending provider registration", pending.id);
        });

        return NextResponse.json(
          {
            error: "Não foi possível iniciar o pagamento. Verifique as credenciais do Mercado Pago.",
            details:
              mpError && typeof mpError === "object" && "message" in mpError
                ? (mpError as { message?: string }).message
                : undefined,
          },
          { status: 502 }
        );
      }
    }

    // Criação do usuário imediato (cliente ou prestador plano grátis)
    let user;

    await ensureUserTermsColumns();

    if (!profileImagePath) {
      profileImagePath = await saveProfileImage(profileImageBuffer)
    }

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
          termsVersion: currentTermsVersion,
          profileImage: profileImagePath,
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

    let details: string | undefined
    let hint: string | undefined

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      details = `${error.code}: ${error.message}`
      if (error.code === 'P2021' || error.code === 'P2022') {
        hint = 'Banco desatualizado. Rode as migrations mais recentes (prisma migrate deploy).'
      }
    } else if (error instanceof Error) {
      details = error.message
    } else if (typeof error === 'string') {
      details = error
    }

    return NextResponse.json(
      { error: "Erro interno do servidor", details, hint },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
}
