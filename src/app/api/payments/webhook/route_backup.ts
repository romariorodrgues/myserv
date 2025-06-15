/**
 * Payment webhook endpoint for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/lib/payment-service'
import { prisma } from '@/lib/prisma'
import { WhatsAppService } from '@/lib/whatsapp-service'
import { EmailService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Webhook received:', body)

    // MercadoPago webhook
    if (body.type === 'payment') {
      const paymentId = body.data?.id

      if (!paymentId) {
        return NextResponse.json({ success: false, error: 'Payment ID not found' })
      }

      // Get payment status from MercadoPago
      const paymentStatus = await PaymentService.getMercadoPagoPaymentStatus(paymentId.toString())

      if (!paymentStatus.success) {
        return NextResponse.json({ success: false, error: 'Failed to get payment status' })
      }

      // Find payment in database
      const payment = await prisma.payment.findFirst({
        where: { gatewayPaymentId: paymentId.toString() },
        include: {
          serviceRequest: {
            include: {
              client: true,
              provider: {
                include: {
                  user: true
                }
              },
              service: true
            }
          },
          user: true
        }
      })

      if (!payment) {
        console.log(`Payment not found for payment ID: ${paymentId}`)
        return NextResponse.json({ success: true, message: 'Payment not found in database' })
      }

      // Update payment status
      let newStatus = 'PENDING'
      
      switch (paymentStatus.status) {
        case 'approved':
          newStatus = 'APPROVED'
          break
        case 'rejected':
        case 'cancelled':
          newStatus = 'REJECTED'
          break
        case 'pending':
        case 'in_process':
          newStatus = 'PENDING'
          break
      }

      // Only update if status changed
      if (newStatus !== payment.status) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: newStatus as any }
        })

        // Send notifications based on status
        if (newStatus === 'APPROVED' && payment.serviceRequest) {
          // Payment approved - update booking status and notify users
          if (payment.serviceRequestId) {
            await prisma.serviceRequest.update({
              where: { id: payment.serviceRequestId },
              data: { status: 'ACCEPTED' }
            })
          }

          // Notify client
          await WhatsAppService.notifyBookingConfirmed({
            userPhone: payment.serviceRequest.client.phone,
            userName: payment.serviceRequest.client.name,
            serviceName: payment.serviceRequest.service.name,
            providerName: payment.serviceRequest.provider.user.name,
            scheduledDate: payment.serviceRequest.scheduledDate?.toLocaleDateString('pt-BR'),
            amount: payment.amount
          })

          await EmailService.sendBookingConfirmationEmail({
            userEmail: payment.serviceRequest.client.email,
            userPhone: payment.serviceRequest.client.phone,
            userName: payment.serviceRequest.client.name,
            serviceName: payment.serviceRequest.service.name,
            providerName: payment.serviceRequest.provider.user.name,
            scheduledDate: payment.serviceRequest.scheduledDate?.toLocaleDateString('pt-BR'),
            amount: payment.amount
          })
          
        } else if (newStatus === 'REJECTED' && payment.serviceRequest) {
          // Payment failed - notify client
          await WhatsAppService.notifyPaymentReminder({
            userPhone: payment.serviceRequest.client.phone,
            userName: payment.serviceRequest.client.name,
            serviceName: payment.serviceRequest.service.name,
            providerName: payment.serviceRequest.provider.user.name,
            amount: payment.amount
          })

          await EmailService.sendPaymentReminderEmail({
            userEmail: payment.serviceRequest.client.email,
            userPhone: payment.serviceRequest.client.phone,
            userName: payment.serviceRequest.client.name,
            serviceName: payment.serviceRequest.service.name,
            providerName: payment.serviceRequest.provider.user.name,
            amount: payment.amount
          })
        }

        console.log(`Payment ${payment.id} status updated to ${newStatus}`)
      }

      return NextResponse.json({ success: true, status: newStatus })
    }

    // Pagar.me webhook
    if (body.object === 'transaction') {
      // Handle Pagar.me webhook
      const transactionId = body.id
      const status = body.status

      const payment = await prisma.payment.findFirst({
        where: { gatewayPaymentId: transactionId.toString() },
        include: {
          serviceRequest: {
            include: {
              client: true,
              provider: {
                include: {
                  user: true
                }
              },
              service: true
            }
          }
        }
      })

      if (!payment) {
        return NextResponse.json({ success: true, message: 'Payment not found' })
      }

      let newStatus = 'PENDING'
      
      switch (status) {
        case 'paid':
          newStatus = 'APPROVED'
          break
        case 'refused':
        case 'chargedback':
          newStatus = 'REJECTED'
          break
        case 'processing':
        case 'analyzing':
        case 'pending_payment':
          newStatus = 'PENDING'
          break
      }

      if (newStatus !== payment.status) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: newStatus as any }
        })

        // Similar notification logic as MercadoPago
        // ... (implement similar to above)

        console.log(`Pagar.me payment ${payment.id} status updated to ${newStatus}`)
      }

      return NextResponse.json({ success: true, status: newStatus })
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'MyServ Payment Webhook Endpoint' })
}
