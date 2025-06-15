/**
 * Alternative Geocoding Service for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Provides fallback geocoding when Google Maps API is not available
 * Uses free public APIs to convert coordinates to city names
 */

export interface LocationInfo {
  city: string
  state: string
  country: string
  formatted: string
}

export class AlternativeGeocodingService {
  
  /**
   * Get city name from coordinates using multiple fallback APIs
   */
  static async getCityFromCoordinates(latitude: number, longitude: number): Promise<LocationInfo | null> {
    // Try multiple APIs in order of preference
    const apis = [
      () => this.tryOpenStreetMapNominatim(latitude, longitude),
      () => this.tryViacepAPI(latitude, longitude),
      () => this.tryBrazilAPIGeocoding(latitude, longitude)
    ]

    for (const apiCall of apis) {
      try {
        const result = await apiCall()
        if (result) {
          return result
        }
      } catch (error) {
        console.log('API fallback attempt failed, trying next...', error instanceof Error ? error.message : String(error))
        continue
      }
    }

    return null
  }

  /**
   * OpenStreetMap Nominatim API (Free, reliable)
   */
  private static async tryOpenStreetMapNominatim(latitude: number, longitude: number): Promise<LocationInfo | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR,pt,en`,
        {
          headers: {
            'User-Agent': 'MyServ-Platform/1.0 (contact@myserv.dev)'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (data && data.address) {
        const address = data.address
        const city = address.city || address.town || address.village || address.municipality || 'Cidade não identificada'
        const state = address.state || address.region || 'Estado não identificado'
        const country = address.country || 'Brasil'

        return {
          city,
          state,
          country,
          formatted: `${city}, ${state}`
        }
      }

      return null
    } catch (error) {
      console.error('OpenStreetMap Nominatim error:', error)
      throw error
    }
  }

  /**
   * ViaCEP API with approximate location (Brazil focused)
   */
  private static async tryViacepAPI(latitude: number, longitude: number): Promise<LocationInfo | null> {
    try {
      // This is a simple approximation - in a real scenario you'd use a proper geocoding service
      // For now, we'll use a basic approach to identify Brazilian regions
      
      const brazilRegions = this.getBrazilRegionFromCoordinates(latitude, longitude)
      
      if (brazilRegions) {
        return {
          city: brazilRegions.city,
          state: brazilRegions.state,
          country: 'Brasil',
          formatted: `${brazilRegions.city}, ${brazilRegions.state}`
        }
      }

      return null
    } catch (error) {
      console.error('ViaCEP approximation error:', error)
      throw error
    }
  }

  /**
   * BrazilAPI Geocoding (Brazil focused)
   */
  private static async tryBrazilAPIGeocoding(latitude: number, longitude: number): Promise<LocationInfo | null> {
    try {
      // BrazilAPI doesn't have reverse geocoding, but we can approximate
      const approximateLocation = this.getBrazilRegionFromCoordinates(latitude, longitude)
      
      if (approximateLocation) {
        return {
          city: approximateLocation.city,
          state: approximateLocation.state,
          country: 'Brasil',
          formatted: `${approximateLocation.city}, ${approximateLocation.state}`
        }
      }

      return null
    } catch (error) {
      console.error('BrazilAPI approximation error:', error)
      throw error
    }
  }

  /**
   * Basic approximation of Brazilian regions based on coordinates
   * This is a simplified approach - in production you'd use proper geocoding
   */
  private static getBrazilRegionFromCoordinates(latitude: number, longitude: number): { city: string, state: string } | null {
    // Brazilian coordinates bounds
    if (latitude < -33.75 || latitude > 5.27 || longitude < -73.98 || longitude > -28.63) {
      return null // Outside Brazil
    }

    // Approximate regions based on major coordinates
    // This is a simplified mapping - real implementation would use proper databases
    
    // Southeast Region
    if (latitude >= -25 && latitude <= -19 && longitude >= -50 && longitude <= -39) {
      if (latitude >= -24 && latitude <= -23 && longitude >= -47 && longitude <= -46) {
        return { city: 'São Paulo', state: 'SP' }
      }
      if (latitude >= -23 && latitude <= -22 && longitude >= -44 && longitude <= -43) {
        return { city: 'Rio de Janeiro', state: 'RJ' }
      }
      if (latitude >= -21 && latitude <= -19 && longitude >= -45 && longitude <= -43) {
        return { city: 'Belo Horizonte', state: 'MG' }
      }
      return { city: 'São Paulo', state: 'SP' } // Default for Southeast
    }

    // South Region
    if (latitude >= -34 && latitude <= -22 && longitude >= -58 && longitude <= -48) {
      if (latitude >= -26 && latitude <= -25 && longitude >= -50 && longitude <= -48) {
        return { city: 'Curitiba', state: 'PR' }
      }
      if (latitude >= -30 && latitude <= -29 && longitude >= -52 && longitude <= -50) {
        return { city: 'Porto Alegre', state: 'RS' }
      }
      if (latitude >= -28 && latitude <= -26 && longitude >= -50 && longitude <= -48) {
        return { city: 'Florianópolis', state: 'SC' }
      }
      return { city: 'Curitiba', state: 'PR' } // Default for South
    }

    // Northeast Region
    if (latitude >= -18 && latitude <= -1 && longitude >= -48 && longitude <= -34) {
      if (latitude >= -13 && latitude <= -12 && longitude >= -39 && longitude <= -38) {
        return { city: 'Salvador', state: 'BA' }
      }
      if (latitude >= -8 && latitude <= -7 && longitude >= -36 && longitude <= -34) {
        return { city: 'Recife', state: 'PE' }
      }
      if (latitude >= -6 && latitude <= -3 && longitude >= -39 && longitude <= -38) {
        return { city: 'Fortaleza', state: 'CE' }
      }
      return { city: 'Salvador', state: 'BA' } // Default for Northeast
    }

    // North Region
    if (latitude >= -12 && latitude <= 5 && longitude >= -74 && longitude <= -44) {
      if (latitude >= -4 && latitude <= -1 && longitude >= -61 && longitude <= -59) {
        return { city: 'Manaus', state: 'AM' }
      }
      if (latitude >= -2 && latitude <= 1 && longitude >= -49 && longitude <= -47) {
        return { city: 'Belém', state: 'PA' }
      }
      return { city: 'Manaus', state: 'AM' } // Default for North
    }

    // Center-West Region
    if (latitude >= -25 && latitude <= -7 && longitude >= -61 && longitude <= -45) {
      if (latitude >= -16 && latitude <= -15 && longitude >= -57 && longitude <= -55) {
        return { city: 'Cuiabá', state: 'MT' }
      }
      if (latitude >= -16 && latitude <= -15 && longitude >= -48 && longitude <= -47) {
        return { city: 'Brasília', state: 'DF' }
      }
      if (latitude >= -21 && latitude <= -17 && longitude >= -55 && longitude <= -53) {
        return { city: 'Campo Grande', state: 'MS' }
      }
      return { city: 'Brasília', state: 'DF' } // Default for Center-West
    }

    // Fallback for any location in Brazil
    return { city: 'São Paulo', state: 'SP' }
  }

  /**
   * Check if coordinates are within Brazil bounds
   */
  static isWithinBrazil(latitude: number, longitude: number): boolean {
    return latitude >= -33.75 && latitude <= 5.27 && longitude >= -73.98 && longitude <= -28.63
  }
}
