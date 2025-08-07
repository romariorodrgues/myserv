import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/chat/admin/active - Chats ativos para admins
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
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const assignedToMe = searchParams.get('assignedToMe') === 'true'
    const priority = searchParams.get('priority')

    const whereClause: any = {}

    // Filtrar por status
    if (status && ['OPEN', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
      whereClause.status = status
    } else {
      // Por padrão, mostrar apenas chats ativos
      whereClause.status = { in: ['OPEN', 'IN_PROGRESS'] }
    }

    // Filtrar por prioridade
    if (priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
      whereClause.priority = priority
    }

    // Filtrar chats atribuídos ao admin atual
    if (assignedToMe) {
      whereClause.assignments = {
        some: {
          adminId: session.user.id,
          isActive: true
        }
      }
    }

    const chats = await prisma.supportChat.findMany({
      where: whereClause,
      include: {
        user: {
          select: { 
            id: true, 
            name: true, 
            userType: true, 
            email: true,
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
                isFromAdmin: false,
                readAt: null
              }
            }
          }
        }
      },
      orderBy: [
        { priority: 'desc' }, // Prioridade alta primeiro
        { status: 'asc' }, // OPEN primeiro
        { updatedAt: 'desc' }
      ]
    })

    // Adicionar informações extras para cada chat
    const chatsWithExtras = chats.map(chat => ({
      ...chat,
      isAssignedToMe: chat.assignments.some(
        assignment => assignment.adminId === session.user.id
      ),
      lastMessage: chat.messages[0] || null,
      unreadCount: chat._count.messages,
      waitingTime: chat.status === 'OPEN' ? 
        Date.now() - new Date(chat.createdAt).getTime() : 0
    }))

    return NextResponse.json({ chats: chatsWithExtras })

  } catch (error) {
    console.error('Error fetching admin chats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
