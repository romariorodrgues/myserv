import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isVerificationExpired } from '@/lib/email-verification'
import { EmailService } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = typeof body?.token === 'string' ? body.token.trim() : ''

    if (!token) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        emailVerificationExpiresAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Token não encontrado' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: 'E-mail já confirmado.' })
    }

    if (isVerificationExpired(user.emailVerificationExpiresAt)) {
      try {
        await prisma.user.delete({ where: { id: user.id } })
      } catch (cleanupError) {
        console.error('[verify email] failed to remove expired account', cleanupError)
      }
      return NextResponse.json(
        { error: 'Link expirado. Faça o cadastro novamente.' },
        { status: 410 }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      }
    })

    try {
      await EmailService.sendWelcomeEmail(user.email, user.name || 'Usuário')
    } catch (emailError) {
      console.error('[verify email] welcome email failed', emailError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[verify email] error', error)
    return NextResponse.json({ error: 'Erro ao confirmar e-mail' }, { status: 500 })
  }
}
