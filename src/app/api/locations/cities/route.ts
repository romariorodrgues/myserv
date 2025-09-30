import { NextRequest, NextResponse } from 'next/server'

interface IbgeCity {
  id: number
  nome: string
}

type CacheEntry = {
  fetchedAt: number
  cities: Array<{ id: number; nome: string }>
}

const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hora
const citiesCache = new Map<string, CacheEntry>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const state = searchParams.get('state')?.trim().toUpperCase()

  if (!state) {
    return NextResponse.json({ success: false, error: 'Informe o estado (UF).' }, { status: 400 })
  }

  try {
    const cached = citiesCache.get(state)
    const now = Date.now()
    if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, cities: cached.cities })
    }

    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`, {
      next: { revalidate: CACHE_TTL_MS / 1000 },
    })

    if (!response.ok) {
      throw new Error(`IBGE request failed with status ${response.status}`)
    }

    const data = (await response.json()) as IbgeCity[]
    const cities = data.map((city) => ({ id: city.id, nome: city.nome }))
    citiesCache.set(state, { fetchedAt: now, cities })

    return NextResponse.json({ success: true, cities })
  } catch (error) {
    console.error('[locations/cities] fetch error', error)
    return NextResponse.json({ success: false, error: 'Não foi possível obter as cidades.' }, { status: 500 })
  }
}

