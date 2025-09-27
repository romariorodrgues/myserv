import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { DEFAULT_TERMS_VERSION } from '@/constants/legal'

const cache = new Map<string, string>()

const LEGAL_SETTING_KEYS: Record<string, string> = {
  termodeuso: 'LEGAL_TERMS_OF_USE',
  politicas: 'LEGAL_PRIVACY_POLICY',
}

const TERMS_VERSION_KEY = 'LEGAL_TERMS_VERSION'

async function tryRead(filePath: string) {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return data
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

async function readFallbackFile(filename: string) {
  const cwd = process.cwd()
  const candidatePaths = [
    path.join(cwd, 'src', 'content', filename),
    path.join(cwd, 'public', filename),
    path.join(cwd, filename),
  ]

  for (const candidate of candidatePaths) {
    const content = await tryRead(candidate)
    if (content != null) {
      return content
    }
  }

  return ''
}

export function invalidateLegalCache(filename?: string) {
  if (filename) {
    cache.delete(filename)
  } else {
    cache.clear()
  }
}

export function legalSettingKeyFor(filename: string): string | undefined {
  return LEGAL_SETTING_KEYS[filename]
}

export async function getLegalText(filename: string) {
  if (cache.has(filename)) {
    return cache.get(filename) as string
  }

  let content = ''
  const settingKey = LEGAL_SETTING_KEYS[filename]
  if (settingKey) {
    const setting = await prisma.systemSettings.findUnique({ where: { key: settingKey } })
    if (setting?.value) {
      content = setting.value
    }
  }

  if (!content) {
    content = await readFallbackFile(filename)
  }

  cache.set(filename, content)
  return content
}

export async function getCurrentTermsVersion() {
  const setting = await prisma.systemSettings.findUnique({ where: { key: TERMS_VERSION_KEY } })
  return setting?.value?.trim() || DEFAULT_TERMS_VERSION
}

export async function upsertSystemSetting(key: string, value: string) {
  await prisma.systemSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}
