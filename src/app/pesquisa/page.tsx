/**
 * Search Page - Página de Pesquisa
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Filter, Star, Heart, Phone, MessageCircle, Loader2, Crosshair } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useGeolocation } from '@/hooks/use-geolocation'

interface ServiceProvider {
  id: string
  name: string
  profileImage?: string
  location: string
  services: string[]
  category: string
  rating: number
  reviewCount: number
  basePrice: number
  distance?: number
  available: boolean
}

interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  serviceCount: number
  isActive: boolean
}

export default function PesquisaPage() {
  const { data: session } = useSession()
  const { getCurrentLocation, address, loading: locationLoading } = useGeolocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null)

  // Load categories on component mount
  useEffect(() => {
    fetchCategories()
  }, [])

  // Auto-search when category changes
  useEffect(() => {
    if (selectedCategory) {
      handleSearch()
    }
  }, [selectedCategory])

  // Update location when geolocation address changes
  useEffect(() => {
    if (address?.formatted) {
      setLocation(address.formatted)
    }
  }, [address])

  const handleLocationClick = async () => {
    await getCurrentLocation()
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?active=true')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Search function
  const handleSearch = async () => {
    if (!searchTerm.trim() && !selectedCategory) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(searchTerm.trim() && { q: searchTerm.trim() }),
        ...(location.trim() && { local: location.trim() }),
        ...(selectedCategory && { categoryId: selectedCategory })
      })

      const response = await fetch(`/api/services/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProviders(data.results || [])
      } else {
        toast.error('Erro ao buscar serviços')
      }
    } catch (error) {
      console.error('Error searching services:', error)
      toast.error('Erro ao buscar serviços')
    } finally {
      setLoading(false)
    }
  }

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Toggle favorite
  const toggleFavorite = async (providerId: string) => {
    if (!session?.user) {
      toast.error('Faça login para favoritar')
      return
    }

    if (favoriteLoading) return

    setFavoriteLoading(providerId)
    const isFavorited = favorites.has(providerId)

    try {
      const response = await fetch('/api/favorites', {
        method: isFavorited ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        ...(isFavorited 
          ? {} 
          : { body: JSON.stringify({ providerId }) }
        ),
        ...(isFavorited && {
          method: 'DELETE',
          headers: {},
          body: undefined
        })
      })

      // For DELETE, use query parameter
      const deleteResponse = isFavorited 
        ? await fetch(`/api/favorites?providerId=${providerId}`, { method: 'DELETE' })
        : response

      if ((isFavorited ? deleteResponse : response).ok) {
        const newFavorites = new Set(favorites)
        if (isFavorited) {
          newFavorites.delete(providerId)
          toast.success('Removido dos favoritos')
        } else {
          newFavorites.add(providerId)
          toast.success('Adicionado aos favoritos')
        }
        setFavorites(newFavorites)
      } else {
        toast.error('Erro ao atualizar favoritos')
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Erro ao atualizar favoritos')
    } finally {
      setFavoriteLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-white to-brand-teal/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy mb-2">
            Pesquisar Serviços
          </h1>
          <p className="text-gray-600">
            Encontre os melhores profissionais da sua região
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="O que você está procurando?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Sua localização"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-cyan focus:border-transparent"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLocationClick}
                  disabled={locationLoading}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  {locationLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Crosshair className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button 
                onClick={handleSearch}
                disabled={loading || !searchTerm.trim()}
                className="px-6"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Category Filters */}
        {categories.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm font-medium text-gray-700">Categorias:</span>
                <Button
                  variant={selectedCategory === '' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory('')}
                >
                  Todas
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="h-auto py-2 px-3"
                  >
                    {category.icon && (
                      <span className="mr-2">{category.icon}</span>
                    )}
                    {category.name}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {category.serviceCount}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
          </div>
        ) : providers.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600">
                {providers.length} resultado{providers.length !== 1 ? 's' : ''} encontrado{providers.length !== 1 ? 's' : ''}
              </p>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>

            {providers.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 bg-brand-cyan/10 rounded-full flex items-center justify-center overflow-hidden">
                      {provider.profileImage ? (
                        <img 
                          src={provider.profileImage} 
                          alt={provider.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-semibold text-brand-cyan">
                          {provider.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-brand-navy text-lg">
                            {provider.name}
                          </h3>
                          <p className="text-gray-600">{provider.category}</p>
                          <p className="text-sm text-gray-500">
                            {provider.services.join(', ')}
                          </p>
                        </div>
                        {session?.user && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(provider.id)}
                            disabled={favoriteLoading === provider.id}
                            className={`${
                              favorites.has(provider.id)
                                ? 'text-red-500 hover:text-red-700'
                                : 'text-gray-400 hover:text-red-500'
                            } hover:bg-red-50`}
                          >
                            {favoriteLoading === provider.id ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Heart className={`h-5 w-5 ${favorites.has(provider.id) ? 'fill-current' : ''}`} />
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Rating and Location */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{provider.rating}</span>
                          <span className="text-sm text-gray-500">({provider.reviewCount})</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span>{provider.location}</span>
                          {provider.distance && (
                            <span className="ml-1">({provider.distance.toFixed(1)} km)</span>
                          )}
                        </div>
                        <Badge variant={provider.available ? "default" : "secondary"}>
                          {provider.available ? "Disponível" : "Ocupado"}
                        </Badge>
                      </div>

                      {/* Price and Actions */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-brand-navy">
                          {provider.basePrice > 0 
                            ? `A partir de R$ ${provider.basePrice.toFixed(2)}`
                            : 'Sob consulta'
                          }
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4 mr-2" />
                            Ligar
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
                          </Button>
                          <Button size="sm">
                            Solicitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchTerm ? (
          /* No Results */
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                Tente buscar com outros termos ou ajustar sua localização
              </p>
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Limpar Busca
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Initial State */
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Digite o que você está procurando
              </h3>
              <p className="text-gray-500">
                Use a barra de pesquisa acima para encontrar profissionais
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
