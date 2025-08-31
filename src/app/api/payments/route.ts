/**
 * Payment API endpoints for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PaymentService } from '@/lib/payment-service'
import { prisma } from '@/lib/prisma'

const createPaymentSchema = z.object({
  bookingId: z.string(),
  amount: z.number().positive(),
  gateway: z.enum(['mercadopago', 'pagarme']),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'pix', 'boleto']).optional(),
  installments: z.number().min(1).max(12).optional(),
  cardToken: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, amount, gateway, paymentMethod, installments, cardToken } = createPaymentSchema.parse(body)

    // Get booking details
    const booking = await prisma.serviceRequest.findUnique({
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

    // Calculate fees
    const fees = PaymentService.calculateFees(amount)

    const paymentData = {
      amount: fees.finalAmount,
      description: `${booking.service.name} - MyServ`,
      payerEmail: booking.client.email,
      payerName: booking.client.name,
      payerPhone: booking.client.phone,
      payerDocument: booking.client.cpfCnpj,
      externalReference: bookingId,
      notificationUrl: `${process.env.NEXTAUTH_URL}/api/payments/webhook`,
      successUrl: `${process.env.NEXTAUTH_URL}/pagamento/sucesso?booking=${bookingId}`,
      failureUrl: `${process.env.NEXTAUTH_URL}/pagamento/erro?booking=${bookingId}`,
      pendingUrl: `${process.env.NEXTAUTH_URL}/pagamento/pendente?booking=${bookingId}`
    }

    let paymentResult

    if (gateway === 'mercadopago') {
      if (paymentMethod === 'credit_card' && cardToken) {
        // Direct payment with credit card
        paymentResult = await PaymentService.processMercadoPagoPayment({
          token: cardToken,
          amount: fees.finalAmount,
          description: paymentData.description,
          payerEmail: paymentData.payerEmail,
          externalReference: paymentData.externalReference,
          installments
        })
      } else {
        // Create preference for checkout
        paymentResult = await PaymentService.createMercadoPagoPreference(paymentData)
      }
    } else {
      paymentResult = await PaymentService.processPagarmePayment(paymentData)
    }

    if (!paymentResult.success) {
      return NextResponse.json(
        { success: false, error: paymentResult.error },
        { status: 400 }
      )
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: booking.clientId,
        serviceRequestId: bookingId,
        amount: fees.finalAmount,
        gateway: gateway === 'mercadopago' ? 'MERCADO_PAGO' : 'PAGAR_ME',
        paymentMethod: (paymentMethod === 'credit_card' ? 'CREDIT_CARD' : 
                       paymentMethod === 'debit_card' ? 'DEBIT_CARD' :
                       paymentMethod === 'pix' ? 'PIX' :
                       paymentMethod === 'boleto' ? 'BOLETO' : 'CREDIT_CARD') as any,
        gatewayPaymentId: paymentResult.paymentId || paymentResult.preferenceId || '',
        status: paymentResult.paymentId ? 'APPROVED' : 'PENDING',
        description: `Pagamento - ${booking.service.name}`
      }
    })

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        fees: {
          commission: fees.commission,
          schedulingFee: fees.schedulingFee,
          total: fees.totalFees
        }
      },
      checkout: {
        preferenceId: paymentResult.preferenceId,
        initPoint: paymentResult.initPoint,
        sandboxInitPoint: paymentResult.sandboxInitPoint
      }
    })

  } catch (error) {
    console.error('Payment creation error:', error)
    
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
    const bookingId = searchParams.get('bookingId')
    const paymentId = searchParams.get('paymentId')

    if (!bookingId && !paymentId) {
      return NextResponse.json(
        { success: false, error: 'bookingId ou paymentId requerido' },
        { status: 400 }
      )
    }

    let payment
    
    if (paymentId) {
      payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          serviceRequest: {
            include: {
              service: true,
              client: true,
              provider: true
            }
          }
        }
      })
    } else {
      payment = await prisma.payment.findFirst({
        where: { serviceRequestId: bookingId },
        include: {
          serviceRequest: {
            include: {
              service: true,
              client: true,
              provider: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Check payment status with gateway if pending
    if (payment.status === 'PENDING' && payment.gatewayPaymentId) {
      const statusResult = await PaymentService.getMercadoPagoPaymentStatus(payment.gatewayPaymentId)
      
      if (statusResult.success && statusResult.status) {
        let newStatus = 'PENDING'
        
        switch (statusResult.status) {
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

        if (newStatus !== payment.status) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: newStatus as any }
          })
          payment.status = newStatus as any
        }
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        gateway: payment.gateway,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
        booking: payment.serviceRequest ? {
          id: payment.serviceRequest.id,
          service: payment.serviceRequest.service.name,
          client: payment.serviceRequest.client.name,
          provider: payment.serviceRequest.provider.name
        } : null
      }
    })

  } catch (error) {
    console.error('Payment fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
