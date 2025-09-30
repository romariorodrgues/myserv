import { NextResponse } from 'next/server'

interface IbgeState {
  id: number
  sigla: string
  nome: string
}

let cachedStates: Array<{ id: number; sigla: string; nome: string }> | null = null
let lastFetch: number | null = null

const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hora

export async function GET() {
  try {
    const now = Date.now()
    if (cachedStates && lastFetch && now - lastFetch < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, states: cachedStates })
    }

    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome', {
      next: { revalidate: CACHE_TTL_MS / 1000 },
    })

    if (!response.ok) {
      throw new Error(`IBGE request failed with status ${response.status}`)
    }

    const data = (await response.json()) as IbgeState[]
    cachedStates = data.map((state) => ({ id: state.id, sigla: state.sigla, nome: state.nome }))
    lastFetch = Date.now()

    return NextResponse.json({ success: true, states: cachedStates })
  } catch (error) {
    console.error('[locations/states] fetch error', error)
    return NextResponse.json({ success: false, error: 'Não foi possível obter a lista de estados.' }, { status: 500 })
  }
}

