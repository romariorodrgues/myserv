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

    const service = await prisma.service.findFirst({
      where: { id: serviceId, isActive: true },
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
              is: {
                user: {
                  is: {
                    isActive: true,
                    // isApproved: true, // opcional (desabilitado para não filtrar seus testes)
                  }
                }
              }
            }
          },
          include: {
            serviceProvider: {
              select: {
                id: true,
                hasScheduling: true,
                hasQuoting: true,
                chargesTravel: true,
                travelCost: true,
                travelRatePerKm: true,
                travelMinimumFee: true,
                waivesTravelOnHire: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true,
                    address: { select: { city: true, state: true, latitude: true, longitude: true, street: true, number: true } }
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
