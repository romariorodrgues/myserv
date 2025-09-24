import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { reason } = await request.json() as { reason?: string }
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Informe um motivo para desativar a conta.' }, { status: 400 })
    }

    const now = new Date()

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: session.user.id },
        data: {
          isActive: false,
          deactivatedAt: now,
        },
        select: { id: true, userType: true, serviceProvider: { select: { id: true } } },
      })

      if (user.userType === 'SERVICE_PROVIDER' && user.serviceProvider) {
        await tx.serviceProviderService.updateMany({
          where: { serviceProviderId: user.serviceProvider.id },
          data: { isActive: false },
        })
      }

      await tx.userModeration.create({
        data: {
          userId: user.id,
          adminId: null,
          action: 'SELF_DEACTIVATE',
          reason: reason.trim(),
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /api/users/deactivate]', error)
    return NextResponse.json({ error: 'Erro ao desativar conta' }, { status: 500 })
  }
}
