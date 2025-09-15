/**
 * Provider metrics API (real data)
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

    const { start: monthStart, end: monthEnd } = monthBounds()

    // Counts for completed and totals (final statuses)
    const [completedCount, finalTotal] = await Promise.all([
      prisma.serviceRequest.count({ where: { providerId, status: 'COMPLETED' } }),
      prisma.serviceRequest.count({
        where: {
          providerId,
          status: { in: ['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'] as any },
        },
      }),
    ])

    // Earnings (all-time and month): APPROVED - REFUNDED
    const [approvedAll, refundedAll, approvedMonth, refundedMonth] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'APPROVED', serviceRequest: { providerId } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'REFUNDED', serviceRequest: { providerId } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'APPROVED',
          createdAt: { gte: monthStart, lt: monthEnd },
          serviceRequest: { providerId },
        },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'REFUNDED',
          createdAt: { gte: monthStart, lt: monthEnd },
          serviceRequest: { providerId },
        },
      }),
    ])

    const totalEarnings = (approvedAll._sum.amount || 0) - (refundedAll._sum.amount || 0)
    const monthEarnings = (approvedMonth._sum.amount || 0) - (refundedMonth._sum.amount || 0)

    // This month services: use count of payments approved in month as proxy
    const monthServices = await prisma.payment.count({
      where: {
        status: 'APPROVED',
        createdAt: { gte: monthStart, lt: monthEnd },
        serviceRequest: { providerId },
      },
    })

    // Ratings
    const ratingAgg = await prisma.review.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
      where: { receiverId: providerId },
    })
    const averageRating = Number((ratingAgg._avg.rating || 0).toFixed(2))

    // Repeat clients
    const repeatGroups = await prisma.serviceRequest.groupBy({
      by: ['clientId'],
      where: { providerId, status: 'COMPLETED' },
      _count: { clientId: true },
      having: { clientId: { _count: { gt: 1 } } },
    })
    const repeatClients = repeatGroups.length
    const distinctClientsAll = await prisma.serviceRequest.groupBy({
      by: ['clientId'],
      where: { providerId, status: 'COMPLETED' },
      _count: { clientId: true },
    })
    const repeatClientRate = distinctClientsAll.length > 0 ? Math.round((repeatClients / distinctClientsAll.length) * 100) : 0

    // Response rate (last 30 days)
    const now = new Date()
    const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentTotal = await prisma.serviceRequest.count({ where: { providerId, createdAt: { gte: days30, lte: now } } })
    const recentResponded = await prisma.serviceRequest.count({
      where: {
        providerId,
        createdAt: { gte: days30, lte: now },
        status: { not: 'PENDING' },
      },
    })
    const responseRate = recentTotal > 0 ? Math.round((recentResponded / recentTotal) * 100) : null

    // Top services (by APPROVED payments all-time)
    const paidWithService = await prisma.payment.findMany({
      where: { status: 'APPROVED', serviceRequest: { providerId } },
      include: { serviceRequest: { include: { service: true } } },
    })
    const byService: Record<string, { name: string; services: number; earnings: number }> = {}
    for (const p of paidWithService) {
      const s = p.serviceRequest?.service
      if (!s) continue
      const key = s.id
      if (!byService[key]) byService[key] = { name: s.name, services: 0, earnings: 0 }
      byService[key].services += 1
      byService[key].earnings += p.amount
    }
    const categories = Object.values(byService).slice(0, 5).map(s => ({ ...s, rating: averageRating, growth: 0 }))

    const completionRate = finalTotal > 0 ? Number(((completedCount / finalTotal) * 100).toFixed(1)) : 0

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalServices: completedCount,
          totalEarnings,
          averageRating,
          completionRate,
          responseTime: null,
          repeatClientRate,
        },
        monthly: {
          current: { services: monthServices, earnings: monthEarnings, newClients: 0, rating: averageRating },
        },
        responseRate,
        categories,
      },
    })
  } catch (error) {
    console.error('Provider metrics error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao calcular métricas' }, { status: 500 })
  }
}

