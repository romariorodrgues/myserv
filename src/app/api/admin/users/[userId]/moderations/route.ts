import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (session.user.userType !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas administradores' }, { status: 403 })
    }

    const { userId } = params

    const moderations = await prisma.userModeration.findMany({
      where: { userId },
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ success: true, moderations })
  } catch (error) {
    console.error('[ADMIN_USER_MODERATIONS_GET]', error)
    return NextResponse.json({ error: 'Erro ao carregar histórico de moderação' }, { status: 500 })
  }
}
