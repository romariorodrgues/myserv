/**
 * Admin User Approval API
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * API para aprovar profissionais
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem realizar esta ação.' },
        { status: 403 }
      )
    }

    const { userId } = params

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Aprovar o usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        isApproved: true,
        isActive: true
      }
    })

    // Criar notificação para o usuário aprovado
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'SYSTEM',
        title: 'Conta Aprovada!',
        message: 'Sua conta foi aprovada e você já pode começar a receber solicitações de serviço.',
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário aprovado com sucesso',
      data: { id: updatedUser.id, isApproved: updatedUser.isApproved }
    })

  } catch (error) {
    console.error('User approval error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
