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
  zipCode: z.string().min(8, 'CEP deve ter 8 caracteres')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createBookingSchema.parse(body)

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
            phone: true
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

    // Define request type (QUOTE by default; SCHEDULING when preferred date/time provided)
    const requestType = (validatedData.preferredDate || validatedData.preferredTime) ? 'SCHEDULING' : 'QUOTE'

    // Create the booking
    const booking = await prisma.serviceRequest.create({
      data: {
        clientId: clientUser.id,
        providerId: serviceProvider.userId, // Use the User ID, not ServiceProvider ID
        serviceId: validatedData.serviceId,
        description: validatedData.description,
        scheduledDate: validatedData.preferredDate ? new Date(validatedData.preferredDate + 'T' + (validatedData.preferredTime || '10:00')) : null,
        scheduledTime: validatedData.preferredTime || null,
        requestType,
        status: 'PENDING'
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
    await WhatsAppService.notifyBookingRequest(notificationData)

    // Send email notification
    await EmailService.sendNewRequestNotificationEmail({
      ...notificationData,
      userEmail: serviceProvider.user.email
    })

    // Create notification record (provider side)
    await prisma.notification.create({
      data: {
        userId: serviceProvider.userId, // Use the User ID, not ServiceProvider ID
        type: 'SERVICE_REQUEST',
        title: 'Nova Solicitação de Serviço',
        message: `Nova solicitação para ${booking.service.name} de ${booking.client.name}`,
        isRead: false,
        data: { bookingId: booking.id }
      }
    })
    
    return NextResponse.json({
      success: true,
      booking,
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
