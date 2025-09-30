import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import GoogleMapsServerService from '@/lib/maps-server'
function normalizeDecimal(value: number | string | Prisma.Decimal | null | undefined) {
  if (value == null) return null
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (typeof (value as Prisma.Decimal).toNumber === 'function') {
    const parsed = (value as Prisma.Decimal).toNumber()
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ---- helper: TODAS as folhas (inclui root se já for leaf)
async function getDescendantLeafIds(rootId: string): Promise<string[]> {
  const queue: string[] = [rootId]
  const leaves: string[] = []

  while (queue.length) {
    const batch = await prisma.serviceCategory.findMany({
      where: { parentId: { in: queue } },
      select: { id: true, isLeaf: true }
    })
    queue.length = 0
    for (const n of batch) {
      if (n.isLeaf) leaves.push(n.id)
      else queue.push(n.id)
    }
  }

  const root = await prisma.serviceCategory.findUnique({
    where: { id: rootId }, select: { isLeaf: true }
  })
  if (root?.isLeaf) leaves.push(rootId)

  return Array.from(new Set(leaves))
}

// Validation schema
const advancedSearchSchema = z.object({
  q: z.string().optional(),
  leafCategoryId: z.string().optional(),
  categoryId: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  rating: z.number().optional(),
  availability: z.enum(['TODAY', 'THIS_WEEK']).optional(),
  hasQuoting: z.boolean().optional(),
  isHighlighted: z.boolean().optional(),
  // novos:
  lat: z.number().optional(),
  lng: z.number().optional(),
  radiusKm: z.number().default(30),
  hasScheduling: z.boolean().optional(),
  sortBy: z.enum(['RELEVANCE', 'DISTANCE', 'PRICE_LOW', 'PRICE_HIGH', 'RATING', 'NEWEST']).default('RELEVANCE'),
  page: z.number().default(1),
  limit: z.number().default(20),
  homeService: z.boolean().optional(),
  freeTravel: z.boolean().optional(),
  localService: z.boolean().optional(),
})


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // compat 'local' → city/state
    const localParam = searchParams.get('local') || searchParams.get('location')
    let cityFilter = searchParams.get('city')
    let stateFilter = searchParams.get('state')
    if (localParam && !cityFilter) {
      const parts = localParam.split(',').map(s => s.trim())
      if (parts.length >= 2) { cityFilter = parts[0]; stateFilter = parts[1] }
      else if (parts.length === 1) { cityFilter = parts[0] }
    }

    const availabilityParam = searchParams.get('availability')
    const ratingParam = searchParams.get('rating')
    const hasQuotingParam = searchParams.get('hasQuoting')
    const isHighlightedParam = searchParams.get('isHighlighted')
    const parsedRating = ratingParam != null ? Number(ratingParam) : undefined
    const ratingValue = parsedRating != null && Number.isFinite(parsedRating) ? parsedRating : undefined

    const input = advancedSearchSchema.parse({
  q: searchParams.get('q') || undefined,
  leafCategoryId: searchParams.get('leafCategoryId') || undefined,
  categoryId: searchParams.get('categoryId') || undefined,
  city: cityFilter || undefined,
  state: stateFilter || undefined,
  minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
  maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
  rating: ratingValue,
  availability: availabilityParam === 'TODAY' || availabilityParam === 'THIS_WEEK' ? availabilityParam : undefined,
  hasQuoting: hasQuotingParam === 'true' ? true : undefined,
  isHighlighted: isHighlightedParam === 'true' ? true : undefined,
  sortBy: (searchParams.get('sortBy') as any) || 'RELEVANCE',
  page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
  limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
  // novos:
  lat: searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined,
  lng: searchParams.get('lng') ? Number(searchParams.get('lng')) : undefined,
  radiusKm: searchParams.get('radiusKm') ? Number(searchParams.get('radiusKm')) : undefined,
  hasScheduling: searchParams.get('hasScheduling') === 'true' ? true : undefined,
  homeService: searchParams.get('homeService') === 'true' ? true : undefined,
  freeTravel: searchParams.get('freeTravel') === 'true' ? true : undefined,
  localService: searchParams.get('localService') === 'true' ? true : undefined,
})

let resolvedLat = typeof input.lat === 'number' && Number.isFinite(input.lat) ? input.lat : null
let resolvedLng = typeof input.lng === 'number' && Number.isFinite(input.lng) ? input.lng : null
let resolvedCity = input.city ?? null
let resolvedState = input.state ?? null

try {
  if ((resolvedLat == null || resolvedLng == null) && localParam) {
    const geocoded = await GoogleMapsServerService.geocodeAddress(localParam)
    if (geocoded) {
      if (resolvedLat == null) resolvedLat = geocoded.latitude
      if (resolvedLng == null) resolvedLng = geocoded.longitude
      if (!resolvedCity && geocoded.address.city) resolvedCity = geocoded.address.city
      if (!resolvedState && geocoded.address.state) resolvedState = geocoded.address.state
    }
  }

  if ((resolvedCity == null || resolvedState == null) && resolvedLat != null && resolvedLng != null) {
    const reverse = await GoogleMapsServerService.reverseGeocode(resolvedLat, resolvedLng)
    if (reverse) {
      if (!resolvedCity && reverse.address.city) resolvedCity = reverse.address.city
      if (!resolvedState && reverse.address.state) resolvedState = reverse.address.state
    }
  }
} catch (locationError) {
  console.error('[services/search] location resolution error', locationError)
}

const rawRadiusKm = Math.max(1, Math.min(input.radiusKm, 200));
const cityRadiusThreshold = 50;
const normalize = (value?: string | null) =>
  value ? value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim() : ''
const normalizedCity = normalize(resolvedCity)
const normalizedState = normalize(resolvedState)
const resolvedStateFilter = resolvedState ? resolvedState.toUpperCase() : null
const enforceCityOnly = rawRadiusKm > cityRadiusThreshold && !!normalizedCity
const radiusKm = enforceCityOnly ? cityRadiusThreshold : rawRadiusKm

    // where em Service
    const whereService: Prisma.ServiceWhereInput = { isActive: true }

if (input.q?.trim()) {
  const variants = Array.from(new Set([
    input.q,
    input.q.toLowerCase(),
    input.q.toUpperCase(),
  ]))

  whereService.OR = variants.flatMap((v) => ([
    { name: { contains: v } },
    { description: { contains: v } },
  ]))
}

if (input.leafCategoryId) {
  whereService.categoryId = input.leafCategoryId
} else if (input.categoryId) {
  const leafIds = await getDescendantLeafIds(input.categoryId)
  whereService.categoryId = { in: leafIds.length ? leafIds : ['___no_match___'] }
}


    const effectiveLimit = Math.max(1, input.limit)

    // filtros em providers
    const whereProvider: Prisma.ServiceProviderServiceWhereInput = { isActive: true }
    if (input.minPrice != null) whereProvider.basePrice = { ...(whereProvider.basePrice as any || {}), gte: input.minPrice }
    if (input.maxPrice != null) whereProvider.basePrice = { ...(whereProvider.basePrice as any || {}), lte: input.maxPrice }
    if (input.hasScheduling) whereProvider.offersScheduling = true
    if (input.localService) whereProvider.providesLocalService = true

    const serviceProviderConditions: Prisma.ServiceProviderWhereInput = {}

    if (input.hasQuoting) serviceProviderConditions.hasQuoting = true
    if (input.isHighlighted) serviceProviderConditions.isHighlighted = true

    if (resolvedCity || resolvedState) {
      const addressFilters: Prisma.AddressWhereInput = {}
      if (resolvedStateFilter) {
        addressFilters.state = { equals: resolvedStateFilter }
      }

      const cityHasDiacritics = resolvedCity ? /[^\u0000-\u007F]/.test(resolvedCity) : false
      if (resolvedCity && cityHasDiacritics) {
        const cityVariants = Array.from(new Set([
          resolvedCity,
          resolvedCity.toLowerCase(),
          resolvedCity.toUpperCase(),
        ]))
        addressFilters.OR = cityVariants.map((v) => ({ city: { contains: v } }))
      }

      if (Object.keys(addressFilters).length > 0) {
        serviceProviderConditions.user = {
          is: {
            address: {
              is: addressFilters,
            },
          },
        }
      }
    }

    if (Object.keys(serviceProviderConditions).length > 0) {
      whereProvider.serviceProvider = { is: serviceProviderConditions }
    }

    const serviceProviderServiceWhere: Prisma.ServiceProviderServiceWhereInput = {
      ...whereProvider,
      service: { is: whereService },
    }

    const providerServices = await prisma.serviceProviderService.findMany({
      where: serviceProviderServiceWhere,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            category: { select: { id: true, name: true, icon: true } },
          },
        },
        serviceProvider: {
          select: {
            id: true,
            serviceRadiusKm: true,
            chargesTravel: true,
            travelRatePerKm: true,
            travelMinimumFee: true,
            travelCost: true,
            waivesTravelOnHire: true,
            hasScheduling: true,
            hasQuoting: true,
            isHighlighted: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                address: true,
              },
            },
          },
        },
      },
    })

    const providerUserIds = new Set<string>()
    for (const ps of providerServices) {
      providerUserIds.add(ps.serviceProvider.user.id)
    }

    const ratingByUser = new Map<string, { average: number; count: number }>()
    if (providerUserIds.size > 0) {
      const reviewStats = await prisma.review.groupBy({
        by: ['receiverId'],
        where: { receiverId: { in: Array.from(providerUserIds) } },
        _avg: { rating: true },
        _count: { rating: true },
      })

      for (const stat of reviewStats) {
        const count = stat._count.rating ?? 0
        const average = Number(stat._avg.rating ?? 0)
        ratingByUser.set(stat.receiverId, {
          average: count > 0 ? Math.round(average * 10) / 10 : 0,
          count,
        })
      }
    }

    // ---- flatten para a sua pesquisa/page.tsx (data.results)
    const resultEntries = providerServices.map((ps) => {
      const providerProfile = ps.serviceProvider.user
      const providerAddress = providerProfile.address
      const providerRadius = ps.serviceProvider.serviceRadiusKm ?? null
      const locationLabel = providerAddress
        ? (providerAddress.state ? `${providerAddress.city}, ${providerAddress.state}` : providerAddress.city ?? '')
        : ''
      const dist =
        resolvedLat != null && resolvedLng != null && providerAddress?.latitude != null && providerAddress?.longitude != null
          ? haversine(resolvedLat, resolvedLng, providerAddress.latitude!, providerAddress.longitude!)
          : undefined
      const stats = ratingByUser.get(providerProfile.id)
      const averageRating = stats?.average ?? 0
      const reviewsCount = stats?.count ?? 0
      const basePriceNumber = normalizeDecimal(ps.basePrice)

      return {
        id: ps.id,
        providerId: ps.serviceProvider.id,
        providerUserId: providerProfile.id,
        name: providerProfile.name,
        providerName: providerProfile.name,
        profileImage: providerProfile.profileImage || undefined,
        providerProfileImage: providerProfile.profileImage || undefined,
        customDescription: ps.description,
        unit: ps.unit,
        primaryServiceId: ps.serviceId,
        serviceId: ps.service.id,
        serviceName: ps.service.name,
        serviceDescription: ps.service.description,
        serviceCategory: {
          id: ps.service.category.id,
          name: ps.service.category.name,
          icon: ps.service.category.icon,
        },
        category: ps.service.category.name,
        location: locationLabel,
        city: providerAddress?.city ?? null,
        state: providerAddress?.state ?? null,
        latitude: providerAddress?.latitude ?? null,
        longitude: providerAddress?.longitude ?? null,
        rating: averageRating,
        reviewCount: reviewsCount,
        basePrice: basePriceNumber ?? null,
        distance: dist,
        serviceRadiusKm: providerRadius,
        available: true,
        offersScheduling: ps.offersScheduling,
        providesHomeService: ps.providesHomeService ?? false,
        providesLocalService: ps.providesLocalService ?? true,
        travel: {
          chargesTravel: ps.serviceProvider.chargesTravel,
          travelRatePerKm: normalizeDecimal(ps.serviceProvider.travelRatePerKm),
          travelMinimumFee: normalizeDecimal(ps.serviceProvider.travelMinimumFee),
          travelFixedFee: normalizeDecimal(ps.serviceProvider.travelCost),
          waivesTravelOnHire: ps.serviceProvider.waivesTravelOnHire,
        },
        serviceCreatedAt: ps.service.createdAt,
        providerServiceCreatedAt: ps.createdAt,
      }
    })

    let results = resultEntries

