/**
 * Homepage for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Main landing page with hero section, features, and service categories
 */

// creates development branch

import Link from "next/link"
import { Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import HomepageSearch from "@/components/search/homepage-search"

type Category = { id: string; name: string }

async function getTopCategories(): Promise<Category[]> {
  try {
    const base = process.env.NEXTAUTH_URL ?? ''
    const res = await fetch(`${base}/api/categories?active=true`, { next: { revalidate: 600 } })
    if (!res.ok) return fallbackCategories
    const data = await res.json()
    const cats: Category[] = (data.categories || []).map((c: any) => ({ id: c.id, name: c.name }))
    // Prefer commonly procurados se existirem
    const preferred = ['Limpeza', 'Reformas', 'Beleza', 'Tecnologia', 'Educação', 'Saúde']
    const mapped = preferred
      .map((p) => cats.find((c) => c.name.toLowerCase() === p.toLowerCase()))
      .filter(Boolean) as Category[]
    const rest = cats.filter((c) => !mapped.some((m) => m.id === c.id))
    return (mapped.length ? mapped : cats).slice(0, 6)
  } catch {
    return fallbackCategories
  }
}

export default async function Home() {
  const categories = await getTopCategories()
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
              Encontre o <span className="text-blue-600">profissional</span>
              <br />
              mais perto e adequado para você
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Conectamos você aos melhores prestadores de serviços da sua região.
            </p>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Escolha o profissional qualificado ideal para você, agende seu orçamento/serviço online
e pague direto ao prestador.
            </p>
            {/* Search Bar with Geolocation */}
            <HomepageSearch />

            {/* Trust notes (sem números exagerados nesta fase) */}
            <div className="flex justify-center gap-6 flex-wrap text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Profissionais qualificados</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Contato direto com o prestador</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Serviços mais procurados
            </h2>
            <p className="text-xl text-gray-600">
              Encontre profissionais qualificados em diversas áreas
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/servicos?q=${encodeURIComponent(category.name)}`}
                className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  {/* simple avatar icon placeholder */}
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Como funciona?
            </h2>
            <p className="text-xl text-gray-600">
              É muito simples contratar um profissional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Pronto para encontrar seu profissional?
          </h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Crie sua conta grátis e encontre profissionais na sua região.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/cadastrar">Começar agora</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/seja-profissional">Seja um profissional</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

// Sample data - In production, this would come from your database
const fallbackCategories: Category[] = [
  { id: 'limpeza', name: 'Limpeza' },
  { id: 'reformas', name: 'Reformas' },
  { id: 'beleza', name: 'Beleza' },
  { id: 'tecnologia', name: 'Tecnologia' },
  { id: 'educacao', name: 'Educação' },
  { id: 'saude', name: 'Saúde' },
]

const steps = [
  {
    title: 'Buscar',
    description: 'Faça sua busca pelo serviço ou profissional que deseja'
  },
  {
    title: 'Compare e escolha',
    description: 'Analise perfis, avaliações e escolha o profissional ideal para você'
  },
  {
    title: 'Agendamento',
    description: 'Agende seu serviço ou orçamento online. Pague direto ao prestador após o serviço concluído'
  }
]
