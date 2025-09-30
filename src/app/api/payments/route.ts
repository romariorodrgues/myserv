/**
 * Payment API endpoints for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { PaymentService } from '@/lib/payment-service'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { PaymentGateway, PaymentMethod, PaymentStatus } from '@/types'

const createPaymentSchema = z.object({
  bookingId: z.string(),
  amount: z.number().positive(),
  gateway: z.enum(['mercadopago', 'pagarme']),
  paymentMethod: z.enum(['credit_card', 'debit_card', 'pix', 'boleto']).optional(),
  paymentMethodId: z.string().optional(),
  installments: z.number().min(1).max(12).optional(),
  cardToken: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, amount, gateway, paymentMethod, paymentMethodId, installments, cardToken } = createPaymentSchema.parse(body)

    const booking = await prisma.serviceRequest.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        provider: true,
        service: true
      }
    })

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Reserva não encontrada' }, { status: 404 })
    }

    if (session.user.userType !== 'SERVICE_PROVIDER' || session.user.id !== booking.providerId) {
      return NextResponse.json({ success: false, error: 'Somente prestadores podem pagar esta solicitação' }, { status: 403 })
    }

    if (gateway !== 'mercadopago') {
      return NextResponse.json({ success: false, error: 'Gateway ainda não suportado' }, { status: 400 })
    }

    if (paymentMethod === 'credit_card' && cardToken && !paymentMethodId) {
      return NextResponse.json({ success: false, error: 'paymentMethodId é obrigatório para pagamentos com cartão' }, { status: 400 })
    }

    const payerUser = booking.provider

    const fees = PaymentService.calculateFees(amount)

    const metadata = {
      booking: { id: booking.id },
      payer: {
        userId: session.user.id,
        role: 'PROVIDER'
      }
    }

    const basePaymentData = {
      amount: fees.finalAmount,
      description: `${booking.service.name} - MyServ`,
      payerEmail: payerUser.email,
      payerName: payerUser.name,
      payerPhone: payerUser.phone,
      payerDocument: payerUser.cpfCnpj,
      externalReference: bookingId,
      notificationUrl: `${process.env.BASE_URL}/api/payments/webhook/booking`,
      successUrl: `${process.env.BASE_URL}/pagamento/sucesso?booking=${bookingId}`,
      failureUrl: `${process.env.BASE_URL}/pagamento/erro?booking=${bookingId}`,
      pendingUrl: `${process.env.BASE_URL}/pagamento/pendente?booking=${bookingId}`,
      metadata
    }

    const idempotencyKey = `booking-${bookingId}-${session.user.id}-${Date.now()}`

    let paymentResult

    if (paymentMethod === 'credit_card' && cardToken) {
      paymentResult = await PaymentService.processMercadoPagoPayment({
        token: cardToken,
        amount: fees.finalAmount,
        description: basePaymentData.description,
        payerEmail: basePaymentData.payerEmail,
        externalReference: basePaymentData.externalReference,
        installments,
        paymentMethodId: paymentMethodId!,
        notificationUrl: basePaymentData.notificationUrl,
        metadata,
        idempotencyKey
      })
    } else {
      paymentResult = await PaymentService.createMercadoPagoPreference(basePaymentData)
    }

    if (!paymentResult.success) {
      return NextResponse.json({ success: false, error: paymentResult.error }, { status: 400 })
    }

    const mapStatus = (status?: string): PaymentStatus => {
      switch (status) {
        case 'approved':
          return PaymentStatus.APPROVED
        case 'in_process':
          return PaymentStatus.PROCESSING
        case 'pending':
        case 'pending_waiting_payment':
        case 'pending_contingency':
          return PaymentStatus.PENDING
        case 'rejected':
        case 'cancelled':
          return PaymentStatus.REJECTED
        default:
          return PaymentStatus.PENDING
      }
    }

    const mapMethod = (method?: string): string => {
      switch (method) {
        case 'credit_card':
          return PaymentMethod.CREDIT_CARD
        case 'debit_card':
          return PaymentMethod.DEBIT_CARD
        case 'pix':
          return PaymentMethod.PIX
        case 'boleto':
          return PaymentMethod.BOLETO
        default:
          return 'CHECKOUT'
      }
    }

    const resolvedGateway = gateway === 'mercadopago' ? PaymentGateway.MERCADO_PAGO : PaymentGateway.PAGAR_ME
    const resolvedStatus = mapStatus(paymentResult.status)
    const resolvedMethod = mapMethod(paymentMethod)

    let paymentRecord = paymentResult.paymentId
      ? await prisma.payment.findFirst({ where: { gatewayPaymentId: paymentResult.paymentId } })
      : null

    if (!paymentRecord) {
      paymentRecord = await prisma.payment.findFirst({
        where: {
          serviceRequestId: bookingId,
          userId: session.user.id,
          gateway: resolvedGateway,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
          gatewayPaymentId: null
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    const paymentDataForDb = {
      userId: session.user.id,
      serviceRequestId: bookingId,
      amount: fees.finalAmount,
      currency: 'BRL',
      paymentMethod: resolvedMethod,
      gateway: resolvedGateway,
      status: resolvedStatus,
      description: `Pagamento - ${booking.service.name}`,
      gatewayPaymentId: paymentResult.paymentId ?? paymentRecord?.gatewayPaymentId ?? null
    }

    if (paymentRecord) {
      paymentRecord = await prisma.payment.update({ where: { id: paymentRecord.id }, data: paymentDataForDb })
    } else {
      paymentRecord = await prisma.payment.create({ data: paymentDataForDb })
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentRecord.id,
        status: paymentRecord.status
      },
      checkout: paymentResult.preferenceId
        ? {
            preferenceId: paymentResult.preferenceId,
            initPoint: paymentResult.initPoint,
            sandboxInitPoint: paymentResult.sandboxInitPoint
          }
        : undefined
    })

  } catch (error) {
    console.error('Payment creation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
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
