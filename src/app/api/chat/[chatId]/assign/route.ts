import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema para atribuir chat
const assignChatSchema = z.object({
  adminId: z.string().optional() // Se não fornecido, atribui ao usuário atual
})

interface RouteParams {
  params: {
    chatId: string
  }
}

// POST /api/chat/[chatId]/assign - Atribuir chat a admin
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
    const validatedData = assignChatSchema.parse(body)

    // Verificar se o usuário é admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can assign chats' },
        { status: 403 }
      )
    }

    // Verificar se o chat existe
    const chat = await prisma.supportChat.findUnique({
      where: { id: chatId },
      include: {
        assignments: {
          where: { isActive: true }
        }
      }
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Se chat já está fechado, não pode ser atribuído
    if (chat.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Cannot assign closed chat' },
        { status: 400 }
      )
    }

    const adminId = validatedData.adminId || session.user.id

    // Verificar se o admin existe e é realmente admin
    const targetAdmin = await prisma.user.findUnique({
      where: { id: adminId }
    })

    if (!targetAdmin || targetAdmin.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Target user is not an admin' },
        { status: 400 }
      )
    }

    // Desativar atribuições anteriores
    await prisma.supportAssignment.updateMany({
      where: {
        chatId,
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    // Criar nova atribuição
    const assignment = await prisma.supportAssignment.create({
      data: {
        chatId,
        adminId,
        isActive: true
      },
      include: {
        admin: {
          select: { id: true, name: true, email: true }
        },
        chat: {
          include: {
            user: {
              select: { id: true, name: true, userType: true }
            }
          }
        }
      }
    })

    // Atualizar status do chat para IN_PROGRESS se estava OPEN
    if (chat.status === 'OPEN') {
      await prisma.supportChat.update({
        where: { id: chatId },
        data: { status: 'IN_PROGRESS' }
      })
    }

    // TODO: Emitir evento WebSocket
    // socketService.emit(`admin:${adminId}`, 'chat-assigned', assignment)

    return NextResponse.json({ 
      assignment,
      message: 'Chat assigned successfully' 
    }, { status: 201 })

  } catch (error) {
    console.error('Error assigning chat:', error)
    
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

// DELETE /api/chat/[chatId]/assign - Remover atribuição
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

    // Verificar se o usuário é admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can remove assignments' },
        { status: 403 }
      )
    }

    // Desativar todas as atribuições ativas
    const result = await prisma.supportAssignment.updateMany({
      where: {
        chatId,
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'No active assignment found' },
        { status: 404 }
      )
    }

    // Retornar chat para status OPEN se estava IN_PROGRESS
    const chat = await prisma.supportChat.findUnique({
      where: { id: chatId }
    })

    if (chat?.status === 'IN_PROGRESS') {
      await prisma.supportChat.update({
        where: { id: chatId },
        data: { status: 'OPEN' }
      })
    }

    return NextResponse.json({ 
      message: 'Assignment removed successfully' 
    })

  } catch (error) {
    console.error('Error removing assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
