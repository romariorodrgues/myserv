import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isPhoneVerificationExpired } from '@/lib/phone-verification'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: { code?: string } = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const code = body.code?.trim()

  if (!code || code.length < 4) {
    return NextResponse.json({ error: 'Código inválido.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      phoneVerificationCode: true,
      phoneVerificationExpiresAt: true,
    }
  })

  if (!user || !user.phoneVerificationCode) {
    return NextResponse.json({ error: 'Nenhum código solicitado.' }, { status: 400 })
  }

  if (isPhoneVerificationExpired(user.phoneVerificationExpiresAt)) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phoneVerificationCode: null,
        phoneVerificationExpiresAt: null,
      },
    })
    return NextResponse.json({ error: 'Código expirado.' }, { status: 410 })
  }

  if (code !== user.phoneVerificationCode) {
    return NextResponse.json({ error: 'Código incorreto.' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
      phoneVerificationCode: null,
      phoneVerificationExpiresAt: null,
    },
  })

  return NextResponse.json({ success: true })
}