// ordenação por preço quando solicitado (fallback)
if (input.sortBy === 'PRICE_LOW') {
  results.sort((a, b) => {
    const pa = a.basePrice ?? Number.POSITIVE_INFINITY
    const pb = b.basePrice ?? Number.POSITIVE_INFINITY
    return pa - pb
  })
}

if (input.sortBy === 'PRICE_HIGH') {
  results.sort((a, b) => {
    const pa = a.basePrice ?? Number.NEGATIVE_INFINITY
    const pb = b.basePrice ?? Number.NEGATIVE_INFINITY
    return pb - pa
  })
}

if (input.sortBy === 'NEWEST') {
  results.sort((a, b) => {
    const timeA = (a.serviceCreatedAt ?? a.providerServiceCreatedAt)?.valueOf() ?? 0
    const timeB = (b.serviceCreatedAt ?? b.providerServiceCreatedAt)?.valueOf() ?? 0
    return timeB - timeA
  })
}

if (input.sortBy === 'RATING') {
  results.sort((a, b) => {
    const rb = b.rating ?? 0
    const ra = a.rating ?? 0
    if (rb !== ra) return rb - ra
    const cb = b.reviewCount ?? 0
    const ca = a.reviewCount ?? 0
    if (cb !== ca) return cb - ca
    return (b.basePrice ?? Number.POSITIVE_INFINITY) - (a.basePrice ?? Number.POSITIVE_INFINITY)
  })
}

