/**
 * Admin Users API
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * API para gerenciamento de usuários pelo admin
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (session.user.userType !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar essas informações.' },
        { status: 403 }
      )
    }

    // Buscar todos os usuários com informações relacionadas
    const users = await prisma.user.findMany({
      include: {
        address: {
          select: {
            city: true,
            state: true
          }
        },
        serviceProvider: {
          include: {
            services: {
              include: {
                service: {
                  include: {
                    category: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Remover senhas dos dados retornados
    const sanitizedUsers = users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })

    return NextResponse.json({
      success: true,
      data: sanitizedUsers
    })

  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
