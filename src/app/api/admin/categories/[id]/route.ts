/**
 * Admin Categories API - Update/Delete nodes
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const input = updateSchema.parse(body)

    const node = await prisma.serviceCategory.findUnique({ where: { id } })
    if (!node) return NextResponse.json({ success: false, error: 'Categoria não encontrada' }, { status: 404 })

    const updated = await prisma.serviceCategory.update({ where: { id }, data: input })

    // Sincroniza nome com Service canônico se for leaf e renomeado
    if (input.name && updated.isLeaf) {
      const svc = await prisma.service.findFirst({ where: { categoryId: id } })
      if (svc) {
        await prisma.service.update({ where: { id: svc.id }, data: { name: input.name } })
      }
    }

    return NextResponse.json({ success: true, category: updated })
  } catch (e) {
    console.error('[ADMIN_CATEGORIES_UPDATE]', e)
    if (e instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Dados inválidos', details: e.errors }, { status: 400 })
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const node = await prisma.serviceCategory.findUnique({ where: { id }, include: { children: true } })
    if (!node) return NextResponse.json({ success: false, error: 'Categoria não encontrada' }, { status: 404 })

    if (!node.isLeaf || node.children.length > 0) {
      return NextResponse.json({ success: false, error: 'Só é possível excluir folhas sem filhos' }, { status: 400 })
    }

    // Verifica Service e vínculos com providers
    const svc = await prisma.service.findFirst({ where: { categoryId: id } })
    if (svc) {
      const used = await prisma.serviceProviderService.count({ where: { serviceId: svc.id } })
      if (used > 0) return NextResponse.json({ success: false, error: 'Categoria em uso por prestadores' }, { status: 400 })
      await prisma.service.delete({ where: { id: svc.id } })
    }

    await prisma.serviceCategory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[ADMIN_CATEGORIES_DELETE]', e)
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 })
  }
}

