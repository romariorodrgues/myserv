/**
 * Cancel a client request
 * PATCH /api/requests/cancel
 * Body: { bookingId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { bookingId } = await request.json()
    if (!bookingId) return NextResponse.json({ error: 'bookingId é obrigatório' }, { status: 400 })

    const sr = await prisma.serviceRequest.findUnique({ where: { id: bookingId }, select: { clientId: true, status: true } })
    if (!sr) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
    if (sr.clientId !== session.user.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    if (sr.status !== 'PENDING') return NextResponse.json({ error: 'Só é possível cancelar solicitações pendentes' }, { status: 400 })

    await prisma.serviceRequest.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[REQUEST_CANCEL]', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

