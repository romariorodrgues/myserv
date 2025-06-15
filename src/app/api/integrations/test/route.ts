/**
 * Integration testing API endpoint for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { WhatsAppService } from '@/lib/whatsapp-service'
import { EmailService } from '@/lib/email-service'
import { PaymentService } from '@/lib/payment-service'
import GoogleMapsService from '@/lib/maps-service'

const testSchema = z.object({
  service: z.enum(['whatsapp', 'email', 'payment', 'maps']),
  testData: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    amount: z.number().positive().optional()
  }).optional()
})

interface TestResult {
  service: string
  success: boolean
  message: string
  data: unknown
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { service, testData } = testSchema.parse(body)

    const results: TestResult = {
      service,
      success: false,
      message: '',
      data: null,
      timestamp: new Date().toISOString()
    }

    switch (service) {
      case 'whatsapp':
        if (!testData?.phone) {
          results.message = 'Telefone é obrigatório para teste do WhatsApp'
          break
        }

        results.success = await WhatsAppService.sendWelcomeMessage({
          userPhone: testData.phone,
          userName: 'Usuário Teste'
        })
        results.message = results.success 
          ? 'Mensagem de teste enviada via WhatsApp' 
          : 'Falha ao enviar mensagem via WhatsApp'
        break

      case 'email':
        if (!testData?.email) {
          results.message = 'Email é obrigatório para teste de email'
          break
        }

        results.success = await EmailService.testConnection(testData.email)
        results.message = results.success 
          ? 'Email de teste enviado com sucesso' 
          : 'Falha ao enviar email de teste'
        break

      case 'payment':
        if (!testData?.amount) {
          results.message = 'Valor é obrigatório para teste de pagamento'
          break
        }

        const paymentData = {
          amount: testData.amount,
          description: 'Teste de Pagamento MyServ',
          payerEmail: 'teste@myserv.com.br',
          payerName: 'Usuário Teste',
          payerPhone: '11999999999',
          externalReference: `test-${Date.now()}`,
          notificationUrl: `${process.env.NEXTAUTH_URL}/api/payments/webhook`,
          successUrl: `${process.env.NEXTAUTH_URL}/pagamento/sucesso`,
          failureUrl: `${process.env.NEXTAUTH_URL}/pagamento/erro`,
          pendingUrl: `${process.env.NEXTAUTH_URL}/pagamento/pendente`
        }

        const paymentResult = await PaymentService.createMercadoPagoPreference(paymentData)
        results.success = paymentResult.success
        results.message = paymentResult.success 
          ? 'Preferência de pagamento criada com sucesso' 
          : `Falha na criação da preferência: ${paymentResult.error}`
        results.data = paymentResult.success ? {
          preferenceId: paymentResult.preferenceId,
          initPoint: paymentResult.initPoint
        } : null
        break

      case 'maps':
        if (!testData?.address) {
          results.message = 'Endereço é obrigatório para teste do Google Maps'
          break
        }

        const locationResult = await GoogleMapsService.geocodeAddress(testData.address)
        results.success = !!locationResult
        results.message = locationResult 
          ? 'Endereço geocodificado com sucesso' 
          : 'Falha na geocodificação do endereço'
        results.data = locationResult
        break

      default:
        results.message = 'Serviço não reconhecido'
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Integration test error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Dados inválidos', 
          details: error.errors,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const service = searchParams.get('service')

    if (!service) {
      // Return integration status overview
      const status = {
        whatsapp: {
          configured: !!(process.env.CHATPRO_API_URL && process.env.CHATPRO_API_KEY),
          apiUrl: process.env.CHATPRO_API_URL ? 'Configurado' : 'Não configurado',
          apiKey: process.env.CHATPRO_API_KEY ? 'Configurado' : 'Não configurado'
        },
        email: {
          configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
          smtpHost: process.env.SMTP_HOST || 'Não configurado',
          smtpUser: process.env.SMTP_USER ? 'Configurado' : 'Não configurado'
        },
        payment: {
          mercadopago: {
            configured: !!(process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.MERCADOPAGO_PUBLIC_KEY),
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ? 'Configurado' : 'Não configurado',
            publicKey: process.env.MERCADOPAGO_PUBLIC_KEY ? 'Configurado' : 'Não configurado'
          },
          pagarme: {
            configured: !!(process.env.PAGARME_API_KEY),
            apiKey: process.env.PAGARME_API_KEY ? 'Configurado' : 'Não configurado'
          }
        },
        maps: {
          configured: !!process.env.GOOGLE_MAPS_API_KEY,
          apiKey: process.env.GOOGLE_MAPS_API_KEY ? 'Configurado' : 'Não configurado'
        },
        system: {
          environment: process.env.NODE_ENV || 'development',
          nextAuthUrl: process.env.NEXTAUTH_URL || 'Não configurado',
          databaseUrl: process.env.DATABASE_URL ? 'Configurado' : 'Não configurado'
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Status das integrações MyServ',
        integrations: status,
        timestamp: new Date().toISOString()
      })
    }

    // Return specific service configuration
    const serviceConfigs: Record<string, { 
      name: string; 
      configured: boolean; 
      description?: string; 
      url?: string;
      requiredEnvVars?: string[];
      status?: Record<string, string>
    }> = {
      whatsapp: {
        name: 'WhatsApp (ChatPro)',
        configured: !!(process.env.CHATPRO_API_URL && process.env.CHATPRO_API_KEY),
        requiredEnvVars: ['CHATPRO_API_URL', 'CHATPRO_API_KEY', 'CHATPRO_PHONE_NUMBER'],
        status: Object.fromEntries(
          ['CHATPRO_API_URL', 'CHATPRO_API_KEY', 'CHATPRO_PHONE_NUMBER'].map(key => [
            key, 
            process.env[key] ? 'Configurado' : 'Não configurado'
          ])
        )
      },
      email: {
        name: 'Email (SMTP)',
        configured: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
        requiredEnvVars: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'],
        status: Object.fromEntries(
          ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'].map(key => [
            key, 
            process.env[key] ? 'Configurado' : 'Não configurado'
          ])
        )
      },
      payment: {
        name: 'Pagamentos',
        configured: !!(process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.PAGARME_API_KEY),
        requiredEnvVars: ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_PUBLIC_KEY', 'PAGARME_API_KEY'],
        status: Object.fromEntries(
          ['MERCADOPAGO_ACCESS_TOKEN', 'MERCADOPAGO_PUBLIC_KEY', 'PAGARME_API_KEY'].map(key => [
            key, 
            process.env[key] ? 'Configurado' : 'Não configurado'
          ])
        )
      },
      maps: {
        name: 'Google Maps',
        configured: !!process.env.GOOGLE_MAPS_API_KEY,
        requiredEnvVars: ['GOOGLE_MAPS_API_KEY'],
        status: {
          GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ? 'Configurado' : 'Não configurado'
        }
      }
    }

    const config = serviceConfigs[service]
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Serviço não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      service: config,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Get integration status error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
