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

function getOneMonthInterval(base?: Date): { startDate: Date; endDate: Date } {
  const startDate = base ?? new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  return { startDate, endDate };
}

export async function POST(request: NextRequest) {
  try {
    const { type, data } =
      (await request.json()) as MercadoPagoWebhookNotification;

    if (type === "payment") {
      const payment = new Payment(mercadoPagoConfig);
      const paymentData = await payment.get({ id: data.id });

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
        },
      });

      if (updatedPayment.status === "APPROVED") {
        const enterprisePlan = await prisma.plan.findFirst({
          where: { name: "Enterprise", isActive: true },
        });

        if (!enterprisePlan) {
          return NextResponse.json({ message: "Plan Not Found" }, { status: 404 });
        }

        const serviceProviderId = paymentData.metadata.payer.provider_id as string;

        let subscription = await prisma.subscription.findFirst({
          where: {
            serviceProviderId,
            status: "ACTIVE",
          },
        });

        if (!subscription) {
          const { startDate, endDate } = getOneMonthInterval();
          subscription = await prisma.subscription.create({
            data: {
              serviceProviderId,
              planId: enterprisePlan.id,
              startDate,
              endDate,
              isAutoRenew: false,
              status: "ACTIVE",
              payments: { connect: { id: updatedPayment.id } },
            },
          });
        } else if (subscription.planId === enterprisePlan.id) {
          const { endDate } = getOneMonthInterval(
            subscription.endDate ?? new Date()
          );
          subscription = await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              endDate,
              payments: { connect: { id: updatedPayment.id } },
            },
          });
        } else {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "CANCELLED" },
          });

          const { startDate, endDate } = getOneMonthInterval();
          subscription = await prisma.subscription.create({
            data: {
              serviceProviderId,
              planId: enterprisePlan.id,
              startDate,
              endDate,
              isAutoRenew: false,
              status: "ACTIVE",
              payments: { connect: { id: updatedPayment.id } },
            },
          });
        }
      }

      return NextResponse.json({ message: 'successful subscription to the Enterprise plan' }, { status: 200 });
    }

    return NextResponse.json(
      { message: "Unhandled notification type:" + type },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
