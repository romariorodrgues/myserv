import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function requireAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions)
    // @ts-expect-error next-auth augmented type
    return session?.user?.userType === 'ADMIN'
  } catch {
    return false
  }
}

export async function GET() {
  const items = await prisma.systemSettings.findMany({ orderBy: { key: 'asc' } })
  const map = Object.fromEntries(items.map((i) => [i.key, i.value]))
  return NextResponse.json({ success: true, settings: map })
}

export async function POST(req: NextRequest) {
  const isAdmin = await requireAdmin()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, string> = body?.updates || {}
  const allowedKeys = new Set([
    'CONTACT_EMAIL',
    'CONTACT_PHONE',
    'CONTACT_ADDRESS',
    'SOCIAL_FACEBOOK_URL',
    'SOCIAL_INSTAGRAM_URL',
  ])

  const entries = Object.entries(updates).filter(([k, v]) => allowedKeys.has(k) && typeof v === 'string')
  if (entries.length === 0) return NextResponse.json({ success: true })

  for (const [key, value] of entries) {
    await prisma.systemSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  return NextResponse.json({ success: true })
}

