import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

async function syncProviderSchedulingFlag(serviceProviderId: string) {
  const hasScheduling = await prisma.serviceProviderService.count({
    where: {
      serviceProviderId,
      offersScheduling: true,
      isActive: true,
    },
  }) > 0

  await prisma.serviceProvider.update({
    where: { id: serviceProviderId },
    data: { hasScheduling },
  })
}

// ---------------- GET (mantém seu shape) ----------------
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.userType !== 'SERVICE_PROVIDER') {
    return NextResponse.json(
      { success: false, error: 'Não autorizado' },
      { status: 401 }
    )
  }

  try {
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: session.user.id },
      include: {
        services: {
          include: {
        service: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                allowScheduling: true,
              }
            }
          }
        }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!provider) {
      return NextResponse.json({ success: true, services: [] })
    }

    return NextResponse.json({
      success: true,
      services: provider.services.map((s) => ({
        id: s.service.id,                 // ID do Service
        serviceProviderServiceId: s.id,   // ID do vínculo
        name: s.service.name,
        description: s.description ?? s.service.description ?? '',
        basePrice: s.basePrice,
        unit: s.unit,
        isActive: s.isActive,
        offersScheduling: s.offersScheduling,
        offersQuoting: s.offersQuoting,
        providesHomeService: s.providesHomeService,
        providesLocalService: s.providesLocalService,
        chargesTravel: s.chargesTravel,
        quoteFee: s.quoteFee,
        category: s.service.category,
        categoryId: s.service.categoryId,
        allowScheduling: s.service.category?.allowScheduling ?? true,
        createdAt: s.createdAt
      }))
    })
  } catch (error) {
    console.error('Erro ao buscar serviços do prestador:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// ---------------- POST (criar/atualizar vínculo) ----------------

const upsertSchema = z.object({
  leafCategoryId: z.string().uuid(),
  basePrice: z.number().nonnegative().optional(),
  unit: z.string().min(1),               // ex.: "hora", "serviço", "m²"
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
  offersScheduling: z.boolean().optional(),
  offersQuoting: z.boolean().optional(),
  providesHomeService: z.boolean().optional(),
  providesLocalService: z.boolean().optional(),
  chargesTravel: z.boolean().optional(),
  quoteFee: z.number().nonnegative().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.userType !== 'SERVICE_PROVIDER') {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const input = upsertSchema.parse(await req.json())

    // prestador logado
    let sp = await prisma.serviceProvider.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })
    if (!sp) {
      // cria perfil de prestador automaticamente para usuários do tipo prestador
      const created = await prisma.serviceProvider.create({ data: { userId: session.user.id, hasQuoting: true, hasScheduling: false, chargesTravel: false } })
      sp = { id: created.id }
    }

    // valida categoria folha
    const cat = await prisma.serviceCategory.findUnique({
      where: { id: input.leafCategoryId },
      select: { id: true, name: true, isLeaf: true, isActive: true }
    })
    if (!cat || !cat.isActive) {
      return NextResponse.json({ success: false, error: 'Categoria inválida/inativa' }, { status: 400 })
    }
    if (!cat.isLeaf) {
      return NextResponse.json({ success: false, error: 'Selecione uma subcategoria folha' }, { status: 400 })
    }

    // garante Service canônico (um por leaf)
    const selectSvc = {
      id: true, name: true, categoryId: true, description: true, isActive: true
    } as const

    // Usa findFirst para ser resiliente mesmo se o índice único ainda não estiver aplicado
    let service = await prisma.service.findFirst({
      where: { categoryId: cat.id },
      select: selectSvc
    })

    if (service && !service.isActive) {
      service = await prisma.service.update({
        where: { id: service.id },
        data: { isActive: true },
        select: selectSvc
      })
    }

    if (!service) {
      service = await prisma.service.create({
        data: { name: cat.name, categoryId: cat.id, isActive: true },
        select: selectSvc
      })
    }

    // upsert do vínculo prestador x serviço (único por [serviceProviderId, serviceId])
    const requestedHomeService = typeof input.providesHomeService === 'boolean' ? input.providesHomeService : undefined
    const requestedLocalService = typeof input.providesLocalService === 'boolean' ? input.providesLocalService : undefined
    const requestedQuoting = typeof input.offersQuoting === 'boolean' ? input.offersQuoting : undefined
    const requestedChargesTravel = typeof input.chargesTravel === 'boolean' ? input.chargesTravel : undefined
    const requestedQuoteFee = typeof input.quoteFee === 'number' ? input.quoteFee : undefined

    const homeServiceData = requestedHomeService !== undefined ? { providesHomeService: requestedHomeService } : {}
    const localServiceData = requestedLocalService !== undefined ? { providesLocalService: requestedLocalService } : {}
    const travelData = requestedChargesTravel !== undefined ? { chargesTravel: requestedChargesTravel } : {}
    const quoteFeeData = requestedQuoting === false
      ? { quoteFee: 0 }
      : requestedQuoteFee !== undefined
        ? { quoteFee: requestedQuoteFee }
        : {}

    const link = await prisma.serviceProviderService.upsert({
      where: {
        serviceProviderId_serviceId: {
          serviceProviderId: sp.id,
          serviceId: service.id
        }
      },
      update: {
        basePrice: input.basePrice ?? null,
        unit: input.unit,
        description: input.description ?? null,
        isActive: input.isActive ?? true,
        offersScheduling: cat.allowScheduling && !!input.offersScheduling,
        offersQuoting: requestedQuoting ?? true,
        ...homeServiceData,
        ...localServiceData,
        ...travelData,
        ...quoteFeeData,
      },
      create: {
        serviceProviderId: sp.id,
        serviceId: service.id,
        basePrice: input.basePrice ?? null,
        unit: input.unit,
        description: input.description ?? null,
        isActive: input.isActive ?? true,
        offersScheduling: cat.allowScheduling && !!input.offersScheduling,
        offersQuoting: requestedQuoting ?? true,
        providesHomeService: requestedHomeService ?? false,
        providesLocalService: requestedLocalService ?? true,
        chargesTravel: requestedChargesTravel ?? false,
        quoteFee: requestedQuoting === false ? 0 : (requestedQuoteFee ?? 0),
      },
      include: {
        service: { include: { category: { select: { id: true, name: true, icon: true, allowScheduling: true } } } }
      }
    })

    await syncProviderSchedulingFlag(sp.id)

    // retorna no mesmo shape do GET
    return NextResponse.json({
      success: true,
      service: {
        id: link.serviceId,
        serviceProviderServiceId: link.id,
        name: link.service.name,
        description: link.description ?? service.description ?? '',
        basePrice: link.basePrice,
        unit: link.unit,
        isActive: link.isActive,
        offersScheduling: link.offersScheduling,
        offersQuoting: link.offersQuoting,
        providesHomeService: link.providesHomeService,
        providesLocalService: link.providesLocalService,
        chargesTravel: link.chargesTravel,
        quoteFee: link.quoteFee,
        category: link.service.category,
        categoryId: service.categoryId,
        allowScheduling: link.service.category.allowScheduling,
        createdAt: link.createdAt
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao salvar serviço do prestador:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// ---------------- DELETE (remover vínculo) ----------------
// aceita ?id=<serviceProviderServiceId> OU ?serviceId=<Service.id> OU ?leafCategoryId=<uuid>
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.userType !== 'SERVICE_PROVIDER') {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const serviceId = searchParams.get('serviceId')
    const leafCategoryId = searchParams.get('leafCategoryId')

    const sp = await prisma.serviceProvider.findUnique({
      where: { userId: session.user.id },
      select: { id: true }
    })
    if (!sp) {
      return NextResponse.json({ success: false, error: 'Perfil de prestador não encontrado' }, { status: 404 })
    }

    if (id) {
      const link = await prisma.serviceProviderService.findUnique({
        where: { id },
        select: { serviceProviderId: true }
      })
      if (!link) {
        return NextResponse.json({ success: false, error: 'Vínculo não encontrado' }, { status: 404 })
      }
      if (link.serviceProviderId !== sp.id) {
        return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 })
      }

      await prisma.serviceProviderService.delete({ where: { id } })
    } else if (serviceId) {
      await prisma.serviceProviderService.delete({
        where: {
          serviceProviderId_serviceId: { serviceProviderId: sp.id, serviceId }
        }
      })
    } else if (leafCategoryId) {
      const svc = await prisma.service.findFirst({ where: { categoryId: leafCategoryId }, select: { id: true } })
      if (svc) {
        await prisma.serviceProviderService.delete({
          where: {
            serviceProviderId_serviceId: { serviceProviderId: sp.id, serviceId: svc.id }
          }
        })
      }
    } else {
      return NextResponse.json({ success: false, error: 'Informe id, serviceId ou leafCategoryId' }, { status: 400 })
    }

    await syncProviderSchedulingFlag(sp.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover serviço do prestador:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.userType !== 'SERVICE_PROVIDER') {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { serviceProviderServiceId, basePrice, unit, description, isActive, leafCategoryId, offersScheduling, providesHomeService, providesLocalService, offersQuoting, chargesTravel, quoteFee } = await req.json()

    const requestedScheduling = typeof offersScheduling === 'boolean' ? offersScheduling : undefined
    const requestedHomeService = typeof providesHomeService === 'boolean' ? providesHomeService : undefined
    const requestedLocalService = typeof providesLocalService === 'boolean' ? providesLocalService : undefined
    const requestedQuoting = typeof offersQuoting === 'boolean' ? offersQuoting : undefined
    const requestedChargesTravel = typeof chargesTravel === 'boolean' ? chargesTravel : undefined
    const requestedQuoteFee = typeof quoteFee === 'number' ? quoteFee : undefined

    const sps = await prisma.serviceProviderService.findUnique({
      where: { id: serviceProviderServiceId },
      select: {
        serviceProviderId: true,
        serviceId: true,
        offersScheduling: true,
        service: { select: { category: { select: { allowScheduling: true } } } }
      }
    })
    if (!sps) return NextResponse.json({ success: false, error: 'Vínculo não encontrado' }, { status: 404 })

    // (opcional) validar que pertence ao provider logado
    const provider = await prisma.serviceProvider.findUnique({ where: { userId: session.user.id } })
    if (!provider || provider.id !== sps.serviceProviderId) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 })
    }

    const baseHomeServiceData = requestedHomeService !== undefined ? { providesHomeService: requestedHomeService } : {}
    const baseLocalServiceData = requestedLocalService !== undefined ? { providesLocalService: requestedLocalService } : {}
    const baseQuotingData = requestedQuoting !== undefined ? { offersQuoting: requestedQuoting } : {}
    const baseTravelData = requestedChargesTravel !== undefined ? { chargesTravel: requestedChargesTravel } : {}
    const baseQuoteFeeData = requestedQuoting === false
      ? { quoteFee: 0 }
      : requestedQuoteFee !== undefined
        ? { quoteFee: requestedQuoteFee }
        : {}

    // Se veio uma nova folha, mover para o serviço canônico da nova categoria
    if (typeof leafCategoryId === 'string') {
      const cat = await prisma.serviceCategory.findUnique({ where: { id: leafCategoryId }, select: { id: true, isLeaf: true, isActive: true, name: true, allowScheduling: true } })
      if (!cat || !cat.isActive) {
        return NextResponse.json({ success: false, error: 'Categoria inválida/inativa' }, { status: 400 })
      }
      if (!cat.isLeaf) {
        return NextResponse.json({ success: false, error: 'Selecione uma subcategoria folha' }, { status: 400 })
      }

      const schedulingData = {
        offersScheduling: cat.allowScheduling ? (requestedScheduling ?? false) : false,
      }
      const homeServiceData = baseHomeServiceData
      const localServiceData = baseLocalServiceData

      const selectSvc = { id: true, categoryId: true } as const
      let target = await prisma.service.findFirst({ where: { categoryId: cat.id }, select: selectSvc })
      if (!target) {
        target = await prisma.service.create({ data: { name: cat.name, categoryId: cat.id, isActive: true }, select: selectSvc })
      }

      if (target.id !== sps.serviceId) {
        // Se já existir vínculo com o serviço alvo, atualiza-o e remove o antigo
        const existing = await prisma.serviceProviderService.findUnique({
          where: { serviceProviderId_serviceId: { serviceProviderId: sps.serviceProviderId, serviceId: target.id } },
        })

        if (existing) {
          await prisma.serviceProviderService.update({
            where: { id: existing.id },
            data: {
              ...(basePrice != null && { basePrice }),
              ...(unit && { unit }),
              ...(typeof description === 'string' ? { description } : {}),
              ...(typeof isActive === 'boolean' ? { isActive } : {}),
              ...schedulingData,
              ...homeServiceData,
              ...localServiceData,
              ...baseQuotingData,
              ...baseTravelData,
              ...baseQuoteFeeData,
            }
          })
          await prisma.serviceProviderService.delete({ where: { id: serviceProviderServiceId } })
        } else {
          await prisma.serviceProviderService.update({
            where: { id: serviceProviderServiceId },
            data: {
              serviceId: target.id,
              ...(basePrice != null && { basePrice }),
              ...(unit && { unit }),
              ...(typeof description === 'string' ? { description } : {}),
              ...(typeof isActive === 'boolean' ? { isActive } : {}),
              ...schedulingData,
              ...homeServiceData,
              ...localServiceData,
              ...baseQuotingData,
              ...baseTravelData,
              ...baseQuoteFeeData,
            }
          })
        }
      } else {
        // mesma folha — apenas atualiza campos
        await prisma.serviceProviderService.update({
          where: { id: serviceProviderServiceId },
          data: {
            ...(basePrice != null && { basePrice }),
            ...(unit && { unit }),
            ...(typeof description === 'string' ? { description } : {}),
            ...(typeof isActive === 'boolean' ? { isActive } : {}),
            ...schedulingData,
            ...homeServiceData,
            ...localServiceData,
            ...baseQuotingData,
            ...baseTravelData,
            ...baseQuoteFeeData,
          }
        })
      }
    } else {
      // Sem troca de categoria — atualiza campos
      const currentAllows = sps.service?.category.allowScheduling ?? true
      const schedulingData: { offersScheduling?: boolean } = currentAllows
        ? (requestedScheduling !== undefined ? { offersScheduling: requestedScheduling } : {})
        : { offersScheduling: false }

      await prisma.serviceProviderService.update({
        where: { id: serviceProviderServiceId },
        data: {
          ...(basePrice != null && { basePrice }),
          ...(unit && { unit }),
          ...(typeof description === 'string' ? { description } : {}),
          ...(typeof isActive === 'boolean' ? { isActive } : {}),
          ...schedulingData,
          ...baseHomeServiceData,
          ...baseLocalServiceData,
          ...baseQuotingData,
          ...baseTravelData,
          ...baseQuoteFeeData,
        }
      })
    }

    await syncProviderSchedulingFlag(sps.serviceProviderId)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success: false, error: 'Erro ao atualizar' }, { status: 500 })
  }
}
