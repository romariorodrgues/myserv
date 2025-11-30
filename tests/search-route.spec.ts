/**
 * Basic assertions for the search API to guarantee filters & pagination.
 * Run with: npx tsx tests/search-route.spec.ts
 */

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'

import { prisma } from '@/lib/prisma'
import { GET as searchHandler } from '@/app/api/services/search/route'

type CreatedEntities = {
  userIds: string[]
  serviceProviderIds: string[]
  serviceIds: string[]
  categoryIds: string[]
}

const created: CreatedEntities = {
  userIds: [],
  serviceProviderIds: [],
  serviceIds: [],
  categoryIds: [],
}

const buildRequest = (params: Record<string, string>) => {
  const url = new URL('http://localhost/api/services/search')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new NextRequest(url.toString())
}

async function setupSearchFixtures() {
  const sharedPassword = await bcrypt.hash('SearchFlow123!', 10)

  const createCategoryWithService = async (name: string, icon: string) => {
    const category = await prisma.serviceCategory.create({
      data: {
        id: randomUUID(),
        name,
        description: `${name} - categoria teste`,
        icon,
        isLeaf: true,
        isActive: true,
        level: 1,
      },
    })
    created.categoryIds.push(category.id)

    const service = await prisma.service.create({
      data: {
        id: randomUUID(),
        name,
        description: `${name} profissional`,
        categoryId: category.id,
        isActive: true,
      },
    })
    created.serviceIds.push(service.id)

    return service
  }

  const laundryService = await createCategoryWithService('Lavagem Residencial Teste', 'laundry_icon')
  const cleaningService = await createCategoryWithService('Diarista Premium Teste', 'cleaning_icon')

  const createProvider = async (index: number, overrides?: { city?: string; basePrices?: Record<string, number>; homeServices?: Record<string, boolean> }) => {
    const email = `provider-search-${index}@teste.com`
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        name: `Prestador Teste ${index}`,
        phone: '(11) 97777-0000',
        cpfCnpj: `${index}`.padEnd(11, '3'),
        password: sharedPassword,
        userType: 'PROVIDER',
        isActive: true,
        isApproved: true,
        approvalStatus: 'APPROVED',
        emailVerified: true,
        phoneVerified: true,
      },
    })
    created.userIds.push(user.id)

    await prisma.address.create({
      data: {
        userId: user.id,
        street: 'Rua Teste',
        number: `${100 + index}`,
        district: 'Centro',
        city: overrides?.city ?? 'Testville',
        state: 'SP',
        zipCode: `0100${index}-000`,
        latitude: -23.55 - index * 0.001,
        longitude: -46.63 - index * 0.001,
      },
    })

    const provider = await prisma.serviceProvider.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        hasScheduling: true,
        hasQuoting: true,
        chargesTravel: false,
        serviceRadiusKm: 40,
      },
    })
    created.serviceProviderIds.push(provider.id)

    const assignments = [laundryService, cleaningService]
    for (const service of assignments) {
      const base = overrides?.basePrices?.[service.id] ?? (service.id === laundryService.id ? 120 : 180)
      const providesHome = overrides?.homeServices?.[service.id] ?? (service.id === cleaningService.id)
      await prisma.serviceProviderService.create({
        data: {
          id: randomUUID(),
          serviceProviderId: provider.id,
          serviceId: service.id,
          basePrice: base,
          unit: 'FIXED',
          description: `Serviço ${service.name} com qualidade`,
          offersScheduling: service.id === cleaningService.id,
          providesHomeService: providesHome,
          providesLocalService: !providesHome,
        },
      })
    }

    return provider
  }

  await createProvider(1)
  await createProvider(2, {
    basePrices: {
      [laundryService.id]: 90,
      [cleaningService.id]: 150,
    },
    homeServices: {
      [laundryService.id]: false,
      [cleaningService.id]: true,
    },
  })

  // provider in different city for city filter test
  await createProvider(3, {
    city: 'OutraCidade',
    basePrices: {
      [laundryService.id]: 130,
      [cleaningService.id]: 160,
    },
    homeServices: {
      [laundryService.id]: false,
      [cleaningService.id]: false,
    },
  })
}

async function teardownFixtures() {
  await prisma.serviceProviderService.deleteMany({ where: { serviceProviderId: { in: created.serviceProviderIds } } })
  await prisma.serviceProvider.deleteMany({ where: { id: { in: created.serviceProviderIds } } })
  await prisma.address.deleteMany({ where: { userId: { in: created.userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: created.userIds } } })
  await prisma.service.deleteMany({ where: { id: { in: created.serviceIds } } })
  await prisma.serviceCategory.deleteMany({ where: { id: { in: created.categoryIds } } })
}

async function fetchSearch(params: Record<string, string>) {
  const response = await searchHandler(buildRequest(params))
  assert.equal(response.status, 200, 'search handler should return 200')
  return response.json() as Promise<any>
}

async function runAssertions() {
  await setupSearchFixtures()

  try {
    const allResults = await fetchSearch({ city: 'Testville', limit: '10' })
    assert.equal(allResults.resultsPagination.total, 4, 'should return four services in Testville')

    const names = allResults.results.map((item: any) => item.serviceName)
    assert(names.some((name: string) => name.includes('Lavagem Residencial Teste')), 'should include laundry service')

    const queryResults = await fetchSearch({ q: 'Diarista', limit: '10' })
    assert.equal(queryResults.resultsPagination.total, 3, 'three diarista services expected')
    assert(queryResults.results.every((item: any) => item.serviceName.includes('Diarista')), 'query filter should match diarista services')

    const homeServiceResults = await fetchSearch({ homeService: 'true', limit: '10' })
    assert(homeServiceResults.results.every((item: any) => item.providesHomeService), 'homeService filter should only return home services')

    const priceSorted = await fetchSearch({ city: 'Testville', sortBy: 'PRICE_LOW', limit: '10' })
    const prices = priceSorted.results.map((item: any) => item.basePrice)
    const sortedPrices = [...prices].sort((a, b) => (a ?? Infinity) - (b ?? Infinity))
    assert.deepEqual(prices, sortedPrices, 'PRICE_LOW should sort ascending by base price')

    const paginated = await fetchSearch({ city: 'Testville', limit: '2', page: '2' })
    assert.equal(paginated.results.length, 2, 'page 2 should return remaining items respecting limit')
    assert.equal(paginated.resultsPagination.total, 4, 'total should reflect all matching entries')
    assert.equal(paginated.resultsPagination.pages, 2, 'with limit=2 and total=4 we expect 2 pages')

    console.log('✅ Search API filters and pagination validated successfully.')
  } finally {
    await teardownFixtures()
    await prisma.$disconnect()
  }
}

runAssertions().catch((error) => {
  console.error('❌ Search API validation failed:', error)
  process.exitCode = 1
})
