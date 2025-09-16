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
    let planType: 'enterprise' | 'monthly' = 'enterprise'
    try {
      const body = await request.json()
      if (body?.planType === 'monthly') planType = 'monthly'
      // Optional: coupon code
      ;(request as any)._couponCode = body?.couponCode ? String(body.couponCode).trim().toUpperCase() : undefined
    } catch {}

    let itemId: string, title: string, unitPrice: number
    let planRecord: { id: string; name: string } | null = null
    // Enforce PF/PJ rule at checkout time (safe inference by document length)
    const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { cpfCnpj: true } })
    const isPJ = !!dbUser?.cpfCnpj && dbUser.cpfCnpj.replace(/\D/g,'').length > 11
    if (isPJ && planType !== 'enterprise') {
      return NextResponse.json({ error: 'Pessoa jurídica deve escolher Enterprise' }, { status: 400 })
    }
    if (!isPJ && planType === 'enterprise') {
      // PF pode escolher enterprise? Pela sua regra, não. Bloqueia.
      return NextResponse.json({ error: 'Pessoa física não pode escolher Enterprise' }, { status: 400 })
    }
    if (planType === 'enterprise') {
      const enterprisePlan = await prisma.plan.findFirst({ where: { name: 'Enterprise', isActive: true } })
      if (!enterprisePlan) return NextResponse.json({ message: 'Invalid Plan' }, { status: 400 })
      itemId = enterprisePlan.id
      title = 'MyServ Enterprise Plan'
      const s = await prisma.systemSettings.findUnique({ where: { key: 'PLAN_ENTERPRISE_PRICE' } })
      unitPrice = Number(s?.value || enterprisePlan.price || 0) || enterprisePlan.price
      planRecord = { id: enterprisePlan.id, name: enterprisePlan.name }
    } else {
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
      itemId = premiumPlan.id
      title = 'MyServ Plano Mensal Profissional'
      unitPrice = monthlyPrice
      planRecord = { id: premiumPlan.id, name: premiumPlan.name }
    }

    const preference = new Preference(mercadoPagoConfig);

    // Validate coupon (optional) and compute final price
    let couponMeta: { couponId?: string; couponCode?: string; amountOff?: number } = {}
    try {
      const couponCode = (request as any)._couponCode as string | undefined
      if (couponCode) {
        const c = await prisma.coupon.findFirst({ where: { code: couponCode, isActive: true } })
        const now = new Date()
        const appliesTo = planType === 'monthly' ? 'PREMIUM' : 'ENTERPRISE'
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
                planType: planType === 'enterprise' ? 'ENTERPRISE' : 'PREMIUM',
              }
            : undefined,
        },
        external_reference: itemId,
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
