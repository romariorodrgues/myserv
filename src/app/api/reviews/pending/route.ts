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

    const clientId = clientIdParam || session?.user?.id
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

