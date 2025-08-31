import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { socketService } from '@/lib/socket'

// Schema para atualizar chat
const updateChatSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional()
})

interface RouteParams {
  params: {
    chatId: string
  }
}

// GET /api/chat/[chatId] - Obter chat específico
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

    // Verificar se o chat existe e o usuário tem acesso
    const chat = await prisma.supportChat.findFirst({
      where: {
        id: chatId,
        OR: [
          { userId: session.user.id }, // Dono do chat
          { 
            assignments: {
              some: {
                adminId: session.user.id,
                isActive: true
              }
            }
          } // Admin atribuído
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, userType: true, email: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, name: true, userType: true }
            }
          }
        },
        assignments: {
          where: { isActive: true },
          include: {
            admin: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    return NextResponse.json({ chat })

  } catch (error) {
    console.error('Error fetching chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/chat/[chatId] - Atualizar chat
export async function PATCH(
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
    const validatedData = updateChatSchema.parse(body)

    // Verificar se é admin ou dono do chat
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

    // Verificar permissões para cada campo
    const updateData: any = {}

    if (validatedData.priority) {
      // Só admins podem alterar prioridade
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })
      
      if (user?.userType !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only admins can change priority' },
          { status: 403 }
        )
      }
      updateData.priority = validatedData.priority
    }

    if (validatedData.status) {
      updateData.status = validatedData.status
      
      if (validatedData.status === 'CLOSED') {
        updateData.closedAt = new Date()
        updateData.closedBy = session.user.id
      }
    }

    const updatedChat = await prisma.supportChat.update({
      where: { id: chatId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, userType: true, email: true }
        },
        assignments: {
          where: { isActive: true },
          include: {
            admin: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    // Emitir evento de atualização de status via WebSocket
    if (validatedData.status) {
      socketService.emitStatusUpdate(chatId, validatedData.status)
      
      if (validatedData.status === 'CLOSED') {
        socketService.emitChatClosed(chatId, session.user.id)
      }
    }

    return NextResponse.json({ chat: updatedChat })

  } catch (error) {
    console.error('Error updating chat:', error)
    
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

// DELETE /api/chat/[chatId] - Fechar chat
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await params

    // Verificar se é admin ou dono do chat
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

    // Fechar chat em vez de deletar
    const closedChat = await prisma.supportChat.update({
      where: { id: chatId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedBy: session.user.id
      }
    })

    return NextResponse.json({ 
      message: 'Chat closed successfully',
      chat: closedChat 
    })

  } catch (error) {
    console.error('Error closing chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
