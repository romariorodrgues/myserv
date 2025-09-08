/**
 * Página de categorias (pública)
 */

import Link from 'next/link'

type Category = {
  id: string
  name: string
  isLeaf: boolean
  isActive: boolean
  serviceCount: number
}

async function getRootCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? ''}/api/categories?active=true`, {
      // Garante dados atualizados em runtime
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.categories ?? []
  } catch {
    return []
  }
}

export default async function CategoriasPage() {
  const categories = await getRootCategories()

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Categorias de serviços</h1>
          <p className="text-gray-600">Escolha uma categoria ou use a busca para encontrar o que precisa</p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center text-gray-600">
            Em breve listaremos nossas categorias por aqui. Enquanto isso, use a página de serviços para pesquisar.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/servicos?q=${encodeURIComponent(cat.name)}`}
                className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
              >
                <div className="font-semibold text-gray-900">{cat.name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {cat.serviceCount} serviços disponíveis
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link href="/servicos" className="text-blue-600 hover:underline">Ir para a busca de serviços</Link>
        </div>
      </div>
    </div>
  )
}

