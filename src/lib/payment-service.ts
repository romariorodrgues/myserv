/**
 * Payment service integration for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles payment processing with MercadoPago and Pagar.me
 */

import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

// MercadoPago configuration
const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
  }
})

export interface PaymentData {
  amount: number
  description: string
  payerEmail: string
  payerName: string
  payerPhone?: string
  payerDocument?: string
  externalReference: string
  notificationUrl?: string
  successUrl?: string
  failureUrl?: string
  pendingUrl?: string
  metadata?: any
}

export interface PaymentResponse {
  success: boolean
  paymentId?: string
  preferenceId?: string
  initPoint?: string
  sandboxInitPoint?: string
  error?: string
  transactionId?: string
  status?: string
}

export class PaymentService {
  
  /**
   * Create MercadoPago preference for payment
   */
  static async createMercadoPagoPreference(data: PaymentData): Promise<PaymentResponse> {
    try {
      const preference = new Preference(mercadoPagoClient)

      const sanitizedPhone = data.payerPhone ? data.payerPhone.replace(/[^0-9]/g, '') : undefined
      const phoneAreaCode = sanitizedPhone && sanitizedPhone.length > 2 ? sanitizedPhone.slice(0, 2) : undefined
      const phoneNumber = sanitizedPhone && sanitizedPhone.length > 2 ? sanitizedPhone.slice(2) : undefined

      const preferenceData = {
        items: [
          {
            id: data.externalReference,
            title: data.description,
            quantity: 1,
            unit_price: data.amount,
            currency_id: 'BRL'
          }
        ],
        payer: {
          name: data.payerName,
          email: data.payerEmail,
          phone: sanitizedPhone && phoneAreaCode && phoneNumber
            ? {
                area_code: phoneAreaCode,
                number: phoneNumber
              }
            : undefined,
          identification: data.payerDocument ? {
            type: 'CPF',
            number: data.payerDocument
          } : undefined
        },
        external_reference: data.externalReference,
        notification_url: data.notificationUrl,
        back_urls: {
          success: data.successUrl || `${process.env.BASE_URL}/pagamento/sucesso`,
          failure: data.failureUrl || `${process.env.BASE_URL}/pagamento/erro`,
          pending: data.pendingUrl || `${process.env.BASE_URL}/pagamento/pendente`
        },
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12
        },
        metadata: data.metadata
      }

      const response = await preference.create({ body: preferenceData })

      return {
        success: true,
        preferenceId: response.id,
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point,
        status: 'pending'
      }

    } catch (error) {
      console.error('MercadoPago error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar pagamento'
      }
    }
  }

  /**
   * Process direct payment with MercadoPago
   */
  static async processMercadoPagoPayment(paymentData: {
    token: string
    amount: number
    description: string
    payerEmail: string
    externalReference: string
    installments?: number
    paymentMethodId: string
    notificationUrl?: string
    metadata?: Record<string, unknown>
    idempotencyKey?: string
  }): Promise<PaymentResponse> {
    try {
      const payment = new Payment(mercadoPagoClient)

      const paymentRequest = {
        transaction_amount: paymentData.amount,
        token: paymentData.token,
        description: paymentData.description,
        installments: paymentData.installments || 1,
        payment_method_id: paymentData.paymentMethodId,
        payer: {
          email: paymentData.payerEmail
        },
        external_reference: paymentData.externalReference,
        metadata: paymentData.metadata,
        notification_url: paymentData.notificationUrl
      }

      const response = await payment.create({
        body: paymentRequest,
        requestOptions: paymentData.idempotencyKey ? { idempotencyKey: paymentData.idempotencyKey } : undefined,
      })

      return {
        success: response.status !== 'rejected' && response.status !== 'cancelled',
        paymentId: response.id?.toString(),
        transactionId: response.id?.toString(),
        status: response.status
      }

    } catch (error) {
      console.error('MercadoPago payment error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar pagamento'
      }
    }
  }

  /**
   * Get payment status from MercadoPago
   */
  static async getMercadoPagoPaymentStatus(paymentId: string) {
    try {
      const payment = new Payment(mercadoPagoClient)
      const response = await payment.get({ id: paymentId })
      
      return {
        success: true,
        status: response.status,
        statusDetail: response.status_detail,
        amount: response.transaction_amount,
        externalReference: response.external_reference
      }

    } catch (error) {
      console.error('Error getting payment status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao consultar pagamento'
      }
    }
  }

  /**
   * Process Pagar.me payment (alternative gateway)
   */
  static async processPagarmePayment(data: PaymentData): Promise<PaymentResponse> {
    try {
      // Pagar.me implementation would go here
      // For now, return a mock response
      return {
        success: false,
        error: 'Pagar.me integration not implemented yet'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no Pagar.me'
      }
    }
  }

  /**
   * Calculate platform commission and fees
   */
  static calculateFees(baseAmount: number, hasSchedulingFee: boolean = true): {
    baseAmount: number
    commissionRate: number
    commission: number
    schedulingFee: number
    totalFees: number
    finalAmount: number
  } {
    const commissionRate = parseFloat(process.env.DEFAULT_COMMISSION_RATE || '0.10')
    const schedulingFee = hasSchedulingFee ? parseFloat(process.env.DEFAULT_SCHEDULING_FEE || '5.00') : 0
    
    const commission = baseAmount * commissionRate
    const totalFees = commission + schedulingFee
    const finalAmount = baseAmount + totalFees

    return {
      baseAmount,
      commissionRate,
      commission,
      schedulingFee,
      totalFees,
      finalAmount
    }
  }
}

export default PaymentService
