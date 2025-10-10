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
const paymentSchema = z.object({
  method: z.enum(['PIX', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'OTHER']),
  amount: z.number().nonnegative()
})

const updateStatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
  cancelReason: z.string().min(5, 'Informe um motivo de cancelamento').max(500).optional(),
  cancelledBy: z.enum(['CLIENT', 'PROVIDER']).optional(),
  payment: paymentSchema.optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params
    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)

    if (validatedData.status === 'COMPLETED' && !validatedData.payment) {
      return NextResponse.json({ success: false, error: 'Informe valor e método de pagamento para concluir o serviço.' }, { status: 400 })
    }

    if (validatedData.status === 'CANCELLED' && (!validatedData.cancelReason || !validatedData.cancelledBy)) {
      return NextResponse.json({ success: false, error: 'Informe quem cancelou e o motivo do cancelamento.' }, { status: 400 })
    }

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

    const updateData: any = {
      status: validatedData.status,
      ...(validatedData.notes ? { description: validatedData.notes } : {}),
      ...(validatedData.status === 'ACCEPTED' ? { expiresAt: null } : {}),
      ...(validatedData.status === 'REJECTED' ? { expiresAt: null } : {}),
    }

    if (validatedData.status === 'COMPLETED' && validatedData.payment) {
      updateData.finalPrice = validatedData.payment.amount
      updateData.paymentMethod = validatedData.payment.method
      updateData.expiresAt = null
    }

    if (validatedData.status === 'CANCELLED') {
      updateData.cancellationReason = validatedData.cancelReason
      updateData.cancelledBy = validatedData.cancelledBy
      updateData.cancelledAt = new Date()
      updateData.expiresAt = null
      updateData.providerId = booking.providerId
      updateData.clientId = booking.clientId
      updateData.serviceId = booking.serviceId
      updateData.requestType = booking.requestType
      updateData.description = booking.description
      updateData.estimatedPrice = booking.estimatedPrice
      updateData.basePriceSnapshot = booking.basePriceSnapshot
      updateData.travelCost = booking.travelCost
      updateData.scheduledDate = booking.scheduledDate
      updateData.scheduledTime = booking.scheduledTime
    }

    const updatedBooking = await prisma.serviceRequest.update({
      where: { id: bookingId },
      data: updateData,
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
        },
        payments: true,
      }
    })

    if (validatedData.status === 'CANCELLED') {
      await prisma.payment.updateMany({
        where: { serviceRequestId: bookingId, status: { in: ['PENDING', 'PROCESSING'] } },
        data: { status: 'CANCELLED' }
      })
    }

    if (validatedData.status === 'COMPLETED' && validatedData.payment) {
      const { amount, method } = validatedData.payment
      const existingPayment = updatedBooking.payments?.[0]

      if (existingPayment) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount,
            paymentMethod: method,
            status: 'APPROVED',
            gateway: existingPayment.gateway || 'MANUAL',
          }
        })
      } else {
        await prisma.payment.create({
          data: {
            serviceRequestId: bookingId,
            userId: booking.providerId,
            amount,
            paymentMethod: method,
            status: 'APPROVED',
            gateway: 'MANUAL',
            description: `Pagamento manual do serviço ${booking.service.name}`,
          }
        })
      }
    }

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
      case 'CANCELLED':
        if (validatedData.cancelledBy === 'PROVIDER') {
          message = `Seu pedido de ${updatedBooking.service.name} foi cancelado pelo profissional.`
          notificationType = 'SERVICE_REQUEST'
          await prisma.notification.create({
            data: {
              userId: updatedBooking.clientId,
              type: 'SERVICE_REQUEST',
              title: message,
              message: validatedData.cancelReason || 'Pedido cancelado pelo prestador.',
              isRead: false,
              data: { bookingId: updatedBooking.id, cancelledBy: 'PROVIDER' }
            }
          })
        } else {
          message = `O cliente cancelou o pedido de ${updatedBooking.service.name}.`
          notificationType = 'SERVICE_REQUEST'
          await prisma.notification.create({
            data: {
              userId: updatedBooking.providerId,
              type: 'SERVICE_REQUEST',
              title: message,
              message: validatedData.cancelReason || 'Pedido cancelado pelo cliente.',
              isRead: false,
              data: { bookingId: updatedBooking.id, cancelledBy: 'CLIENT' }
            }
          })
        }
        break
    }

    if (notificationType && validatedData.status !== 'CANCELLED') {
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
        payments: true,
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
