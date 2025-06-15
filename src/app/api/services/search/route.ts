/**
 * Advanced Services search API endpoint
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles service search with advanced filters and geolocation
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for advanced search
const advancedSearchSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  sortBy: z.enum(['RELEVANCE', 'PRICE_LOW', 'PRICE_HIGH', 'NEWEST']).default('RELEVANCE'),
  page: z.number().default(1),
  limit: z.number().default(20)
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Handle both 'local' and legacy parameters
    const localParam = searchParams.get('local') || searchParams.get('location')
    let cityFilter = searchParams.get('city')
    let stateFilter = searchParams.get('state')
    
    // If 'local' parameter is provided, try to parse city/state from it
    if (localParam && !cityFilter) {
      const localParts = localParam.split(',').map(part => part.trim())
      if (localParts.length >= 2) {
        cityFilter = localParts[0]
        stateFilter = localParts[1]
      } else if (localParts.length === 1) {
        cityFilter = localParts[0]
      }
    }
    
    const queryData = {
      q: searchParams.get('q') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      city: cityFilter || undefined,
      state: stateFilter || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      sortBy: (searchParams.get('sortBy') as 'RELEVANCE' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RATING' | 'DISTANCE') || 'RELEVANCE',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    }

    const validatedData = advancedSearchSchema.parse(queryData)
    
    // Build search filters
    const whereClause: { isActive: boolean; [key: string]: unknown } = { isActive: true }

    if (validatedData.q) {
      whereClause.OR = [
        { name: { contains: validatedData.q } },
        { description: { contains: validatedData.q } }
      ]
    }

    if (validatedData.categoryId) {
      whereClause.categoryId = validatedData.categoryId
    }

    // Calculate pagination
    const skip = (validatedData.page - 1) * validatedData.limit

    // Search services
    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        category: { select: { name: true, icon: true } },
        providers: {
          where: { isActive: true },
          take: 3,
          include: {
            serviceProvider: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true
                  }
                }
              }
            }
          }
        }
      },
      skip,
      take: validatedData.limit
    })

    const totalCount = await prisma.service.count({ where: whereClause })

    interface ServiceWithProviders {
      id: string;
      name: string;
      description: string;
      category: { id: string; name: string; icon: string };
      providers: Array<{
        serviceProvider: {
          id: string;
          user: { id: string; name: string; profileImage: string | null };
        };
        basePrice: number;
        description: string;
      }>;
    }

    const servicesWithProviders = (services as ServiceWithProviders[])
      .filter((service) => service.providers.length > 0)
      .map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category,
        providers: service.providers.map((provider) => ({
          id: provider.serviceProvider.id,
          userId: provider.serviceProvider.user.id,
          name: provider.serviceProvider.user.name,
          profileImage: provider.serviceProvider.user.profileImage,
          basePrice: provider.basePrice,
          description: provider.description
        }))
      }))

    return NextResponse.json({
      success: true,
      data: {
        services: servicesWithProviders,
        pagination: {
          page: validatedData.page,
          limit: validatedData.limit,
          total: servicesWithProviders.length,
          totalServices: totalCount,
          pages: Math.ceil(totalCount / validatedData.limit)
        }
      }
    })

  } catch (error) {
    console.error('Search error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Parâmetros de busca inválidos',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar serviços'
    }, { status: 500 })
  }
}
