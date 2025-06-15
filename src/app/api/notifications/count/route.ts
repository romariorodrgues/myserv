/**
 * Notification count API for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 })
    }

    // Get unread notification count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      data: { unreadCount }
    })

  } catch (error) {
    console.error('Get notification count error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar contagem de notificações'
    }, { status: 500 })
  }
}