// se vieram coordenadas, filtra por raio e, se solicitado, ordena por distância
if (resolvedLat != null && resolvedLng != null) {
  const effectiveRadius = Number.isFinite(radiusKm) ? radiusKm : null
  if (effectiveRadius != null) {
    results = results.filter((r) => r.distance == null || r.distance <= effectiveRadius)
  }

  results = results.filter((r) => {
    if (r.distance == null) return true
    if (r.serviceRadiusKm == null) return true
    return r.distance <= r.serviceRadiusKm
  })

  if (enforceCityOnly) {
    results = results.filter((r) => {
      if (!normalizedCity) return true
      const providerCity = r.city ?? (typeof r.location === 'string' ? r.location.split(',')[0] : null)
      const providerState = r.state ?? (typeof r.location === 'string' ? r.location.split(',')[1]?.trim() : null)
      const cityMatch = normalize(providerCity) === normalizedCity
      const stateMatch = normalizedState ? normalize(providerState) === normalizedState : true
      return cityMatch && stateMatch
    })
  }

  if (input.sortBy === 'DISTANCE' || input.sortBy === 'RELEVANCE') {
    results.sort((a, b) => {
      const da = a.distance ?? Number.POSITIVE_INFINITY
      const db = b.distance ?? Number.POSITIVE_INFINITY
      if (da !== db) return da - db
      const pa = a.basePrice ?? Number.POSITIVE_INFINITY
      const pb = b.basePrice ?? Number.POSITIVE_INFINITY
      return pa - pb
    })
  }
}

