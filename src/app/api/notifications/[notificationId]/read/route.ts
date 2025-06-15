/**
 * Mark notification as read API for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 })
    }

    const { notificationId } = params

    // Update notification as read
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id // Ensure user owns the notification
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Notificação marcada como lida'
    })

  } catch (error) {
    console.error('Mark notification as read error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao marcar notificação como lida'
    }, { status: 500 })
  }
}
