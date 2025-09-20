/**
 * Geolocation API endpoint
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 *
 * Handles geolocation services and address lookup using Google Maps APIs
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import GoogleMapsServerService from '@/lib/maps-server'

const reverseGeocodeSchema = z.object({
  lat: z.number(),
  lng: z.number()
})

const forwardGeocodeSchema = z.object({
  address: z.string().min(1)
})

function formatLocationResponse(location: Awaited<ReturnType<typeof GoogleMapsServerService.geocodeAddress>>): NextResponse {
  if (!location) {
    return NextResponse.json(
      { success: false, error: 'Endereço não encontrado' },
      { status: 404 }
    )
  }

  const addressLine = [
    location.address.street,
    location.address.number
  ].filter(Boolean).join(', ')

  return NextResponse.json({
    success: true,
    result: {
      lat: location.latitude,
      lng: location.longitude,
      address: addressLine,
      city: location.address.city,
      state: location.address.state,
      country: 'Brasil',
      postalCode: location.address.zipCode,
      formatted: location.formattedAddress,
      components: location.address
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'reverse'

    if (type === 'reverse') {
      const { lat, lng } = reverseGeocodeSchema.parse(body)
      const location = await GoogleMapsServerService.reverseGeocode(lat, lng)
      return formatLocationResponse(location)
    }

    if (type === 'forward') {
      const { address } = forwardGeocodeSchema.parse(body)
      const location = await GoogleMapsServerService.geocodeAddress(address)
      return formatLocationResponse(location)
    }

    return NextResponse.json(
      { success: false, error: 'Tipo de operação inválido' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in geolocation API:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { success: false, error: 'Google Maps API key não configurada' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
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
        { success: false, error: 'Query é obrigatória' },
        { status: 400 }
      )
    }

    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius')

    const predictions = await GoogleMapsServerService.autocomplete(query, {
      location: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
      radius: radius ? Number(radius) : undefined
    })

    return NextResponse.json({
      success: true,
      suggestions: predictions.map((prediction) => prediction.description),
      predictions,
      total: predictions.length
    })
  } catch (error) {
    console.error('Error fetching location suggestions:', error)

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { success: false, error: 'Google Maps API key não configurada' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
