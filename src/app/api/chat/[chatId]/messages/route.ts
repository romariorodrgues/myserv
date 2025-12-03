import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { socketService } from '@/lib/socket'

// Schema para criar mensagem
const createMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT')
})

interface RouteParams {
  params: {
    chatId: string
  }
}

// GET /api/chat/[chatId]/messages - Listar mensagens do chat
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params
    const isAdmin = session.user.userType === 'ADMIN'
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Verificar se o usuário tem acesso ao chat
    const chat = await prisma.supportChat.findFirst({
      where: isAdmin
        ? { id: chatId }
        : {
            id: chatId,
            OR: [
              { userId: session.user.id },
              {
                assignments: {
                  some: {
                    adminId: session.user.id,
                    isActive: true,
                  },
                },
              },
            ],
          },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Buscar mensagens com paginação
    const messages = await prisma.supportMessage.findMany({
      where: { chatId },
      include: {
        sender: {
          select: { id: true, name: true, userType: true, profileImage: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit
    })

    const totalMessages = await prisma.supportMessage.count({
      where: { chatId }
    })

    const hasMore = offset + messages.length < totalMessages

    // Se o usuário for o cliente (não admin), marcar mensagens do admin como lidas
    if (!isAdmin) {
      await prisma.supportMessage.updateMany({
        where: {
          chatId,
          isFromAdmin: true,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total: totalMessages,
        hasMore
      }
    })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/chat/[chatId]/messages - Enviar nova mensagem
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
    const body = await request.json()
    const validatedData = createMessageSchema.parse(body)

    // Verificar se o chat existe e o usuário tem acesso
    const chat = await prisma.supportChat.findFirst({
      where: {
        id: chatId,
        OR: [
          { userId: session.user.id },
          {
            assignments: {
              some: {
                adminId: session.user.id,
                isActive: true,
              },
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        assignments: {
          where: { isActive: true },
          include: {
            admin: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Verificar se o chat não está fechado
    if (chat.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Cannot send message to closed chat' },
        { status: 400 }
      )
    }

    // Verificar se é admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    const isFromAdmin = user?.userType === 'ADMIN'

    // Criar mensagem
    const message = await prisma.supportMessage.create({
      data: {
        chatId,
        senderId: session.user.id,
        content: validatedData.content,
        type: validatedData.type,
        isFromAdmin
      },
      include: {
        sender: {
          select: { id: true, name: true, userType: true, profileImage: true }
        }
      }
    })

    // Atualizar status do chat se necessário
    let chatUpdateData: any = {
      updatedAt: new Date()
    }

    if (isFromAdmin && chat.status === 'OPEN') {
      chatUpdateData.status = 'IN_PROGRESS'
    }

    await prisma.supportChat.update({
      where: { id: chatId },
      data: chatUpdateData
    })

    // Emitir evento WebSocket para tempo real
    socketService.emitMessage(chatId, message)
    
    // Se o status mudou, emitir também
    if (chatUpdateData.status) {
      socketService.emitStatusUpdate(chatId, chatUpdateData.status)
    }

    const recipients = new Set<string>()

    if (isFromAdmin) {
      recipients.add(chat.userId)
    } else {
      if (chat.assignments?.length) {
        chat.assignments.forEach((assignment) => {
          if (assignment.adminId) recipients.add(assignment.adminId)
        })
      }

      if (recipients.size === 0) {
        const admins = await prisma.user.findMany({
          where: { userType: 'ADMIN', isActive: true },
          select: { id: true },
        })
        admins.forEach((admin) => recipients.add(admin.id))
      }
    }

    recipients.delete(session.user.id)

    if (recipients.size > 0) {
      const preview = validatedData.content.slice(0, 150)
      const senderName = user?.name || (isFromAdmin ? 'Administrador' : chat.user.name)

      await Promise.all(
        Array.from(recipients).map((targetId) =>
          prisma.notification.create({
            data: {
              userId: targetId,
              type: 'MESSAGE_RECEIVED',
              title: isFromAdmin
                ? 'Nova mensagem do suporte'
                : `Nova mensagem de ${senderName}`,
              message: preview || 'Você recebeu uma nova mensagem no suporte.',
              isRead: false,
              data: {
                kind: 'SUPPORT_CHAT_MESSAGE',
                chatId,
                senderId: session.user.id,
                senderName,
                isFromAdmin,
              },
            },
          }),
        ),
      )
    }

    return NextResponse.json({ message }, { status: 201 })

  } catch (error) {
    console.error('Error creating message:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
