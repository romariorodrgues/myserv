/**
 * Admin User Rejection API
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * API para rejeitar profissionais
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

    // Rejeitar o usuário (manter como não aprovado e desativar)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        isApproved: false,
        isActive: false
      }
    })

    // Criar notificação para o usuário rejeitado
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'SYSTEM',
        title: 'Conta Rejeitada',
        message: 'Sua solicitação de cadastro como profissional foi rejeitada. Entre em contato com o suporte para mais informações.',
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuário rejeitado com sucesso',
      data: { id: updatedUser.id, isApproved: updatedUser.isApproved, isActive: updatedUser.isActive }
    })

  } catch (error) {
    console.error('User rejection error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
