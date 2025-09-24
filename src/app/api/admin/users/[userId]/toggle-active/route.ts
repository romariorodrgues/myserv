/**
 * Admin toggle user active API with moderation audit
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    if (session.user.userType !== 'ADMIN') return NextResponse.json({ error: 'Apenas administradores' }, { status: 403 })

    const { userId } = params
    const payload = await request.json() as { active?: boolean; isActive?: boolean; reason?: string }
    const nextActive = typeof payload.active === 'boolean'
      ? payload.active
      : payload.isActive

    if (nextActive === undefined) {
      return NextResponse.json({ error: 'Parâmetro "active" é obrigatório' }, { status: 400 })
    }

    const reason = payload.reason
    if (nextActive === false && (!reason || reason.trim().length === 0)) {
      return NextResponse.json({ error: 'Motivo é obrigatório para desativar' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { serviceProvider: { select: { id: true } } }
    })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          isActive: nextActive,
          deactivatedAt: nextActive ? null : new Date(),
        }
      })

      if (user.userType === 'SERVICE_PROVIDER' && user.serviceProvider) {
        await tx.serviceProviderService.updateMany({
          where: { serviceProviderId: user.serviceProvider.id },
          data: { isActive: nextActive },
        })
      }

      await tx.userModeration.create({
        data: {
          userId,
          adminId: session.user.id,
          action: nextActive ? 'ACTIVATE' : 'DEACTIVATE',
          reason: reason?.trim() || null,
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('toggle-active error:', e)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
