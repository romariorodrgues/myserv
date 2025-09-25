import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import GoogleMapsServerService from '@/lib/maps-server'
import { cdnImageUrl } from '@/lib/cdn'

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

// Tipagem forte do retorno com relações
type ServiceWithRels = Prisma.ServiceGetPayload<{
  include: {
    category: { select: { id: true; name: true; icon: true } }
    providers: {
      include: {
        serviceProvider: {
          include: {
            user: { select: { id: true; name: true; profileImage: true; address: true } }
          }
        }
      }
    }
  }
}>

// Validation schema
const advancedSearchSchema = z.object({
  q: z.string().optional(),
  leafCategoryId: z.string().optional(),
  categoryId: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  // novos:
  lat: z.number().optional(),
  lng: z.number().optional(),
  radiusKm: z.number().default(30),
  hasScheduling: z.boolean().optional(),
  sortBy: z.enum(['RELEVANCE', 'DISTANCE', 'PRICE_LOW', 'PRICE_HIGH', 'NEWEST']).default('RELEVANCE'),
  page: z.number().default(1),
  limit: z.number().default(20),
  homeService: z.boolean().optional(),
  freeTravel: z.boolean().optional(),
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

const input = advancedSearchSchema.parse({
  q: searchParams.get('q') || undefined,
  leafCategoryId: searchParams.get('leafCategoryId') || undefined,
  categoryId: searchParams.get('categoryId') || undefined,
  city: cityFilter || undefined,
  state: stateFilter || undefined,
  minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
  maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
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


    // paginação
    const skip = (input.page - 1) * input.limit

    // filtros em providers
    const whereProvider: Prisma.ServiceProviderServiceWhereInput = { isActive: true }
    if (input.minPrice != null) whereProvider.basePrice = { ...(whereProvider.basePrice as any || {}), gte: input.minPrice }
    if (input.maxPrice != null) whereProvider.basePrice = { ...(whereProvider.basePrice as any || {}), lte: input.maxPrice }
    if (input.hasScheduling) whereProvider.offersScheduling = true

    if (resolvedCity || resolvedState) {
  const cityVariants = resolvedCity
    ? Array.from(new Set([resolvedCity, resolvedCity.toLowerCase(), resolvedCity.toUpperCase()]))
    : null

  whereProvider.serviceProvider = {
    is: {
      user: {
        is: {
          address: {
            is: {
              ...(cityVariants
                ? { OR: cityVariants.map(v => ({ city: { contains: v } })) }
                : {}),
              ...(resolvedStateFilter ? { state: { equals: resolvedStateFilter } } : {}),
            }
          }
        }
      }
    }
  }
}

    // orderBy tipado (evita "any" quebrar inferência)
    const orderByService: Prisma.ServiceOrderByWithRelationInput | undefined =
      input.sortBy === 'NEWEST' ? { createdAt: 'desc' } : undefined

    // consulta (tipada) — note o "as const" para preservar include literal
    const services = await prisma.service.findMany({
      where: whereService,
      include: {
        category: { select: { id: true, name: true, icon: true } },
        providers: {
          where: whereProvider,
          include: {
            serviceProvider: {
              include: {
                user: { select: { id: true, name: true, profileImage: true, address: true } }
              }
            }
          }
        }
      } as const,
      orderBy: orderByService,
      skip,
      take: input.limit
    }) as ServiceWithRels[]

    const totalCount = await prisma.service.count({
  where: {
    ...whereService,
    providers: { some: whereProvider },
  },
})


    // ---- shape "services" (compat)
    const servicesWithProviders = services
      .filter((s) => s.providers.length > 0)
      .map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category, // { id, name, icon }
        providers: s.providers.map((p) => ({
          id: p.serviceProvider.id,
          userId: p.serviceProvider.user.id,
          name: p.serviceProvider.user.name,
          profileImage: p.serviceProvider.user.profileImage,
          basePrice: p.basePrice ?? 0,
          description: p.description,
          offersScheduling: p.offersScheduling,
          providesHomeService: p.providesHomeService ?? false,
        }))
      }))

    // ordenação por preço (menor preço por service)
    if (input.sortBy === 'PRICE_LOW' || input.sortBy === 'PRICE_HIGH') {
      servicesWithProviders.sort((a, b) => {
        const minA = Math.min(...a.providers.map((p) => p.basePrice ?? Number.POSITIVE_INFINITY))
        const minB = Math.min(...b.providers.map((p) => p.basePrice ?? Number.POSITIVE_INFINITY))
        return input.sortBy === 'PRICE_LOW' ? minA - minB : minB - minA
      })
    }

    // ---- flatten para a sua pesquisa/page.tsx (data.results)
    const providerMap = new Map<string, any>()
    for (const svc of services) {
      for (const p of svc.providers) {
        const pid = p.serviceProvider.id
        const addr = p.serviceProvider.user.address
        const loc = addr ? (addr.state ? `${addr.city}, ${addr.state}` : addr.city ?? '') : ''
        const providerRadius = p.serviceProvider.serviceRadiusKm ?? null
        const dist =
  (resolvedLat != null && resolvedLng != null && addr?.latitude != null && addr?.longitude != null)
    ? haversine(resolvedLat, resolvedLng, addr.latitude!, addr.longitude!)
    : undefined

        if (!providerMap.has(pid)) {
          providerMap.set(pid, {
            id: pid,
            name: p.serviceProvider.user.name,
            profileImage: p.serviceProvider.user.profileImage
              ? cdnImageUrl(p.serviceProvider.user.profileImage)
              : undefined,
            primaryServiceId: p.serviceId,
            location: loc,
            city: addr?.city ?? null,
            state: addr?.state ?? null,
            latitude: addr?.latitude ?? null,
            longitude: addr?.longitude ?? null,
            services: [svc.name],
            category: svc.category.name,
            rating: 0,
            reviewCount: 0,
          basePrice: p.basePrice ?? Number.POSITIVE_INFINITY,
          distance: dist,
          serviceRadiusKm: providerRadius,
          available: true,
          offersScheduling: p.offersScheduling,
          providesHomeService: p.providesHomeService ?? false,
          travel: {
              chargesTravel: p.serviceProvider.chargesTravel,
              travelRatePerKm: p.serviceProvider.travelRatePerKm,
              travelMinimumFee: p.serviceProvider.travelMinimumFee,
              travelFixedFee: p.serviceProvider.travelCost,
              waivesTravelOnHire: p.serviceProvider.waivesTravelOnHire,
            },
          })
        } else {
          const entry = providerMap.get(pid)
          if (!entry.services.includes(svc.name)) entry.services.push(svc.name)
          if (!entry.primaryServiceId) entry.primaryServiceId = p.serviceId
          const candidatePrice = typeof p.basePrice === 'number' ? p.basePrice : Number.POSITIVE_INFINITY
          entry.basePrice = Math.min(entry.basePrice ?? Number.POSITIVE_INFINITY, candidatePrice)
          if (dist != null && (entry.distance == null || dist < entry.distance)) {
            entry.distance = dist
          }
          if (providerRadius != null) {
            entry.serviceRadiusKm = entry.serviceRadiusKm == null
              ? providerRadius
              : Math.min(entry.serviceRadiusKm, providerRadius)
          }
          if (p.providesHomeService) {
            entry.providesHomeService = true
          }
          if (p.offersScheduling && !entry.offersScheduling) entry.offersScheduling = true
          if (!entry.travel) {
            entry.travel = {
              chargesTravel: p.serviceProvider.chargesTravel,
              travelRatePerKm: p.serviceProvider.travelRatePerKm,
              travelMinimumFee: p.serviceProvider.travelMinimumFee,
              travelFixedFee: p.serviceProvider.travelCost,
              waivesTravelOnHire: p.serviceProvider.waivesTravelOnHire,
            }
          }
        }
      }
    }

 let results = Array.from(providerMap.values()).map((entry) => ({
  ...entry,
  basePrice: entry.basePrice === Number.POSITIVE_INFINITY ? null : entry.basePrice,
}))

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
// --- Paginação dos providers "results" (lista achatada)
const resultsTotal = results.length
const resultsSkip = (input.page - 1) * input.limit
const pagedResults = results.slice(resultsSkip, resultsSkip + input.limit)

// --- Resposta final
return NextResponse.json({
  success: true,
  data: {
    services: servicesWithProviders,
    pagination: {
      page: input.page,
      limit: input.limit,
      total: servicesWithProviders.length, // quantos serviços vieram nesta página
      totalServices: totalCount,           // total de serviços com pelo menos 1 provider compatível
      pages: Math.ceil(totalCount / input.limit),
    },
    appliedRadiusKm: radiusKm,
    requestedRadiusKm: rawRadiusKm,
    cityFilterApplied: enforceCityOnly,
  },
  results: pagedResults,
  resultsPagination: {
    page: input.page,
    limit: input.limit,
    total: resultsTotal,
    pages: Math.ceil(resultsTotal / input.limit),
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
