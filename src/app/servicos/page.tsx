/**
 * Service Search page
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, MapPin, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AddressSearch from '@/components/maps/address-search'
import ServiceSuggestInput from '@/components/services/service-suggest-input'

interface Service {
  id: string
  name: string
  description: string
  category: {
    name: string
    icon: string
  }
  providers: Array<{
    id: string
    userId: string
    name: string
    profileImage: string | null
    basePrice: number
    description: string
  }>
}

function ServicesPageContent() {
  const searchParams = useSearchParams()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [location, setLocation] = useState(searchParams.get('local') || searchParams.get('location') || '')
  const [leafCategoryId, setLeafCategoryId] = useState<string | undefined>(undefined)

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (leafCategoryId) params.set('leafCategoryId', leafCategoryId)
      else if (searchTerm) params.set('q', searchTerm)
      if (location) params.set('local', location)
      
      const response = await fetch(`/api/services/search?${params}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setServices(data.data.services || [])
      } else {
        setServices([])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, location, leafCategoryId])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchServices()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Encontre o profissional ideal para você
          </h1>
          
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <ServiceSuggestInput
                placeholder="Que serviço você precisa?"
                defaultValue={searchTerm}
                onSelect={(item) => {
                  if (item.type === 'leaf' && item.id) {
                    setLeafCategoryId(item.id)
                    setSearchTerm(item.name)
                  } else {
                    setLeafCategoryId(undefined)
                    setSearchTerm(item.name)
                  }
                }}
              />
            </div>
            
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Onde você está?"
                className="pl-10"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <Button type="submit" className="w-full">
              Buscar Profissionais
            </Button>
          </form>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {loading ? 'Carregando...' : `${services.length} serviços encontrados`}
          </p>
          
          <Button variant="outline" size="sm">
            Filtros
          </Button>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : services.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum serviço encontrado
              </h3>
              <p className="text-gray-500">
                Tente ajustar sua busca ou explorar outras categorias
              </p>
            </div>
          ) : (
            services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{service.category.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-500">{service.category.name}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  {service.providers && service.providers.length > 0 ? (
                    <div className="space-y-3">
                      {service.providers.slice(0, 2).map((provider) => (
                        <div key={provider.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {provider.name.charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium text-sm">
                                {provider.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">4.8</span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-500 mb-2">
                            {provider.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-green-600">
                              R$ {provider.basePrice?.toFixed(2)}
                            </span>
                            <Button size="sm" asChild>
                              <Link href={`/servico/${service.id}/solicitar?providerId=${provider.id}`}>
                                Contratar
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {service.providers.length > 2 && (
                        <Button variant="outline" size="sm" className="w-full">
                          Ver mais {service.providers.length - 2} profissionais
                        </Button>
                      )}
                      
                      <div className="pt-2 border-t">
                        <Button className="w-full" asChild>
                          <Link href={`/servico/${service.id}/solicitar`}>
                            Solicitar Este Serviço
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm mb-4">
                        Nenhum profissional disponível no momento
                      </p>
                      <Button className="w-full" asChild>
                        <Link href={`/servico/${service.id}/solicitar`}>
                          Solicitar Este Serviço
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Popular Categories */}
        {!loading && services.length === 0 && !searchTerm && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Categorias Populares
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { name: 'Limpeza', icon: '🧹' },
                { name: 'Beleza', icon: '💅' },
                { name: 'Manutenção', icon: '🔧' },
                { name: 'Jardinagem', icon: '🌱' },
                { name: 'Pet Care', icon: '🐕' },
                { name: 'Culinária', icon: '👨‍🍳' },
              ].map((category) => (
                <Button
                  key={category.name}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-1"
                  onClick={() => {
                    setSearchTerm(category.name)
                    fetchServices()
                  }}
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-sm">{category.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ServicesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <ServicesPageContent />
    </Suspense>
  )
}
