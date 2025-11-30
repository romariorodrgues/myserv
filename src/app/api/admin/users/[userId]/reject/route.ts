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
    let rejectionReason: string | undefined

    if (request.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await request.json()
        if (body && typeof body.reason === 'string') {
          const trimmed = body.reason.trim()
          if (trimmed.length > 0) {
            rejectionReason = trimmed
          }
        }
      } catch (parseError) {
        console.warn('Rejection reason parse error', parseError)
      }
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

    // Rejeitar o usuário (manter como não aprovado e desativar)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        isApproved: false,
        approvalStatus: 'REJECTED',
        rejectionReason: rejectionReason ?? user.rejectionReason ?? null,
        rejectedAt: new Date(),
        reviewRequestedAt: null,
        isActive: true
      }
    })

    // Criar notificação para o usuário rejeitado
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'SYSTEM',
        title: 'Perfil de profissional recusado',
        message: 'Encontramos pendências no seu cadastro. Atualize seus dados e solicite uma nova análise para liberar seus serviços.',
        isRead: false,
        data: {
          kind: 'PROVIDER_REJECTED',
          url: '/dashboard/profissional?tab=settings'
        }
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
