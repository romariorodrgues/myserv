import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = (searchParams.get('code') || '').toUpperCase().trim()
  const plan = (searchParams.get('plan') || '').toUpperCase().trim() // FREE | PREMIUM | ENTERPRISE
  if (!code) return NextResponse.json({ success: false, error: 'Informe o código' }, { status: 400 })
  try {
    const now = new Date()
    const c = await prisma.coupon.findFirst({ where: {
      code,
      isActive: true,
      OR: [ { validFrom: null }, { validFrom: { lte: now } } ],
    } })
    if (!c) return NextResponse.json({ success: false, error: 'Cupom inválido ou inativo' }, { status: 404 })
    if (c.validTo && c.validTo < now) return NextResponse.json({ success: false, error: 'Cupom expirado' }, { status: 400 })
    if (plan && c.appliesTo !== 'ANY' && c.appliesTo !== plan) return NextResponse.json({ success: false, error: 'Cupom não aplicável a este plano' }, { status: 400 })
    return NextResponse.json({ success: true, data: { code: c.code, discountType: c.discountType, value: c.value, appliesTo: c.appliesTo } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Erro ao validar cupom' }, { status: 500 })
  }
}

