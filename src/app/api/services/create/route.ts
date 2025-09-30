import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const serviceSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10), // usado internamente no modelo Service
  categoryId: z.string().uuid(),
  basePrice: z.number().min(0),
  unit: z.enum(['HOUR', 'FIXED', 'SQUARE_METER', 'ROOM', 'CUSTOM']),
  providerDescription: z.string().min(5), // visível para o cliente
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.userType !== 'SERVICE_PROVIDER') {
      return NextResponse.json({ success: false, error: 'Acesso não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = serviceSchema.parse(body)

    // Regras de elegibilidade por categoria
    const category = await prisma.serviceCategory.findUnique({ where: { id: data.categoryId } })
    if (!category) {
      return NextResponse.json({ success: false, error: 'Categoria inválida' }, { status: 400 })
    }

    if (category.requiresDriverLicense) {
      const provider = await prisma.serviceProvider.findFirst({ where: { userId: session.user.id } })
      if (!provider || !provider.hasDriverLicense) {
        return NextResponse.json({ success: false, error: 'Esta categoria exige CNH válida' }, { status: 403 })
      }
      if (provider.driverLicenseExpiresAt && provider.driverLicenseExpiresAt < new Date()) {
        return NextResponse.json({ success: false, error: 'CNH vencida. Atualize seus dados.' }, { status: 403 })
      }
    }

    // Cria novo serviço global (mesmo que já exista com mesmo nome)
    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        isActive: true
      }
    })

    // Busca o provider logado
    const provider = await prisma.serviceProvider.findFirst({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            address: {
              select: {
                street: true,
                number: true,
                district: true,
                city: true,
                state: true,
                zipCode: true,
              },
            },
          },
        },
      },
    })

    if (!provider) {
      return NextResponse.json({ success: false, error: 'Prestador não encontrado' }, { status: 404 })
    }

    const address = provider.user?.address
    const missingAddress = !address || !address.city || !address.state || !address.street || !address.number || !address.zipCode
    if (missingAddress) {
      return NextResponse.json({
        success: false,
        error: 'Cadastre seu endereço completo em Configurações antes de publicar serviços. Cidade, estado, rua, número e CEP são obrigatórios para aparecer nas buscas.',
      }, { status: 400 })
    }

    // Cria o vínculo do serviço com o prestador
    const newService = await prisma.serviceProviderService.create({
      data: {
        serviceId: service.id,
        serviceProviderId: provider.id,
        basePrice: data.basePrice,
        unit: data.unit,
        description: data.providerDescription,
        isActive: true
      },
      include: {
        service: {
          include: {
            category: { select: { name: true, icon: true } }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      service: {
        id: newService.service.id,
        serviceProviderServiceId: newService.id,
        name: newService.service.name,
        description: newService.description,
        basePrice: newService.basePrice,
        unit: newService.unit,
        isActive: newService.isActive,
        category: newService.service.category,
        createdAt: newService.createdAt
      }
    })

  } catch (error) {
    console.error('Erro ao criar serviço:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}
