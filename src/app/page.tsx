/**
 * Homepage for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Main landing page with hero section, features, and service categories
 */

import Link from "next/link"
import { Star, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import HomepageSearch from "@/components/search/homepage-search"

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
              Encontre o <span className="text-blue-600">profissional</span>
              <br />
              perfeito para você
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Conectamos você aos melhores prestadores de serviços da sua região. 
              Agendamento online, pagamento seguro e profissionais qualificados.
            </p>
            
            {/* Search Bar with Geolocation */}
            <HomepageSearch />

            <div className="flex justify-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>+10.000 profissionais</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Avaliação 4.8/5</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>100% seguro</span>
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
                href={`/categoria/${category.slug}`}
                className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <category.icon className="w-8 h-8 text-blue-600" />
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
            Junte-se a milhares de clientes satisfeitos que já encontraram 
            os melhores serviços através da MyServ.
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
const categories = [
  { id: 1, name: 'Limpeza', slug: 'limpeza', icon: Users },
  { id: 2, name: 'Reformas', slug: 'reformas', icon: Users },
  { id: 3, name: 'Beleza', slug: 'beleza', icon: Users },
  { id: 4, name: 'Tecnologia', slug: 'tecnologia', icon: Users },
  { id: 5, name: 'Educação', slug: 'educacao', icon: Users },
  { id: 6, name: 'Saúde', slug: 'saude', icon: Users },
]

const steps = [
  {
    title: 'Descreva seu projeto',
    description: 'Conte o que você precisa e receba orçamentos de profissionais qualificados'
  },
  {
    title: 'Compare e escolha',
    description: 'Analise perfis, avaliações e escolha o profissional ideal para você'
  },
  {
    title: 'Contrate com segurança',
    description: 'Faça o pagamento de forma segura e acompanhe o andamento do seu projeto'
  }
]
