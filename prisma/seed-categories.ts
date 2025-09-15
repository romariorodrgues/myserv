// prisma/seed-categories.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

type Node = { name: string; description?: string; icon?: string; children?: Node[] }

// <<< Troque/expanda à vontade (exemplo resumido dos 10 troncos) >>>
const TREE: Node[] = [
  { name: 'Beleza', children: [
    { name: 'Cabelo', children: [{ name: 'Corte masculino' }, { name: 'Corte feminino' }] },
    { name: 'Unhas',  children: [{ name: 'Manicure/Pedicure' }, { name: 'Alongamento em gel/fibra' }] },
    { name: 'Depilação', children: [{ name: 'Cera' }, { name: 'Fotodepilação/Laser' }] }
  ]},
  { name: 'Consultoria', children: [
    { name: 'Financeira', children: [{ name: 'Planejamento pessoal/MEI' }, { name: 'Impostos/Regularização' }] },
    { name: 'Marketing', children: [{ name: 'Social media/Conteúdo' }, { name: 'SEO/Tráfego pago' }] }
  ]},
  { name: 'Educação', children: [
    { name: 'Reforço escolar', children: [{ name: 'Matemática' }, { name: 'Português/Redação' }] },
    { name: 'Idiomas', children: [{ name: 'Inglês' }, { name: 'Espanhol' }] }
  ]},
  { name: 'Eventos', children: [
    { name: 'Buffet', children: [{ name: 'Coffee break/Coquetel' }, { name: 'Buffet completo' }] },
    { name: 'Foto & Vídeo', children: [{ name: 'Fotografia' }, { name: 'Filmagem/Drone' }] }
  ]},
  { name: 'Limpeza', children: [
    { name: 'Residencial', children: [{ name: 'Diarista/Limpeza de casa' }, { name: 'Pós-obra' }] },
    { name: 'Automotiva', children: [{ name: 'Lavagem de carro' }, { name: 'Higienização de estofados' }] }
  ]},
  { name: 'Pets', children: [
    { name: 'Pet sitter' }, { name: 'Dog walker' }, { name: 'Banho e tosa' }, { name: 'Adestramento' }
  ]},
  { name: 'Reformas', children: [
    { name: 'Elétrica', children: [{ name: 'Instalações/Quadro' }, { name: 'Automação/Iluminação' }] },
    { name: 'Pintura', children: [{ name: 'Residencial/Comercial' }, { name: 'Texturas/Efeitos' }] }
  ]},
  { name: 'Saúde', children: [
    { name: 'Fisioterapia domiciliar' }, { name: 'Psicologia (on-line/presencial)' }, { name: 'Massoterapia' }
  ]},
  { name: 'Tecnologia', children: [
    { name: 'Suporte TI (PC/Notebook)' }, { name: 'Desenvolvimento Web' }, { name: 'Redes/Wi-Fi' }
  ]},
  { name: 'Transporte', children: [
    { name: 'Frete/Carreto' }, { name: 'Mudanças' }, { name: 'Motoboy/Entregas rápidas' }
  ]},
]

// Cria/atualiza a árvore (parent via relation)
async function upsertTree(nodes: Node[], parentId: string | null = null, level = 0): Promise<void> {
  for (const [i, n] of nodes.entries()) {
    const isLeaf = !n.children || n.children.length === 0

    const cat = await prisma.serviceCategory.upsert({
      where: { name: n.name }, // name é único no seu schema atual
      update: {
        description: n.description,
        icon: n.icon,
        ...(parentId ? { parent: { connect: { id: parentId } } } : { parent: { disconnect: true } }),
        level,
        isLeaf,
        displayOrder: i,
        isActive: true,
      },
      create: {
        name: n.name,
        description: n.description,
        icon: n.icon,
        ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
        level,
        isLeaf,
        displayOrder: i,
        isActive: true,
      },
    })

    if (!isLeaf) await upsertTree(n.children!, cat.id, level + 1)
  }
}

// 1 Service canônico por leaf
async function seedServicesForLeaves() {
  const leaves = await prisma.serviceCategory.findMany({
    where: { isLeaf: true, isActive: true },
    select: { id: true, name: true },
  })

  for (const leaf of leaves) {
    const existing = await prisma.service.findFirst({
      where: { categoryId: leaf.id }, select: { id: true }
    })
    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: { name: leaf.name, isActive: true },
      })
    } else {
      await prisma.service.create({
        data: {
          name: leaf.name,
          description: `Serviço: ${leaf.name}`,
          categoryId: leaf.id,
          isActive: true,
        },
      })
    }
  }
}

async function main() {
  console.time('seed:categories')
  await upsertTree(TREE)
  await seedServicesForLeaves()
  console.timeEnd('seed:categories')
  console.log('✅ Categorias e serviços canônicos ok.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
