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
import { formatCurrency } from '@/lib/utils'

interface Favorite {
  id: string
  providerId: string
  name: string
  services: string[]
  category: string
  location: string
  rating: number
  reviewCount: number
  basePrice: number | null
  offersScheduling: boolean
  quoteFee: number | null
  chargesTravel?: boolean
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

  const normalizeFavorite = (item: any): Favorite | null => {
    if (!item) return null

    if ('serviceProvider' in item && item.serviceProvider) {
      const provider = item.serviceProvider
      const providerUser = provider.user ?? {}
      const providerServices = Array.isArray(provider.services) ? provider.services : []
      const servicesNames = providerServices
        .map((svc: any) => svc?.name)
        .filter((name: any): name is string => typeof name === 'string' && name.length > 0)
      const schedulingService = providerServices.find((svc: any) => svc?.offersScheduling)
      const primaryService = schedulingService ?? providerServices[0] ?? null
      const basePrice = schedulingService?.basePrice ?? null
      const offersScheduling = providerServices.some((svc: any) => !!svc?.offersScheduling)
      const quoteFeeSource = schedulingService ?? primaryService ?? null
      const quoteFee = typeof (quoteFeeSource?.quoteFee) === 'number' ? quoteFeeSource.quoteFee : null
      const chargesTravel = typeof (primaryService?.chargesTravel) === 'boolean'
        ? primaryService.chargesTravel
        : providerServices.some((svc: any) => !!svc?.chargesTravel)

      const locationParts = [
        provider.location?.city,
        provider.location?.state
      ].filter((part) => typeof part === 'string' && part.length > 0)

      const providerId = provider.id ?? item.id ?? providerUser.id
      if (!providerId) {
        return null
      }

      const categoryName = typeof primaryService?.category === 'string' && primaryService.category.length > 0
        ? primaryService.category
        : (servicesNames[0] ?? 'Serviços')

      return {
        id: item.id ?? `${providerId}-${primaryService?.id ?? 'favorite'}`,
        providerId,
        name: providerUser.name ?? provider.name ?? 'Profissional',
        services: servicesNames.length > 0 ? servicesNames : primaryService?.name ? [primaryService.name] : [],
        category: categoryName,
        location: locationParts.join(', '),
        rating: typeof provider.rating === 'number' ? provider.rating : 0,
        reviewCount: typeof provider.reviewCount === 'number' ? provider.reviewCount : 0,
        basePrice,
        offersScheduling,
        quoteFee,
        chargesTravel,
        available: provider.availableScheduling ?? true,
        image: providerUser.profileImage ?? undefined,
        createdAt: item.addedAt ? new Date(item.addedAt).toISOString() : new Date().toISOString(),
      }
    }

    const servicesNames = Array.isArray(item.services)
      ? item.services.filter((svc: any): svc is string => typeof svc === 'string')
      : []
    const providerId = item.providerId ?? item.id
    if (!providerId) {
      return null
    }

    const basePriceValue = typeof item.basePrice === 'number' ? item.basePrice : null
    const quoteFeeValue = typeof item.quoteFee === 'number' ? item.quoteFee : null

    return {
      id: item.id ?? `${providerId}-favorite`,
      providerId,
      name: item.name ?? 'Profissional',
      services: servicesNames,
      category: typeof item.category === 'string' && item.category.length > 0 ? item.category : 'Serviços',
      location: item.location ?? '',
      rating: typeof item.rating === 'number' ? item.rating : 0,
      reviewCount: typeof item.reviewCount === 'number' ? item.reviewCount : 0,
      basePrice: basePriceValue,
      offersScheduling: item.offersScheduling ?? (basePriceValue != null),
      quoteFee: quoteFeeValue,
      chargesTravel: item.chargesTravel ?? false,
      available: item.available ?? true,
      image: item.image ?? undefined,
      createdAt: item.createdAt ?? new Date().toISOString(),
    }
  }

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites')
      if (response.ok) {
        const data = await response.json()
        const rawList = Array.isArray(data)
          ? data
          : Array.isArray(data?.favorites)
            ? data.favorites
            : []
        const normalized = rawList
          .map(normalizeFavorite)
          .filter((fav): fav is Favorite => !!fav && typeof fav.providerId === 'string')
        setFavorites(normalized)
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
                            {favorite.services.length > 0
                              ? favorite.services.join(', ')
                              : 'Serviço sob orçamento'}
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
                        <div className="flex flex-col">
                          <span className="font-semibold text-brand-navy">
                            {favorite.offersScheduling && favorite.basePrice != null
                              ? `A partir de ${formatCurrency(favorite.basePrice)}`
                              : 'Valor definido após orçamento'
                            }
                          </span>
                          <span className="text-xs text-gray-500">
                            {favorite.offersScheduling
                              ? 'Agende direto com o profissional.'
                              : favorite.quoteFee != null
                                ? favorite.quoteFee > 0
                                  ? `Taxa de orçamento: ${formatCurrency(favorite.quoteFee)}`
                                  : 'Orçamento grátis.'
                                : 'Solicite um orçamento para combinar valores.'}
                          </span>
                          {!favorite.offersScheduling && favorite.chargesTravel && (
                            <span className="text-xs text-gray-500">Deslocamento pode ser cobrado.</span>
                          )}
                        </div>
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
