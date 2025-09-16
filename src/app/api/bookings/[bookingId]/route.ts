/**
 * Booking Status Update API endpoint
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles booking status updates (accept/reject/complete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { WhatsAppService } from '@/lib/whatsapp-service'
import { EmailService } from '@/lib/email-service'

// Validation schema for status update
const updateStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'COMPLETED']),
  notes: z.string().optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params
    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)

    // Find the booking
    const booking = await prisma.serviceRequest.findUnique({
      where: { id: bookingId },
      include: {
        provider: true,
        client: true,
        service: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Reserva não encontrada'
        },
        { status: 404 }
      )
    }

    // Update the booking status
    const updatedBooking = await prisma.serviceRequest.update({
      where: { id: bookingId },
      data: {
        status: validatedData.status,
        // Clear HOLD expiry on decision
        ...(validatedData.status === 'ACCEPTED' ? { expiresAt: null } : {}),
        ...(validatedData.status === 'REJECTED' ? { expiresAt: null } : {}),
        ...(validatedData.notes && { description: validatedData.notes }),
      },
      include: {
        service: true,
        provider: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Send notifications to client about status change
    const notificationData = {
      userPhone: updatedBooking.client.phone,
      userName: updatedBooking.client.name,
      serviceName: updatedBooking.service.name,
      providerName: updatedBooking.provider.name,
      bookingId: updatedBooking.id,
      scheduledDate: updatedBooking.scheduledDate?.toLocaleDateString('pt-BR'),
      amount: updatedBooking.estimatedPrice || 0
    }

    let message = ''
    let notificationType: 'SERVICE_REQUEST' | 'PAYMENT' | 'SYSTEM' | 'PROMOTIONAL' = 'SERVICE_REQUEST'
    
    switch (validatedData.status) {
      case 'ACCEPTED':
        message = `Sua solicitação de ${updatedBooking.service.name} foi aceita!`
        notificationType = 'SERVICE_REQUEST'
        
        // Send WhatsApp and email notifications
        await WhatsAppService.notifyBookingConfirmed(notificationData)
        await EmailService.sendBookingConfirmationEmail({
          ...notificationData,
          userEmail: updatedBooking.client.email
        })
        break
        
      case 'REJECTED':
        message = `Sua solicitação de ${updatedBooking.service.name} foi recusada.`
        notificationType = 'SERVICE_REQUEST'
        
        await WhatsAppService.notifyBookingRejected(notificationData)
        await EmailService.sendBookingRejectionEmail({
          ...notificationData,
          userEmail: updatedBooking.client.email
        })
        break
        
      case 'COMPLETED':
        message = `Seu serviço de ${updatedBooking.service.name} foi concluído. Avalie o profissional!`
        notificationType = 'SERVICE_REQUEST'
        
        await WhatsAppService.notifyServiceCompleted(notificationData)
        await EmailService.sendServiceCompletionEmail({
          ...notificationData,
          userEmail: updatedBooking.client.email
        })
        break
    }

    // Create notification record
    if (notificationType) {
      await prisma.notification.create({
        data: {
          userId: updatedBooking.clientId,
          type: notificationType,
          title: message,
          message: `${updatedBooking.service.name} - ${updatedBooking.provider.name}`,
          isRead: false,
          sentVia: 'whatsapp,email',
          data: { bookingId: updatedBooking.id }
        }
      })
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message
    })

  } catch (error) {
    console.error('Booking status update error:', error)
    
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

// GET - Return booking details for review modal and details view
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params

    const booking = await prisma.serviceRequest.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        client: {
          select: { id: true, name: true, email: true, phone: true }
        },
        provider: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          }
        },
        review: true,
      }
    })

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Reserva não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error('Booking fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
