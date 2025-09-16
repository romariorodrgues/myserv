import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.userType !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const body = await req.json()
  const { id } = params
  try {
    const updated = await prisma.coupon.update({ where: { id }, data: {
      code: body.code ? String(body.code).toUpperCase() : undefined,
      discountType: body.discountType ?? undefined,
      value: typeof body.value === 'number' ? body.value : undefined,
      appliesTo: body.appliesTo ?? undefined,
      validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
      validTo: body.validTo ? new Date(body.validTo) : undefined,
      maxRedemptions: body.maxRedemptions ?? undefined,
      perUserLimit: body.perUserLimit ?? undefined,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
    } })
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro ao atualizar cupom' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.userType !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const { id } = params
  await prisma.coupon.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

