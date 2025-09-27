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
import { PROFILE_IMAGE_ALLOWED_MIME, PROFILE_IMAGE_MAX_SIZE, saveProfileImageFromFile } from '@/lib/profile-image'

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
    if (!PROFILE_IMAGE_ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP'
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > PROFILE_IMAGE_MAX_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo muito grande. Máximo 5MB'
      }, { status: 400 })
    }

    const imagePath = await saveProfileImageFromFile(file)

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
