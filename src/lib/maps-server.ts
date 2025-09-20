import type { DistanceResult, LocationResult } from './maps-types'

const GOOGLE_MAPS_SERVER_KEY =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  ''

const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api'

type LatLng = { lat: number; lng: number }

type AutocompletePrediction = {
  description: string
  place_id: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
}

function assertApiKey() {
  if (!GOOGLE_MAPS_SERVER_KEY) {
    throw new Error('Google Maps API key não configurada no servidor')
  }
}

async function fetchGoogle<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  assertApiKey()

  const url = new URL(`${GOOGLE_MAPS_BASE_URL}/${path}`)
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    url.searchParams.set(key, String(value))
  })
  url.searchParams.set('key', GOOGLE_MAPS_SERVER_KEY)

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json'
    },
    next: { revalidate: 0 }
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    throw new Error(`Erro na requisição Google Maps (${path}): ${message}`)
  }

  return response.json() as Promise<T>
}

function extractAddress(result: any): LocationResult {
  const components = result.address_components ?? []
  const location = result.geometry?.location ?? { lat: 0, lng: 0 }

  let street = ''
  let number = ''
  let district = ''
  let city = ''
  let state = ''
  let zipCode = ''

  for (const component of components) {
    const types: string[] = component.types ?? []
    if (types.includes('route')) {
      street = component.long_name
    } else if (types.includes('street_number')) {
      number = component.long_name
    } else if (types.includes('sublocality_level_1') || types.includes('political') && types.includes('sublocality')) {
      district = component.long_name
    } else if (types.includes('administrative_area_level_2')) {
      city = component.long_name
    } else if (types.includes('administrative_area_level_1')) {
      state = component.short_name
    } else if (types.includes('postal_code')) {
      zipCode = component.long_name
    }
  }

  return {
    address: {
      street,
      number,
      district,
      city,
      state,
      zipCode,
      latitude: location.lat,
      longitude: location.lng
    },
    latitude: location.lat,
    longitude: location.lng,
    formattedAddress: result.formatted_address ?? ''
  }
}

export class GoogleMapsServerService {
  static async geocodeAddress(address: string): Promise<LocationResult | null> {
    if (!address?.trim()) return null

    try {
      const data = await fetchGoogle<any>('geocode/json', {
        address,
        language: 'pt-BR'
      })

      if (data.status !== 'OK' || !Array.isArray(data.results) || data.results.length === 0) {
        return null
      }

      return extractAddress(data.results[0])
    } catch (error) {
      console.error('[GoogleMapsServerService.geocodeAddress]', error)
      return null
    }
  }

  static async reverseGeocode(lat: number, lng: number): Promise<LocationResult | null> {
    if (typeof lat !== 'number' || typeof lng !== 'number') return null

    try {
      const data = await fetchGoogle<any>('geocode/json', {
        latlng: `${lat},${lng}`,
        language: 'pt-BR'
      })

      if (data.status !== 'OK' || !Array.isArray(data.results) || data.results.length === 0) {
        return null
      }

      return extractAddress(data.results[0])
    } catch (error) {
      console.error('[GoogleMapsServerService.reverseGeocode]', error)
      return null
    }
  }

  static async calculateDistance(origin: LatLng, destination: LatLng): Promise<DistanceResult | null> {
    try {
      const data = await fetchGoogle<any>('distancematrix/json', {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        units: 'metric',
        mode: 'driving',
        language: 'pt-BR'
      })

      if (data.status !== 'OK') {
        return null
      }

      const element = data.rows?.[0]?.elements?.[0]
      if (!element || element.status !== 'OK') {
        return null
      }

      return {
        distance: element.distance.value / 1000,
        duration: element.duration.value / 60,
        distanceText: element.distance.text,
        durationText: element.duration.text
      }
    } catch (error) {
      console.error('[GoogleMapsServerService.calculateDistance]', error)
      return null
    }
  }

  static async autocomplete(query: string, opts: { location?: LatLng; radius?: number } = {}): Promise<AutocompletePrediction[]> {
    if (!query?.trim()) return []

    try {
      const data = await fetchGoogle<any>('place/autocomplete/json', {
        input: query,
        language: 'pt-BR',
        components: 'country:br',
        location: opts.location ? `${opts.location.lat},${opts.location.lng}` : undefined,
        radius: opts.radius ? Math.min(opts.radius, 50000) : undefined,
        types: 'address'
      })

      if (data.status !== 'OK' || !Array.isArray(data.predictions)) {
        return []
      }

      return data.predictions as AutocompletePrediction[]
    } catch (error) {
      console.error('[GoogleMapsServerService.autocomplete]', error)
      return []
    }
  }
}

export default GoogleMapsServerService
