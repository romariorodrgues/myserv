/**
 * Service Cards Demo Page
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Example implementation of service card components
 */

import { 
  ServiceCardHorizontal, 
  ServiceCardGrid, 
  ServiceCardCompact 
} from '@/components/service/service-card'

// Mock data for service cards
const servicesMock = [
  {
    id: 'service-1',
    title: 'Manutenção e reparos elétricos residenciais',
    category: 'Eletricista',
    description: 'Serviços de manutenção elétrica, instalação de tomadas, reparos de curto circuito e problemas elétricos em geral.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45249be59',
    price: {
      value: 120,
      unit: 'hour'
    },
    provider: {
      id: 'provider-1',
      name: 'João Silva',
      image: '/images/providers/joao.jpg',
      rating: { average: 4.8, count: 56 },
      verified: true
    },
    location: {
      city: 'São Paulo',
      state: 'SP',
      neighborhood: 'Vila Mariana'
    },
    distance: 3.2,
    available: true,
    featured: true
  },
  {
    id: 'service-2',
    title: 'Pintura de interiores e exteriores',
    category: 'Pintor',
    description: 'Serviço de pintura para casas, apartamentos e escritórios. Trabalho limpo e com acabamento de qualidade.',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f',
    price: {
      value: 350,
      unit: 'day'
    },
    provider: {
      id: 'provider-2',
      name: 'Carlos Santos',
      image: '/images/providers/carlos.jpg',
      rating: { average: 4.5, count: 32 },
      verified: true
    },
    location: {
      city: 'São Paulo',
      state: 'SP',
      neighborhood: 'Pinheiros'
    },
    distance: 5.8,
    available: true,
    featured: false
  },
  {
    id: 'service-3',
    title: 'Limpeza completa de residências',
    category: 'Limpeza',
    description: 'Limpeza profunda de casas e apartamentos. Serviço completo incluindo pisos, móveis, banheiros e cozinha.',
    image: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf',
    price: {
      value: 280,
      unit: 'job'
    },
    provider: {
      id: 'provider-3',
      name: 'Maria Oliveira',
      image: '/images/providers/maria.jpg',
      rating: { average: 4.9, count: 87 },
      verified: true
    },
    location: {
      city: 'São Paulo',
      state: 'SP',
      neighborhood: 'Moema'
    },
    distance: 1.7,
    available: false,
    featured: false
  },
  {
    id: 'service-4',
    title: 'Encanador - Reparos e instalações',
    category: 'Encanador',
    description: 'Serviços de encanamento, reparos em vazamentos, desentupimentos e instalações hidráulicas em geral.',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4',
    price: {
      value: 130,
      unit: 'hour'
    },
    provider: {
      id: 'provider-4',
      name: 'Antônio Pereira',
      image: '/images/providers/antonio.jpg',
      rating: { average: 4.6, count: 41 },
      verified: true
    },
    location: {
      city: 'São Paulo',
      state: 'SP',
      neighborhood: 'Santana'
    },
    distance: 8.5,
    available: true,
    featured: false
  }
]

export default function ServiceCardsDemo() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-display font-bold text-primary mb-8">
        Serviços em Destaque
      </h1>
      
      <section>
        <h2 className="text-xl font-display font-semibold mb-4">
          Layout Horizontal (resultados de busca)
        </h2>
        <div className="space-y-4">
          {servicesMock.map(service => (
            <ServiceCardHorizontal 
              key={service.id}
              {...service}
            />
          ))}
        </div>
      </section>
      
      <section className="mt-16">
        <h2 className="text-xl font-display font-semibold mb-4">
          Layout Grid (serviços em destaque)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {servicesMock.map(service => (
            <ServiceCardGrid 
              key={service.id}
              {...service}
            />
          ))}
        </div>
      </section>
      
      <section className="mt-16">
        <h2 className="text-xl font-display font-semibold mb-4">
          Layout Compacto (recomendações, histórico)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {servicesMock.map(service => (
            <ServiceCardCompact 
              key={service.id}
              {...service}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
