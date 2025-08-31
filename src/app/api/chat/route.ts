import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validação para criar chat
const createChatSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM')
})

// GET /api/chat - Listar chats do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const whereClause: any = {
      userId: session.user.id
    }
    
    if (status && ['OPEN', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
      whereClause.status = status
    }

    const chats = await prisma.supportChat.findMany({
      where: whereClause,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Última mensagem
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
        },
        _count: {
          select: {
            messages: {
              where: {
                isFromAdmin: true,
                readAt: null
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // OPEN primeiro
        { priority: 'desc' }, // Prioridade alta primeiro
        { updatedAt: 'desc' }
      ]
    })

    // Mapear subject para title e adicionar description da primeira mensagem
    const chatsWithTitleAndDescription = await Promise.all(
      chats.map(async (chat) => {
        // Buscar primeira mensagem para usar como description
        const firstMessage = await prisma.supportMessage.findFirst({
          where: { chatId: chat.id },
          orderBy: { createdAt: 'asc' }
        })

        return {
          ...chat,
          title: chat.subject || 'Chat de Suporte',
          description: firstMessage?.content || null
        }
      })
    )

    return NextResponse.json({ chats: chatsWithTitleAndDescription })

  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/chat - Criar novo chat
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createChatSchema.parse(body)

    // Permitir múltiplos chats por usuário
    // Comentando a verificação que limitava a um chat por vez
    /*
    const existingOpenChat = await prisma.supportChat.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      }
    })

    if (existingOpenChat) {
      return NextResponse.json({ 
        chat: existingOpenChat,
        message: 'Chat already exists' 
      })
    }
    */

    // Criar novo chat
    const chat = await prisma.supportChat.create({
      data: {
        userId: session.user.id,
        subject: validatedData.title, // Usar title como subject
        priority: validatedData.priority,
        status: 'OPEN'
      },
      include: {
        user: {
          select: { id: true, name: true, userType: true, email: true }
        },
        messages: true,
        assignments: {
          include: {
            admin: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    // Criar mensagem inicial automática com a descrição
    await prisma.supportMessage.create({
      data: {
        chatId: chat.id,
        senderId: session.user.id,
        content: validatedData.description,
        type: 'TEXT',
        isFromAdmin: false
      }
    })

    return NextResponse.json({ chat }, { status: 201 })

  } catch (error) {
    console.error('Error creating chat:', error)
    
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
