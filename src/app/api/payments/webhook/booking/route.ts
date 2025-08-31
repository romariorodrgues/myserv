import mercadoPagoConfig from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, PaymentStatus } from "@/types";
import { Payment } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";

interface MercadoPagoWebhookNotification {
  id: number;
  live_mode: boolean;
  type: "payment" | "plan" | "subscription" | "invoice";
  date_created: string;
  user_id: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

function mapPaymentStatus(status: string): PaymentStatus {
  switch (status) {
    case "approved":
      return PaymentStatus.APPROVED;
    case "pending":
      return PaymentStatus.PENDING;
    case "rejected":
      return PaymentStatus.REJECTED;
    case "in_process":
      return PaymentStatus.PROCESSING;
    default:
      return PaymentStatus.PENDING;
  }
}

function mapPaymentMethod(method: string | undefined): PaymentMethod {
  switch (method) {
    case "credit_card":
      return PaymentMethod.CREDIT_CARD;
    case "pix":
      return PaymentMethod.PIX;
    case "bolbradesco":
      return PaymentMethod.BOLETO;
    default:
      return PaymentMethod.CREDIT_CARD;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, data } =
      (await request.json()) as MercadoPagoWebhookNotification;

    if (type === "payment") {
      const payment = new Payment(mercadoPagoConfig);
      const paymentData = await payment.get({ id: data.id });

      console.log("Received payment data:", paymentData.metadata);

      if (!paymentData) {
        return NextResponse.json({ message: "Payment Not Found" }, { status: 404 });
      }

      const updatedPayment = await prisma.payment.upsert({
        where: { gatewayPaymentId: String(paymentData.id) },
        update: {
          status: mapPaymentStatus(paymentData.status as string),
          amount: paymentData.transaction_amount,
          currency: paymentData.currency_id,
          paymentMethod: mapPaymentMethod(paymentData.payment_type_id),
          description: paymentData.description,
        },
        create: {
          userId: paymentData.metadata.payer.user_id,
          amount: paymentData.transaction_amount as number,
          currency: paymentData.currency_id,
          paymentMethod: mapPaymentMethod(paymentData.payment_type_id),
          gateway: "MERCADO_PAGO",
          gatewayPaymentId: String(paymentData.id),
          status: mapPaymentStatus(paymentData.status as string),
          description: paymentData.description,
          serviceRequestId: paymentData.metadata.booking.id
        },
      });

      return NextResponse.json(updatedPayment, { status: 200 });
    }

    return NextResponse.json(
      { message: "Unhandled notification type: " + type },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
