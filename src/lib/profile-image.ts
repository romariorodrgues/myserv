import { existsSync } from 'fs'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

const PROFILE_UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'profiles')

export const PROFILE_IMAGE_ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

export const PROFILE_IMAGE_MAX_SIZE = 5 * 1024 * 1024 // 5MB

async function ensureUploadDir() {
  if (!existsSync(PROFILE_UPLOAD_DIR)) {
    await mkdir(PROFILE_UPLOAD_DIR, { recursive: true })
  }
}

function generateFileName(extension: string) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  const safeExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  return `profile_${timestamp}_${random}.${safeExtension}`
}

export function parseImageDataUrl(dataUrl: string) {
  if (typeof dataUrl !== 'string' || dataUrl.trim().length === 0) {
    throw new Error('Imagem não informada')
  }

  const match = dataUrl.match(/^data:(image\/[-+a-zA-Z0-9.]+);base64,(.+)$/)
  if (!match) {
    throw new Error('Formato de imagem inválido')
  }

  const mime = match[1]
  const base64 = match[2]
  const buffer = Buffer.from(base64, 'base64')

  if (!PROFILE_IMAGE_ALLOWED_MIME.has(mime)) {
    throw new Error('Tipo de arquivo não permitido. Use JPG, PNG ou WebP')
  }

  if (buffer.byteLength > PROFILE_IMAGE_MAX_SIZE) {
    throw new Error('Arquivo muito grande. Máximo 5MB')
  }

  return { buffer, mime }
}

export async function saveProfileImage(buffer: Buffer) {
  await ensureUploadDir()

  // Todas as imagens são convertidas para JPG otimizado
  const filename = generateFileName('jpg')
  const outputPath = join(PROFILE_UPLOAD_DIR, filename)

  await sharp(buffer)
    .resize(400, 400, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({
      quality: 85,
      progressive: true,
    })
    .toFile(outputPath)

  return `/uploads/profiles/${filename}`
}

export async function processAndSaveProfileImageFromDataUrl(dataUrl: string) {
  const { buffer } = parseImageDataUrl(dataUrl)
  return saveProfileImage(buffer)
}

export async function saveProfileImageFromFile(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  if (!PROFILE_IMAGE_ALLOWED_MIME.has(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use JPG, PNG ou WebP')
  }
  if (buffer.byteLength > PROFILE_IMAGE_MAX_SIZE) {
    throw new Error('Arquivo muito grande. Máximo 5MB')
  }
  return saveProfileImage(buffer)
}
