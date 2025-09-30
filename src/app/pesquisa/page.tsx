/**
 * Search Page - Página de Pesquisa
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Search,
  MapPin,
  Star,
  Heart,
  Loader2,
  Compass,
  Crosshair,
  X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useGeolocation } from '@/hooks/use-geolocation'
import { AdvancedSearchFilters, DEFAULT_RADIUS_KM, type SearchFilters } from '@/components/search/advanced-filters'
import type { CascCat } from '@/components/categories/cascading-category-picker'
import { formatCurrency } from '@/lib/utils'
import type { TravelCalculationResult } from '@/lib/travel-calculator'
import ServiceSuggestInput from '@/components/services/service-suggest-input'
import { cdnImageUrl } from '@/lib/cdn'

interface SearchResultProvider {
  id: string
  name: string
  profileImage?: string | null
  primaryServiceId?: string
  location: string
  city: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  services: string[]
  category: string
  rating: number
  reviewCount: number
  basePrice: number | null
  distance?: number
  available: boolean
  offersScheduling: boolean
  providesHomeService?: boolean
  providesLocalService?: boolean
  travel?: {
    chargesTravel: boolean
    travelRatePerKm?: number | null
    travelMinimumFee?: number | null
    travelFixedFee?: number | null
    waivesTravelOnHire?: boolean | null
  }
}

const DEFAULT_FILTERS: SearchFilters = {
  sortBy: 'RELEVANCE',
  radius: DEFAULT_RADIUS_KM,
}

function PesquisaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const {
    address,
    loading: geoLoading,
    error: geoError,
    getCurrentLocation,
    forwardGeocode,
  } = useGeolocation()

  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({ ...DEFAULT_FILTERS })
  const [providers, setProviders] = useState<SearchResultProvider[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null)
  const [locationInput, setLocationInput] = useState('')
  const [appliedLocationLabel, setAppliedLocationLabel] = useState('')
  const [isApplyingLocation, setIsApplyingLocation] = useState(false)
  const [travelQuotes, setTravelQuotes] = useState<Record<string, TravelCalculationResult>>({})
  const [travelErrors, setTravelErrors] = useState<Record<string, string>>({})
  const [travelLoading, setTravelLoading] = useState(false)
  const skipAddressEffectRef = useRef(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  const locationDefined = useMemo(() => {
    const hasCoords = filters.latitude != null && filters.longitude != null
    return hasCoords || Boolean(filters.city || filters.state)
  }, [filters.latitude, filters.longitude, filters.city, filters.state])

  useEffect(() => {
    if (!address) return
    if (address.lat == null || address.lng == null) return
    if (skipAddressEffectRef.current) {
      skipAddressEffectRef.current = false
      return
    }
    const label = address.formatted || [address.city, address.state].filter(Boolean).join(', ')
    applyLocation({
      label,
      latitude: address.lat,
      longitude: address.lng,
      city: address.city ?? undefined,
      state: address.state ?? undefined,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  const applyFilters = (patch: Partial<SearchFilters>) => {
    const next: SearchFilters = {
      ...DEFAULT_FILTERS,
      ...filters,
      ...patch,
    }
    if (next.radius == null) next.radius = DEFAULT_RADIUS_KM
    setFilters(next)
    return next
  }

  const executeSearch = async (
    overrideFilters?: SearchFilters,
    overrideTerm?: string
  ) => {
    const activeFilters = overrideFilters ?? filters
    const term = (overrideTerm ?? searchTerm).trim()

    if (!term && !activeFilters.leafCategoryId && !activeFilters.city && !activeFilters.latitude) {
      toast.info('Informe um serviço ou defina sua localização para iniciar a busca.')
      return
    }

    const controller = new AbortController()
    searchAbortRef.current?.abort()
    searchAbortRef.current = controller

    setHasSearched(true)
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (term) params.set('q', term)
      if (activeFilters.leafCategoryId) params.set('leafCategoryId', activeFilters.leafCategoryId)
      if (activeFilters.city) params.set('city', activeFilters.city)
      if (activeFilters.state) params.set('state', activeFilters.state)
      if (activeFilters.latitude != null) params.set('lat', String(activeFilters.latitude))
      if (activeFilters.longitude != null) params.set('lng', String(activeFilters.longitude))
      if (activeFilters.radius != null) params.set('radiusKm', String(activeFilters.radius))
      if (activeFilters.minPrice != null) params.set('minPrice', String(activeFilters.minPrice))
      if (activeFilters.maxPrice != null) params.set('maxPrice', String(activeFilters.maxPrice))
      if (activeFilters.rating != null) params.set('rating', String(activeFilters.rating))
      if (activeFilters.availability) params.set('availability', activeFilters.availability)
      if (activeFilters.hasScheduling) params.set('hasScheduling', 'true')
      if (activeFilters.hasQuoting) params.set('hasQuoting', 'true')
      if (activeFilters.isHighlighted) params.set('isHighlighted', 'true')
      if (activeFilters.homeService) params.set('homeService', 'true')
      if (activeFilters.freeTravel) params.set('freeTravel', 'true')
      if (activeFilters.localService) params.set('localService', 'true')
      if (activeFilters.sortBy && activeFilters.sortBy !== 'RELEVANCE') {
        params.set('sortBy', activeFilters.sortBy)
      }

      const endpoint = params.toString()
        ? `/api/services/search?${params.toString()}`
        : '/api/services/search'

      const response = await fetch(endpoint, { signal: controller.signal })
      if (!response.ok) {
        toast.error('Erro ao buscar serviços')
        return
      }

      const data = await response.json()
      const results: SearchResultProvider[] = Array.isArray(data.results) ? data.results : []
      setProviders(results)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      console.error('Error searching services:', error)
      toast.error('Erro ao buscar serviços')
    } finally {
      if (searchAbortRef.current === controller) {
        searchAbortRef.current = null
      }
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    clearScheduledSearch()
    await executeSearch()
  }

  const handleSortChange = async (value: SearchFilters['sortBy']) => {
    const next = applyFilters({ sortBy: value })
    await executeSearch(next)
  }

  const clearScheduledSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      clearScheduledSearch()
      searchAbortRef.current?.abort()
    }
  }, [clearScheduledSearch])

  const handleFiltersUpdate = (patch: Partial<SearchFilters>) => {
    const next = applyFilters(patch)
    clearScheduledSearch()
    searchTimeoutRef.current = setTimeout(() => {
      searchTimeoutRef.current = null
      void executeSearch(next)
    }, 350)
  }

  const handleResetFilters = async () => {
    const preservedLocation: Partial<SearchFilters> = {
      city: filters.city,
      state: filters.state,
      latitude: filters.latitude,
      longitude: filters.longitude,
    }
    const next: SearchFilters = {
      ...DEFAULT_FILTERS,
      ...preservedLocation,
      sortBy: filters.sortBy,
    }
    setFilters(next)
    clearScheduledSearch()
    await executeSearch(next)
  }

  const handleSelectCategory = (leafId: string | null, path: CascCat[]) => {
    if (leafId && path.length) {
      const label = path.map((item) => item.name).join(' › ')
      setSearchTerm(label)
    }
  }

  const applyLocation = async (data: {
    label: string
    latitude: number
    longitude: number
    city?: string
    state?: string
  }) => {
    setLocationInput(data.label)
    setAppliedLocationLabel(data.label)
    const next = applyFilters({
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
      state: data.state,
    })
    clearScheduledSearch()
    await executeSearch(next)
  }

  const handleApplyLocation = async () => {
    const query = locationInput.trim()
    if (!query) {
      setAppliedLocationLabel('')
      const next = applyFilters({
        city: undefined,
        state: undefined,
        latitude: undefined,
        longitude: undefined,
      })
      clearScheduledSearch()
      await executeSearch(next)
      return
    }

    setIsApplyingLocation(true)
    try {
      skipAddressEffectRef.current = true
      const result = await forwardGeocode(query)
      if (result && result.lat != null && result.lng != null) {
        await applyLocation({
          label: result.formatted || query,
          latitude: result.lat,
          longitude: result.lng,
          city: result.city ?? undefined,
          state: result.state ?? undefined,
        })
      } else {
        toast.error('Não foi possível localizar esse endereço')
      }
    } finally {
      skipAddressEffectRef.current = false
      setIsApplyingLocation(false)
    }
  }

  const handleUseCurrentLocation = async () => {
    setIsApplyingLocation(true)
    try {
      await getCurrentLocation()
    } finally {
      setIsApplyingLocation(false)
    }
  }

  const handleClearLocation = async () => {
    setLocationInput('')
    setAppliedLocationLabel('')
    const next = applyFilters({
      city: undefined,
      state: undefined,
      latitude: undefined,
      longitude: undefined,
    })
    clearScheduledSearch()
    await executeSearch(next)
  }

  useEffect(() => {
    const paramsKey = searchParams.toString()
    if (!paramsKey) return

    const q = searchParams.get('q') || ''
    const leafCategoryId = searchParams.get('leafCategoryId') || undefined
    const city = searchParams.get('city') || undefined
    const state = searchParams.get('state') || undefined
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const rating = searchParams.get('rating')
    const availability = searchParams.get('availability') as SearchFilters['availability'] | null
    const hasScheduling = searchParams.get('hasScheduling') === 'true' ? true : undefined
    const hasQuoting = searchParams.get('hasQuoting') === 'true' ? true : undefined
    const isHighlighted = searchParams.get('isHighlighted') === 'true' ? true : undefined
    const homeService = searchParams.get('homeService') === 'true' ? true : undefined
    const freeTravel = searchParams.get('freeTravel') === 'true' ? true : undefined
    const sortBy = (searchParams.get('sortBy') as SearchFilters['sortBy']) || 'RELEVANCE'
    const radiusParam = searchParams.get('radiusKm') || searchParams.get('radius')
    const latParam = searchParams.get('lat')
    const lngParam = searchParams.get('lng')

    const initialFilters: SearchFilters = {
      ...DEFAULT_FILTERS,
      leafCategoryId,
      city,
      state,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      rating: rating ? Number(rating) : undefined,
      availability: availability || undefined,
      hasScheduling,
      hasQuoting,
      isHighlighted,
      homeService,
      freeTravel,
      sortBy,
      radius: radiusParam ? Number(radiusParam) : DEFAULT_RADIUS_KM,
      latitude: latParam ? Number(latParam) : undefined,
      longitude: lngParam ? Number(lngParam) : undefined,
    }

    setFilters(initialFilters)
    if (q) setSearchTerm(q)

    const labelFromParams = searchParams.get('local') || [city, state].filter(Boolean).join(', ')
    if (labelFromParams) {
      setLocationInput(labelFromParams)
      setAppliedLocationLabel(labelFromParams)
    } else if (initialFilters.latitude != null && initialFilters.longitude != null) {
      const fallbackLabel = `${initialFilters.latitude.toFixed(4)}, ${initialFilters.longitude.toFixed(4)}`
      setLocationInput(fallbackLabel)
      setAppliedLocationLabel(fallbackLabel)
    }

    void executeSearch(initialFilters, q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()])

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
        headers: isFavorited ? {} : { 'Content-Type': 'application/json' },
        ...(isFavorited ? {} : { body: JSON.stringify({ providerId }) }),
      })

      const deleteResponse = isFavorited
        ? await fetch(`/api/favorites?providerId=${providerId}`, { method: 'DELETE' })
        : response

      if ((isFavorited ? deleteResponse : response).ok) {
        const next = new Set(favorites)
        if (isFavorited) {
          next.delete(providerId)
          toast.success('Removido dos favoritos')
        } else {
          next.add(providerId)
          toast.success('Adicionado aos favoritos')
        }
        setFavorites(next)
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

  const handleSolicitar = (provider: SearchResultProvider) => {
    const targetHref = provider.primaryServiceId
      ? `/servico/${provider.primaryServiceId}/solicitar?providerId=${provider.id}`
      : null

    if (!session?.user) {
      const next = targetHref ?? '/pesquisa'
      router.push(`/entrar?next=${encodeURIComponent(next)}`)
      return
    }

    if (targetHref) {
      router.push(targetHref)
    } else {
      toast.info('Serviço indisponível para solicitação no momento.')
    }
  }

  const fetchTravelForProvider = useCallback(
    async (provider: SearchResultProvider) => {
      if (!filters.latitude || !filters.longitude) return null
      try {
        const response = await fetch('/api/services/travel-cost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId: provider.id,
            serviceId: provider.primaryServiceId,
            clientLat: filters.latitude,
            clientLng: filters.longitude,
            clientAddress: appliedLocationLabel || locationInput,
          }),
        })
        if (!response.ok) throw new Error('Falha ao calcular deslocamento')
        const data = await response.json()
        if (!data.success || !data.data?.travel) {
          throw new Error(data.error || 'Não foi possível calcular o deslocamento')
        }
        return data.data.travel as TravelCalculationResult
      } catch (error) {
        throw error instanceof Error ? error : new Error('Erro ao calcular deslocamento')
      }
    },
    [appliedLocationLabel, filters.latitude, filters.longitude, locationInput]
  )

  useEffect(() => {
    if (!providers.length || !filters.latitude || !filters.longitude) {
      setTravelQuotes({})
      setTravelErrors({})
      setTravelLoading(false)
      return
    }

    const hasChargedTravel = providers.some((provider) => provider.travel?.chargesTravel)
    if (!hasChargedTravel) {
      setTravelQuotes({})
      setTravelErrors({})
      setTravelLoading(false)
      return
    }
  }, [providers, filters.latitude, filters.longitude])

  const handleCalculateTravel = async (provider: SearchResultProvider) => {
    try {
      setTravelLoading(true)
      const travel = await fetchTravelForProvider(provider)
      if (travel) {
        setTravelQuotes((prev) => ({ ...prev, [provider.id]: travel }))
        setTravelErrors((prev) => {
          const next = { ...prev }
          delete next[provider.id]
          return next
        })
        if (travel.distanceKm != null) {
          setProviders((prev) =>
            prev.map((item) =>
              item.id === provider.id
                ? { ...item, distance: travel.distanceKm }
                : item
            )
          )
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao calcular deslocamento'
      setTravelErrors((prev) => ({ ...prev, [provider.id]: message }))
      toast.error(message)
    } finally {
      setTravelLoading(false)
    }
  }

  const renderTravelInfo = (provider: SearchResultProvider) => {
    const travelSettings = provider.travel
    if (!travelSettings || !travelSettings.chargesTravel || travelSettings.waivesTravelOnHire) {
      return (
        <p className="text-sm text-emerald-700">Deslocamento grátis informado pelo profissional.</p>
      )
    }

    const quote = travelQuotes[provider.id]
    if (quote) {
      const total = provider.basePrice + quote.travelCost
      return (
        <div className="space-y-1 text-sm">
          {quote.distanceText ? (
            <p className="text-gray-600">Distância estimada: {quote.distanceText}</p>
          ) : quote.distanceKm != null ? (
            <p className="text-gray-600">Distância estimada: {quote.distanceKm.toFixed(1)} km</p>
          ) : null}
          <p className="text-gray-600">
            Deslocamento: <span className="font-medium text-brand-navy">{formatCurrency(quote.travelCost)}</span>
          </p>
          {quote.travelCostBreakdown?.perKmPortion ? (
            <p className="text-xs text-gray-500">
              {formatCurrency(quote.travelCostBreakdown.perKmPortion)} por km +{' '}
              {formatCurrency(quote.travelCostBreakdown.fixedFee)} de taxa fixa
            </p>
          ) : null}
          <p className="text-gray-700 font-semibold">
            Estimativa total: {formatCurrency(total)}
          </p>
          {quote.usedFallback && (
            <p className="text-xs text-amber-600">
              Distância calculada por aproximação. Confirme com o profissional.
            </p>
          )}
        </div>
      )
    }

    const error = travelErrors[provider.id]
    if (error) {
      return (
        <div className="space-y-2 text-sm text-red-600">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCalculateTravel(provider)}
            className="text-brand-cyan border-brand-cyan hover:bg-brand-cyan/10"
          >
            Tentar novamente
          </Button>
        </div>
      )
    }

    if (!filters.latitude || !filters.longitude) {
      return (
        <p className="text-sm text-gray-500">
          Informe sua localização para estimar o custo de deslocamento.
        </p>
      )
    }

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleCalculateTravel(provider)}
        className="text-brand-cyan border-brand-cyan hover:bg-brand-cyan/10"
      >
        Calcular deslocamento
      </Button>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-white to-brand-teal/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy mb-2">Pesquisar Serviços</h1>
          <p className="text-gray-600">Encontre os melhores profissionais da sua região</p>
        </div>

        <Card className="mb-6">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1">
                <ServiceSuggestInput
                  placeholder="O que você procura?"
                  defaultValue={searchTerm}
                  onTextChange={(value) => setSearchTerm(value)}
                  onSelect={async (item) => {
                    const next = applyFilters({ leafCategoryId: item.type === 'leaf' ? item.id : undefined })
                    setSearchTerm(item.name)
                    await executeSearch(next, item.name)
                  }}
                  inputClassName="w-full"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <MapPin className="h-5 w-5 text-brand-cyan" />
                <Input
                  placeholder="Cidade, bairro ou endereço"
                  value={locationInput}
                  onChange={(event) => setLocationInput(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleApplyLocation()}
                />
                {locationDefined && (
                  <Button variant="ghost" size="sm" onClick={handleClearLocation} title="Limpar localização">
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplyLocation}
                    disabled={isApplyingLocation}
                    title="Aplicar localização"
                  >
                    {isApplyingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUseCurrentLocation}
                    disabled={isApplyingLocation || geoLoading}
                    title="Usar minha localização"
                  >
                    {isApplyingLocation || geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="w-full md:w-auto"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Buscar
              </Button>
            </div>
            {appliedLocationLabel && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Compass className="h-3 w-3" /> Localização aplicada: {appliedLocationLabel}
              </p>
            )}
            {geoError && (
              <p className="text-xs text-red-600">{geoError}</p>
            )}
          </CardContent>
        </Card>

        <div className="mb-6">
          <AdvancedSearchFilters
            filters={filters}
            onUpdate={handleFiltersUpdate}
            onReset={handleResetFilters}
            locationLabel={appliedLocationLabel}
            onRequestLocation={handleUseCurrentLocation}
            hasLocation={locationDefined}
            onCategorySelected={handleSelectCategory}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
          </div>
        ) : providers.length > 0 ? (
          <div className="space-y-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-gray-600">
                {providers.length} resultado{providers.length !== 1 ? 's' : ''} encontrado{providers.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <label htmlFor="sortBy" className="text-sm text-gray-500">
                  Ordenar por
                </label>
                <select
                  id="sortBy"
                  value={filters.sortBy ?? 'RELEVANCE'}
                  onChange={(event) => handleSortChange(event.target.value as SearchFilters['sortBy'])}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                >
                  <option value="RELEVANCE">Relevância</option>
                  <option value="PRICE_LOW">Menor preço</option>
                  <option value="PRICE_HIGH">Maior preço</option>
                  <option value="DISTANCE" disabled={!locationDefined}>
                    Mais perto
                  </option>
                  <option value="RATING">Melhor avaliados</option>
                  <option value="NEWEST">Mais recentes</option>
                </select>
              </div>
            </div>

            {providers.map((provider) => {
              const favoriteActive = favorites.has(provider.id)
              const travelQuote = travelQuotes[provider.id]
              const displayDistanceValue = travelQuote?.distanceKm ?? provider.distance
              const displayDistanceLabel = travelQuote?.distanceText
              const profileImageUrl = provider.profileImage ? cdnImageUrl(provider.profileImage) : null
              const basePriceValue = provider.basePrice != null && Number.isFinite(provider.basePrice)
                ? provider.basePrice
                : null
              const showPrice = provider.offersScheduling && basePriceValue != null
              const hasReviews = provider.reviewCount > 0
              const ratingDisplay = hasReviews ? provider.rating.toFixed(1) : '—'
              const reviewsDisplay = hasReviews ? `(${provider.reviewCount})` : 'Sem avaliações'
              return (
                <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="flex flex-col gap-4 p-6 md:flex-row">
                    <div className="flex justify-center md:block">
                      <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-brand-cyan/20 bg-brand-cyan/10">
                        {profileImageUrl ? (
                          <Image
                            src={profileImageUrl}
                            alt={provider.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-brand-cyan">
                            {provider.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-brand-navy">{provider.name}</h3>
                          <p className="text-sm text-gray-600">{provider.category}</p>
                          <p className="text-xs text-gray-500">{provider.services.join(', ')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{ratingDisplay}</span>
                            <span className="text-gray-400">{reviewsDisplay}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(provider.id)}
                            disabled={favoriteLoading === provider.id}
                            className={`${favoriteActive ? 'text-red-500' : 'text-gray-400'} hover:bg-red-50`}
                          >
                            {favoriteLoading === provider.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Heart className={`h-5 w-5 ${favoriteActive ? 'fill-current' : ''}`} />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{provider.location || 'Localização não informada'}</span>
                        </div>
                        {displayDistanceValue != null && (
                          <Badge variant="secondary">
                            {displayDistanceLabel ? displayDistanceLabel : `${displayDistanceValue.toFixed(1)} km`} de distância
                          </Badge>
                        )}
                        {provider.offersScheduling && (
                          <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                            Agendamento online
                          </Badge>
                        )}
                        {provider.providesHomeService && (
                          <Badge variant="outline" className="border-brand-cyan text-brand-cyan">
                            Atendimento a domicílio
                          </Badge>
                        )}
                        {provider.providesLocalService !== false && (
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            Atendimento no local
                          </Badge>
                        )}
                        {provider.travel?.waivesTravelOnHire && (
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                            Não cobra deslocamento
                          </Badge>
                        )}
                      </div>

                      <div className="grid gap-3 rounded-lg border border-brand-cyan/20 bg-white/80 p-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500">Serviço a partir de</p>
                          {showPrice ? (
                            <p className="text-xl font-semibold text-brand-navy">
                              {basePriceValue != null ? formatCurrency(basePriceValue) : 'Sob consulta'}
                            </p>
                          ) : (
                            <p className="text-sm font-medium text-gray-600">
                              Valor informado após envio do orçamento.
                            </p>
                          )}
                          <p className="text-xs text-gray-500">
                            O contato telefônico é liberado quando o profissional aceita sua solicitação.
                          </p>
                        </div>
                        <div className="rounded-md bg-brand-cyan/5 p-3">
                          <h4 className="text-sm font-medium text-brand-navy">Deslocamento</h4>
                          <div className="mt-2 space-y-2">
                            {renderTravelInfo(provider)}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={() => handleSolicitar(provider)}>
                          Solicitar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {travelLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Calculando deslocamento...
              </div>
            )}
          </div>
        ) : hasSearched ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <h3 className="mb-2 text-xl font-semibold text-gray-600">Nenhum resultado encontrado</h3>
              <p className="mb-6 text-gray-500">
                Tente ajustar os filtros ou usar outra combinação de termos e localização.
              </p>
              <Button variant="outline" onClick={handleResetFilters}>
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="mx-auto mb-4 h-16 w-16 text-gray-300" />
              <h3 className="mb-2 text-xl font-semibold text-gray-600">
                Digite o que você está procurando
              </h3>
              <p className="text-gray-500">
                Utilize a barra de pesquisa acima para encontrar profissionais ou serviços específicos.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

const SearchPage: React.FC = () => (
  <Suspense fallback={<div className="p-10 text-center">Carregando...</div>}>
    <PesquisaPage />
  </Suspense>
)

export default SearchPage
