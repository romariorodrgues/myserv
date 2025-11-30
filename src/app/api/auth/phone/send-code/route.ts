import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { issuePhoneVerificationCode, normalizePhone } from '@/lib/phone-verification'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: { phone?: string } = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const providedPhone = body.phone?.trim()

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      phone: true,
    }
  })

  if (!user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  const phoneToUse = providedPhone ? normalizePhone(providedPhone) : user.phone

  if (!phoneToUse || phoneToUse.length < 10) {
    return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 })
  }

  try {
    await issuePhoneVerificationCode({
      userId: user.id,
      phone: phoneToUse,
      name: user.name,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao enviar código.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
