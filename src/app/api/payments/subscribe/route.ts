import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";
import mercadoPagoConfig from "@/lib/mercadopago";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type TSubscribeResponde = {
  preferenceId: string;
  initialPoint: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const payer = await prisma.user.findFirst({
      where: { id: body.payerId, isActive: true },
      include: {
        serviceProvider: true,
      },
    });

    if (!payer)
      return NextResponse.json({ message: "Payer Not Found" }, { status: 404 });

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
          name: payer.name,
          email: payer.email,
        },
        back_urls: {
          success: `${process.env.BASE_URL}/success`,
          failure: `${process.env.BASE_URL}/error`,
          pending: `${process.env.BASE_URL}/pending`,
        },
        notification_url: `${process.env.BASE_URL}/api/payments/webhook`,
        auto_return: "approved",
        metadata: {
          payer: {
            name: payer.name,
            email: payer.email,
            providerId: payer.serviceProvider?.id,
            userId: payer.id,
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
        userId: payer.id,
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
                status: 'ACTIVE',
              }
            },
          },
        },
      });
    }

    return NextResponse.json({ message: 'Reset Subscriptions' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
