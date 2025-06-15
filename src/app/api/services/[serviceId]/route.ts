/**
 * Individual Service API endpoint
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles fetching a single service with its providers
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const { serviceId } = await params

    const service = await prisma.service.findUnique({
      where: {
        id: serviceId,
        isActive: true
      },
      include: {
        category: {
          select: {
            name: true,
            icon: true
          }
        },
        providers: {
          where: {
            isActive: true,
            serviceProvider: {
              user: {
                isActive: true,
                isApproved: true
              }
            }
          },
          include: {
            serviceProvider: {
              include: {
                user: {
                  select: {
                    name: true,
                    profileImage: true
                  }
                }
              }
            }
          },
          orderBy: {
            basePrice: 'asc'
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Serviço não encontrado'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      service
    })

  } catch (error) {
    console.error('Service fetch error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}