if (input.availability) {
  results = results.filter((r) => r.offersScheduling)
}

if (input.homeService) {
  results = results.filter((r) => r.providesHomeService)
}

if (input.freeTravel) {
  results = results.filter((r) => r.travel?.waivesTravelOnHire)
}

if (input.localService) {
  results = results.filter((r) => r.providesLocalService !== false)
}

if (input.rating != null && Number.isFinite(input.rating)) {
  const minimumRating = input.rating
  results = results.filter((r) => (r.rating ?? 0) >= minimumRating)
}

if ((resolvedLat == null || resolvedLng == null) && normalizedCity) {
  results = results.filter((r) => {
    const providerCity = r.city ?? (typeof r.location === 'string' ? r.location.split(',')[0] : null)
    const cityMatch = normalize(providerCity) === normalizedCity
    if (!cityMatch) return false
    if (!normalizedState) return true
    const providerState = r.state ?? (typeof r.location === 'string' ? r.location.split(',')[1]?.trim() : null)
    return normalize(providerState) === normalizedState
  })
}
// --- Paginação dos providers "results" (lista achatada)
const resultsTotal = results.length
const resultsSkip = (input.page - 1) * effectiveLimit
const pagedResults = results.slice(resultsSkip, resultsSkip + effectiveLimit)

