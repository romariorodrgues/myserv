import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/chat/admin/metrics - Métricas de atendimento
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
    const period = searchParams.get('period') || '7' // dias
    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Métricas gerais
    const [
      totalChats,
      openChats,
      inProgressChats,
      closedChats,
      urgentChats,
      chatsToday,
      avgResponseTime,
      avgResolutionTime
    ] = await Promise.all([
      // Total de chats
      prisma.supportChat.count(),
      
      // Chats abertos
      prisma.supportChat.count({
        where: { status: 'OPEN' }
      }),
      
      // Chats em andamento
      prisma.supportChat.count({
        where: { status: 'IN_PROGRESS' }
      }),
      
      // Chats fechados no período
      prisma.supportChat.count({
        where: {
          status: 'CLOSED',
          closedAt: { gte: startDate }
        }
      }),
      
      // Chats urgentes
      prisma.supportChat.count({
        where: {
          priority: 'URGENT',
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        }
      }),
      
      // Chats criados hoje
      prisma.supportChat.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Tempo médio de primeira resposta (em minutos)
      calculateAvgResponseTime(startDate),
      
      // Tempo médio de resolução (em horas)
      calculateAvgResolutionTime(startDate)
    ])

    // Chats por prioridade
    const chatsByPriority = await prisma.supportChat.groupBy({
      by: ['priority'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: {
        id: true
      }
    })

    // Chats por dia (últimos dias)
    const chatsByDay = await getDailyChatsData(periodDays)

    // Performance por admin
    const adminPerformance = await getAdminPerformance(startDate)

    // Admins online (que fizeram alguma ação nas últimas 2 horas)
    const onlineAdmins = await getOnlineAdmins()

    const metrics = {
      overview: {
        totalChats,
        openChats,
        inProgressChats,
        closedChats,
        urgentChats,
        chatsToday,
        avgResponseTime: Math.round(avgResponseTime || 0),
        avgResolutionTime: Math.round(avgResolutionTime || 0)
      },
      distribution: {
        byPriority: chatsByPriority.map(item => ({
          priority: item.priority,
          count: item._count.id
        })),
        byDay: chatsByDay
      },
      performance: {
        admins: adminPerformance,
        onlineAdmins
      },
      period: {
        days: periodDays,
        startDate,
        endDate: new Date()
      }
    }

    return NextResponse.json({ metrics })

  } catch (error) {
    console.error('Error fetching chat metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Função auxiliar para calcular tempo médio de primeira resposta
async function calculateAvgResponseTime(startDate: Date): Promise<number> {
  const chatsWithFirstResponse = await prisma.supportChat.findMany({
    where: {
      createdAt: { gte: startDate },
      messages: {
        some: {
          isFromAdmin: true
        }
      }
    },
    include: {
      messages: {
        where: { isFromAdmin: true },
        orderBy: { createdAt: 'asc' },
        take: 1
      }
    }
  })

  if (chatsWithFirstResponse.length === 0) return 0

  const totalResponseTime = chatsWithFirstResponse.reduce((sum, chat) => {
    const firstResponse = chat.messages[0]
    if (firstResponse) {
      const responseTime = new Date(firstResponse.createdAt).getTime() - 
                          new Date(chat.createdAt).getTime()
      return sum + (responseTime / (1000 * 60)) // em minutos
    }
    return sum
  }, 0)

  return totalResponseTime / chatsWithFirstResponse.length
}

// Função auxiliar para calcular tempo médio de resolução
async function calculateAvgResolutionTime(startDate: Date): Promise<number> {
  const closedChats = await prisma.supportChat.findMany({
    where: {
      status: 'CLOSED',
      closedAt: { 
        gte: startDate,
        not: null 
      }
    }
  })

  if (closedChats.length === 0) return 0

  const totalResolutionTime = closedChats.reduce((sum, chat) => {
    if (chat.closedAt) {
      const resolutionTime = new Date(chat.closedAt).getTime() - 
                           new Date(chat.createdAt).getTime()
      return sum + (resolutionTime / (1000 * 60 * 60)) // em horas
    }
    return sum
  }, 0)

  return totalResolutionTime / closedChats.length
}

// Função auxiliar para dados diários
async function getDailyChatsData(days: number) {
  const dailyData = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const startOfDay = new Date(date.setHours(0, 0, 0, 0))
    const endOfDay = new Date(date.setHours(23, 59, 59, 999))

    const count = await prisma.supportChat.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    dailyData.unshift({
      date: startOfDay.toISOString().split('T')[0],
      count
    })
  }

  return dailyData
}

// Função auxiliar para performance de admins
async function getAdminPerformance(startDate: Date) {
  const admins = await prisma.user.findMany({
    where: { userType: 'ADMIN' },
    select: { id: true, name: true }
  })

  const performance = await Promise.all(
    admins.map(async (admin) => {
      const [assignedChats, resolvedChats, avgResponseTime] = await Promise.all([
        prisma.supportAssignment.count({
          where: {
            adminId: admin.id,
            assignedAt: { gte: startDate }
          }
        }),
        prisma.supportChat.count({
          where: {
            closedBy: admin.id,
            closedAt: { gte: startDate }
          }
        }),
        calculateAdminAvgResponseTime(admin.id, startDate)
      ])

      return {
        id: admin.id,
        name: admin.name,
        assignedChats,
        resolvedChats,
        avgResponseTime: Math.round(avgResponseTime || 0)
      }
    })
  )

  return performance
}

async function calculateAdminAvgResponseTime(adminId: string, startDate: Date): Promise<number> {
  // Implementação simplificada - pode ser melhorada futuramente
  const adminMessages = await prisma.supportMessage.count({
    where: {
      senderId: adminId,
      isFromAdmin: true,
      createdAt: { gte: startDate }
    }
  })

  // Retorna contagem por enquanto, lógica completa será implementada depois
  return adminMessages
}

// Função auxiliar para admins online
async function getOnlineAdmins() {
  const twoHoursAgo = new Date()
  twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)

  const recentActivity = await prisma.supportMessage.findMany({
    where: {
      isFromAdmin: true,
      createdAt: { gte: twoHoursAgo }
    },
    distinct: ['senderId'],
    include: {
      sender: {
        select: { id: true, name: true }
      }
    }
  })

  return recentActivity.map(msg => msg.sender)
}
