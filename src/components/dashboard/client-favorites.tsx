/**
 * Client Favorites Component - Favoritos salvos do cliente
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect } from 'react'
import { Heart, Star, MapPin, Clock, Search, Filter, ChevronDown, User, Phone, MessageCircle, Calendar } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'

interface FavoriteProvider {
  id: string
  addedAt: string
  serviceProvider: {
    id: string
    description?: string
    priceRange?: string
    isVerified: boolean
    isHighlighted: boolean
    availableScheduling: boolean
    user: {
      name: string
      profileImage: string | null
      phone?: string
    }
    rating?: number
    reviewCount?: number
    location: {
      city: string
      state: string
      district?: string
    }
    services: Array<{
      id: string
      name: string
      category: string
      basePrice?: number
    }>
    availability?: {
      nextAvailable?: string
      responseTime?: string
    }
  }
}

interface ClientFavoritesProps {
  clientId?: string
}

export function ClientFavorites({ clientId }: ClientFavoritesProps) {
  const [favorites, setFavorites] = useState<FavoriteProvider[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [locationFilter, setLocationFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'name'>('date')

  useEffect(() => {
    fetchFavorites()
  }, [clientId])

  useEffect(() => {
    filterAndSortFavorites()
  }, [favorites, searchTerm, categoryFilter, locationFilter, sortBy])


  const fetchFavorites = async () => {
  try {
    setLoading(true)

    const res = await fetch('/api/favorites')
    if (!res.ok) throw new Error('Erro ao buscar favoritos')

    const data = await res.json()
    setFavorites(data)
    
  } catch (error) {
    console.error('Error fetching favorites:', error)
  } finally {
    setLoading(false)
  }
}
  // const fetchFavorites = async () => {
  //   try {
  //     setLoading(true)
      
  //     // Mock data for development - replace with actual API call
  //     const mockData: FavoriteProvider[] = [
  //       {
  //         id: '1',
  //         addedAt: '2025-06-10T15:30:00Z',
  //         serviceProvider: {
  //           id: 'provider-1',
  //           description: 'Especialista em limpeza residencial e comercial com 10 anos de experiência. Atendimento de qualidade garantido.',
  //           priceRange: 'R$ 80 - R$ 200',
  //           isVerified: true,
  //           isHighlighted: true,
  //           availableScheduling: true,
  //           user: {
  //             name: 'Maria Silva',
  //             profileImage: null,
  //             phone: '(11) 99999-1234'
  //           },
  //           rating: 4.9,
  //           reviewCount: 127,
  //           location: {
  //             city: 'São Paulo',
  //             state: 'SP',
  //             district: 'Vila Madalena'
  //           },
  //           services: [
  //             { id: '1', name: 'Limpeza Residencial', category: 'Limpeza', basePrice: 120 },
  //             { id: '2', name: 'Limpeza Pós-Obra', category: 'Limpeza', basePrice: 180 }
  //           ],
  //           availability: {
  //             nextAvailable: '2025-06-15T09:00:00Z',
  //             responseTime: '2 horas'
  //           }
  //         }
  //       },
  //       {
  //         id: '2',
  //         addedAt: '2025-06-08T10:15:00Z',
  //         serviceProvider: {
  //           id: 'provider-2',
  //           description: 'Técnico especializado em instalação e manutenção de ar condicionado. Certificado pelos principais fabricantes.',
  //           priceRange: 'R$ 150 - R$ 500',
  //           isVerified: true,
  //           isHighlighted: false,
  //           availableScheduling: true,
  //           user: {
  //             name: 'João Santos',
  //             profileImage: null,
  //             phone: '(11) 98888-5678'
  //           },
  //           rating: 4.8,
  //           reviewCount: 89,
  //           location: {
  //             city: 'São Paulo',
  //             state: 'SP',
  //             district: 'Moema'
  //           },
  //           services: [
  //             { id: '3', name: 'Instalação de Ar Condicionado', category: 'Técnico', basePrice: 300 },
  //             { id: '4', name: 'Manutenção de Ar Condicionado', category: 'Técnico', basePrice: 150 }
  //           ],
  //           availability: {
  //             nextAvailable: '2025-06-14T14:00:00Z',
  //             responseTime: '1 hora'
  //           }
  //         }
  //       },
  //       {
  //         id: '3',
  //         addedAt: '2025-06-05T16:45:00Z',
  //         serviceProvider: {
  //           id: 'provider-3',
  //           description: 'Eletricista residencial e predial com mais de 15 anos de experiência. Trabalhos garantidos.',
  //           priceRange: 'R$ 100 - R$ 400',
  //           isVerified: false,
  //           isHighlighted: false,
  //           availableScheduling: false,
  //           user: {
  //             name: 'Carlos Pereira',
  //             profileImage: null,
  //             phone: '(11) 97777-9012'
  //           },
  //           rating: 4.5,
  //           reviewCount: 234,
  //           location: {
  //             city: 'São Paulo',
  //             state: 'SP',
  //             district: 'Ipiranga'
  //           },
  //           services: [
  //             { id: '5', name: 'Instalação Elétrica', category: 'Elétrica', basePrice: 200 },
  //             { id: '6', name: 'Reparo Elétrico', category: 'Elétrica', basePrice: 120 }
  //           ],
  //           availability: {
  //             responseTime: '4 horas'
  //           }
  //         }
  //       }
  //     ]

  //     // Simulate API delay
  //     await new Promise(resolve => setTimeout(resolve, 800))
  //     setFavorites(mockData)
      
  //   } catch (error) {
  //     console.error('Error fetching favorites:', error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const filterAndSortFavorites = () => {
    let filtered = [...favorites]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(favorite =>
        favorite.serviceProvider.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        favorite.serviceProvider.services.some(service => 
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.category.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        favorite.serviceProvider.location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        favorite.serviceProvider.location.district?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(favorite =>
        favorite.serviceProvider.services.some(service => service.category === categoryFilter)
      )
    }

    // Filter by location
    if (locationFilter !== 'ALL') {
      filtered = filtered.filter(favorite =>
        favorite.serviceProvider.location.city === locationFilter
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        case 'rating':
          return (b.serviceProvider.rating || 0) - (a.serviceProvider.rating || 0)
        case 'name':
          return a.serviceProvider.user.name.localeCompare(b.serviceProvider.user.name)
        default:
          return 0
      }
    })

    setFilteredFavorites(filtered)
  }

  const removeFavorite = async (favoriteId: string) => {
  try {
    const res = await fetch(`/api/favorites?providerId=${favoriteId}`, {
      method: 'DELETE'
    })

    if (!res.ok) throw new Error('Erro ao remover favorito')
    
    setFavorites(prev => prev.filter(fav => fav.serviceProvider.id !== favoriteId))
  } catch (error) {
    console.error('Error removing favorite:', error)
  }
}

  // const removeFavorite = async (favoriteId: string) => {
  //   try {
  //     // Mock implementation - replace with actual API call
  //     setFavorites(prev => prev.filter(fav => fav.id !== favoriteId))
  //   } catch (error) {
  //     console.error('Error removing favorite:', error)
  //   }
  // }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getUniqueCategories = () => {
    const categories = new Set<string>()
    favorites.forEach(fav => 
      fav.serviceProvider.services.forEach(service => 
        categories.add(service.category)
      )
    )
    return Array.from(categories)
  }

  const getUniqueCities = () => {
    const cities = new Set<string>()
    favorites.forEach(fav => cities.add(fav.serviceProvider.location.city))
    return Array.from(cities)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Favoritos Salvos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse border rounded-lg p-4">
                <div className="flex space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span>Favoritos Salvos</span>
            <Badge variant="secondary">{favorites.length}</Badge>
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar profissionais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">Todas as categorias</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Mais Filtros
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredFavorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {favorites.length === 0 
                ? 'Você ainda não adicionou nenhum profissional aos favoritos'
                : 'Nenhum profissional encontrado com os filtros aplicados'
              }
            </p>
            <Button className="mt-4" asChild>
              <Link href="/servicos">
                Buscar Profissionais
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            {filteredFavorites.map((favorite) => (
              <div key={favorite.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:space-x-6">
                  {/* Profile Section */}
                  <div className="flex items-start space-x-4 mb-4 lg:mb-0">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {favorite.serviceProvider.user.profileImage ? (
                          <Image
                            src={favorite.serviceProvider.user.profileImage}
                            alt={favorite.serviceProvider.user.name}
                            width={64}
                            height={64}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="w-8 h-8 text-gray-500" />
                        )}
                      </div>
                      {favorite.serviceProvider.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {favorite.serviceProvider.user.name}
                        </h3>
                        {favorite.serviceProvider.isHighlighted && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Destaque
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{favorite.serviceProvider.rating || 'N/A'}</span>
                          <span>({favorite.serviceProvider.reviewCount || 0})</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{favorite.serviceProvider.location.district}, {favorite.serviceProvider.location.city}</span>
                        </div>
                      </div>
                      
                      {favorite.serviceProvider.priceRange && (
                        <div className="text-sm font-medium text-green-600 mb-2">
                          {favorite.serviceProvider.priceRange}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Details Section */}
                  <div className="flex-1 space-y-3">
                    {favorite.serviceProvider.description && (
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {favorite.serviceProvider.description}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {favorite.serviceProvider.services.slice(0, 3).map((service) => (
                          <Badge key={service.id} variant="outline" className="text-xs">
                            {service.name}
                          </Badge>
                        ))}
                        {favorite.serviceProvider.services.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{favorite.serviceProvider.services.length - 3} mais
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {favorite.serviceProvider.availability?.nextAvailable && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Próxima disponibilidade: {formatDate(favorite.serviceProvider.availability.nextAvailable)}</span>
                          </div>
                        )}
                        
                        {favorite.serviceProvider.availability?.responseTime && (
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>Responde em: {favorite.serviceProvider.availability.responseTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions Section */}
                  <div className="flex flex-col space-y-2 lg:w-40">
                    <Button asChild>
                      <Link href={`/prestador/${favorite.serviceProvider.id}/avaliacoes`}>
                        Ver Perfil
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild>
                      <Link href={`/servicos`}>
                        <Calendar className="w-4 h-4 mr-1" />
                        Agendar
                      </Link>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFavorite(favorite.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Heart className="w-4 h-4 mr-1 fill-current" />
                      Remover
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                  Adicionado aos favoritos em {formatDate(favorite.addedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
