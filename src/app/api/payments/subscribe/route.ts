import { NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { prisma } from "@/lib/prisma";
import mercadoPagoConfig from "@/lib/mercadopago";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Plan } from "@/types";

export interface CreatePreferenceResponse {
  preferenceId: string;
  initialPoint: string;
}

export interface SubscriptionResponse {
  id: string;
  planId: string;
  serviceProviderId: string;
  status: string;
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
          where: { status: "ACTIVE", endDate: { gte: new Date() } },
          include: { plan: true },
        },
      },
    });

    if (!serviceProvider)
      return NextResponse.json(
        { message: "You are not a provider" },
        { status: 401 }
      );

    return NextResponse.json(serviceProvider.subscriptions[0] || null, {
      status: 200,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    // Decide qual plano
    try {
      const body = await request.json()
      ;(request as any)._couponCode = body?.couponCode ? String(body.couponCode).trim().toUpperCase() : undefined
    } catch {}

    const s = await prisma.systemSettings.findUnique({ where: { key: 'PLAN_MONTHLY_PRICE' } })
    const monthlyPrice = Number(s?.value || '39.9') || 39.9
    const premiumPlan = await prisma.plan.upsert({
      where: { name: 'Premium' },
      update: {
        price: monthlyPrice,
        isActive: true,
      },
      create: {
        name: 'Premium',
        description: 'Plano mensal para profissionais MyServ',
        price: monthlyPrice,
        billingCycle: 'MONTHLY',
        features: JSON.stringify([
          'Propostas ilimitadas',
          'Agenda personalizada',
          'Gestão de clientes e pagamentos',
        ]),
        isActive: true,
      },
    })

    const itemId = premiumPlan.id
    const title = 'MyServ Plano Mensal Profissional'
    let unitPrice = monthlyPrice
    const planRecord: { id: string; name: string } = { id: premiumPlan.id, name: premiumPlan.name }

    const preference = new Preference(mercadoPagoConfig);

    // Validate coupon (optional) and compute final price
    let couponMeta: { couponId?: string; couponCode?: string; amountOff?: number } = {}
    try {
      const couponCode = (request as any)._couponCode as string | undefined
      if (couponCode) {
        const c = await prisma.coupon.findFirst({ where: { code: couponCode, isActive: true } })
        const now = new Date()
        const appliesTo = 'PREMIUM'
        if (!c) throw new Error('Cupom inválido')
        if (c.validFrom && c.validFrom > now) throw new Error('Cupom não começou ainda')
        if (c.validTo && c.validTo < now) throw new Error('Cupom expirado')
        if (c.appliesTo !== 'ANY' && c.appliesTo !== appliesTo) throw new Error('Cupom não aplicável a este plano')
        // Compute amountOff
        let amountOff = 0
        if (c.discountType === 'PERCENT') amountOff = Math.round(unitPrice * (c.value / 100))
        else amountOff = Math.round(Math.min(c.value, unitPrice))
        const minimal = 1
        unitPrice = Math.max(minimal, unitPrice - amountOff)
        couponMeta = { couponId: c.id, couponCode: c.code, amountOff }
      }
    } catch (e) {
      // ignore invalid coupon silently for now; UI pode revalidar via /api/coupons/validate
    }

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
          name: session.user.name,
          email: session.user.email,
        },
        back_urls: {
          success: `${process.env.BASE_URL}/success`,
          failure: `${process.env.BASE_URL}/error`,
          pending: `${process.env.BASE_URL}/pending`,
        },
        notification_url: `${process.env.BASE_URL}/api/payments/webhook/subscription`,
        auto_return: "approved",
        metadata: {
          payer: {
            name: session.user.name,
            email: session.user.email,
            providerId: serviceProvider.id,
            userId: session.user.id,
          },
          coupon: couponMeta,
          plan: planRecord
            ? {
                planId: planRecord.id,
                planName: planRecord.name,
                planType: 'PREMIUM',
              }
            : undefined,
        },
        external_reference: itemId,
      },
    });

    await prisma.notification.create({
      data: {
        message:
          "A sua assinatura do plano profissional está pendente. Conclua o pagamento para aproveitar todos os benefícios.",
        title: "Pagamento Pendente",
        userId: session.user.id,
        type: "PAYMENT",
      },
    });

    return NextResponse.json(
      {
        preferenceId: id,
        initialPoint: init_point,
        finalPrice: unitPrice,
        coupon: couponMeta,
        plan: planRecord,
      },
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
