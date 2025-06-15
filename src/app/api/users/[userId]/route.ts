/**
 * User Profile API endpoint
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles fetching user profile data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Não autorizado'
        },
        { status: 401 }
      )
    }

    const { userId } = await params

    // Verificar se o usuário está tentando acessar seus próprios dados
    if (session.user.id !== userId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Acesso negado'
        },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profileImage: true,
        userType: true,
        address: {
          select: {
            street: true,
            number: true,
            city: true,
            state: true,
            zipCode: true,
            district: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Usuário não encontrado'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('User profile fetch error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}
