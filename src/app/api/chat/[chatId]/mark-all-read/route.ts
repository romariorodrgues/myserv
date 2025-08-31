import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    chatId: string
  }
}

// POST /api/chat/[chatId]/mark-all-read - Marcar todas mensagens como lidas
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params

    // Verificar se o usuário tem acesso ao chat
    const chat = await prisma.supportChat.findFirst({
      where: {
        id: chatId,
        OR: [
          { userId: session.user.id },
          { 
            assignments: {
              some: {
                adminId: session.user.id,
                isActive: true
              }
            }
          }
        ]
      }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Marcar todas as mensagens não lidas (que não são do usuário atual)
    const result = await prisma.supportMessage.updateMany({
      where: {
        chatId,
        senderId: { not: session.user.id },
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    })

    return NextResponse.json({ 
      markedCount: result.count,
      success: true 
    })

  } catch (error) {
    console.error('Error marking all messages as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
