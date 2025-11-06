/**
 * Regression tests for provider acceptance flow.
 * Ensures que prestadores só conseguem aceitar solicitações se tiverem
 * assinatura ativa ou pagamento de desbloqueio aprovado.
 *
 * Executar com: npx tsx tests/bookings-acceptance.spec.ts
 */

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { PATCH as updateBookingStatus } from '@/app/api/bookings/[bookingId]/route'

type Created = {
  users: string[]
  serviceProviders: string[]
  serviceRequests: string[]
  services: string[]
  categories: string[]
  payments: string[]
  subscriptions: string[]
  plans: string[]
}

const created: Created = {
  users: [],
  serviceProviders: [],
  serviceRequests: [],
  services: [],
  categories: [],
  payments: [],
  subscriptions: [],
  plans: [],
}

const buildRequest = (bookingId: string, body: Record<string, unknown>) =>
  new NextRequest(`http://localhost/api/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const callPatch = (bookingId: string, body: Record<string, unknown>) =>
  updateBookingStatus(buildRequest(bookingId, body), {
    params: Promise.resolve({ bookingId }),
  } as any)

async function createBaseFixture() {
  const category = await prisma.serviceCategory.create({
    data: {
      id: randomUUID(),
      name: `Categoria Teste ${Date.now()}`,
      level: 1,
      isLeaf: true,
      isActive: true,
    },
  })
  created.categories.push(category.id)

  const service = await prisma.service.create({
    data: {
      id: randomUUID(),
      name: `Serviço Teste ${Date.now()}`,
      categoryId: category.id,
      isActive: true,
    },
  })
  created.services.push(service.id)

  const createUser = async (type: 'SERVICE_PROVIDER' | 'CLIENT') => {
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `${type.toLowerCase()}-${randomUUID()}@spec.com`,
        name: `${type} Spec`,
        phone: '(11)90000-0000',
        cpfCnpj: randomUUID().replace(/-/g, '').slice(0, 11),
        password: 'Spec123!',
        userType: type,
        isActive: true,
        isApproved: true,
      },
    })
    created.users.push(user.id)
    return user
  }

  const providerUser = await createUser('SERVICE_PROVIDER')
  const clientUser = await createUser('CLIENT')

  const serviceProvider = await prisma.serviceProvider.create({
    data: {
      id: randomUUID(),
      userId: providerUser.id,
      hasScheduling: false,
      hasQuoting: true,
      chargesTravel: false,
    },
  })
  created.serviceProviders.push(serviceProvider.id)

  const booking = await prisma.serviceRequest.create({
    data: {
      id: randomUUID(),
      clientId: clientUser.id,
      providerId: providerUser.id,
      serviceId: service.id,
      requestType: 'QUOTE',
      description: 'Teste de bloqueio',
      status: 'PENDING',
    },
  })
  created.serviceRequests.push(booking.id)

  return { bookingId: booking.id, providerUserId: providerUser.id }
}

async function teardown() {
  await prisma.payment.deleteMany({ where: { id: { in: created.payments } } })
  await prisma.subscription.deleteMany({ where: { id: { in: created.subscriptions } } })
  await prisma.plan.deleteMany({ where: { id: { in: created.plans } } })
  await prisma.serviceRequest.deleteMany({ where: { id: { in: created.serviceRequests } } })
  await prisma.serviceProvider.deleteMany({ where: { id: { in: created.serviceProviders } } })
  await prisma.user.deleteMany({ where: { id: { in: created.users } } })
  await prisma.service.deleteMany({ where: { id: { in: created.services } } })
  await prisma.serviceCategory.deleteMany({ where: { id: { in: created.categories } } })
}

async function run() {
  await teardown() // ensure clean slate from previous runs

  try {
    // 1) Prestador sem assinatura e sem pagamento deve ser bloqueado
    {
      const { bookingId } = await createBaseFixture()
      const res = await callPatch(bookingId, { status: 'ACCEPTED' })
      const body = await res.json()
      assert.equal(res.status, 402, 'should demand unlock payment or plan')
      assert.match(body.error, /Desbloqueie/i, 'error message should mention unlock requirement')
    }

    // 2) Pagamento aprovado para o prestador libera aceitação
    {
      const { bookingId, providerUserId } = await createBaseFixture()
      const payment = await prisma.payment.create({
        data: {
          id: randomUUID(),
          userId: providerUserId,
          serviceRequestId: bookingId,
          amount: 2.99,
          paymentMethod: 'PIX',
          gateway: 'SPEC',
          status: 'APPROVED',
          description: 'Teste pagamento desbloqueio',
        },
      })
      created.payments.push(payment.id)

      const res = await callPatch(bookingId, { status: 'ACCEPTED' })
      const body = await res.json()
      assert.equal(res.status, 200, 'status should update when payment exists')
      assert.equal(body.booking.status, 'ACCEPTED')
    }

    // 3) Assinatura ativa também libera aceitação mesmo sem pagamento
    {
      const { bookingId, providerUserId } = await createBaseFixture()
      const sp = await prisma.serviceProvider.findFirstOrThrow({
        where: { userId: providerUserId },
      })
      const plan = await prisma.plan.create({
        data: {
          id: randomUUID(),
          name: `Spec Plan ${Date.now()}`,
          description: 'Plano de teste',
          price: 15.99,
          billingCycle: 'MONTHLY',
          features: '[]',
          isActive: true,
        },
      })
      created.plans.push(plan.id)
      const subscription = await prisma.subscription.create({
        data: {
          id: randomUUID(),
          serviceProviderId: sp.id,
          planId: plan.id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: null,
          isAutoRenew: true,
        },
      })
      created.subscriptions.push(subscription.id)

      const res = await callPatch(bookingId, { status: 'ACCEPTED' })
      const body = await res.json()
      assert.equal(res.status, 200, 'active subscription should allow acceptance')
      assert.equal(body.booking.status, 'ACCEPTED')
    }

    console.log('✅ bookings-acceptance.spec.ts passed')
  } finally {
    await teardown()
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
