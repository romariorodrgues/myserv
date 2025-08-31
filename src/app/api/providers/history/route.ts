/**
 * Provider service history API (real data) + stats
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
    const limitParam = parseInt(searchParams.get('limit') || '50')
    const limit = Math.max(1, Math.min(limitParam, 200))
    const providerId = providerIdParam || session?.user?.id
    if (!providerId) {
      return NextResponse.json({ success: false, error: 'Usuário não autenticado' }, { status: 401 })
    }

    const status = searchParams.get('status') as 'COMPLETED' | 'CANCELLED' | null
    const whereBase: any = {
      providerId,
      status: { in: ['COMPLETED', 'CANCELLED'] },
    }
    if (status) whereBase.status = status

    const requests = await prisma.serviceRequest.findMany({
      where: whereBase,
      include: {
        service: { include: { category: true } },
        client: true,
        payments: true,
        review: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })

    // Map items
    const items = requests.map(r => {
      const approved = r.payments.find(p => p.status === 'APPROVED')
      const refunded = r.payments.find(p => p.status === 'REFUNDED')
      const amount = (approved?.amount || 0) - (refunded?.amount || 0)
      const paymentStatus = approved ? 'PAID' : (r.payments.some(p => p.status === 'PENDING' || p.status === 'PROCESSING') ? 'PENDING' : (refunded ? 'CANCELLED' : 'PENDING'))
      const method = approved ? approved.paymentMethod : undefined
      const methodMap: Record<string, 'CREDIT'|'DEBIT'|'PIX'|'CASH'> = {
        CREDIT_CARD: 'CREDIT',
        DEBIT_CARD: 'DEBIT',
        PIX: 'PIX',
        BOLETO: 'CASH',
      }
      return {
        id: r.id,
        status: r.status as 'COMPLETED' | 'CANCELLED',
        description: r.description || '',
        completedAt: r.updatedAt.toISOString(),
        address: '',
        city: r.service?.category ? '' : '',
        state: '',
        duration: undefined,
        price: amount,
        rating: r.review?.rating || undefined,
        review: r.review?.comment || undefined,
        service: {
          id: r.serviceId,
          name: r.service?.name || 'Serviço',
          category: r.service?.category?.name || '',
        },
        client: {
          id: r.client.id,
          name: r.client.name,
          profileImage: r.client.profileImage,
          totalBookings: undefined,
        },
        payment: {
          method: method ? methodMap[method] || 'PIX' : 'PIX',
          status: paymentStatus,
          fee: undefined,
        },
      }
    })

    // Stats
    const completed = requests.filter(r => r.status === 'COMPLETED')
    const totalServices = completed.length
    const totalEarnings = requests.reduce((sum, r) => {
      const approved = r.payments.find(p => p.status === 'APPROVED')
      const refunded = r.payments.find(p => p.status === 'REFUNDED')
      return sum + (approved?.amount || 0) - (refunded?.amount || 0)
    }, 0)
    const avgRating = (() => {
      const ratings = requests.map(r => r.review?.rating).filter((x): x is number => typeof x === 'number')
      return ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)) : 0
    })()
    const completionRate = requests.length ? Number(((completed.length / requests.length) * 100).toFixed(1)) : 0

    const { start: monthStart, end: monthEnd } = monthBounds()
    const thisMonth = {
      services: requests.filter(r => r.status === 'COMPLETED' && r.updatedAt >= monthStart && r.updatedAt < monthEnd).length,
      earnings: requests.reduce((sum, r) => {
        if (r.updatedAt < monthStart || r.updatedAt >= monthEnd) return sum
        const approved = r.payments.find(p => p.status === 'APPROVED')
        const refunded = r.payments.find(p => p.status === 'REFUNDED')
        return sum + (approved?.amount || 0) - (refunded?.amount || 0)
      }, 0),
    }

    // Top services
    const topMap: Record<string, { name: string; count: number; earnings: number }> = {}
    for (const r of requests) {
      const s = r.service
      if (!s) continue
      const key = s.id
      if (!topMap[key]) topMap[key] = { name: s.name, count: 0, earnings: 0 }
      if (r.status === 'COMPLETED') topMap[key].count += 1
      const approved = r.payments.find(p => p.status === 'APPROVED')
      const refunded = r.payments.find(p => p.status === 'REFUNDED')
      topMap[key].earnings += (approved?.amount || 0) - (refunded?.amount || 0)
    }
    const topServices = Object.values(topMap).sort((a, b) => b.count - a.count).slice(0, 5)

    return NextResponse.json({
      success: true,
      data: {
        items,
        stats: {
          totalServices,
          totalEarnings,
          averageRating: avgRating,
          completionRate,
          repeatClients: 0,
          thisMonth,
          topServices,
        },
      },
    })
  } catch (error) {
    console.error('Provider history error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar histórico' }, { status: 500 })
  }
}
