/**
 * Provider review re-submission API
 * Allows a rejected service provider to request a new manual review
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    if (session.user.userType !== 'SERVICE_PROVIDER') {
      return NextResponse.json({ success: false, error: 'Apenas prestadores podem solicitar nova análise.' }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        approvalStatus: true,
        isApproved: true,
        isActive: true
      }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado.' }, { status: 404 })
    }

    if (existing.isApproved || existing.approvalStatus === 'APPROVED') {
      return NextResponse.json({ success: false, error: 'Seu perfil já está aprovado.' }, { status: 400 })
    }

    if (existing.approvalStatus !== 'REJECTED') {
      return NextResponse.json({ success: false, error: 'Seu perfil já está em análise.' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        approvalStatus: 'PENDING',
        isApproved: false,
        reviewRequestedAt: new Date(),
        isActive: true
      }
    })

    const admins = await prisma.user.findMany({
      where: { userType: 'ADMIN', isActive: true },
      select: { id: true }
    })

    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'SYSTEM',
            title: 'Reavaliação solicitada',
            message: `${session.user.name || 'Um prestador'} solicitou nova análise do perfil.`,
            isRead: false,
            data: {
              kind: 'PROVIDER_REVIEW_REQUEST',
              providerId: session.user.id
            }
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: 'Solicitação reenviada. Nossa equipe revisará as novas informações em breve.'
    })
  } catch (error) {
    console.error('Provider review request error:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}
