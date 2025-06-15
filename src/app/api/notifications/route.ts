/**
 * Notifications API endpoint for MyServ platform
 * Author: R    const notificationData = {
      userPhone: userPhone,
      userName: userName,
      serviceName: booking?.service.name,
      bookingId: booking?.id,
      providerName: booking?.provider.name,
      clientName: booking?.client.name,
      scheduledDate: booking?.scheduledDate?.toLocaleDateString('pt-BR'),
      amount: booking?.estimatedPrice || booking?.finalPrice || 0,
      status: booking?.status
    }igues <romariorodrigues.dev@gmail.com>
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { WhatsAppService } from '@/lib/whatsapp-service'
import { EmailService } from '@/lib/email-service'
import { prisma } from '@/lib/prisma'

const sendNotificationSchema = z.object({
  type: z.enum([
    'welcome',
    'booking_request',
    'booking_confirmed',
    'booking_rejected',
    'service_completed',
    'payment_reminder'
  ]),
  userId: z.string(),
  bookingId: z.string().optional(),
  channels: z.array(z.enum(['whatsapp', 'email'])).default(['whatsapp', 'email'])
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, userId, bookingId, channels } = sendNotificationSchema.parse(body)

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    let booking = null
    if (bookingId) {
      booking = await prisma.serviceRequest.findUnique({
        where: { id: bookingId },
        include: {
          client: true,
          provider: true,
          service: true
        }
      })

      if (!booking) {
        return NextResponse.json(
          { success: false, error: 'Reserva não encontrada' },
          { status: 404 }
        )
      }
    }

    const results = {
      whatsapp: false,
      email: false
    }

    const notificationData = {
      userPhone: user.phone,
      userName: user.name,
      serviceName: booking?.service.name,
      bookingId: booking?.id,
      providerName: booking?.provider.name,
      clientName: booking?.client.name,
      scheduledDate: booking?.scheduledDate?.toLocaleDateString('pt-BR'),
      amount: booking?.estimatedPrice || booking?.finalPrice,
      status: booking?.status
    }

    // Send WhatsApp notification
    if (channels.includes('whatsapp')) {
      switch (type) {
        case 'welcome':
          results.whatsapp = await WhatsAppService.sendWelcomeMessage(notificationData)
          break
        case 'booking_request':
          results.whatsapp = await WhatsAppService.notifyBookingRequest(notificationData)
          break
        case 'booking_confirmed':
          results.whatsapp = await WhatsAppService.notifyBookingConfirmed(notificationData)
          break
        case 'booking_rejected':
          results.whatsapp = await WhatsAppService.notifyBookingRejected(notificationData)
          break
        case 'service_completed':
          results.whatsapp = await WhatsAppService.notifyServiceCompleted(notificationData)
          break
        case 'payment_reminder':
          results.whatsapp = await WhatsAppService.notifyPaymentReminder(notificationData)
          break
      }
    }

    // Send Email notification
    if (channels.includes('email')) {
      const emailData = { ...notificationData, userEmail: user.email }
      
      switch (type) {
        case 'welcome':
          results.email = await EmailService.sendWelcomeEmail(user.email, user.name)
          break
        case 'booking_request':
          results.email = await EmailService.sendNewRequestNotificationEmail(emailData)
          break
        case 'booking_confirmed':
          results.email = await EmailService.sendBookingConfirmationEmail(emailData)
          break
        case 'booking_rejected':
          results.email = await EmailService.sendBookingRejectionEmail(emailData)
          break
        case 'service_completed':
          results.email = await EmailService.sendServiceCompletionEmail(emailData)
          break
        case 'payment_reminder':
          results.email = await EmailService.sendPaymentReminderEmail(emailData)
          break
      }
    }

    // Save notification record
    await prisma.notification.create({
      data: {
        userId,
        type: (type.toUpperCase() === 'WELCOME' ? 'SYSTEM' :
               type.toUpperCase().includes('BOOKING') ? 'SERVICE_REQUEST' :
               type.toUpperCase().includes('PAYMENT') ? 'PAYMENT' : 'SYSTEM') as any,
        title: getNotificationTitle(type),
        message: getNotificationMessage(type, notificationData),
        isRead: false,
        sentVia: channels.join(',')
      }
    })

    return NextResponse.json({
      success: true,
      results,
      message: 'Notificações enviadas'
    })

  } catch (error) {
    console.error('Notification error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
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
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId requerido' },
        { status: 400 }
      )
    }

    const where: { userId: string; isRead?: boolean } = { userId }
    if (unreadOnly) {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    })

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    })

  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationIds, markAsRead } = z.object({
      notificationIds: z.array(z.string()),
      markAsRead: z.boolean()
    }).parse(body)

    await prisma.notification.updateMany({
      where: { id: { in: notificationIds } },
      data: { isRead: markAsRead }
    })

    return NextResponse.json({
      success: true,
      message: markAsRead ? 'Notificações marcadas como lidas' : 'Notificações marcadas como não lidas'
    })

  } catch (error) {
    console.error('Update notifications error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function getNotificationTitle(type: string): string {
  const titles = {
    welcome: 'Bem-vindo ao MyServ!',
    booking_request: 'Nova Solicitação de Serviço',
    booking_confirmed: 'Solicitação Aceita',
    booking_rejected: 'Solicitação Recusada',
    service_completed: 'Serviço Concluído',
    payment_reminder: 'Lembrete de Pagamento'
  }
  return titles[type as keyof typeof titles] || 'Notificação'
}

function getNotificationMessage(type: string, data: Record<string, unknown>): string {
  const typedData = data as {
    userName?: string;
    serviceName?: string;
    clientName?: string;
    providerName?: string;
    amount?: number;
  }
  
  const messages = {
    welcome: `Olá ${typedData.userName}! Seja bem-vindo à maior plataforma de serviços do Brasil.`,
    booking_request: `Nova solicitação para ${typedData.serviceName} de ${typedData.clientName}.`,
    booking_confirmed: `Sua solicitação para ${typedData.serviceName} foi aceita por ${typedData.providerName}.`,
    booking_rejected: `Sua solicitação para ${typedData.serviceName} foi recusada por ${typedData.providerName}.`,
    service_completed: `O serviço ${typedData.serviceName} foi concluído com sucesso.`,
    payment_reminder: `Você tem um pagamento pendente de R$ ${typedData.amount?.toFixed(2)}.`
  }
  return messages[type as keyof typeof messages] || 'Nova notificação'
}
