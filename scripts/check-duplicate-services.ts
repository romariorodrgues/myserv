import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const services = await prisma.service.findMany({
    select: {
      id: true, name: true, categoryId: true, createdAt: true,
      category: { select: { id: true, name: true } }
    }
  })

  const byCat = new Map<string, typeof services>()
  for (const s of services) {
    const arr = byCat.get(s.categoryId) ?? []
    arr.push(s)
    byCat.set(s.categoryId, arr)
  }

  let dupCount = 0
  for (const [catId, list] of byCat.entries()) {
    if (list.length > 1) {
      dupCount += list.length - 1
      console.log(`\nCategoria ${list[0].category.name} (${catId}) tem ${list.length} Services:`)
      list.forEach(s => console.log(`  - ${s.id}  ${s.name}`))
    }
  }

  if (dupCount === 0) console.log('✅ Nenhuma duplicata encontrada.')
  else console.log(`\n⚠️  Total de duplicatas: ${dupCount}`)
}

main().finally(()=>prisma.$disconnect())
