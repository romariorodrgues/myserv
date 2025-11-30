import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { isPasswordResetExpired } from '@/lib/password-reset'

const resetSchema = z.object({
  token: z.string().min(10, 'Token inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string().min(8, 'Confirmação inválida'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password, confirmPassword } = resetSchema.parse(body)

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'As senhas não coincidem.' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token },
      select: {
        id: true,
        passwordResetExpiresAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Token inválido ou já utilizado.' }, { status: 404 })
    }

    if (isPasswordResetExpired(user.passwordResetExpiresAt)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        },
      })
      return NextResponse.json({ error: 'Token expirado.' }, { status: 410 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    })

    return NextResponse.json({ success: true, message: 'Senha redefinida com sucesso.' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Dados inválidos' },
        { status: 400 }
      )
    }

    console.error('[password reset apply] error', error)
    return NextResponse.json({ error: 'Não foi possível redefinir a senha.' }, { status: 500 })
  }
}
