import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email-service'
import { generateEmailVerificationToken, getEmailVerificationExpiryDate, isVerificationExpired } from '@/lib/email-verification'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: { email?: string } = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const requestedEmail = body.email?.trim().toLowerCase()
  if (requestedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedEmail)) {
    return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  if (user.emailVerified) {
    return NextResponse.json({ success: true, message: 'E-mail já confirmado.' })
  }

  let nextEmail = user.email

  if (requestedEmail && requestedEmail !== user.email) {
    let conflictingUser = await prisma.user.findFirst({
      where: { email: requestedEmail },
      select: {
        id: true,
        emailVerified: true,
        emailVerificationExpiresAt: true,
      }
    })

    if (conflictingUser) {
      if (!conflictingUser.emailVerified && isVerificationExpired(conflictingUser.emailVerificationExpiresAt)) {
        try {
          await prisma.user.delete({ where: { id: conflictingUser.id } })
          conflictingUser = null
        } catch (cleanupError) {
          console.error('[resend verification] failed to remove expired account', cleanupError)
        }
      }
    }

    if (conflictingUser) {
      return NextResponse.json({ error: 'Já existe uma conta com este e-mail.' }, { status: 409 })
    }

    nextEmail = requestedEmail
  }

  const verificationToken = generateEmailVerificationToken()
  const verificationExpiresAt = getEmailVerificationExpiryDate()
  const now = new Date()

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      email: nextEmail,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiresAt: verificationExpiresAt,
      emailVerificationSentAt: now,
    },
    select: {
      id: true,
      email: true,
      emailVerified: true,
    }
  })

  try {
    await EmailService.sendEmailVerificationEmail({
      email: updatedUser.email,
      name: session.user.name ?? 'Usuário',
      token: verificationToken,
    })
  } catch (emailError) {
    console.error('[resend verification] email dispatch failed', emailError)
  }

  return NextResponse.json({ success: true, user: updatedUser })
}
