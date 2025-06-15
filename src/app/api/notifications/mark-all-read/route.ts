/**
 * Mark all notifications as read API for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 })
    }

    // Mark all notifications as read for the user
    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({
      success: true,
      data: { updatedCount: result.count },
      message: `${result.count} notificações marcadas como lidas`
    })

  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao marcar notificações como lidas'
    }, { status: 500 })
  }
}
