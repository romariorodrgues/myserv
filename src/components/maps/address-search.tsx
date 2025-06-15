/**
 * Address search component with Google Maps integration
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import GoogleMapsService, { LocationResult } from '@/lib/maps-service'

interface PlaceSuggestion {
  description: string
  place_id: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
}

interface AddressSearchProps {
  onAddressSelect: (address: LocationResult) => void
  initialValue?: string
  placeholder?: string
  className?: string
}

export default function AddressSearch({ 
  onAddressSelect, 
  initialValue = '',
  placeholder = 'Digite seu endereço...',
  className = ''
}: AddressSearchProps) {
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const debounceTimer = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Get user's current location
    GoogleMapsService.getCurrentLocation().then(location => {
      if (location) {
        setUserLocation(location)
      }
    })
  }, [])

  const searchAddresses = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    
    try {
      const results = await GoogleMapsService.searchPlaces(searchQuery, userLocation || undefined)
      setSuggestions(results.slice(0, 5)) // Show max 5 suggestions
    } catch (error) {
      console.error('Erro na busca de endereços:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    setShowSuggestions(true)

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      searchAddresses(value)
    }, 300)
  }

  const handleSuggestionClick = async (suggestion: PlaceSuggestion) => {
    setQuery(suggestion.description)
    setShowSuggestions(false)
    setSuggestions([])

    // Geocode the selected address to get full details
    setIsLoading(true)
    try {
      const locationResult = await GoogleMapsService.geocodeAddress(suggestion.description)
      if (locationResult) {
        onAddressSelect(locationResult)
      }
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentLocation = async () => {
    setIsLoading(true)
    
    try {
      const location = await GoogleMapsService.getCurrentLocation()
      if (location) {
        const locationResult = await GoogleMapsService.reverseGeocode(location.lat, location.lng)
        if (locationResult) {
          setQuery(locationResult.formattedAddress)
          onAddressSelect(locationResult)
        }
      } else {
        alert('Não foi possível obter sua localização. Verifique as permissões do navegador.')
      }
    } catch (error) {
      console.error('Erro ao obter localização:', error)
      alert('Erro ao obter localização atual.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="w-full"
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay hiding suggestions to allow clicks
              setTimeout(() => setShowSuggestions(false), 200)
            }}
          />
          
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isLoading}
          className="px-3"
          title="Usar minha localização atual"
        >
          📍
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start gap-3">
                <div className="text-gray-400 mt-1">📍</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </div>
                  <div className="text-xs text-gray-500">
                    {suggestion.structured_formatting?.secondary_text || ''}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && suggestions.length === 0 && query.length >= 3 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4 text-center text-gray-500 text-sm">
          Nenhum endereço encontrado para &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  )
}
