import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserTypeValues, type UserType } from "@/types";
import { isValidCPF, isValidCNPJ } from "@/utils";

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

    // Criação do usuário
    let user;

    try {
      user = await prisma.user.create({
        data: {
          ...validatedData,
          password: hashedPassword,
          isApproved: validatedData.userType === UserTypeValues.CLIENT,
        },
      });
    } catch (err) {
      console.error("Erro ao criar usuário no banco:", err);
      throw err; // ou NextResponse.json({ error: 'Erro ao salvar usuário' }, { status: 500 })
    }

    // Criação de perfil
    if (validatedData.userType === UserTypeValues.CLIENT) {
      await prisma.clientProfile.create({ data: { userId: user.id } });
    } else {
      await prisma.serviceProvider.create({
        data: {
          userId: user.id,
          hasScheduling: false,
          hasQuoting: true,
          chargesTravel: false,
          subscriptions: {
            create: {
              planId: 'cmekbe32x000q4rbwcskidkvu',
              status: 'ACTIVE',
              startDate: new Date(),
              isAutoRenew: true,
            }
          }
        },
      });
    }

    // Remover a senha da resposta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
