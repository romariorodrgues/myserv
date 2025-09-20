export interface Address {
  street: string
  number: string
  district: string
  city: string
  state: string
  zipCode: string
  latitude?: number
  longitude: number
}

export interface LocationResult {
  address: Address
  latitude: number
  longitude: number
  formattedAddress: string
}

export interface DistanceResult {
  distance: number // in kilometers
  duration: number // in minutes
  distanceText: string
  durationText: string
}