type ServiceGroup = {
  id: string
  name: string
  description: string | null | undefined
  category: { id: string; name: string; icon: string | null }
  providers: Array<{
    id: string
    userId: string
    name: string
    profileImage?: string | null
    basePrice: number
    description?: string | null
    offersScheduling: boolean
    providesHomeService: boolean
    providesLocalService: boolean
    rating: number
    reviewCount: number
  }>
}

const servicesAllMap = new Map<string, ServiceGroup>()
const servicesPageMap = new Map<string, ServiceGroup>()

const appendToMap = (
  map: Map<string, ServiceGroup>,
  entry: typeof results[number],
) => {
  let serviceEntry = map.get(entry.serviceId)
  if (!serviceEntry) {
    serviceEntry = {
      id: entry.serviceId,
      name: entry.serviceName,
      description: entry.serviceDescription,
      category: entry.serviceCategory,
      providers: [],
    }
    map.set(entry.serviceId, serviceEntry)
  }

  const basePriceValue = entry.basePrice ?? 0
  serviceEntry.providers.push({
    id: entry.providerId,
    userId: entry.providerUserId,
    name: entry.providerName,
    profileImage: entry.profileImage,
    basePrice: Number.isFinite(basePriceValue) ? basePriceValue : 0,
    description: entry.customDescription,
    offersScheduling: entry.offersScheduling,
    providesHomeService: entry.providesHomeService ?? false,
    providesLocalService: entry.providesLocalService ?? true,
    rating: entry.rating,
    reviewCount: entry.reviewCount,
  })
}

for (const entry of results) {
  appendToMap(servicesAllMap, entry)
}

for (const entry of pagedResults) {
  appendToMap(servicesPageMap, entry)
}

const servicesWithProviders = Array.from(servicesPageMap.values())
const totalServices = servicesAllMap.size

const sanitizedPagedResults = pagedResults.map((entry) => {
  const clone = { ...entry }
  delete (clone as any).serviceCreatedAt
  delete (clone as any).providerServiceCreatedAt
  return clone
})

// --- Resposta final
return NextResponse.json({
  success: true,
  data: {
    services: servicesWithProviders,
    pagination: {
      page: input.page,
      limit: effectiveLimit,
      total: servicesWithProviders.length,
      totalServices,
      pages: Math.max(1, Math.ceil(totalServices / effectiveLimit)),
    },
    appliedRadiusKm: radiusKm,
    requestedRadiusKm: rawRadiusKm,
    cityFilterApplied: enforceCityOnly,
  },
  results: sanitizedPagedResults,
  resultsPagination: {
    page: input.page,
    limit: effectiveLimit,
    total: resultsTotal,
    pages: Math.max(1, Math.ceil(resultsTotal / effectiveLimit)),
  },
})

  } catch (error) {
    console.error('Search error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Parâmetros de busca inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Erro ao buscar serviços' }, { status: 500 })
  }
}
