/**
 * Provider earnings for current month
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function monthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0)
  return { start, end }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const providerIdParam = searchParams.get('providerId')

    const providerId = providerIdParam || session?.user?.id
    if (!providerId) {
      return NextResponse.json({ success: false, error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { start, end } = monthBounds()

    const [approvedSum, refundedSum] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'APPROVED',
          createdAt: { gte: start, lt: end },
          serviceRequest: { providerId },
        },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'REFUNDED',
          createdAt: { gte: start, lt: end },
          serviceRequest: { providerId },
        },
      }),
    ])

    const approved = approvedSum._sum.amount || 0
    const refunded = refundedSum._sum.amount || 0
    const net = approved - refunded

    return NextResponse.json({
      success: true,
      data: {
        month: start.toISOString(),
        approved,
        refunded,
        net,
      },
    })
  } catch (error) {
    console.error('Earnings error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao calcular ganhos' }, { status: 500 })
  }
}

