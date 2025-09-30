import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.userType !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cityFilter = searchParams.get('city')?.trim()
  const stateFilter = searchParams.get('state')?.trim()?.toUpperCase()

  const providers = await prisma.user.findMany({
    where: {
      userType: 'SERVICE_PROVIDER',
      ...(cityFilter
        ? { address: { city: { contains: cityFilter, mode: 'insensitive' } } }
        : {}),
      ...(stateFilter
        ? { address: { state: { equals: stateFilter } } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      isApproved: true,
      isActive: true,
      createdAt: true,
      address: {
        select: {
          street: true,
          number: true,
          district: true,
          city: true,
          state: true,
          zipCode: true,
          latitude: true,
          longitude: true,
        },
      },
      serviceProvider: {
        select: {
          id: true,
          hasScheduling: true,
          hasQuoting: true,
          chargesTravel: true,
          serviceRadiusKm: true,
          services: {
            select: {
              id: true,
              isActive: true,
              basePrice: true,
              unit: true,
              service: {
                select: {
                  id: true,
                  name: true,
                  category: {
                    select: { name: true },
                  },
                },
              },
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const payload = providers.map((provider) => ({
    ...provider,
    servicesCount: provider.serviceProvider?.services.length ?? 0,
  }))

  return NextResponse.json({ success: true, providers: payload })
}

