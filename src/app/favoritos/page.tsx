/**
 * Favorites Page - Página de Favoritos
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Heart, Star, MapPin, Phone, MessageCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Favorite {
  id: string
  providerId: string
  name: string
  services: string[]
  category: string
  location: string
  rating: number
  reviewCount: number
  basePrice: number
  available: boolean
  image?: string
  createdAt: string
}

export default function FavoritosPage() {
  const { data: session } = useSession()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  // Fetch favorites on component mount
  useEffect(() => {
    if (session?.user) {
      fetchFavorites()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites')
      if (response.ok) {
        const data = await response.json()
        setFavorites(data.favorites || [])
      } else {
        console.error('Failed to fetch favorites')
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
      toast.error('Erro ao carregar favoritos')
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (providerId: string) => {
    if (removing) return

    setRemoving(providerId)
    try {
      const response = await fetch(`/api/favorites?providerId=${providerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setFavorites(favorites.filter(fav => fav.providerId !== providerId))
        toast.success('Removido dos favoritos')
      } else {
        toast.error('Erro ao remover favorito')
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
      toast.error('Erro ao remover favorito')
    } finally {
      setRemoving(null)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-bg via-white to-brand-teal/5">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-navy mb-2">
              Meus Favoritos
            </h1>
            <p className="text-gray-600">
              Profissionais salvos para contatar rapidamente
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
          </div>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-bg via-white to-brand-teal/5">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-navy mb-2">
              Meus Favoritos
            </h1>
            <p className="text-gray-600">
              Profissionais salvos para contatar rapidamente
            </p>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Faça login para ver seus favoritos
              </h3>
              <p className="text-gray-500 mb-6">
                Entre na sua conta para acessar seus profissionais favoritos
              </p>
              <Button asChild>
                <a href="/entrar">Fazer Login</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-white to-brand-teal/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy mb-2">
            Meus Favoritos
          </h1>
          <p className="text-gray-600">
            Profissionais salvos para contatar rapidamente
          </p>
        </div>

        {/* Favorites List */}
        {favorites.length > 0 ? (
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 bg-brand-cyan/10 rounded-full flex items-center justify-center overflow-hidden">
                      {favorite.image ? (
                        <img 
                          src={favorite.image} 
                          alt={favorite.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-semibold text-brand-cyan">
                          {favorite.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-brand-navy text-lg">
                            {favorite.name}
                          </h3>
                          <p className="text-gray-600">{favorite.category}</p>
                          <p className="text-sm text-gray-500">
                            {favorite.services.join(', ')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFavorite(favorite.providerId)}
                          disabled={removing === favorite.providerId}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          {removing === favorite.providerId ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Heart className="h-5 w-5 fill-current" />
                          )}
                        </Button>
                      </div>

                      {/* Rating and Location */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{favorite.rating}</span>
                          <span className="text-sm text-gray-500">({favorite.reviewCount})</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span>{favorite.location}</span>
                        </div>
                        <Badge variant={favorite.available ? "default" : "secondary"}>
                          {favorite.available ? "Disponível" : "Ocupado"}
                        </Badge>
                      </div>

                      {/* Price and Actions */}
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-brand-navy">
                          {favorite.basePrice > 0 
                            ? `A partir de R$ ${favorite.basePrice.toFixed(2)}`
                            : 'Sob consulta'
                          }
                        </span>
                        <div className="flex gap-2">
                          {/* <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4 mr-2" />
                            Ligar
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
                          </Button> */}
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
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum favorito ainda
              </h3>
              <p className="text-gray-500 mb-6">
                Salve seus profissionais preferidos para acessá-los rapidamente
              </p>
              <Button asChild>
                <a href="/pesquisa">Explorar Serviços</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
