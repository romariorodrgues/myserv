import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const mercadoPagoConfig = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export type TSubscribeResponde = {
    preferenceId: string,
    initialPoint: string,
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const preference = new Preference(mercadoPagoConfig);

    const { id, init_point } = await preference.create({ body: {
      items: [
        {
          id: '123123123',
          title: 'MyServ Enterprise Plan',
          quantity: 1,
          currency_id: "BRL",
          unit_price: 59.9,
        },
      ],
      payer: {
        name: body.payer?.name,
        email: body.payer?.email,
      },
      back_urls: {
        success: `${process.env.BASE_URL}/success`,
        failure: `${process.env.BASE_URL}/error`,
        pending:`${process.env.BASE_URL}/pending`,
      },
      notification_url: `${process.env.BASE_URL}/api/payments/webhook`,
      auto_return: "approved",
    } });

    return NextResponse.json({ preferenceId: id, initialPoint: init_point }, { status: 200 });
  } catch (error: any) {
    console.error("Erro ao criar preferência:", error);
    return NextResponse.json(
      { error: "Erro ao criar preferência", details: error.message },
      { status: 500 }
    );
  }
}
