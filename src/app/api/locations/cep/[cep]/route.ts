import { NextRequest, NextResponse } from 'next/server'

interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
  erro?: boolean
}

export async function GET(request: NextRequest, { params }: { params: { cep: string } }) {
  const rawCep = params.cep ?? ''
  const digits = rawCep.replace(/\D/g, '')

  if (digits.length !== 8) {
    return NextResponse.json({ success: false, error: 'CEP inválido' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`ViaCEP request failed with status ${response.status}`)
    }

    const data = (await response.json()) as ViaCepResponse
    if (data.erro) {
      return NextResponse.json({ success: false, error: 'CEP não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      cep: data.cep,
      street: data.logradouro,
      complement: data.complemento,
      district: data.bairro,
      city: data.localidade,
      state: data.uf,
    })
  } catch (error) {
    console.error('[locations/cep] lookup error', error)
    return NextResponse.json({ success: false, error: 'Não foi possível consultar o CEP.' }, { status: 500 })
  }
}

