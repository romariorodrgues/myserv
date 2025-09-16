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
    const { active, reason } = await request.json() as { active: boolean; reason?: string }
    if (active === undefined) return NextResponse.json({ error: 'Parâmetro "active" é obrigatório' }, { status: 400 })
    if (active === false && (!reason || reason.trim().length === 0)) {
      return NextResponse.json({ error: 'Motivo é obrigatório para desativar' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { isActive: active } })
      await tx.userModeration.create({
        data: {
          userId,
          adminId: session.user.id,
          action: active ? 'ACTIVATE' : 'DEACTIVATE',
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

