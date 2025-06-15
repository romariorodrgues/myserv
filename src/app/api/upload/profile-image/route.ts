/**
 * Image upload service for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles image upload, processing and storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'profiles')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

// Generate unique filename
function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  return `profile_${timestamp}_${random}.${ext}`
}

// Process and optimize image
async function processImage(buffer: Buffer, filename: string): Promise<string> {
  const outputPath = join(UPLOAD_DIR, filename)
  
  await sharp(buffer)
    .resize(400, 400, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({
      quality: 85,
      progressive: true
    })
    .toFile(outputPath)
  
  return `/uploads/profiles/${filename}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma imagem foi enviada'
      }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP'
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo muito grande. Máximo 5MB'
      }, { status: 400 })
    }

    // Ensure upload directory exists
    await ensureUploadDir()

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate filename and process image
    const filename = generateFileName(file.name)
    const imagePath = await processImage(buffer, filename)

    // Update user profile image in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { profileImage: imagePath },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        imagePath
      },
      message: 'Imagem de perfil atualizada com sucesso'
    })

  } catch (error) {
    console.error('Upload image error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao fazer upload da imagem'
    }, { status: 500 })
  }
}

// GET - Get current user profile image
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true
      }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: user
    })

  } catch (error) {
    console.error('Get profile image error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar imagem de perfil'
    }, { status: 500 })
  }
}

// DELETE - Remove profile image
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 })
    }

    // Update user to remove profile image
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { profileImage: null },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Imagem de perfil removida com sucesso'
    })

  } catch (error) {
    console.error('Delete profile image error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao remover imagem de perfil'
    }, { status: 500 })
  }
}
