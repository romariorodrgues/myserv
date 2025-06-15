/**
 * Admin User Toggle Active API
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * API para ativar/desativar usuários
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
    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Status de ativação deve ser um boolean' },
        { status: 400 }
      )
    }

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

    // Não permitir desativar admins
    if (user.userType === 'ADMIN' && !isActive) {
      return NextResponse.json(
        { error: 'Não é possível desativar contas de administrador' },
        { status: 400 }
      )
    }

    // Atualizar status de ativação
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    })

    // Criar notificação para o usuário
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'SYSTEM',
        title: isActive ? 'Conta Reativada' : 'Conta Desativada',
        message: isActive 
          ? 'Sua conta foi reativada e você já pode acessar a plataforma normalmente.'
          : 'Sua conta foi temporariamente desativada. Entre em contato com o suporte se necessário.',
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      data: { id: updatedUser.id, isActive: updatedUser.isActive }
    })

  } catch (error) {
    console.error('User toggle active error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
