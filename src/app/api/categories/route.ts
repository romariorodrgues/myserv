/**
 * Service Categories (hierarchical) API
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 *
 * Suporta cascata:
 *  - GET /api/categories?active=true         -> raízes (parentId = null)
 *  - GET /api/categories?parentId=<uuid>     -> filhos diretos
 * Retorna { id, name, isLeaf, isActive, serviceCount }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
// Busca TODAS as folhas descendentes de um nó (inclui o próprio nó se já for leaf)
async function getDescendantLeafIds(rootId: string): Promise<string[]> {
  const queue: string[] = [rootId]
  const leaves: string[] = []

  while (queue.length) {
    const batch = await prisma.serviceCategory.findMany({
      where: { parentId: { in: queue } },
      select: { id: true, isLeaf: true },
    })
    queue.length = 0
    for (const n of batch) {
      if (n.isLeaf) leaves.push(n.id)
      else queue.push(n.id)
    }
  }

  const root = await prisma.serviceCategory.findUnique({
    where: { id: rootId },
    select: { isLeaf: true },
  })
  if (root?.isLeaf) leaves.push(rootId)

  return Array.from(new Set(leaves))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'
    const parentId = searchParams.get('parentId')

    // Raízes quando não for passado parentId
    const where: Prisma.ServiceCategoryWhereInput = parentId ? { parentId } : { parentId: null }
    if (activeOnly) where.isActive = true

    const nodes = await prisma.serviceCategory.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }, // fallback estável
      ],
      select: {
        id: true,
        name: true,
        isLeaf: true,
        isActive: true,
        allowScheduling: true,
      },
    })

    // Conta serviços de provedores ativos sob TODAS as folhas do sub-tree
    const categories = await Promise.all(
      nodes.map(async (node) => {
        const leafIds = await getDescendantLeafIds(node.id)
        const serviceCount = leafIds.length
          ? await prisma.serviceProviderService.count({
              where: {
                isActive: true,
                service: {
                  isActive: true,
                  categoryId: { in: leafIds },
                },
              },
            })
          : 0

        return {
          id: node.id,
          name: node.name,
          isLeaf: node.isLeaf,
          isActive: node.isActive,
          allowScheduling: node.allowScheduling,
          serviceCount,
        }
      }),
    )

    return NextResponse.json({ categories, total: categories.length })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
