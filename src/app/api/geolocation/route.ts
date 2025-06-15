/**
 * Geolocation API endpoint
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles geolocation services and address lookup
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for reverse geocoding
const reverseGeocodeSchema = z.object({
  lat: z.number(),
  lng: z.number()
})

// Validation schema for forward geocoding
const forwardGeocodeSchema = z.object({
  address: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'reverse'

    if (type === 'reverse') {
      // Reverse geocoding: lat/lng to address
      const { lat, lng } = reverseGeocodeSchema.parse(body)

      // Use a simple mock for now - in production you'd use Google Maps API or similar
      const mockResponse = {
        address: 'Rua Exemplo, 123',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        postalCode: '01234-567',
        formatted: 'Rua Exemplo, 123, São Paulo - SP, 01234-567'
      }

      return NextResponse.json({
        success: true,
        result: mockResponse,
        coordinates: { lat, lng }
      })

    } else if (type === 'forward') {
      // Forward geocoding: address to lat/lng
      const { address } = forwardGeocodeSchema.parse(body)

      // Mock response - in production use real geocoding service
      const mockResponse = {
        lat: -23.5505 + (Math.random() - 0.5) * 0.1,
        lng: -46.6333 + (Math.random() - 0.5) * 0.1,
        address: address,
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        formatted: `${address}, São Paulo - SP`
      }

      return NextResponse.json({
        success: true,
        result: mockResponse
      })

    } else {
      return NextResponse.json(
        { error: 'Tipo de operação inválido' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in geolocation API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json(
        { error: 'Query é obrigatória' },
        { status: 400 }
      )
    }

    // Mock location suggestions
    const suggestions = [
      'São Paulo, SP',
      'Rio de Janeiro, RJ',
      'Belo Horizonte, MG',
      'Brasília, DF',
      'Salvador, BA',
      'Fortaleza, CE',
      'Curitiba, PR',
      'Recife, PE'
    ].filter(location => 
      location.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5)

    return NextResponse.json({
      suggestions,
      total: suggestions.length
    })

  } catch (error) {
    console.error('Error fetching location suggestions:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
