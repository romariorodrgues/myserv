import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { normalizeServiceUnits, parseServiceUnits } from '@/lib/service-units'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return (session as any)?.user?.userType === 'ADMIN'
}

export async function GET() {
  const setting = await prisma.systemSettings.findUnique({ where: { key: 'SERVICE_UNITS' } })
  const units = parseServiceUnits(setting?.value)
  return NextResponse.json({ success: true, units })
}

export async function POST(req: NextRequest) {
  const isAdmin = await requireAdmin()
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const units = Array.isArray(body?.units) ? body.units : []

  const deduped = normalizeServiceUnits(units, { fallbackToDefault: false })

  if (deduped.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Informe ao menos uma unidade válida.' },
      { status: 400 },
    )
  }

  await prisma.systemSettings.upsert({
    where: { key: 'SERVICE_UNITS' },
    update: { value: JSON.stringify(deduped) },
    create: { key: 'SERVICE_UNITS', value: JSON.stringify(deduped) },
  })

  return NextResponse.json({ success: true, units: deduped })
}

export const dynamic = 'force-dynamic'
