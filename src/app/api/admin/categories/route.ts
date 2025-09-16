/**
 * Admin Categories API - Create category nodes in the taxonomy
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().uuid().nullish(),
  isActive: z.boolean().optional().default(true),
  requiresDriverLicense: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const input = createSchema.parse(body)

    let level = 0
    if (input.parentId) {
      const parent = await prisma.serviceCategory.findUnique({ where: { id: input.parentId } })
      if (!parent) return NextResponse.json({ success: false, error: 'Categoria pai não encontrada' }, { status: 404 })
      level = (parent.level || 0) + 1
    }

    // displayOrder: próximo para os irmãos
    const siblingMax = await prisma.serviceCategory.aggregate({
      where: { parentId: input.parentId ?? null },
      _max: { displayOrder: true },
    })
    const displayOrder = (siblingMax._max.displayOrder ?? 0) + 1

    const created = await prisma.serviceCategory.create({
      data: {
        name: input.name,
        description: input.description,
        icon: input.icon,
        parentId: input.parentId ?? null,
        level,
        isLeaf: true, // por padrão, novo nó é folha
        displayOrder,
        isActive: input.isActive,
        requiresDriverLicense: input.requiresDriverLicense,
      },
    })

    // Se existir pai e ele era folha, marcamos como não-folha
    if (input.parentId) {
      await prisma.serviceCategory.update({ where: { id: input.parentId }, data: { isLeaf: false } })
    }

    // Criar Service canônico para a leaf
    const service = await prisma.service.create({
      data: {
        name: created.name,
        categoryId: created.id,
        isActive: true,
        description: created.description,
      },
    })

    return NextResponse.json({ success: true, category: created, service })
  } catch (e) {
    console.error('[ADMIN_CATEGORIES_CREATE]', e)
    if (e instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Dados inválidos', details: e.errors }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}
