import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || (session.user as any)?.userType !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [openCount, pendingUnread] = await Promise.all([
    prisma.supportChat.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_USER'] } },
    }),
    prisma.supportMessage.count({
      where: {
        isFromAdmin: false,
        readAt: null,
      },
    }),
  ])

  return NextResponse.json({
    success: true,
    counts: {
      open: openCount,
      unread: pendingUnread,
    },
  })
}
