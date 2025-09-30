import { getMercadoPagoConfig } from "@/lib/mercadopago";
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
      const mercadoPagoConfig = getMercadoPagoConfig();

      if (!mercadoPagoConfig) {
        console.error("[PAYMENTS_WEBHOOK_BOOKING] MERCADOPAGO_ACCESS_TOKEN não está configurado");
        return NextResponse.json(
          { error: "Configuração de pagamento indisponível" },
          { status: 503 }
        );
      }

      const payment = new Payment(mercadoPagoConfig);
      const paymentData = await payment.get({ id: data.id });

      console.log("Received payment data:", paymentData.metadata);

      if (!paymentData) {
        return NextResponse.json({ message: "Payment Not Found" }, { status: 404 });
      }

      const metadataPayer = (paymentData.metadata?.payer || {}) as { userId?: string; user_id?: string; role?: string }
      const metadataBooking = paymentData.metadata?.booking as { id?: string } | undefined
      const payerUserId = metadataPayer.userId || metadataPayer.user_id
      const serviceRequestId = metadataBooking?.id

      if (!payerUserId || !serviceRequestId) {
        return NextResponse.json({ message: 'Metadados do pagamento incompletos' }, { status: 400 })
      }

      const payload = {
        userId: payerUserId,
        amount: paymentData.transaction_amount as number,
        currency: paymentData.currency_id,
        paymentMethod: mapPaymentMethod(paymentData.payment_type_id),
        gateway: 'MERCADO_PAGO' as const,
        gatewayPaymentId: String(paymentData.id),
        status: mapPaymentStatus(paymentData.status as string),
        description: paymentData.description,
        serviceRequestId,
      }

      let paymentRecord = await prisma.payment.findFirst({ where: { gatewayPaymentId: payload.gatewayPaymentId } })

      if (!paymentRecord) {
        paymentRecord = await prisma.payment.findFirst({
          where: {
            serviceRequestId,
            userId: payerUserId,
            gateway: 'MERCADO_PAGO',
            status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
            gatewayPaymentId: null,
          },
          orderBy: { createdAt: 'desc' },
        })
      }

      if (paymentRecord) {
        paymentRecord = await prisma.payment.update({ where: { id: paymentRecord.id }, data: payload })
      } else {
        paymentRecord = await prisma.payment.create({ data: payload })
      }

      return NextResponse.json(paymentRecord, { status: 200 });
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
