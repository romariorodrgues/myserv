/**
 * Delete notification API for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
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

    // Delete notification (only if it belongs to the user)
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: session.user.id // Ensure user owns the notification
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Notificação excluída com sucesso'
    })

  } catch (error) {
    console.error('Delete notification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao excluir notificação'
    }, { status: 500 })
  }
}
