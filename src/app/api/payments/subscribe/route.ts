import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";
import mercadoPagoConfig from "@/lib/mercadopago";

export type TSubscribeResponde = {
  preferenceId: string;
  initialPoint: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log('body', body)

    // valida pagador
    const payer = await prisma.user.findFirst({
      where: { id: body.payerId, isActive: true },
      include: {
        serviceProvider: true,
      },
    });

    console.log('payer', payer)

    if (!payer)
      return NextResponse.json({ message: "Payer Not Found" }, { status: 404 });

    // valida plano
    const enterprisePlan = await prisma.plan.findFirst({
      where: { name: "Enterprise", isActive: true },
    });

    if (!enterprisePlan)
      return NextResponse.json({ message: "Invalid Plan" }, { status: 400 });

    // cria preferencia
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
            userId: payer.id
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


// coisas para fazer
// 1. verificar pq a rota de buscar dados do usuário logado está vindo os dados do admin
// 2. finalizar a lógica de criação do pagamento via webhook