/**
 * Favorites API endpoint
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles user favorites management
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for favorites
const favoriteSchema = z.object({
  providerId: z.string().cuid()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Get user's favorites
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        serviceProvider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                address: {
                  select: {
                    city: true,
                    state: true,
                    latitude: true,
                    longitude: true
                  }
                }
              }
            },
            services: {
              include: {
                service: {
                  include: {
                    category: true
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

    // Format response
    const formattedFavorites = favorites.map(fav => ({
  id: fav.id,
  addedAt: fav.createdAt,
  serviceProvider: {
    id: fav.serviceProviderId,
    user: {
      name: fav.serviceProvider.user.name,
      profileImage: fav.serviceProvider.user.profileImage,
      phone: undefined, // ou preencha se quiser retornar o telefone
    },
    location: {
      city: fav.serviceProvider.user.address?.city || '',
      state: fav.serviceProvider.user.address?.state || '',
      district: '', // ou preencha se tiver esse campo
    },
    services: fav.serviceProvider.services.map(ps => ({
      id: ps.serviceId,
      name: ps.service.name,
      category: ps.service.category.name,
      basePrice: ps.basePrice ?? undefined
    })),
    description: '', // Preencha se quiser
    priceRange: '', // Preencha se quiser
    isVerified: false, // ou ajuste se tiver lógica
    isHighlighted: false, // ou ajuste se tiver lógica
    availableScheduling: false, // ou ajuste se tiver lógica
    rating: 4.8,
    reviewCount: 125,
    availability: {
      nextAvailable: undefined,
      responseTime: undefined
    }
  }
}))


    return NextResponse.json(formattedFavorites)


  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { providerId } = favoriteSchema.parse(body)

    // Check if provider exists
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId }
    })

    if (!provider) {
      return NextResponse.json(
        { error: 'Prestador de serviço não encontrado' },
        { status: 404 }
      )
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: session.user.id,
        serviceProviderId: providerId
      }
    })

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Prestador já está nos favoritos' },
        { status: 400 }
      )
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        serviceProviderId: providerId
      }
    })

    return NextResponse.json({
      message: 'Prestador adicionado aos favoritos',
      favoriteId: favorite.id
    }, { status: 201 })

  } catch (error) {
    console.error('Error adding favorite:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const providerId = searchParams.get('providerId')

    if (!providerId) {
      return NextResponse.json(
        { error: 'ID do prestador é obrigatório' },
        { status: 400 }
      )
    }

    // Find and delete favorite
    const deleted = await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        serviceProviderId: providerId
      }
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Favorito não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Prestador removido dos favoritos'
    })

  } catch (error) {
    console.error('Error removing favorite:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
