import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  serviceId: z.string().uuid(), // ID do Service vinculado ao ServiceProviderService
  basePrice: z.number(),
  unit: z.enum(['HOUR', 'FIXED', 'SQUARE_METER', 'ROOM', 'CUSTOM']),
  description: z.union([z.string().min(3), z.literal('')]).optional(),
  isActive: z.boolean()
})

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const body = await req.json()

  console.log('[UPDATE RECEBIDO]', body)

  if (!session?.user || session.user.userType !== 'SERVICE_PROVIDER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', issues: parsed.error.errors },
      { status: 400 }
    )
  }

  const { serviceId, basePrice, unit, description, isActive } = parsed.data

  try {
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const updated = await prisma.serviceProviderService.update({
      where: {
        serviceProviderId_serviceId: {
          serviceProviderId: provider.id,
          serviceId
        }
      },
      data: {
        basePrice,
        unit,
        description,
        isActive
      }
    })

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    console.error('[UPDATE_PROVIDER_SERVICE_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
