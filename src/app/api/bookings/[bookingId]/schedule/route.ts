/**
 * Schedule a QUOTE booking into a SCHEDULING with date/time and accept it
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { WhatsAppService } from '@/lib/whatsapp-service'
import { EmailService } from '@/lib/email-service'

const scheduleSchema = z.object({
  scheduledDate: z.string().min(10), // YYYY-MM-DD
  scheduledTime: z.string().min(4),  // HH:MM
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params
    const body = await request.json()
    const { scheduledDate, scheduledTime } = scheduleSchema.parse(body)

    const booking = await prisma.serviceRequest.findUnique({
      where: { id: bookingId },
      include: { service: true, client: true, provider: true }
    })
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Reserva não encontrada' }, { status: 404 })
    }

    if (booking.status === 'CANCELLED' || booking.status === 'REJECTED' || booking.status === 'COMPLETED') {
      return NextResponse.json({ success: false, error: 'Não é possível agendar esta solicitação' }, { status: 400 })
    }

    if (booking.requestType !== 'QUOTE') {
      // Allow rescheduling only if it had no schedule
      if (booking.scheduledDate && booking.scheduledTime) {
        return NextResponse.json({ success: false, error: 'Solicitação já possui agendamento' }, { status: 400 })
      }
    }

    const sameDayStart = new Date(scheduledDate)
    const nextDay = new Date(sameDayStart)
    nextDay.setDate(nextDay.getDate() + 1)

    // Ensure slot is free for provider
    const conflicting = await prisma.serviceRequest.findFirst({
      where: {
        providerId: booking.providerId,
        scheduledDate: { gte: sameDayStart, lt: nextDay },
        scheduledTime,
        status: { in: ['PENDING', 'ACCEPTED', 'COMPLETED'] },
        NOT: { id: booking.id }
      }
    })
    if (conflicting) {
      return NextResponse.json({ success: false, error: 'Horário indisponível' }, { status: 409 })
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: booking.id },
      data: {
        scheduledDate: new Date(`${scheduledDate}T${scheduledTime}`),
        scheduledTime,
        requestType: 'SCHEDULING',
        status: 'ACCEPTED',
      },
      include: { service: true, provider: true, client: true }
    })

    // Notify client about acceptance/scheduling
    const notificationData = {
      userPhone: updated.client.phone,
      userName: updated.client.name,
      serviceName: updated.service.name,
      providerName: updated.provider.name,
      bookingId: updated.id,
      scheduledDate: updated.scheduledDate?.toLocaleDateString('pt-BR'),
      amount: updated.estimatedPrice || 0
    }

    await WhatsAppService.notifyBookingConfirmed(notificationData)
    await EmailService.sendBookingConfirmationEmail({
      ...notificationData,
      userEmail: updated.client.email
    })

    await prisma.notification.create({
      data: {
        userId: updated.clientId,
        type: 'SERVICE_REQUEST',
        title: 'Seu orçamento foi agendado',
        message: `${updated.service.name} com ${updated.provider.name} em ${updated.scheduledDate?.toLocaleDateString('pt-BR')} às ${updated.scheduledTime}`,
        isRead: false,
        sentVia: 'whatsapp,email',
        data: { bookingId: updated.id }
      }
    })

    return NextResponse.json({ success: true, booking: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Schedule from quote error:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}

