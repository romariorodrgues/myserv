/**
 * Geolocation hook
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Custom hook for handling geolocation functionality
 */

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface Coordinates {
  lat: number
  lng: number
}

interface LocationData {
  address: string
  city: string
  state: string
  country: string
  postalCode?: string
  formatted: string
}

export function useGeolocation() {
  const [location, setLocation] = useState<Coordinates | null>(null)
  const [address, setAddress] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get current position
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada neste navegador')
      toast.error('Geolocalização não é suportada neste navegador')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      })

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }

      setLocation(coords)

      // Get address from coordinates
      await reverseGeocode(coords)

    } catch (error: any) {
      let errorMessage = 'Erro ao obter localização'
      
      if (error.code === error.PERMISSION_DENIED) {
        errorMessage = 'Permissão de localização negada'
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMessage = 'Localização não disponível'
      } else if (error.code === error.TIMEOUT) {
        errorMessage = 'Tempo limite para obter localização'
      }

      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Reverse geocoding: coordinates to address
  const reverseGeocode = async (coords: Coordinates) => {
    try {
      const response = await fetch('/api/geolocation?type=reverse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(coords)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAddress(data.result)
          return data.result
        }
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error)
    }
    return null
  }

  // Forward geocoding: address to coordinates
  const forwardGeocode = async (addressString: string) => {
    try {
      const response = await fetch('/api/geolocation?type=forward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ address: addressString })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const coords = {
            lat: data.result.lat,
            lng: data.result.lng
          }
          setLocation(coords)
          setAddress(data.result)
          return data.result
        }
      }
    } catch (error) {
      console.error('Error in forward geocoding:', error)
      toast.error('Erro ao buscar endereço')
    }
    return null
  }

  // Get location suggestions
  const getLocationSuggestions = async (query: string) => {
    try {
      const response = await fetch(`/api/geolocation?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        return data.suggestions || []
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error)
    }
    return []
  }

  return {
    location,
    address,
    loading,
    error,
    getCurrentLocation,
    reverseGeocode,
    forwardGeocode,
    getLocationSuggestions,
    clearError: () => setError(null)
  }
}
