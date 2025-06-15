/**
 * Advanced Search Filters component for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Component for advanced service search filters
 */

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Filter, 
  MapPin, 
  Star, 
  DollarSign, 
  Calendar, 
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StarRating } from '@/components/reviews/review-components'

interface FilterCategory {
  id: string
  name: string
  icon: string
  count: number
}

interface SearchFilters {
  q?: string
  categoryId?: string
  city?: string
  state?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  availability?: 'IMMEDIATE' | 'TODAY' | 'THIS_WEEK' | 'FLEXIBLE'
  sortBy?: 'RELEVANCE' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RATING' | 'DISTANCE' | 'NEWEST'
  hasScheduling?: boolean
  hasQuoting?: boolean
  isHighlighted?: boolean
  radius?: number
  latitude?: number
  longitude?: number
}

interface AdvancedSearchFiltersProps {
  categories: FilterCategory[]
  priceRange: { min: number; max: number }
  onFiltersChange: (filters: SearchFilters) => void
  className?: string
}

export function AdvancedSearchFilters({ 
  categories, 
  priceRange, 
  onFiltersChange,
  className = '' 
}: AdvancedSearchFiltersProps) {
  const searchParams = useSearchParams()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [locationSearch, setLocationSearch] = useState('')
  const [priceValues, setPriceValues] = useState({ 
    min: priceRange.min, 
    max: priceRange.max 
  })

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters: SearchFilters = {
      q: searchParams.get('q') || '',
      categoryId: searchParams.get('categoryId') || undefined,
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined,
      availability: (searchParams.get('availability') as 'IMMEDIATE' | 'TODAY' | 'THIS_WEEK' | 'FLEXIBLE') || undefined,
      sortBy: (searchParams.get('sortBy') as 'RELEVANCE' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RATING' | 'DISTANCE' | 'NEWEST') || 'RELEVANCE',
      hasScheduling: searchParams.get('hasScheduling') === 'true' ? true : undefined,
      hasQuoting: searchParams.get('hasQuoting') === 'true' ? true : undefined,
      isHighlighted: searchParams.get('isHighlighted') === 'true' ? true : undefined,
      radius: searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : 50
    }
    
    setFilters(urlFilters)
    setLocationSearch(urlFilters.city || '')
    setPriceValues({
      min: urlFilters.minPrice || priceRange.min,
      max: urlFilters.maxPrice || priceRange.max
    })
  }, [searchParams, priceRange])

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      q: filters.q, // Keep search query
      sortBy: 'RELEVANCE'
    }
    setFilters(clearedFilters)
    setLocationSearch('')
    setPriceValues({ min: priceRange.min, max: priceRange.max })
    onFiltersChange(clearedFilters)
  }

  const handleLocationSearch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateFilters({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city: undefined,
            state: undefined
          })
        },
        () => {
          // Fallback to text-based location
          updateFilters({
            city: locationSearch,
            latitude: undefined,
            longitude: undefined
          })
        }
      )
    } else {
      updateFilters({
        city: locationSearch,
        latitude: undefined,
        longitude: undefined
      })
    }
  }

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && value !== 'RELEVANCE'
  ).length

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Mais
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              Localização
            </label>
            <div className="flex space-x-2">
              <Input
                placeholder="Cidade ou usar GPS"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLocationSearch}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              value={filters.categoryId || ''}
              onChange={(e) => updateFilters({ categoryId: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordenar por
            </label>
            <select
              value={filters.sortBy || 'RELEVANCE'}
              onChange={(e) => updateFilters({ sortBy: e.target.value as 'RELEVANCE' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RATING' | 'DISTANCE' | 'NEWEST' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="RELEVANCE">Relevância</option>
              <option value="RATING">Melhor avaliados</option>
              <option value="PRICE_LOW">Menor preço</option>
              <option value="PRICE_HIGH">Maior preço</option>
              <option value="DISTANCE">Mais próximos</option>
              <option value="NEWEST">Mais recentes</option>
            </select>
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-6 border-t pt-6">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Faixa de Preço
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Mínimo</label>
                  <Input
                    type="number"
                    placeholder="R$ 0"
                    value={priceValues.min || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined
                      setPriceValues(prev => ({ ...prev, min: value || priceRange.min }))
                      updateFilters({ minPrice: value })
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Máximo</label>
                  <Input
                    type="number"
                    placeholder="R$ 1000"
                    value={priceValues.max || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined
                      setPriceValues(prev => ({ ...prev, max: value || priceRange.max }))
                      updateFilters({ maxPrice: value })
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Star className="h-4 w-4 inline mr-1" />
                Avaliação mínima
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => updateFilters({ 
                      rating: filters.rating === rating ? undefined : rating 
                    })}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md border transition-colors ${
                      filters.rating === rating
                        ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <StarRating rating={rating} size="sm" />
                    <span className="text-sm">+</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Calendar className="h-4 w-4 inline mr-1" />
                Disponibilidade
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'IMMEDIATE', label: 'Imediato' },
                  { value: 'TODAY', label: 'Hoje' },
                  { value: 'THIS_WEEK', label: 'Esta semana' },
                  { value: 'FLEXIBLE', label: 'Flexível' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateFilters({ 
                      availability: filters.availability === option.value ? undefined : option.value as 'IMMEDIATE' | 'TODAY' | 'THIS_WEEK' | 'FLEXIBLE'
                    })}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      filters.availability === option.value
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Características do Serviço
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasScheduling || false}
                    onChange={(e) => updateFilters({ 
                      hasScheduling: e.target.checked ? true : undefined 
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Agendamento online
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasQuoting || false}
                    onChange={(e) => updateFilters({ 
                      hasQuoting: e.target.checked ? true : undefined 
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Orçamento online
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.isHighlighted || false}
                    onChange={(e) => updateFilters({ 
                      isHighlighted: e.target.checked ? true : undefined 
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    <Star className="h-4 w-4 inline mr-1" />
                    Profissionais destaque
                  </span>
                </label>
              </div>
            </div>

            {/* Radius Filter (if location is set) */}
            {(filters.latitude || filters.city) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Raio de busca: {filters.radius || 50} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={filters.radius || 50}
                  onChange={(e) => updateFilters({ radius: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 km</span>
                  <span>100 km</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
