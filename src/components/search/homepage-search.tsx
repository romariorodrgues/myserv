/**
 * Homepage Search Component with automatic geolocation
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Search bar for the homepage with automatic location detection
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Locate, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ServiceSuggestInput from '@/components/services/service-suggest-input'
import GoogleMapsService from '@/lib/maps-service'
import { AlternativeGeocodingService } from '@/lib/alternative-geocoding'

interface HomepageSearchProps {
  className?: string
}

export default function HomepageSearch({ className = '' }: HomepageSearchProps) {
  const router = useRouter()
  const [serviceQuery, setServiceQuery] = useState('')
  const [leafId, setLeafId] = useState<string | undefined>(undefined)
  const [locationQuery, setLocationQuery] = useState('')
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null)

  // Auto-detect location on component mount
  useEffect(() => {
    detectUserLocation()
  }, [])

  const detectUserLocation = async () => {
    try {
      setIsLoadingLocation(true)
      
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setHasLocationPermission(false)
        return
      }

      // Try to get current location using native geolocation
      const location = await getCurrentLocationNative()
      
      if (location) {
        setHasLocationPermission(true)
        
        // Try to use Google Maps for reverse geocoding first
        try {
          const locationResult = await GoogleMapsService.reverseGeocode(location.lat, location.lng)
          
          if (locationResult) {
            // Use city and state for location display
            const cityState = `${locationResult.address.city}, ${locationResult.address.state}`
            setLocationQuery(cityState)
            return
          }        } catch {
          console.log('Google Maps not available, trying alternative geocoding...')
        }
        
        // Fallback to alternative geocoding services
        try {
          const alternativeResult = await AlternativeGeocodingService.getCityFromCoordinates(location.lat, location.lng)
          
          if (alternativeResult) {
            setLocationQuery(alternativeResult.formatted)
            return
          }
        } catch {
          console.log('Alternative geocoding failed, using coordinates fallback')
        }

        // Final fallback: check if within Brazil and show appropriate message
        if (AlternativeGeocodingService.isWithinBrazil(location.lat, location.lng)) {
          setLocationQuery('Brasil (localização detectada)')
        } else {
          setLocationQuery(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`)
        }
      } else {
        setHasLocationPermission(false)
      }
    } catch (error) {
      console.error('Erro ao detectar localização:', error)
      setHasLocationPermission(false)
    } finally {
      setIsLoadingLocation(false)
    }
  }

  // Native geolocation function as fallback
  const getCurrentLocationNative = (): Promise<{ lat: number, lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  const handleLocationClick = async () => {
    if (hasLocationPermission === false) {
      // If permission was denied, show help message
      alert('Para usar sua localização, permita o acesso nas configurações do navegador e atualize a página.')
      return
    }

    await detectUserLocation()
  }

  const handleSearch = () => {
    if (!serviceQuery.trim() && !locationQuery.trim()) {
      alert('Por favor, digite o serviço que você precisa.')
      return
    }

    // Build search URL with parameters
    const params = new URLSearchParams()
    if (leafId) params.set('leafCategoryId', leafId)
    else if (serviceQuery.trim()) params.set('q', serviceQuery.trim())
    
    if (locationQuery.trim()) {
      params.set('local', locationQuery.trim())
    }

    // Navigate to services page with search parameters
    router.push(`/servicos?${params.toString()}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Service Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <div className="pl-12">
            <ServiceSuggestInput
              placeholder="Que serviço você precisa?"
              defaultValue={serviceQuery}
              onSelect={(item) => {
                if (item.type === 'leaf' && item.id) {
                  setLeafId(item.id)
                  setServiceQuery(item.name)
                } else {
                  setLeafId(undefined)
                  setServiceQuery(item.name)
                }
              }}
            />
          </div>
        </div>

        {/* Location Input */}
        <div className="relative flex-1">
          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isLoadingLocation ? "Detectando localização..." : "Onde?"}
            className="pl-12 pr-12 h-14 text-lg"
            disabled={isLoadingLocation}
          />
          
          {/* Location Detection Button */}
          <button
            type="button"
            onClick={handleLocationClick}
            disabled={isLoadingLocation}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Usar minha localização"
          >
            {isLoadingLocation ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Locate className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Search Button */}
        <Button 
          size="lg" 
          className="h-14 px-8 text-lg"
          onClick={handleSearch}
          disabled={!serviceQuery.trim() && !locationQuery.trim()}
        >
          Buscar
        </Button>
      </div>

      {/* Location Status Messages */}
      {hasLocationPermission === false && (
        <div className="mt-2 text-sm text-amber-600 text-center">
          💡 Dica: Permita o acesso à localização para encontrar serviços próximos a você
        </div>
      )}
      
      {hasLocationPermission === true && locationQuery && !isLoadingLocation && (
        <div className="mt-2 text-sm text-green-600 text-center">
          📍 Localização detectada: {locationQuery}
        </div>
      )}
      
      {isLoadingLocation && (
        <div className="mt-2 text-sm text-blue-600 text-center">
          🔍 Detectando sua localização...
        </div>
      )}
    </div>
  )
}
