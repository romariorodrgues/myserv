import { GoogleMapsServerService } from '@/lib/maps-server'
import calculateTravelPricing from '@/lib/travel-calculator'
import { createAvatarPresignedPost, getObjectPresignedUrl, s3 } from '@/lib/spaces'
import { HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

type MapTestReport = {
  geocode?: {
    success: boolean
    latitude?: number
    longitude?: number
    formattedAddress?: string
  }
  reverseGeocode?: {
    success: boolean
    latitude?: number
    longitude?: number
    formattedAddress?: string
  }
  distance?: {
    success: boolean
    distanceKm?: number | null
    durationMinutes?: number | null
    usedFallback?: boolean
  }
  autocomplete?: {
    success: boolean
    suggestionCount: number
    firstSuggestion?: string
  }
  travelPricing?: {
    success: boolean
    travelCost: number
    distanceKm?: number | null
    durationMinutes?: number | null
    usedFallback: boolean
    warnings: string[]
  }
  errors: string[]
}

type SpacesTestReport = {
  presign?: {
    success: boolean
    uploadUrlHost?: string
    key?: string
    fieldNames?: string[]
  }
  upload?: {
    success: boolean
    status?: number
  }
  cdnAccess?: {
    success: boolean
    status?: number
  }
  headCheck?: {
    success: boolean
    contentLength?: number
    contentType?: string
  }
  presignedGet?: {
    success: boolean
    url?: string
  }
  cleanup?: {
    success: boolean
  }
  errors: string[]
}

function requireEnvVars(vars: string[]): string[] {
  return vars.filter((name) => !process.env[name])
}

async function testMaps(): Promise<MapTestReport> {
  const report: MapTestReport = { errors: [] }

  const address = 'Avenida Paulista, 1000 - São Paulo'
  try {
    const geocode = await GoogleMapsServerService.geocodeAddress(address)
    if (geocode) {
      report.geocode = {
        success: true,
        latitude: geocode.latitude,
        longitude: geocode.longitude,
        formattedAddress: geocode.formattedAddress,
      }
    } else {
      report.geocode = { success: false }
      report.errors.push('Geocode retornou nulo')
    }
  } catch (error) {
    report.errors.push(`Erro no geocode: ${error instanceof Error ? error.message : String(error)}`)
    report.geocode = { success: false }
  }

  const reverseSource = report.geocode?.success && report.geocode.latitude && report.geocode.longitude
    ? { lat: report.geocode.latitude, lng: report.geocode.longitude }
    : { lat: -23.561684, lng: -46.655981 }

  try {
    const reverse = await GoogleMapsServerService.reverseGeocode(reverseSource.lat, reverseSource.lng)
    if (reverse) {
      report.reverseGeocode = {
        success: true,
        latitude: reverse.latitude,
        longitude: reverse.longitude,
        formattedAddress: reverse.formattedAddress,
      }
    } else {
      report.reverseGeocode = { success: false }
      report.errors.push('Reverse geocode retornou nulo')
    }
  } catch (error) {
    report.errors.push(`Erro no reverse geocode: ${error instanceof Error ? error.message : String(error)}`)
    report.reverseGeocode = { success: false }
  }

  try {
    const origin = reverseSource
    const destination = { lat: -23.55052, lng: -46.633308 }
    const distance = await GoogleMapsServerService.calculateDistance(origin, destination)

    if (distance) {
      report.distance = {
        success: true,
        distanceKm: distance.distance,
        durationMinutes: distance.duration,
        usedFallback: false,
      }
    } else {
      report.distance = { success: false }
      report.errors.push('Distance matrix retornou nulo')
    }
  } catch (error) {
    report.errors.push(`Erro no distance matrix: ${error instanceof Error ? error.message : String(error)}`)
    report.distance = { success: false }
  }

  try {
    const predictions = await GoogleMapsServerService.autocomplete('Avenida Paulista 1000', {
      location: reverseSource,
      radius: 5000,
    })

    report.autocomplete = {
      success: Array.isArray(predictions) && predictions.length > 0,
      suggestionCount: predictions.length,
      firstSuggestion: predictions[0]?.description,
    }
    if (!report.autocomplete.success) {
      report.errors.push('Autocomplete não retornou sugestões')
    }
  } catch (error) {
    report.errors.push(`Erro no autocomplete: ${error instanceof Error ? error.message : String(error)}`)
    report.autocomplete = { success: false, suggestionCount: 0 }
  }

  try {
    const travelResult = await calculateTravelPricing({
      provider: {
        coords: reverseSource,
        addressString: address,
        travel: {
          chargesTravel: true,
          travelRatePerKm: 2.5,
          travelMinimumFee: 15,
          travelFixedFee: 5,
          waivesTravelOnHire: false,
        },
      },
      client: {
        coords: { lat: -23.55052, lng: -46.633308 },
        addressString: 'Praça da Sé, São Paulo',
      },
      basePrice: 120,
    })

    report.travelPricing = {
      success: travelResult.success,
      travelCost: travelResult.travelCost,
      distanceKm: travelResult.distanceKm,
      durationMinutes: travelResult.durationMinutes,
      usedFallback: travelResult.usedFallback,
      warnings: travelResult.warnings,
    }

    if (!travelResult.success) {
      report.errors.push('Calculo de deslocamento retornou falha')
    }
  } catch (error) {
    report.errors.push(`Erro no cálculo de deslocamento: ${error instanceof Error ? error.message : String(error)}`)
    report.travelPricing = { success: false, travelCost: 0, usedFallback: true, warnings: [] }
  }

  return report
}

async function testSpaces(): Promise<SpacesTestReport> {
  const report: SpacesTestReport = { errors: [] }

  const bucket = process.env.SPACES_PUBLIC_BUCKET
  if (!bucket) {
    report.errors.push('SPACES_PUBLIC_BUCKET não configurado')
    return report
  }

  const key = `public/avatars/test/${Date.now()}-codex.png`

  try {
    const { url, fields } = await createAvatarPresignedPost({
      bucket,
      key,
      maxMB: 2,
      contentType: 'image/png',
    })

    const uploadUrlHost = (() => {
      try {
        return new URL(url).host
      } catch {
        return undefined
      }
    })()

    report.presign = {
      success: true,
      uploadUrlHost,
      key,
      fieldNames: Object.keys(fields),
    }

    const transparentPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAnEB9pW7x8kAAAAASUVORK5CYII=',
      'base64',
    )

    const formData = new FormData()
    Object.entries(fields).forEach(([name, value]) => {
      formData.set(name, value)
    })
    formData.set('file', new Blob([transparentPng], { type: 'image/png' }), 'avatar.png')

    const uploadResponse = await fetch(url, {
      method: 'POST',
      body: formData,
    })

    report.upload = {
      success: uploadResponse.ok,
      status: uploadResponse.status,
    }

    if (!uploadResponse.ok) {
      const bodyText = await uploadResponse.text().catch(() => '')
      report.errors.push(`Upload falhou com status ${uploadResponse.status} ${bodyText}`)
      return report
    }

    const cdnHost = (process.env.SPACES_PUBLIC_CDN_HOST || '').replace(/^https?:\/\//, '')
    const publicUrl = cdnHost
      ? `https://${cdnHost}/${key}`
      : new URL(key, url.endsWith('/') ? url : `${url}/`).toString()

    try {
      const cdnResponse = await fetch(publicUrl, { method: 'GET' })
      report.cdnAccess = {
        success: cdnResponse.ok,
        status: cdnResponse.status,
      }
      if (!cdnResponse.ok) {
        report.errors.push(`CDN acesso falhou (${cdnResponse.status}) para ${publicUrl}`)
      }
    } catch (error) {
      report.errors.push(`Erro ao acessar CDN: ${error instanceof Error ? error.message : String(error)}`)
      report.cdnAccess = { success: false }
    }

    const headResult = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    report.headCheck = {
      success: true,
      contentLength: Number(headResult.ContentLength ?? 0),
      contentType: headResult.ContentType,
    }

    const presignedGetUrl = await getObjectPresignedUrl(bucket, key, 30)
    report.presignedGet = {
      success: !!presignedGetUrl,
      url: presignedGetUrl,
    }

    const cleanupResult = await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    report.cleanup = { success: cleanupResult.$metadata.httpStatusCode === 204 || !cleanupResult.$metadata.httpStatusCode }
  } catch (error) {
    report.errors.push(`Erro no teste do Spaces: ${error instanceof Error ? error.message : String(error)}`)
  }

  return report
}

async function main() {
  const missingMapsEnv = requireEnvVars([
    'GOOGLE_MAPS_API_KEY',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  ])

  const missingSpacesEnv = requireEnvVars([
    'SPACES_PUBLIC_ENDPOINT',
    'SPACES_PUBLIC_REGION',
    'SPACES_PUBLIC_KEY',
    'SPACES_PUBLIC_SECRET',
    'SPACES_PUBLIC_BUCKET',
  ])

  if (missingMapsEnv.length > 0) {
    console.warn('[Aviso] Variáveis de ambiente ausentes para Google Maps:', missingMapsEnv.join(', '))
  }
  if (missingSpacesEnv.length > 0) {
    console.warn('[Aviso] Variáveis de ambiente ausentes para Spaces:', missingSpacesEnv.join(', '))
  }

  const [maps, spaces] = await Promise.allSettled([testMaps(), testSpaces()])

  const mapsReport = maps.status === 'fulfilled' ? maps.value : { errors: [`${maps.reason}`] }
  const spacesReport = spaces.status === 'fulfilled' ? spaces.value : { errors: [`${spaces.reason}`] }

  const output = {
    timestamp: new Date().toISOString(),
    maps: mapsReport,
    spaces: spacesReport,
  }

  console.log(JSON.stringify(output, null, 2))
}

main().catch((error) => {
  console.error('Teste geral falhou:', error)
  process.exitCode = 1
})
