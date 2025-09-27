import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentTermsVersion, legalSettingKeyFor } from '@/lib/legal'

export async function GET() {
  try {
    const version = await getCurrentTermsVersion()

    const termsKey = legalSettingKeyFor('termodeuso')
    const privacyKey = legalSettingKeyFor('politicas')
    const keys = [termsKey, privacyKey].filter((key): key is string => Boolean(key))

    let termsUpdatedAt: string | null = null
    let privacyUpdatedAt: string | null = null

    if (keys.length > 0) {
      const settings = await prisma.systemSettings.findMany({
        where: { key: { in: keys } },
        select: { key: true, updatedAt: true },
      })

      for (const item of settings) {
        if (item.key === termsKey) {
          termsUpdatedAt = item.updatedAt.toISOString()
        }
        if (item.key === privacyKey) {
          privacyUpdatedAt = item.updatedAt.toISOString()
        }
      }
    }

    return NextResponse.json({
      success: true,
      version,
      termsUpdatedAt,
      privacyUpdatedAt,
    })
  } catch (error) {
    console.error('[GET /api/legal/summary]', error)
    return NextResponse.json({ success: false, error: 'Não foi possível carregar o resumo legal' }, { status: 500 })
  }
}
