/**
 * Service Provider details API for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * API endpoint to get service provider information
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params

    if (!providerId) {
      return NextResponse.json({
        success: false,
        error: 'ID do prestador é obrigatório'
      }, { status: 400 })
    }

    // Get service provider with related data
    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            description: true,
            isActive: true,
            isApproved: true,
            createdAt: true,
            address: {
              select: {
                state: true,
                city: true,
                district: true
              }
            }
          }
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                description: true,
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        availability: {
          where: {
            isActive: true
          },
          orderBy: {
            dayOfWeek: 'asc'
          }
        }
      }
    })

    if (!serviceProvider) {
      return NextResponse.json({
        success: false,
        error: 'Prestador de serviço não encontrado'
      }, { status: 404 })
    }

    // Get review statistics
    const [reviewStats, totalServices, platformAvgRaw, platformTotalCount] = await Promise.all([
      prisma.review.aggregate({
        where: {
          receiverId: serviceProvider.user.id
        },
        _avg: {
          rating: true
        },
        _count: {
          id: true
        }
      }),
      prisma.serviceRequest.count({
        where: {
          providerId: serviceProvider.user.id,
          status: 'COMPLETED'
        }
      }),
      prisma.review.aggregate({ _avg: { rating: true } }),
      prisma.review.count()
    ])

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        receiverId: serviceProvider.user.id
      },
      _count: {
        rating: true
      }
    })

    const distributionMap = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }

    ratingDistribution.forEach(item => {
      distributionMap[item.rating as keyof typeof distributionMap] = item._count.rating
    })

    // Format response
    // Bayesian average to stabilize small sample sizes
    const C = platformAvgRaw._avg.rating ? Number(platformAvgRaw._avg.rating.toFixed(2)) : 0
    const n = reviewStats._count.id
    const R = reviewStats._avg.rating ? Number(reviewStats._avg.rating) : 0
    const m = 8 // prior weight (tunable)
    const bayesian = n > 0 ? (m * C + n * R) / (m + n) : C

    const response = {
      ...serviceProvider,
      statistics: {
        averageRating: reviewStats._avg.rating ? Number(reviewStats._avg.rating.toFixed(2)) : 0,
        bayesianRating: Number(bayesian.toFixed(2)),
        totalReviews: reviewStats._count.id,
        totalCompletedServices: totalServices,
        ratingDistribution: distributionMap
      }
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Get service provider error:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar dados do prestador'
    }, { status: 500 })
  }
}
