import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { userType: true } })
  if (user?.userType !== 'ADMIN') {
    return NextResponse.json({ error: 'Apenas administradores' }, { status: 403 })
  }

  try {
    const [paymentsAggregate, paymentsStatuses, notificationCounts] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.notification.groupBy({
        by: ['isRead'],
        _count: { _all: true },
      }),
    ])

    const paymentCountByStatus = Object.fromEntries(
      paymentsStatuses.map((item) => [item.status, item._count._all])
    ) as Record<string, number>

    const totalPayments = paymentsStatuses.reduce((acc, item) => acc + item._count._all, 0)
    const successfulPayments = paymentCountByStatus.APPROVED ?? 0
    const failedPayments = (paymentCountByStatus.FAILED ?? 0) + (paymentCountByStatus.REFUNDED ?? 0)
    const pendingPayments = paymentCountByStatus.PENDING ?? 0

    const totalAmount = paymentsAggregate._sum.amount ?? 0

    const notificationsSent = notificationCounts.reduce((acc, item) => acc + item._count._all, 0)
    const notificationsRead = notificationCounts
      .filter((item) => item.isRead)
      .reduce((acc, item) => acc + item._count._all, 0)

    return NextResponse.json({
      success: true,
      metrics: {
        payments: {
          total: totalPayments,
          successful: successfulPayments,
          failed: failedPayments,
          pending: pendingPayments,
          totalAmount,
        },
        notifications: {
          sent: notificationsSent,
          delivered: notificationsRead,
          failed: 0,
          whatsappSent: 0,
          emailSent: notificationsSent,
        },
        geocoding: {
          requests: 0,
          cached: 0,
          errors: 0,
          cacheHitRate: 0,
        },
        apiRequests: {
          total: 0,
          rateLimited: 0,
          errors: 0,
          averageResponseTime: 0,
        },
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/metrics/summary]', error)
    return NextResponse.json({ error: 'Erro ao carregar métricas' }, { status: 500 })
  }
}
