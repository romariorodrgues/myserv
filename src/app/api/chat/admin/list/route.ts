import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/chat/admin/list - Listar todos os chats para admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Admin only.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Construir filtros
    const whereClause: any = {}
    
    if (status && status !== 'all' && ['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'CLOSED'].includes(status)) {
      whereClause.status = status
    }

    if (search) {
      whereClause.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          messages: {
            some: {
              content: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        }
      ]
    }

    // Auto close: chats em WAITING_USER sem atividade há 3 dias
    const waitingTtlMs = 3 * 24 * 60 * 60 * 1000
    const waitingDeadline = new Date(Date.now() - waitingTtlMs)
    await prisma.supportChat.updateMany({
      where: {
        status: 'WAITING_USER',
        updatedAt: { lte: waitingDeadline },
      },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedBy: 'system:auto-close',
      },
    })

    // Buscar chats com paginação
    const chats = await prisma.supportChat.findMany({
      where: whereClause,
      include: {
        user: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            userType: true,
            profileImage: true 
          }
        },
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
                readAt: null,
                senderId: { not: session.user.id }
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // Priorizar abertos
        { priority: 'desc' }, // Priorizar urgentes
        { updatedAt: 'desc' } // Mais recentes primeiro
      ],
      skip: offset,
      take: limit
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

    // Contar total para paginação
    const totalChats = await prisma.supportChat.count({
      where: whereClause
    })

    // Estatísticas rápidas
    const stats = await prisma.supportChat.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    const statsFormatted = {
      total: totalChats,
      open: stats.find(s => s.status === 'OPEN')?._count.id || 0,
      inProgress: stats.find(s => s.status === 'IN_PROGRESS')?._count.id || 0,
      waitingUser: stats.find(s => s.status === 'WAITING_USER')?._count.id || 0,
      closed: stats.find(s => s.status === 'CLOSED')?._count.id || 0
    }

    const hasMore = offset + chats.length < totalChats

    return NextResponse.json({
      chats: chatsWithTitleAndDescription,
      stats: statsFormatted,
      pagination: {
        page,
        limit,
        total: totalChats,
        hasMore
      }
    })

  } catch (error) {
    console.error('Error fetching admin chats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
