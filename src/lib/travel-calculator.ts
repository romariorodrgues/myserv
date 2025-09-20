import GoogleMapsServerService from '@/lib/maps-server'

type Coordinates = {
  lat: number
  lng: number
}

export interface ProviderTravelSettings {
  chargesTravel: boolean
  travelRatePerKm?: number | null
  travelMinimumFee?: number | null
  travelFixedFee?: number | null
  waivesTravelOnHire?: boolean | null
}

export interface TravelCalculationParams {
  provider: {
    coords?: Coordinates | null
    addressString?: string | null
    travel: ProviderTravelSettings
  }
  client: {
    coords?: Coordinates | null
    addressString?: string | null
  }
  basePrice?: number | null
}

export interface TravelCalculationResult {
  success: boolean
  providerLocation?: Coordinates
  clientLocation?: Coordinates
  distanceKm?: number | null
  distanceText?: string
  durationMinutes?: number | null
  durationText?: string
  travelCost: number
  travelCostBreakdown: {
    perKmPortion: number
    fixedFee: number
    minimumFee: number
    appliedMinimum: boolean
    travelRatePerKm?: number | null
    waivesTravelOnHire?: boolean | null
  }
  estimatedTotal?: number | null
  usedFallback: boolean
  warnings: string[]
}

function isValidCoord(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

async function resolveCoordinates(source: { coords?: Coordinates | null; addressString?: string | null }): Promise<{ coords: Coordinates | null; warnings: string[]; resolvedBy: 'input' | 'geocode' | null }> {
  if (source.coords && isValidCoord(source.coords.lat) && isValidCoord(source.coords.lng)) {
    return { coords: { lat: source.coords.lat, lng: source.coords.lng }, warnings: [], resolvedBy: 'input' }
  }

  if (source.addressString) {
    try {
      const geocoded = await GoogleMapsServerService.geocodeAddress(source.addressString)
      if (geocoded) {
        return {
          coords: { lat: geocoded.latitude, lng: geocoded.longitude },
          warnings: [],
          resolvedBy: 'geocode'
        }
      }
      return { coords: null, warnings: ['Não foi possível geocodificar o endereço informado.'], resolvedBy: null }
    } catch (error) {
      console.error('[travel-calculator] geocode error', error)
      return { coords: null, warnings: ['Erro ao geocodificar endereço.'], resolvedBy: null }
    }
  }

  return { coords: null, warnings: ['Localização não informada.'], resolvedBy: null }
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371 // km
  const dLat = toRadians(b.lat - a.lat)
  const dLon = toRadians(b.lng - a.lng)

  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
  return R * c
}

export async function calculateTravelPricing(params: TravelCalculationParams): Promise<TravelCalculationResult> {
  const warnings: string[] = []

  const providerResolution = await resolveCoordinates({
    coords: params.provider.coords,
    addressString: params.provider.addressString,
  })
  warnings.push(...providerResolution.warnings)

  const clientResolution = await resolveCoordinates({
    coords: params.client.coords,
    addressString: params.client.addressString,
  })
  warnings.push(...clientResolution.warnings)

  const providerLocation = providerResolution.coords
  const clientLocation = clientResolution.coords

  if (!providerLocation || !clientLocation) {
    return {
      success: false,
      providerLocation: providerLocation ?? undefined,
      clientLocation: clientLocation ?? undefined,
      travelCost: 0,
      travelCostBreakdown: {
        perKmPortion: 0,
        fixedFee: params.provider.travel.travelFixedFee ?? 0,
        minimumFee: params.provider.travel.travelMinimumFee ?? 0,
        appliedMinimum: false,
        travelRatePerKm: params.provider.travel.travelRatePerKm,
        waivesTravelOnHire: params.provider.travel.waivesTravelOnHire ?? null,
      },
      estimatedTotal: params.basePrice ?? null,
      distanceKm: null,
      durationMinutes: null,
      usedFallback: true,
      warnings,
    }
  }

  let distanceKm: number | null = null
  let durationMinutes: number | null = null
  let distanceText: string | undefined
  let durationText: string | undefined
  let usedFallback = false

  try {
    const matrix = await GoogleMapsServerService.calculateDistance(providerLocation, clientLocation)
    if (matrix) {
      distanceKm = matrix.distance
      durationMinutes = matrix.duration
      distanceText = matrix.distanceText
      durationText = matrix.durationText
    } else {
      usedFallback = true
    }
  } catch (error) {
    console.error('[travel-calculator] distance matrix error', error)
    usedFallback = true
  }

  if (distanceKm == null) {
    distanceKm = haversineDistance(providerLocation, clientLocation)
    distanceKm = Number.isFinite(distanceKm) ? Math.max(distanceKm, 0) : null
  }

  const travelSettings = params.provider.travel
  const perKmRate = travelSettings.travelRatePerKm ?? null
  const fixedFee = travelSettings.travelFixedFee ?? 0
  const minimumFee = travelSettings.travelMinimumFee ?? 0

  let perKmPortion = 0
  let totalTravel = 0
  let appliedMinimum = false

  if (travelSettings.chargesTravel && distanceKm != null && perKmRate != null) {
    perKmPortion = perKmRate * distanceKm
    totalTravel = perKmPortion + fixedFee
  } else if (travelSettings.chargesTravel) {
    // cobra deslocamento mas não há taxa por km ou não foi possível medir distância
    totalTravel = fixedFee
  } else {
    totalTravel = fixedFee
  }

  if (minimumFee > 0) {
    if (totalTravel < minimumFee) {
      totalTravel = minimumFee
      appliedMinimum = true
    }
  }

  // arredonda para 2 casas
  totalTravel = Math.round(totalTravel * 100) / 100
  perKmPortion = Math.round(perKmPortion * 100) / 100

  const estimatedTotal = params.basePrice != null
    ? Math.round((params.basePrice + totalTravel) * 100) / 100
    : null

  return {
    success: true,
    providerLocation,
    clientLocation,
    distanceKm,
    distanceText,
    durationMinutes,
    durationText,
    travelCost: totalTravel,
    travelCostBreakdown: {
      perKmPortion,
      fixedFee,
      minimumFee,
      appliedMinimum,
      travelRatePerKm: perKmRate,
      waivesTravelOnHire: travelSettings.waivesTravelOnHire ?? null,
    },
    estimatedTotal,
    usedFallback,
    warnings,
  }
}

export default calculateTravelPricing
