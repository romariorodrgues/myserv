import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";
import mercadoPagoConfig from "@/lib/mercadopago";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SubscriptionStatus } from "@prisma/client";
import { Plan } from "@/types";

export interface CreatePreferenceResponse {
  preferenceId: string;
  initialPoint: string;
};

export interface SubscriptionResponse {
  id: string;
  planId: string;
  serviceProviderId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  plan: Plan;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceProvider = await prisma.serviceProvider.findFirst({
      where: { userId: session.user.id },
      include: {
        subscriptions: {
          where: { status: "ACTIVE" },
          include: { plan: true },
        },
      },
    });

    if (!serviceProvider)
      return NextResponse.json(
        { message: "You are not a provider" },
        { status: 401 }
      );

    return NextResponse.json(serviceProvider.subscriptions, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.name || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceProvider = await prisma.serviceProvider.findFirst({
      where: { userId: session.user.id },
      include: {
        subscriptions: true,
      },
    });

    if (!serviceProvider)
      return NextResponse.json(
        { message: "You are not a provider" },
        { status: 401 }
      );

    const enterprisePlan = await prisma.plan.findFirst({
      where: { name: "Enterprise", isActive: true },
    });

    if (!enterprisePlan)
      return NextResponse.json({ message: "Invalid Plan" }, { status: 400 });

    const preference = new Preference(mercadoPagoConfig);

    const { id, init_point } = await preference.create({
      body: {
        items: [
          {
            id: enterprisePlan.id,
            title: "MyServ Enterprise Plan",
            quantity: 1,
            currency_id: "BRL",
            unit_price: enterprisePlan.price,
          },
        ],
        payer: {
          name: session.user.name,
          email: session.user.email,
        },
        back_urls: {
          success: `${process.env.BASE_URL}/success`,
          failure: `${process.env.BASE_URL}/error`,
          pending: `${process.env.BASE_URL}/pending`,
        },
        notification_url: `${process.env.BASE_URL}/api/payments/webhook/subscribe`,
        auto_return: "approved",
        metadata: {
          payer: {
            name: session.user.name,
            email: session.user.email,
            providerId: serviceProvider.id,
            userId: session.user.id,
          },
        },
        external_reference: enterprisePlan.id,
      },
    });

    await prisma.notification.create({
      data: {
        message:
          "A sua inscrição para o plano Enterprise está pendente. Faça o pagamento para aproveitar todos os benefícios.",
        title: "Pagamento Pendente",
        userId: session.user.id,
        type: "PAYMENT",
      },
    });

    return NextResponse.json(
      { preferenceId: id, initialPoint: init_point },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Erro ao criar preferência:", error);
    return NextResponse.json(
      { error: "Erro ao criar preferência", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceProvider = await prisma.serviceProvider.findFirst({
      where: { userId: session.user.id },
      include: {
        subscriptions: { where: { status: "ACTIVE" } },
      },
    });

    if (serviceProvider?.subscriptions.length) {
      await Promise.all(
        serviceProvider?.subscriptions.map(async (sub) => {
          return await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              isAutoRenew: false,
              status: "EXPIRED",
            },
          });
        })
      );

      const startPlan = await prisma.plan.findFirst({
        where: { name: "Start" },
      });

      await prisma.serviceProvider.update({
        where: { id: serviceProvider.id },
        data: {
          planId: startPlan?.id,
          subscriptions: {
            update: {
              where: { id: startPlan?.id },
              data: {
                status: "ACTIVE",
              },
            },
          },
        },
      });
    }

    return NextResponse.json(
      { message: "Reset Subscriptions" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
