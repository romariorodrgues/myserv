import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email-service'
import { generatePasswordResetToken, getPasswordResetExpiryDate } from '@/lib/password-reset'
import { z } from 'zod'

const requestSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = requestSchema.parse(body)
    const normalizedEmail = email.trim().toLowerCase()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (user) {
      const token = generatePasswordResetToken()
      const expiresAt = getPasswordResetExpiryDate()

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpiresAt: expiresAt,
        },
      })

      try {
        await EmailService.sendPasswordResetEmail({
          email: user.email,
          name: user.name || 'Usuário',
          token,
        })
      } catch (emailError) {
        console.error('[password reset] email dispatch failed', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Se existir uma conta com este e-mail, enviaremos as instruções em instantes.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'E-mail inválido' },
        { status: 400 }
      )
    }

    console.error('[password reset request] error', error)
    return NextResponse.json({ error: 'Não foi possível iniciar a recuperação.' }, { status: 500 })
  }
}
