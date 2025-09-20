import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import calculateTravelPricing from '@/lib/travel-calculator'

const requestSchema = z.object({
  providerId: z.string().min(1, 'providerId é obrigatório'),
  serviceId: z.string().optional(),
  clientLat: z.number().optional(),
  clientLng: z.number().optional(),
  clientAddress: z.string().optional(),
  clientCity: z.string().optional(),
  clientState: z.string().optional(),
  clientZipCode: z.string().optional(),
}).refine((data) => {
  const hasCoordinates = typeof data.clientLat === 'number' && typeof data.clientLng === 'number'
  return hasCoordinates || data.clientAddress || data.clientCity || data.clientState
}, {
  path: ['clientAddress'],
  message: 'Informe o endereço ou as coordenadas do cliente'
})

function buildAddressString(parts: Array<string | null | undefined>): string | undefined {
  const value = parts.filter((item) => item && item.toString().trim().length > 0).join(', ')
  return value.length > 0 ? value : undefined
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input = requestSchema.parse(body)

    const provider = await prisma.serviceProvider.findFirst({
      where: {
        OR: [{ id: input.providerId }, { userId: input.providerId }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        services: {
          where: input.serviceId ? { serviceId: input.serviceId } : undefined,
          include: {
            service: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!provider) {
      return NextResponse.json({ success: false, error: 'Profissional não encontrado' }, { status: 404 })
    }

    const providerAddress = provider.user.address
    if (!providerAddress) {
      return NextResponse.json({ success: false, error: 'Profissional sem endereço cadastrado' }, { status: 400 })
    }

    const providerAddressString = buildAddressString([
      providerAddress.street && providerAddress.number ? `${providerAddress.street}, ${providerAddress.number}` : providerAddress.street,
      providerAddress.district,
      providerAddress.city,
      providerAddress.state,
      providerAddress.zipCode,
      'Brasil',
    ])

    const clientAddressString = buildAddressString([
      input.clientAddress,
      input.clientCity,
      input.clientState,
      input.clientZipCode,
      'Brasil',
    ])

    const basePrice = provider.services?.[0]?.basePrice ?? null

    const travelResult = await calculateTravelPricing({
      provider: {
        coords: providerAddress.latitude != null && providerAddress.longitude != null
          ? { lat: providerAddress.latitude, lng: providerAddress.longitude }
          : undefined,
        addressString: providerAddressString,
        travel: {
          chargesTravel: provider.chargesTravel,
          travelRatePerKm: provider.travelRatePerKm,
          travelMinimumFee: provider.travelMinimumFee,
          travelFixedFee: provider.travelCost,
          waivesTravelOnHire: provider.waivesTravelOnHire,
        },
      },
      client: {
        coords: input.clientLat != null && input.clientLng != null
          ? { lat: input.clientLat, lng: input.clientLng }
          : undefined,
        addressString: clientAddressString,
      },
      basePrice,
    })

    if (!travelResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Não foi possível calcular o deslocamento',
        details: travelResult,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: {
          id: provider.id,
          userId: provider.userId,
          name: provider.user.name,
        },
        service: provider.services?.[0]?.service ?? null,
        travel: travelResult,
      },
    })
  } catch (error) {
    console.error('[POST /api/services/travel-cost]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Parâmetros inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Erro ao calcular deslocamento' }, { status: 500 })
  }
}
