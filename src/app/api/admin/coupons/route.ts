import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.userType !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ success: true, data: coupons })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.userType !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  const body = await req.json()
  const { code, discountType, value, appliesTo, validFrom, validTo, maxRedemptions, perUserLimit, isActive } = body
  if (!code || !discountType || typeof value !== 'number' || !appliesTo) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }
  try {
    const c = await prisma.coupon.create({
      data: {
        code: String(code).toUpperCase(),
        discountType,
        value,
        appliesTo,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        maxRedemptions: maxRedemptions ?? null,
        perUserLimit: perUserLimit ?? null,
        isActive: isActive ?? true,
      }
    })
    return NextResponse.json({ success: true, data: c })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro ao criar cupom' }, { status: 500 })
  }
}

