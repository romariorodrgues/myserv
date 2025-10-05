/**
 * Bookings API endpoint
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles booking creation and management
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { WhatsAppService } from '@/lib/whatsapp-service'
import { EmailService } from '@/lib/email-service'
import calculateTravelPricing, { type TravelCalculationResult } from '@/lib/travel-calculator'

// Validation schema for booking creation
const createBookingSchema = z.object({
  serviceId: z.string().min(1, 'Service ID é obrigatório'),
  providerId: z.string().min(1, 'Provider ID é obrigatório'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  clientName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  clientPhone: z.string().min(10, 'Telefone deve ter pelo menos 10 caracteres'),
  clientEmail: z.string().email('Email inválido'),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(8, 'CEP deve ter 8 caracteres'),
  fulfillmentMode: z.enum(['HOME', 'LOCAL']).optional()
})

function buildAddressString(parts: Array<string | null | undefined>): string | undefined {
  const value = parts.filter((item) => item && item.toString().trim().length > 0).join(', ')
  return value.length > 0 ? value : undefined
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createBookingSchema.parse(body)
    const fulfillmentMode = validatedData.fulfillmentMode === 'LOCAL' ? 'LOCAL' : 'HOME'

    // Verify that service and provider exist and are active
    // Aceita tanto ServiceProvider.id quanto User.id
    const serviceProvider = await prisma.serviceProvider.findFirst({
      where: {
        OR: [
          { id: validatedData.providerId },
          { userId: validatedData.providerId }
        ],
        user: {
          isActive: true,
          // isApproved: true, // relaxado para permitir testes e onboarding
        },
        services: {
          some: {
            serviceId: validatedData.serviceId,
            isActive: true
          }
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true
          }
        },
        services: {
          where: {
            serviceId: validatedData.serviceId
          },
          include: {
            service: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!serviceProvider) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Profissional ou serviço não encontrado'
        },
        { status: 404 }
      )
    }

    const providerAddress = serviceProvider.user.address
    const providerCoords = providerAddress?.latitude != null && providerAddress?.longitude != null
      ? { lat: providerAddress.latitude, lng: providerAddress.longitude }
      : undefined

    const providerAddressString = buildAddressString([
      providerAddress?.street && providerAddress?.number
        ? `${providerAddress.street}, ${providerAddress.number}`
        : providerAddress?.street,
      providerAddress?.district,
      providerAddress?.city,
      providerAddress?.state,
      providerAddress?.zipCode,
      'Brasil'
    ])

    const clientAddressString = buildAddressString([
      validatedData.address,
      validatedData.city,
      validatedData.state,
      validatedData.zipCode,
      'Brasil'
    ])

    const requestType = (validatedData.preferredDate || validatedData.preferredTime) ? 'SCHEDULING' : 'QUOTE'

    let selectedDateTime: Date | null = null
    if (requestType === 'SCHEDULING') {
      if (!validatedData.preferredDate || !validatedData.preferredTime) {
        return NextResponse.json({ success: false, error: 'Data e horário são obrigatórios para agendamento.' }, { status: 400 })
      }

      selectedDateTime = new Date(`${validatedData.preferredDate}T${validatedData.preferredTime}`)
      if (Number.isNaN(selectedDateTime.getTime())) {
        return NextResponse.json({ success: false, error: 'Data ou horário inválido.' }, { status: 400 })
      }

      if (selectedDateTime.getTime() <= Date.now()) {
        return NextResponse.json({ success: false, error: 'Não é possível agendar em um horário que já passou.' }, { status: 400 })
      }
    }

    const providerServiceLink = serviceProvider.services?.[0]
    const basePriceValue = providerServiceLink?.basePrice ?? null
    const chargesTravel = fulfillmentMode === 'HOME'
      ? (providerServiceLink?.chargesTravel ?? serviceProvider.chargesTravel)
      : false

    let travelQuote: TravelCalculationResult | null = null
    if (chargesTravel) {
      travelQuote = await calculateTravelPricing({
        provider: {
          coords: providerCoords,
          addressString: providerAddressString,
          travel: {
            chargesTravel: true,
            travelRatePerKm: serviceProvider.travelRatePerKm,
            travelMinimumFee: serviceProvider.travelMinimumFee,
            travelFixedFee: serviceProvider.travelCost,
            waivesTravelOnHire: serviceProvider.waivesTravelOnHire,
          },
        },
        client: {
          coords: undefined,
          addressString: clientAddressString,
        },
        basePrice: basePriceValue,
      })

      if (!travelQuote.success) {
        return NextResponse.json({
          success: false,
          error: 'Não foi possível calcular o deslocamento',
          details: travelQuote,
        }, { status: 400 })
      }
    }

    const travelCostValue = chargesTravel ? travelQuote?.travelCost ?? 0 : 0
    const quoteFeeAmount = requestType === 'QUOTE' ? (providerServiceLink?.quoteFee ?? 0) : 0
    const subtotal = (basePriceValue ?? 0) + travelCostValue
    const hasPriceInfo = basePriceValue != null || travelCostValue > 0 || quoteFeeAmount > 0
    const estimatedPrice = hasPriceInfo ? Math.round((subtotal + quoteFeeAmount) * 100) / 100 : null

    // For now, we'll create a temporary user or use a guest booking system
    // In a real implementation, we'd get the user from the session
    let clientUser = await prisma.user.findUnique({
      where: { email: validatedData.clientEmail }
    })

    if (!clientUser) {
      // Create a temporary client user
      clientUser = await prisma.user.create({
        data: {
          name: validatedData.clientName,
          email: validatedData.clientEmail,
          phone: validatedData.clientPhone,
          cpfCnpj: `temp-${Date.now()}`, // Unique temporary CPF
          password: 'temp_password', // Will be changed by user
          userType: 'CLIENT',
          isActive: true,
          isApproved: true
        }
      })
    }

    // Load provider schedule settings
    const settingsKey = `provider_schedule_settings:${serviceProvider.userId}`
    const settingsRec = await prisma.systemSettings.findUnique({ where: { key: settingsKey } })
    const settings = (() => { try { return JSON.parse(settingsRec?.value || '{}') } catch { return {} } })() as any
    const minAdvanceHours = Number(settings.minAdvanceHours ?? 0)
    const maxAdvanceDays = Number(settings.maxAdvanceDays ?? 0)
    const maxDaily = Number(settings.maxDaily ?? 0)
    const notifyWhatsapp = settings.notifyWhatsapp !== false
    const autoAccept = settings.autoAccept === true

    // If scheduling, validate slot availability to avoid double booking
    if (requestType === 'SCHEDULING' && validatedData.preferredDate && validatedData.preferredTime) {
      const sameDayStart = new Date(validatedData.preferredDate)
      const nextDay = new Date(sameDayStart)
      nextDay.setDate(nextDay.getDate() + 1)

      // Enforce min/max advance
      const selectedDate = selectedDateTime ?? new Date(`${validatedData.preferredDate}T${validatedData.preferredTime}`)
      const now = new Date()
      const diffMs = selectedDate.getTime() - now.getTime()
      if (minAdvanceHours > 0 && diffMs < minAdvanceHours * 3600_000) {
        return NextResponse.json({ success: false, error: 'Data/hora abaixo da antecedência mínima' }, { status: 400 })
      }
      if (maxAdvanceDays > 0) {
        const maxDate = new Date(now)
        maxDate.setDate(maxDate.getDate() + maxAdvanceDays)
        if (selectedDate > maxDate) {
          return NextResponse.json({ success: false, error: 'Data/hora acima da antecedência máxima' }, { status: 400 })
        }
      }

      const conflicting = await prisma.serviceRequest.findFirst({
        where: {
          providerId: serviceProvider.userId,
          scheduledDate: { gte: sameDayStart, lt: nextDay },
          scheduledTime: validatedData.preferredTime,
          OR: [
            { status: { in: ['PENDING', 'ACCEPTED', 'COMPLETED'] } },
            { AND: [ { status: 'HOLD' }, { expiresAt: { gt: now } } ] }
          ]
        }
      })
      if (conflicting) {
        return NextResponse.json(
          { success: false, error: 'Horário indisponível. Escolha outro horário.' },
          { status: 409 }
        )
      }

      if (maxDaily > 0) {
        const countDay = await prisma.serviceRequest.count({
          where: {
            providerId: serviceProvider.userId,
            scheduledDate: { gte: sameDayStart, lt: nextDay },
            status: { not: 'CANCELLED' }
          }
        })
        if (countDay >= maxDaily) {
          return NextResponse.json({ success: false, error: 'Limite diário de agendamentos atingido' }, { status: 400 })
        }
      }
    }

    // Create the booking
    // HOLD TTL (minutes) configurable via env; default 15
    const HOLD_TTL_MINUTES = Number(process.env.HOLD_TTL_MINUTES || 15)
    const holdExpiresAt = new Date(Date.now() + HOLD_TTL_MINUTES * 60_000)

    const booking = await prisma.serviceRequest.create({
      data: {
        clientId: clientUser.id,
        providerId: serviceProvider.userId, // Use the User ID, not ServiceProvider ID
        serviceId: validatedData.serviceId,
        description: validatedData.description,
        scheduledDate: validatedData.preferredDate ? new Date(validatedData.preferredDate + 'T' + (validatedData.preferredTime || '10:00')) : null,
        scheduledTime: validatedData.preferredTime || null,
        requestType,
        status: requestType === 'SCHEDULING'
          ? (autoAccept ? 'ACCEPTED' : 'HOLD')
          : 'PENDING',
        expiresAt: requestType === 'SCHEDULING' && !autoAccept ? holdExpiresAt : null,
        estimatedPrice,
        travelCost: travelCostValue,
        basePriceSnapshot: basePriceValue,
        travelDistanceKm: chargesTravel && travelQuote?.success ? travelQuote.distanceKm ?? null : null,
        travelDurationMinutes: chargesTravel && travelQuote?.success ? travelQuote.durationMinutes ?? null : null,
        travelRatePerKmSnapshot: chargesTravel ? serviceProvider.travelRatePerKm ?? null : null,
        travelMinimumFeeSnapshot: chargesTravel ? serviceProvider.travelMinimumFee ?? null : null,
        travelFixedFeeSnapshot: chargesTravel ? serviceProvider.travelCost ?? null : null,
        schedulingFee: requestType === 'QUOTE' ? quoteFeeAmount : null,
      },
      include: {
        service: {
          select: {
            name: true
          }
        },
        provider: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        client: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Send notifications to service provider
    const notificationData = {
      userPhone: serviceProvider.user.phone,
      userName: serviceProvider.user.name,
      serviceName: booking.service.name,
      clientName: booking.client.name,
      scheduledDate: booking.scheduledDate?.toLocaleDateString('pt-BR'),
      bookingId: booking.id
    }

    // Send WhatsApp notification
    if (notifyWhatsapp) {
      await WhatsAppService.notifyBookingRequest(notificationData)
    }

    // Send email notification
    await EmailService.sendNewRequestNotificationEmail({
      ...notificationData,
      userEmail: serviceProvider.user.email
    })

    const travelResponse: TravelCalculationResult = travelQuote ?? {
      success: true,
      travelCost: 0,
      travelCostBreakdown: {
        perKmPortion: 0,
        fixedFee: 0,
        minimumFee: 0,
        appliedMinimum: false,
        travelRatePerKm: null,
        waivesTravelOnHire: serviceProvider.waivesTravelOnHire ?? null,
      },
      estimatedTotal: hasPriceInfo ? Math.round((subtotal + quoteFeeAmount) * 100) / 100 : null,
      usedFallback: false,
      warnings: [],
    }

    // Create notification record (provider side)
    await prisma.notification.create({
      data: {
        userId: serviceProvider.userId, // Use the User ID, not ServiceProvider ID
        type: 'SERVICE_REQUEST',
        title: requestType === 'QUOTE' ? 'Orçamento pendente' : 'Nova Solicitação de Agendamento',
        message: requestType === 'QUOTE'
          ? `Novo pedido de orçamento para ${booking.service.name} de ${booking.client.name}`
          : `Agendamento solicitado para ${booking.service.name} em ${booking.scheduledDate?.toLocaleDateString('pt-BR')} às ${booking.scheduledTime}`,
        isRead: false,
        data: { bookingId: booking.id, type: requestType }
      }
    })
    
    return NextResponse.json({
      success: true,
      booking,
      travel: travelResponse,
      warnings: travelResponse.warnings,
      message: 'Solicitação criada com sucesso! O profissional será notificado.'
    })

  } catch (error) {
    console.error('Booking creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Dados inválidos',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const providerId = searchParams.get('providerId')
    const status = searchParams.get('status')

    const whereClause: any = {}

    if (clientId) {
      whereClause.clientId = clientId
    }

    if (providerId) {
      whereClause.providerId = providerId
    }

    if (status) {
      whereClause.status = status
    }

    const bookings = await prisma.serviceRequest.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            name: true
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        },
        client: {
          select: {
            name: true,
            profileImage: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      bookings
    })

  } catch (error) {
    console.error('Bookings fetch error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}
