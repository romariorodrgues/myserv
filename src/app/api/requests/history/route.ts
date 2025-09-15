/**
 * Client Requests History API
 * GET /api/requests/history?clientId=...
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status') as
      | 'PENDING'
      | 'ACCEPTED'
      | 'REJECTED'
      | 'COMPLETED'
      | 'CANCELLED'
      | null

    if (!clientId) {
      return NextResponse.json({ error: 'clientId é obrigatório' }, { status: 400 })
    }

    const requests = await prisma.serviceRequest.findMany({
      where: {
        clientId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        service: {
          include: { category: true },
        },
        provider: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            serviceProvider: { select: { id: true } },
          },
        },
        review: true,
      },
    })

    // Build provider stats (avg rating and total reviews) with a single query
    const providerUserIds = Array.from(new Set(requests.map(r => r.provider.id)))
    const providerStatsRaw = providerUserIds.length
      ? await prisma.review.groupBy({
          by: ['receiverId'],
          where: { receiverId: { in: providerUserIds } },
          _avg: { rating: true },
          _count: { rating: true },
        })
      : []
    const providerStatsMap = new Map(providerStatsRaw.map(s => [s.receiverId, {
      averageRating: s._avg.rating ? Number(s._avg.rating.toFixed(2)) : 0,
      totalReviews: s._count.rating,
    }]))

    const data = requests.map((r) => ({
      id: r.id,
      status: r.status,
      description: r.description || '',
      preferredDate: r.scheduledDate ? r.scheduledDate.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      address: '',
      city: '',
      state: '',
      price: r.finalPrice ?? r.estimatedPrice ?? undefined,
      service: {
        id: r.serviceId,
        name: r.service.name,
        category: r.service.category?.name ?? '',
      },
      serviceProvider: {
        id: r.provider.serviceProvider?.id || r.provider.id,
        user: { name: r.provider.name, profileImage: r.provider.profileImage },
        rating: providerStatsMap.get(r.provider.id)?.averageRating,
        reviewCount: providerStatsMap.get(r.provider.id)?.totalReviews,
      },
      rating: r.review?.rating ?? undefined,
      review: r.review?.comment ?? undefined,
    }))

    return NextResponse.json(data)
  } catch (e) {
    console.error('[REQUESTS_HISTORY]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
