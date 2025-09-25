import { getMercadoPagoConfig } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, PaymentStatus, UserTypeValues } from "@/types";
import { Plan } from "@prisma/client";
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
      const mercadoPagoConfig = getMercadoPagoConfig();

      if (!mercadoPagoConfig) {
        console.error("[PAYMENTS_WEBHOOK_SUBSCRIPTION] MERCADOPAGO_ACCESS_TOKEN não está configurado");
        return NextResponse.json(
          { error: "Configuração de pagamento indisponível" },
          { status: 503 }
        );
      }

      const payment = new Payment(mercadoPagoConfig);
      const paymentData = await payment.get({ id: data.id });

      if (!paymentData) {
        return NextResponse.json({ message: "Payment Not Found" }, { status: 404 });
      }

      const metadataPayer = (paymentData.metadata?.payer || {}) as {
        userId?: string
        user_id?: string
        providerId?: string
        provider_id?: string
      }

      const pendingRegistrationId = paymentData.metadata?.pendingRegistrationId as string | undefined

      if (pendingRegistrationId && paymentData.status !== 'approved') {
        return NextResponse.json({ message: 'Registration payment pending' }, { status: 200 })
      }

      let resolvedUserId = (metadataPayer.userId || metadataPayer.user_id) as string | undefined
      let resolvedProviderId = (metadataPayer.providerId || metadataPayer.provider_id) as string | undefined

      if (pendingRegistrationId && paymentData.status === 'approved' && !resolvedUserId) {
        const pending = await prisma.pendingProviderRegistration.findUnique({ where: { id: pendingRegistrationId } })

        if (pending) {
          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { email: pending.email },
                { cpfCnpj: pending.cpfCnpj },
              ],
            },
            include: { serviceProvider: true },
          })

          if (existingUser) {
            resolvedUserId = existingUser.id
            resolvedProviderId = existingUser.serviceProvider?.id
            await prisma.pendingProviderRegistration.delete({ where: { id: pending.id } })
          } else {
            const createdUser = await prisma.user.create({
              data: {
                name: pending.name,
                email: pending.email,
                phone: pending.phone,
                cpfCnpj: pending.cpfCnpj,
                userType: pending.userType,
                password: pending.passwordHash,
                isApproved: false,
                gender: pending.gender,
                maritalStatus: pending.maritalStatus,
                dateOfBirth: pending.dateOfBirth,
              },
            })

            if (pending.userType === UserTypeValues.SERVICE_PROVIDER) {
              const createdProvider = await prisma.serviceProvider.create({
                data: {
                  userId: createdUser.id,
                  hasScheduling: false,
                  hasQuoting: true,
                  chargesTravel: false,
                  hasDriverLicense: pending.hasDriverLicense,
                  driverLicenseNumber: pending.driverLicenseNumber,
                  driverLicenseCategory: pending.driverLicenseCategory,
                  driverLicenseExpiresAt: pending.driverLicenseExpiresAt,
                },
              })
              resolvedProviderId = createdProvider.id
            }

            resolvedUserId = createdUser.id

            await prisma.pendingProviderRegistration.delete({ where: { id: pending.id } })
          }
        }
      }

      if (!resolvedUserId) {
        return NextResponse.json({ message: 'Unable to resolve user for payment' }, { status: 400 })
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
          userId: resolvedUserId,
          amount: paymentData.transaction_amount as number,
          currency: paymentData.currency_id,
          paymentMethod: mapPaymentMethod(paymentData.payment_type_id),
          gateway: "MERCADO_PAGO",
          gatewayPaymentId: String(paymentData.id),
          status: mapPaymentStatus(paymentData.status as string),
          description: paymentData.description,
        },
      })

      if (updatedPayment.status === "APPROVED") {
        const metadataPlan = paymentData.metadata?.plan as
          | { planId?: string; planName?: string; planType?: string }
          | undefined
        const externalReference = typeof paymentData.external_reference === 'string'
          ? paymentData.external_reference
          : undefined

        const planIdCandidates = [
          metadataPlan?.planId,
          externalReference && externalReference.length === 36 ? externalReference : undefined,
        ].filter((value): value is string => Boolean(value))

        const planNameCandidates = [
          metadataPlan?.planName,
          metadataPlan?.planType === 'PREMIUM' ? 'Premium' : undefined,
          externalReference === 'monthly' ? 'Premium' : undefined,
          externalReference && externalReference.length !== 36 ? externalReference : undefined,
        ].filter((value): value is string => Boolean(value))

        let targetPlan: Plan | null = null
        for (const candidate of planIdCandidates) {
          const plan = await prisma.plan.findUnique({ where: { id: candidate } })
          if (plan?.isActive) {
            targetPlan = plan
            break
          }
        }

        if (!targetPlan) {
          for (const name of planNameCandidates) {
            const plan = await prisma.plan.findFirst({ where: { name, isActive: true } })
            if (plan) {
              targetPlan = plan
              break
            }
          }
        }

        if (!targetPlan) {
          targetPlan = await prisma.plan.findFirst({ where: { name: 'Premium', isActive: true } })
        }

        if (!targetPlan) {
          return NextResponse.json({ message: 'Plan not found or is not active' }, { status: 404 })
        }

        let serviceProviderId = resolvedProviderId || (metadataPayer.providerId || metadataPayer.provider_id) as string | undefined
        if (!serviceProviderId) {
          return NextResponse.json({ message: 'Service provider not found in metadata' }, { status: 400 })
        }

        const now = new Date()
        const existingSubscription = await prisma.subscription.findFirst({
          where: { serviceProviderId, status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
        })

        if (existingSubscription && existingSubscription.planId !== targetPlan.id) {
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: { status: 'CANCELLED', endDate: now },
          })
        }

        const baseDate =
          existingSubscription && existingSubscription.planId === targetPlan.id && existingSubscription.endDate && existingSubscription.endDate > now
            ? existingSubscription.endDate
            : now
        const { startDate, endDate } = getOneMonthInterval(baseDate)

        if (existingSubscription && existingSubscription.planId === targetPlan.id) {
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              endDate,
              payments: { connect: { id: updatedPayment.id } },
            },
          })
        } else {
          await prisma.subscription.create({
            data: {
              serviceProviderId,
              planId: targetPlan.id,
              startDate,
              endDate,
              isAutoRenew: false,
              status: 'ACTIVE',
              payments: { connect: { id: updatedPayment.id } },
            },
          })
        }

        await prisma.serviceProvider.update({
          where: { id: serviceProviderId },
          data: { planId: targetPlan.id },
        })

        try {
          const coupon = paymentData.metadata?.coupon
          const userId = resolvedUserId
          if (coupon?.couponId && userId) {
            await prisma.couponRedemption.upsert({
              where: { paymentId: updatedPayment.id },
              update: {},
              create: {
                couponId: String(coupon.couponId),
                userId,
                planId: targetPlan.id,
                amountOff: typeof coupon.amountOff === 'number' ? coupon.amountOff : null,
                paymentId: updatedPayment.id,
              },
            })
          }
        } catch (e) {
          console.error('[WEBHOOK][COUPON] redemption error', e)
        }
      }

      return NextResponse.json({ message: 'successful subscription to the Premium plan' }, { status: 200 });
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
