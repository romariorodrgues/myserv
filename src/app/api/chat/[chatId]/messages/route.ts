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
                isActive: true
              }
            }
          }
        ]
      },
      include: {
        user: true
      }
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
