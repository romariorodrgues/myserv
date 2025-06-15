/**
 * Reviews API for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles review creation, listing, and management
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const createReviewSchema = z.object({
  serviceRequestId: z.string().min(1, 'ID da solicitação é obrigatório'),
  rating: z.number().min(1, 'Avaliação mínima é 1').max(5, 'Avaliação máxima é 5'),
  comment: z.string().optional()
})

const getReviewsSchema = z.object({
  userId: z.string().optional(),
  serviceProviderId: z.string().optional(),
  serviceRequestId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
})

// GET - List reviews with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const { userId, serviceProviderId, serviceRequestId, page = '1', limit = '10' } = 
      getReviewsSchema.parse(params)

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (userId) {
      where.OR = [
        { giverId: userId },
        { receiverId: userId }
      ]
    }
    
    if (serviceProviderId) {
      where.receiverId = serviceProviderId
    }
    
    if (serviceRequestId) {
      where.serviceRequestId = serviceRequestId
    }

    // Get reviews with related data
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          giver: {
            select: {
              id: true,
              name: true,
              profileImage: true
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              profileImage: true
            }
          },
          serviceRequest: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.review.count({ where })
    ])

    // Calculate statistics
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / reviews.length
      : 0

    const ratingDistribution = {
      1: reviews.filter((r: { rating: number }) => r.rating === 1).length,
      2: reviews.filter((r: { rating: number }) => r.rating === 2).length,
      3: reviews.filter((r: { rating: number }) => r.rating === 3).length,
      4: reviews.filter((r: { rating: number }) => r.rating === 4).length,
      5: reviews.filter((r: { rating: number }) => r.rating === 5).length,
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        statistics: {
          averageRating: Number(avgRating.toFixed(2)),
          totalReviews: total,
          ratingDistribution
        }
      }
    })

  } catch (error) {
    console.error('Get reviews error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar avaliações'
    }, { status: 500 })
  }
}

// POST - Create new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 })
    }

    const body = await request.json()
    const { serviceRequestId, rating, comment } = createReviewSchema.parse(body)

    // Check if service request exists and user is involved
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: {
        review: true
      }
    })

    if (!serviceRequest) {
      return NextResponse.json({
        success: false,
        error: 'Solicitação de serviço não encontrada'
      }, { status: 404 })
    }

    // Check if service is completed
    if (serviceRequest.status !== 'COMPLETED') {
      return NextResponse.json({
        success: false,
        error: 'Só é possível avaliar serviços concluídos'
      }, { status: 400 })
    }

    // Check if review already exists
    if (serviceRequest.review) {
      return NextResponse.json({
        success: false,
        error: 'Esta solicitação já foi avaliada'
      }, { status: 400 })
    }

    // Check if user is the client (only clients can review providers)
    if (serviceRequest.clientId !== session.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Apenas o cliente pode avaliar o prestador'
      }, { status: 403 })
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        serviceRequestId,
        giverId: session.user.id,
        receiverId: serviceRequest.providerId,
        rating,
        comment
      },
      include: {
        giver: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        },
        serviceRequest: {
          include: {
            service: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    // Send notification to service provider
    await prisma.notification.create({
      data: {
        userId: serviceRequest.providerId,
        type: 'SERVICE_REQUEST',
        title: 'Nova avaliação recebida',
        message: `Você recebeu uma avaliação de ${rating} estrelas de ${session.user.name}`,
        data: {
          reviewId: review.id,
          rating,
          serviceRequestId
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Avaliação criada com sucesso'
    })

  } catch (error) {
    console.error('Create review error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Erro ao criar avaliação'
    }, { status: 500 })
  }
}
