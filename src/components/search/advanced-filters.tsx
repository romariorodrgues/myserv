'use client'

import { useMemo, useState, useEffect } from 'react'
import { Filter, MapPin, DollarSign, Star, Calendar, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CascadingCategoryPicker, { type CascCat } from '@/components/categories/cascading-category-picker'
import { StarRating } from '@/components/reviews/review-components'

export interface SearchFilters {
  q?: string
  leafCategoryId?: string
  city?: string
  state?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  availability?: 'TODAY' | 'THIS_WEEK'
  sortBy?: 'RELEVANCE' | 'PRICE_LOW' | 'PRICE_HIGH' | 'RATING' | 'DISTANCE' | 'NEWEST'
  hasScheduling?: boolean
  hasQuoting?: boolean
  isHighlighted?: boolean
  radius?: number
  latitude?: number
  longitude?: number
}

const DEFAULT_RADIUS_KM = 30

interface AdvancedSearchFiltersProps {
  filters: SearchFilters
  onUpdate: (patch: Partial<SearchFilters>) => void
  onReset: () => void
  locationLabel?: string
  onRequestLocation?: () => void
  hasLocation: boolean
  onCategorySelected?: (leafId: string | null, path: CascCat[]) => void
}

export function AdvancedSearchFilters({
  filters,
  onUpdate,
  onReset,
  locationLabel,
  onRequestLocation,
  hasLocation,
  onCategorySelected,
}: AdvancedSearchFiltersProps) {
  const [expanded, setExpanded] = useState(false)
  const [priceInputs, setPriceInputs] = useState<{ min: string; max: string }>({ min: '', max: '' })

  useEffect(() => {
    setPriceInputs({
      min: filters.minPrice != null ? String(filters.minPrice) : '',
      max: filters.maxPrice != null ? String(filters.maxPrice) : '',
    })
  }, [filters.minPrice, filters.maxPrice])

  const activeFilters = useMemo(() => {
    const ignoredKeys = new Set(['q', 'sortBy', 'latitude', 'longitude', 'city', 'state'])
    let count = 0
    Object.entries(filters).forEach(([key, value]) => {
      if (ignoredKeys.has(key)) return
      if (key === 'radius' && (value == null || Number(value) === DEFAULT_RADIUS_KM)) return
      if (value === undefined || value === null || value === '' || value === false) return
      count += 1
    })
    if (filters.sortBy && filters.sortBy !== 'RELEVANCE') count += 1
    if (filters.city || filters.state) count += 1
    return count
  }, [filters])

  const toggleAvailability = (value: 'TODAY' | 'THIS_WEEK') => {
    if (filters.availability === value) {
      onUpdate({ availability: undefined })
    } else {
      onUpdate({ availability: value, hasScheduling: true })
    }
  }

  const availabilityOptions: Array<{ value: 'TODAY' | 'THIS_WEEK'; label: string }> = [
    { value: 'TODAY', label: 'Hoje' },
    { value: 'THIS_WEEK', label: 'Esta semana' },
  ]

  const radiusValue = filters.radius ?? DEFAULT_RADIUS_KM

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
            {activeFilters > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {activeFilters}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setExpanded((prev) => !prev)}>
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" /> Menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" /> Mais
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2 rounded-lg border border-brand-cyan/20 bg-brand-cyan/5 p-4">
          <p className="flex items-start gap-2 text-sm text-brand-navy">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{locationLabel || 'Defina a localização no campo acima para resultados mais precisos.'}</span>
          </p>
          {onRequestLocation && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRequestLocation}
                className="border-brand-cyan text-brand-cyan hover:bg-brand-cyan/10"
              >
                {locationLabel ? 'Atualizar localização' : 'Usar minha localização'}
              </Button>
              <span className="text-xs text-gray-500">
                Você pode editar a localização diretamente no campo de pesquisa acima.
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Categoria</label>
          <CascadingCategoryPicker
            value={filters.leafCategoryId || null}
            onChange={(leafId, path) => {
              onUpdate({ leafCategoryId: leafId || undefined })
              onCategorySelected?.(leafId, path)
            }}
          />
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700">
            <DollarSign className="mr-1 inline h-4 w-4" /> Faixa de preço
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-gray-500" htmlFor="price-min">
                Mínimo
              </label>
              <Input
                id="price-min"
                type="number"
                min={0}
                inputMode="decimal"
                placeholder="R$ 0"
                value={priceInputs.min}
                onChange={(event) => {
                  const value = event.target.value
                  setPriceInputs((prev) => ({ ...prev, min: value }))
                  onUpdate({ minPrice: value ? Number(value) : undefined })
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500" htmlFor="price-max">
                Máximo
              </label>
              <Input
                id="price-max"
                type="number"
                min={0}
                inputMode="decimal"
                placeholder="R$ 1000"
                value={priceInputs.max}
                onChange={(event) => {
                  const value = event.target.value
                  setPriceInputs((prev) => ({ ...prev, max: value }))
                  onUpdate({ maxPrice: value ? Number(value) : undefined })
                }}
              />
            </div>
          </div>
        </div>

        {expanded && (
          <div className="space-y-6 border-t pt-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700">
                <Star className="mr-1 inline h-4 w-4" /> Avaliação mínima
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((rating) => {
                  const active = filters.rating === rating
                  return (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => onUpdate({ rating: active ? undefined : rating })}
                      className={`flex items-center gap-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                        active ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <StarRating rating={rating} size="sm" />
                      <span>+</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700">
                <Calendar className="mr-1 inline h-4 w-4" /> Disponibilidade aproximada
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availabilityOptions.map((option) => {
                  const active = filters.availability === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggleAvailability(option.value)}
                      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                        active ? 'border-brand-cyan bg-brand-cyan/10 text-brand-navy' : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Os resultados consideram profissionais que oferecem agendamento online. A disponibilidade exata será confirmada ao solicitar o serviço.
              </p>
            </div>

            <div className="space-y-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Características
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-brand-cyan focus:ring-brand-cyan"
                  checked={!!filters.hasScheduling}
                  onChange={(event) => onUpdate({ hasScheduling: event.target.checked ? true : undefined })}
                />
                Agendamento online
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-brand-cyan focus:ring-brand-cyan"
                  checked={!!filters.hasQuoting}
                  onChange={(event) => onUpdate({ hasQuoting: event.target.checked ? true : undefined })}
                />
                Orçamento online
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-brand-cyan focus:ring-brand-cyan"
                  checked={!!filters.isHighlighted}
                  onChange={(event) => onUpdate({ isHighlighted: event.target.checked ? true : undefined })}
                />
                Profissionais em destaque
              </label>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700">
                Raio de busca: {radiusValue} km
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={radiusValue}
                onChange={(event) => onUpdate({ radius: Number(event.target.value) })}
                disabled={!hasLocation}
                className="h-2 w-full cursor-pointer rounded-lg bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>1 km</span>
                <span>100 km</span>
              </div>
              {!hasLocation && (
                <p className="mt-2 text-xs text-gray-500">
                  Informe sua localização para ativar a busca por raio.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { DEFAULT_RADIUS_KM }
