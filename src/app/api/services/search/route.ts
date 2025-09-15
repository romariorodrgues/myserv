import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

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
  sortBy: z.enum(['RELEVANCE', 'PRICE_LOW', 'PRICE_HIGH', 'NEWEST']).default('RELEVANCE'),
  page: z.number().default(1),
  limit: z.number().default(20)
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
  radiusKm: searchParams.get('radiusKm') ? Number(searchParams.get('radiusKm')) : undefined
})

const radiusKm = Math.max(1, Math.min(input.radiusKm, 200)); // clamp 1–200 km

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

    if (input.city || input.state) {
  const cityVariants = input.city
    ? Array.from(new Set([input.city, input.city.toLowerCase(), input.city.toUpperCase()]))
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
              ...(input.state ? { state: { equals: input.state } } : {}),
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
          description: p.description
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
        const dist =
  (input.lat != null && input.lng != null && addr?.latitude != null && addr?.longitude != null)
    ? haversine(input.lat, input.lng, addr.latitude!, addr.longitude!)
    : undefined

        if (!providerMap.has(pid)) {
          providerMap.set(pid, {
            id: pid,
            name: p.serviceProvider.user.name,
            profileImage: p.serviceProvider.user.profileImage ?? undefined,
            location: loc,
            services: [svc.name],
            category: svc.category.name,
            rating: 0,
            reviewCount: 0,
            basePrice: p.basePrice ?? 0,
            distance: dist,  
            available: true
          })
        } else {
          const entry = providerMap.get(pid)
          if (!entry.services.includes(svc.name)) entry.services.push(svc.name)
          entry.basePrice = Math.min(entry.basePrice, p.basePrice ?? entry.basePrice)
        if (dist != null && (entry.distance == null || dist < entry.distance)) {
    entry.distance = dist
        }
      }
    }
    }

 let results = Array.from(providerMap.values())

// ordenação por preço quando solicitado (fallback)
if (input.sortBy === 'PRICE_LOW') results.sort((a, b) => (a.basePrice ?? 0) - (b.basePrice ?? 0))
if (input.sortBy === 'PRICE_HIGH') results.sort((a, b) => (b.basePrice ?? 0) - (a.basePrice ?? 0))

// se vieram coordenadas, filtra por raio e ordena por distância (com tie-break por preço)
if (input.lat != null && input.lng != null) {
  // mantém quem não tem distância (endereço sem lat/lng) **ou** quem está no raio
  results = results.filter(r => r.distance == null || r.distance <= radiusKm)

  results.sort((a, b) => {
    const da = a.distance ?? Number.POSITIVE_INFINITY
    const db = b.distance ?? Number.POSITIVE_INFINITY
    if (da !== db) return da - db
    // empate: menor preço primeiro
    const pa = a.basePrice ?? Number.POSITIVE_INFINITY
    const pb = b.basePrice ?? Number.POSITIVE_INFINITY
    return pa - pb
  })
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
