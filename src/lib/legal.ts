import { promises as fs } from 'fs'
import path from 'path'

const cache = new Map<string, string>()

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

export async function getLegalText(filename: string) {
  if (cache.has(filename)) {
    return cache.get(filename) as string
  }

  const cwd = process.cwd()
  const candidatePaths = [
    path.join(cwd, 'src', 'content', filename),
    path.join(cwd, 'public', filename),
    path.join(cwd, filename),
  ]

  for (const candidate of candidatePaths) {
    const content = await tryRead(candidate)
    if (content != null) {
      cache.set(filename, content)
      return content
    }
  }

  cache.set(filename, '')
  return ''
}
