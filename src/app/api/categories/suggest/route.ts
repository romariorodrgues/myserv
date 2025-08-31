import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  q: z.string().trim().min(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = schema.safeParse({
      q: searchParams.get('q') ?? '',
      limit: searchParams.get('limit') ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos' },
        { status: 400 }
      )
    }
    const { q, limit } = parsed.data

    const variants = Array.from(new Set([q, q.toLowerCase(), q.toUpperCase()]))

    const leaves = await prisma.serviceCategory.findMany({
      where: {
        isActive: true,
        isLeaf: true,
        OR: variants.map((v) => ({ name: { contains: v } })),
      },
      select: {
        id: true,
        name: true,
        parent: {
          select: {
            id: true,
            name: true,
            parent: {
              select: {
                id: true,
                name: true,
                parent: { select: { id: true, name: true } }, // até 3 níveis
              },
            },
          },
        },
      },
      orderBy: [{ name: 'asc' }],
      take: limit,
    })

    const withCounts = await Promise.all(
      leaves.map(async (cat) => {
        const count = await prisma.serviceProviderService.count({
          where: { service: { categoryId: cat.id }, isActive: true },
        })

        // monta breadcrumb
        const parts: string[] = []
        if (cat.parent?.parent?.parent?.name) parts.push(cat.parent.parent.parent.name)
        if (cat.parent?.parent?.name) parts.push(cat.parent.parent.name)
        if (cat.parent?.name) parts.push(cat.parent.name)

        return {
          id: cat.id,
          name: cat.name,              // ← este é o rótulo padronizado do serviço
          breadcrumb: parts.join(' > '),
          serviceCount: count,
        }
      })
    )

    return NextResponse.json({ success: true, items: withCounts })
  } catch (e) {
    console.error('[CATEGORIES_SUGGEST]', e)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
