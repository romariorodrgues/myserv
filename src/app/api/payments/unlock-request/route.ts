import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMercadoPagoConfig } from '@/lib/mercadopago'
import { Preference } from 'mercadopago'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { requestId } = await req.json()
    if (!requestId) return NextResponse.json({ error: 'requestId é obrigatório' }, { status: 400 })

    const sr = await prisma.serviceRequest.findUnique({ where: { id: requestId }, select: { providerId: true, id: true } })
    if (!sr || sr.providerId !== session.user.id) return NextResponse.json({ error: 'Solicitação inválida' }, { status: 404 })

    // Já desbloqueado por pagamento aprovado?
    const already = await prisma.payment.findFirst({ where: { serviceRequestId: requestId, userId: session.user.id, status: { in: ['APPROVED', 'COMPLETED', 'PAID'] } } })
    if (already) return NextResponse.json({ success: true, already: true })

    // preço dinâmico via SystemSettings
    const s = await prisma.systemSettings.findUnique({ where: { key: 'PLAN_UNLOCK_PRICE' } })
    const price = Number(s?.value || '4.9') || 4.9

    const mercadoPagoConfig = getMercadoPagoConfig()

    if (!mercadoPagoConfig) {
      console.error('[UNLOCK_REQUEST] MERCADOPAGO_ACCESS_TOKEN não está configurado')
      return NextResponse.json({ error: 'Configuração de pagamento indisponível' }, { status: 503 })
    }

    const preference = new Preference(mercadoPagoConfig)
    const { id, init_point } = await preference.create({
      body: {
        items: [
          {
            id: `unlock-${requestId}`,
            title: 'Desbloqueio de contato (solicitação)',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: price,
            description: 'Acesso às informações de contato do cliente para esta solicitação',
          },
        ],
        back_urls: {
          success: `${process.env.BASE_URL}/status?payment=success`,
          failure: `${process.env.BASE_URL}/status?payment=failure`,
          pending: `${process.env.BASE_URL}/status?payment=pending`,
        },
        notification_url: `${process.env.BASE_URL}/api/payments/webhook/booking`,
        auto_return: 'approved',
        metadata: {
          payer: { user_id: session.user.id },
          booking: { id: requestId },
        },
        external_reference: `unlock-${requestId}`,
      },
    })

    return NextResponse.json({ success: true, preferenceId: id, initPoint: init_point })
  } catch (e) {
    console.error('[UNLOCK_REQUEST]', e)
    return NextResponse.json({ error: 'Erro ao iniciar pagamento' }, { status: 500 })
  }
}
