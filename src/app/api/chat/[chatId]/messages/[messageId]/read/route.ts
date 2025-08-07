import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    chatId: string
    messageId: string
  }
}

// PATCH /api/chat/[chatId]/messages/[messageId]/read - Marcar mensagem como lida
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId, messageId } = params

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

    // Verificar se a mensagem existe e pertence ao chat
    const message = await prisma.supportMessage.findFirst({
      where: {
        id: messageId,
        chatId
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Não pode marcar própria mensagem como lida
    if (message.senderId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot mark own message as read' },
        { status: 400 }
      )
    }

    // Marcar como lida
    const updatedMessage = await prisma.supportMessage.update({
      where: { id: messageId },
      data: { readAt: new Date() },
      include: {
        sender: {
          select: { id: true, name: true, userType: true }
        }
      }
    })

    return NextResponse.json({ 
      message: updatedMessage,
      success: true 
    })

  } catch (error) {
    console.error('Error marking message as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/chat/[chatId]/messages/mark-all-read - Marcar todas mensagens como lidas
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
