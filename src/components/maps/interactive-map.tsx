/**
 * Interactive Map Component with Google Maps integration
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Full-featured map component for service provider locations and distance calculations
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react'
import GoogleMapsService from '@/lib/maps-service'

interface MapLocation {
  lat: number
  lng: number
  title?: string
  address?: string
  type?: 'user' | 'provider' | 'service'
}

interface InteractiveMapProps {
  locations?: MapLocation[]
  center?: { lat: number, lng: number }
  zoom?: number
  height?: string
  showSearch?: boolean
  showDirections?: boolean
  onLocationSelect?: (location: MapLocation) => void
  className?: string
}

export function InteractiveMap({
  locations = [],
  center = { lat: -23.5505, lng: -46.6333 }, // São Paulo default
  zoom = 12,
  height = '400px',
  showSearch = true,
  showDirections = true,
  onLocationSelect,
  className = ''
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null)

  useEffect(() => {
    initializeMap()
    getUserLocation()
  }, [])

  useEffect(() => {
    if (map) {
      updateMarkers()
    }
  }, [map, locations])

  const initializeMap = async () => {
    try {
      setLoading(true)
      
      if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps API key não configurada')
      }

      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['places', 'geometry']
      })

      const google = await loader.load()
      
      if (!mapRef.current) {
        throw new Error('Map container não encontrado')
      }

      const mapInstance = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true
      })

      // Initialize directions
      const directionsServiceInstance = new google.maps.DirectionsService()
      const directionsRendererInstance = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#22c55e',
          strokeWeight: 4
        }
      })

      directionsRendererInstance.setMap(mapInstance)

      setMap(mapInstance)
      setDirectionsService(directionsServiceInstance)
      setDirectionsRenderer(directionsRendererInstance)

    } catch (err) {
      console.error('Error initializing map:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar mapa')
    } finally {
      setLoading(false)
    }
  }

  const getUserLocation = async () => {
    try {
      const location = await GoogleMapsService.getCurrentLocation()
      if (location) {
        setUserLocation(location)
        if (map) {
          map.setCenter(location)
        }
      }
    } catch (error) {
      console.error('Error getting user location:', error)
    }
  }

  const updateMarkers = () => {
    if (!map) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    const newMarkers: google.maps.Marker[] = []

    // Add user location marker
    if (userLocation) {
      const userMarker = new google.maps.Marker({
        position: userLocation,
        map,
        title: 'Sua localização',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24)
        }
      })
      newMarkers.push(userMarker)
    }

    // Add location markers
    locations.forEach((location, index) => {
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map,
        title: location.title || `Location ${index + 1}`,
        icon: getMarkerIcon(location.type || 'provider')
      })

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold">${location.title || 'Localização'}</h3>
            ${location.address ? `<p class="text-sm text-gray-600">${location.address}</p>` : ''}
            <div class="mt-2 space-x-2">
              ${showDirections ? `<button onclick="window.getDirections(${location.lat}, ${location.lng})" class="text-xs bg-green-500 text-white px-2 py-1 rounded">Ver Rota</button>` : ''}
            </div>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
        if (onLocationSelect) {
          onLocationSelect(location)
        }
      })

      newMarkers.push(marker)
    })

    setMarkers(newMarkers)
  }

  const getMarkerIcon = (type: string) => {
    const colors = {
      user: '#3b82f6',
      provider: '#22c55e',
      service: '#f59e0b'
    }

    const color = colors[type as keyof typeof colors] || colors.provider

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
        </svg>
      `)}`,
      scaledSize: new google.maps.Size(24, 24)
    }
  }

  const searchLocation = async () => {
    if (!searchQuery.trim() || !map) return

    try {
      const result = await GoogleMapsService.geocodeAddress(searchQuery)
      if (result) {
        const position = { lat: result.latitude, lng: result.longitude }
        map.setCenter(position)
        map.setZoom(15)

        // Add temporary marker
        const searchMarker = new google.maps.Marker({
          position,
          map,
          title: result.formattedAddress,
          icon: getMarkerIcon('service')
        })

        // Remove after 5 seconds
        setTimeout(() => {
          searchMarker.setMap(null)
        }, 5000)
      }
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const getDirections = (destLat: number, destLng: number) => {
    if (!directionsService || !directionsRenderer || !userLocation) {
      alert('Localização do usuário não disponível')
      return
    }

    directionsService.route({
      origin: userLocation,
      destination: { lat: destLat, lng: destLng },
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === 'OK' && result) {
        directionsRenderer.setDirections(result)
      } else {
        console.error('Directions request failed:', status)
      }
    })
  }

  // Make getDirections available globally for info window buttons
  useEffect(() => {
    (window as any).getDirections = getDirections
    return () => {
      delete (window as any).getDirections
    }
  }, [userLocation, directionsService, directionsRenderer])

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            <p className="text-sm text-gray-600">Carregando mapa...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">{error}</p>
            <Button variant="outline" onClick={initializeMap} className="mt-2">
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showSearch && (
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Mapa Interativo</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Input
              placeholder="Buscar endereço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              className="flex-1"
            />
            <Button onClick={searchLocation} variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
            <Button onClick={getUserLocation} variant="outline" size="icon">
              <Navigation className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex space-x-2">
            <Badge variant="outline" className="text-xs">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1" />
              Sua localização
            </Badge>
            <Badge variant="outline" className="text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
              Prestadores
            </Badge>
            <Badge variant="outline" className="text-xs">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1" />
              Busca
            </Badge>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div ref={mapRef} style={{ height, width: '100%' }} />
      </CardContent>
    </Card>
  )
}

export default InteractiveMap
