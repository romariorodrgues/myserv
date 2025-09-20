/**
 * Google Maps service for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles geolocation, address search, and distance calculations
 */

import { Loader } from '@googlemaps/js-api-loader'
import { geocodingCache } from './cache-service'
import type { Address, DistanceResult, LocationResult } from './maps-types'

export type { Address, DistanceResult, LocationResult } from './maps-types'

const BROWSER_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  ''

export class GoogleMapsService {
  private static loader: Loader | null = null
  private static google: typeof google | null = null

  /**
   * Initialize Google Maps API
   */
  private static async initializeGoogle() {
    if (typeof window === 'undefined') {
      throw new Error('Google Maps JS API só está disponível no navegador')
    }

    if (!BROWSER_MAPS_API_KEY) {
      throw new Error('Google Maps API key não configurada')
    }

    if (!this.loader) {
      this.loader = new Loader({
        apiKey: BROWSER_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['places', 'geometry']
      })
    }

    if (!this.google) {
      this.google = await this.loader.load()
    }

    return this.google
  }

  /**
   * Get coordinates from address string
   */
  static async geocodeAddress(address: string): Promise<LocationResult | null> {
    const cacheKey = `geocode:${address.toLowerCase().trim()}`
    
    // Try to get from cache first
    const cached = geocodingCache.get<LocationResult>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const google = await this.initializeGoogle()
      const geocoder = new google.maps.Geocoder()

      return new Promise((resolve) => {
        geocoder.geocode({ address: `${address}, Brasil` }, (results: any[], status: string) => {
          if (status === 'OK' && results[0]) {
            const result = results[0]
            const location = result.geometry.location
            const components = result.address_components

            // Parse address components
            let street = ''
            let number = ''
            let district = ''
            let city = ''
            let state = ''
            let zipCode = ''

            components.forEach((component: any) => {
              const types = component.types
              if (types.includes('route')) {
                street = component.long_name
              } else if (types.includes('street_number')) {
                number = component.long_name
              } else if (types.includes('sublocality') || types.includes('district')) {
                district = component.long_name
              } else if (types.includes('administrative_area_level_2')) {
                city = component.long_name
              } else if (types.includes('administrative_area_level_1')) {
                state = component.short_name
              } else if (types.includes('postal_code')) {
                zipCode = component.long_name
              }
            })

            const locationResult: LocationResult = {
              address: {
                street,
                number,
                district,
                city,
                state,
                zipCode,
                latitude: location.lat(),
                longitude: location.lng()
              },
              latitude: location.lat(),
              longitude: location.lng(),
              formattedAddress: result.formatted_address
            }

            // Cache the result for 24 hours
            geocodingCache.set(cacheKey, locationResult, 24 * 60 * 60)
            resolve(locationResult)
          } else {
            resolve(null)
          }
        })
      })
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  /**
   * Get address from coordinates (reverse geocoding)
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<LocationResult | null> {
    try {
      const google = await this.initializeGoogle()
      const geocoder = new google.maps.Geocoder()
      const latlng = new google.maps.LatLng(latitude, longitude)

      return new Promise((resolve) => {
        geocoder.geocode({ location: latlng }, (results: any[], status: string) => {
          if (status === 'OK' && results[0]) {
            const result = results[0]
            const components = result.address_components

            // Parse address components
            let street = ''
            let number = ''
            let district = ''
            let city = ''
            let state = ''
            let zipCode = ''

            components.forEach((component: any) => {
              const types = component.types
              if (types.includes('route')) {
                street = component.long_name
              } else if (types.includes('street_number')) {
                number = component.long_name
              } else if (types.includes('sublocality') || types.includes('district')) {
                district = component.long_name
              } else if (types.includes('administrative_area_level_2')) {
                city = component.long_name
              } else if (types.includes('administrative_area_level_1')) {
                state = component.short_name
              } else if (types.includes('postal_code')) {
                zipCode = component.long_name
              }
            })

            resolve({
              address: {
                street,
                number,
                district,
                city,
                state,
                zipCode,
                latitude,
                longitude
              },
              latitude,
              longitude,
              formattedAddress: result.formatted_address
            })
          } else {
            resolve(null)
          }
        })
      })
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return null
    }
  }

  /**
   * Calculate distance between two points
   */
  static async calculateDistance(
    origin: { lat: number, lng: number },
    destination: { lat: number, lng: number }
  ): Promise<DistanceResult | null> {
    try {
      const google = await this.initializeGoogle()
      const service = new google.maps.DistanceMatrixService()

      return new Promise((resolve) => {
        service.getDistanceMatrix({
          origins: [new google.maps.LatLng(origin.lat, origin.lng)],
          destinations: [new google.maps.LatLng(destination.lat, destination.lng)],
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        }, (response: any, status: string) => {
          if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
            const element = response.rows[0].elements[0]
            
            resolve({
              distance: element.distance.value / 1000, // Convert to kilometers
              duration: element.duration.value / 60, // Convert to minutes
              distanceText: element.distance.text,
              durationText: element.duration.text
            })
          } else {
            resolve(null)
          }
        })
      })
    } catch (error) {
      console.error('Distance calculation error:', error)
      return null
    }
  }

  /**
   * Calculate distance using simple coordinates (Haversine formula)
   */
  static calculateSimpleDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in kilometers
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Search for places with autocomplete
   */
  static async searchPlaces(query: string, location?: { lat: number, lng: number }): Promise<any[]> {
    try {
      const google = await this.initializeGoogle()
      const service = new google.maps.places.AutocompleteService()

      const request: any = {
        input: query,
        componentRestrictions: { country: 'br' },
        types: ['address']
      }

      if (location) {
        request.location = new google.maps.LatLng(location.lat, location.lng)
        request.radius = 50000 // 50km radius
      }

      return new Promise((resolve) => {
        service.getPlacePredictions(request, (results: any[], status: string) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results)
          } else {
            resolve([])
          }
        })
      })
    } catch (error) {
      console.error('Places search error:', error)
      return []
    }
  }

  /**
   * Get user's current location
   */
  static async getCurrentLocation(): Promise<{ lat: number, lng: number } | null> {
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

  /**
   * Check if coordinates are within service area (Brazil)
   */
  static isWithinServiceArea(latitude: number, longitude: number): boolean {
    // Brazil boundaries (approximate)
    const northBound = 5.27438888
    const southBound = -33.75118637
    const eastBound = -28.6341164
    const westBound = -73.98283063

    return latitude <= northBound && 
           latitude >= southBound && 
           longitude <= eastBound && 
           longitude >= westBound
  }

  /**
   * Format address for display
   */
  static formatAddress(address: Address): string {
    const parts = []
    
    if (address.street) {
      parts.push(address.street)
    }
    if (address.number) {
      parts.push(address.number)
    }
    if (address.district) {
      parts.push(address.district)
    }
    if (address.city) {
      parts.push(address.city)
    }
    if (address.state) {
      parts.push(address.state)
    }
    if (address.zipCode) {
      parts.push(address.zipCode)
    }

    return parts.join(', ')
  }
}

export default GoogleMapsService
