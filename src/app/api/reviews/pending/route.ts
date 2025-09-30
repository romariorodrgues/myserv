/**
 * Pending reviews API
 * Returns completed service requests without a review from the client
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const clientIdParam = searchParams.get('clientId')
    const providerIdParam = searchParams.get('providerId')

    const clientId = clientIdParam || session?.user?.id
    const providerId = providerIdParam || (session?.user?.userType === 'SERVICE_PROVIDER' ? session.user.id : null)

    // Provider pending reviews
    if (providerId && (providerIdParam || session?.user?.userType === 'SERVICE_PROVIDER' && !clientIdParam)) {
    const pending = await prisma.serviceRequest.findMany({
      where: {
        providerId,
        status: 'COMPLETED',
        providerReviewGivenAt: null,
      },
      include: {
        service: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, profileImage: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })

    const clientIds = pending.map((p) => p.clientId).filter((id): id is string => Boolean(id))
    const ratingMap = new Map<string, { average: number; count: number }>()

    if (clientIds.length > 0) {
      const ratingStats = await prisma.serviceRequest.groupBy({
        by: ['clientId'],
        where: {
          clientId: { in: clientIds },
          providerReviewRating: { not: null },
        },
        _avg: { providerReviewRating: true },
        _count: { providerReviewRating: true },
      })

      for (const stat of ratingStats) {
        const avg = stat._avg.providerReviewRating
        const count = stat._count.providerReviewRating
        if (avg != null && count > 0) {
          ratingMap.set(stat.clientId, {
            average: Math.round(avg * 10) / 10,
            count,
          })
        }
      }
    }

      const count = await prisma.serviceRequest.count({
        where: {
          providerId,
          status: 'COMPLETED',
          providerReviewGivenAt: null,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          count,
          items: pending.map((p) => ({
          id: p.id,
          serviceName: p.service.name,
          client: {
            id: p.client.id,
            name: p.client.name,
            profileImage: p.client.profileImage,
            ratingAverage: ratingMap.get(p.client.id)?.average ?? null,
            ratingCount: ratingMap.get(p.client.id)?.count ?? 0,
          },
        })),
      },
    })
    }

    if (!clientId) {
      return NextResponse.json({ success: true, data: { count: 0, items: [] } })
    }

    const pending = await prisma.serviceRequest.findMany({
      where: {
        clientId,
        status: 'COMPLETED',
        review: null,
      },
      include: {
        service: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true, profileImage: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      success: true,
      data: {
        count: await prisma.serviceRequest.count({
          where: { clientId, status: 'COMPLETED', review: null },
        }),
        items: pending.map(p => ({
          id: p.id,
          serviceName: p.service.name,
          provider: { id: p.provider.id, name: p.provider.name, profileImage: p.provider.profileImage },
        })),
      },
    })
  } catch (error) {
    console.error('Pending reviews error:', error)
    return NextResponse.json({ success: false, error: 'Erro ao buscar avaliações pendentes' }, { status: 500 })
  }
}
