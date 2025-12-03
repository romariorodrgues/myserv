import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { generatePasswordResetToken, getPasswordResetExpiryDate } from '@/lib/password-reset'
import { WhatsAppService } from '@/lib/whatsapp-service'
import { normalizePhone } from '@/lib/phone-verification'

const requestSchema = z.object({
  phone: z.string().min(10, 'Telefone inválido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = requestSchema.parse(body)
    const normalizedPhone = normalizePhone(phone)

    // Resposta sempre genérica para evitar enumeração
    const genericResponse = NextResponse.json({
      success: true,
      message:
        'Se houver uma conta com este telefone verificado, enviaremos um link de redefinição pelo WhatsApp.',
    })

    if (!normalizedPhone || normalizedPhone.length < 10) {
      return genericResponse
    }

    const user = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
      select: {
        id: true,
        name: true,
        phoneVerified: true,
      },
    })

    if (!user || !user.phoneVerified) {
      return genericResponse
    }

    const token = generatePasswordResetToken()
    const expiresAt = getPasswordResetExpiryDate()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      },
    })

    const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || 'https://myserv.com.br'
    const resetLink = `${baseUrl}/resetar-senha?token=${encodeURIComponent(token)}`

    await WhatsAppService.sendPasswordResetCode({
      phone: normalizedPhone,
      name: user.name || 'Usuário',
      link: resetLink,
    })

    return genericResponse
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Telefone inválido' },
        { status: 400 }
      )
    }

    console.error('[password reset phone] error', error)
    return NextResponse.json(
      { error: 'Não foi possível iniciar a recuperação pelo telefone.' },
      { status: 500 }
    )
  }
}
