/**
 * Admin Service Providers API
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * API para buscar profissionais de serviço
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

    // Buscar apenas profissionais de serviço
    const providers = await prisma.user.findMany({
      where: {
        userType: 'SERVICE_PROVIDER'
      },
      include: {
        address: {
          select: {
            city: true,
            state: true,
            street: true,
            district: true
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
                        name: true,
                        icon: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        {
          isApproved: 'asc' // Não aprovados primeiro
        },
        {
          createdAt: 'desc'
        }
      ]
    })

    // Remover senhas dos dados retornados
    const sanitizedProviders = providers.map(provider => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...providerWithoutPassword } = provider
      return providerWithoutPassword
    })

    return NextResponse.json({
      success: true,
      data: sanitizedProviders
    })

  } catch (error) {
    console.error('Admin providers error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
