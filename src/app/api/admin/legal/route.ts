import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getCurrentTermsVersion,
  getLegalText,
  legalSettingKeyFor,
  upsertSystemSetting,
  invalidateLegalCache,
} from '@/lib/legal'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.userType === 'ADMIN'
  return { isAdmin, session }
}

export async function GET() {
  try {
    const { isAdmin } = await requireAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const [terms, privacy, version] = await Promise.all([
      getLegalText('termodeuso'),
      getLegalText('politicas'),
      getCurrentTermsVersion(),
    ])

    const termsKey = legalSettingKeyFor('termodeuso')
    const privacyKey = legalSettingKeyFor('politicas')
    const map = new Map<string, Date>()

    const keys = [termsKey, privacyKey].filter((key): key is string => Boolean(key))
    if (keys.length > 0) {
      const settings = await prisma.systemSettings.findMany({
        where: { key: { in: keys } },
        select: { key: true, updatedAt: true },
      })
      for (const item of settings) {
        map.set(item.key, item.updatedAt)
      }
    }

    return NextResponse.json({
      success: true,
      terms,
      privacy,
      version,
      termsUpdatedAt: termsKey && map.get(termsKey) ? map.get(termsKey)!.toISOString() : null,
      privacyUpdatedAt: privacyKey && map.get(privacyKey) ? map.get(privacyKey)!.toISOString() : null,
    })
  } catch (error) {
    console.error('[GET /api/admin/legal]', error)
    return NextResponse.json({ error: 'Erro ao carregar textos legais' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { isAdmin } = await requireAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as {
      terms?: string
      privacy?: string
      forceNewVersion?: boolean
    }

    const termsKey = legalSettingKeyFor('termodeuso')
    const privacyKey = legalSettingKeyFor('politicas')
    const versionKey = 'LEGAL_TERMS_VERSION'

    const existingEntries = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: [termsKey, privacyKey, versionKey].filter((key): key is string => Boolean(key)),
        },
      },
    })

    const byKey = new Map(existingEntries.map((entry) => [entry.key, entry]))

    let shouldBumpVersion = Boolean(body.forceNewVersion)

    if (typeof body.terms === 'string' && termsKey) {
      const normalized = body.terms.trim()
      const existing = byKey.get(termsKey)?.value ?? ''
      if (normalized !== existing) {
        shouldBumpVersion = true
        await upsertSystemSetting(termsKey, normalized)
        invalidateLegalCache('termodeuso')
      }
    }

    if (typeof body.privacy === 'string' && privacyKey) {
      const normalized = body.privacy.trim()
      const existing = byKey.get(privacyKey)?.value ?? ''
      if (normalized !== existing) {
        shouldBumpVersion = true
        await upsertSystemSetting(privacyKey, normalized)
        invalidateLegalCache('politicas')
      }
    }

    const currentVersion = byKey.get(versionKey)?.value ?? (await getCurrentTermsVersion())
    const nextVersion = shouldBumpVersion
      ? new Date().toISOString()
      : currentVersion

    if (shouldBumpVersion) {
      await upsertSystemSetting(versionKey, nextVersion)
    }

    const updatedMap = new Map<string, Date>()
    if (termsKey || privacyKey) {
      const keysToFetch = [termsKey, privacyKey].filter((key): key is string => Boolean(key))
      if (keysToFetch.length > 0) {
        const refreshed = await prisma.systemSettings.findMany({
          where: { key: { in: keysToFetch } },
          select: { key: true, updatedAt: true },
        })
        for (const entry of refreshed) {
          updatedMap.set(entry.key, entry.updatedAt)
        }
      }
    }

    return NextResponse.json({
      success: true,
      version: nextVersion,
      termsUpdatedAt: termsKey && updatedMap.get(termsKey) ? updatedMap.get(termsKey)!.toISOString() : null,
      privacyUpdatedAt: privacyKey && updatedMap.get(privacyKey) ? updatedMap.get(privacyKey)!.toISOString() : null,
    })
  } catch (error) {
    console.error('[POST /api/admin/legal]', error)
    return NextResponse.json({ error: 'Erro ao salvar textos legais' }, { status: 500 })
  }
}
