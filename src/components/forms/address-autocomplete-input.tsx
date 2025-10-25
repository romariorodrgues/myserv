import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2, MapPin, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddressAutocompleteInputProps {
  label?: string
  placeholder?: string
  value: string
  disabled?: boolean
  error?: string | null
  onChange?: (value: string) => void
  onResolved?: (address: {
    formatted: string
    addressLine: string
    city?: string
    state?: string
    postalCode?: string
    latitude?: number
    longitude?: number
    components?: Record<string, any>
  }) => void
}

interface Prediction {
  description: string
  place_id: string
}

const MIN_QUERY_LENGTH = 4
const DEBOUNCE_DELAY = 250

export function AddressAutocompleteInput({
  label,
  placeholder,
  value,
  disabled,
  error,
  onChange,
  onResolved
}: AddressAutocompleteInputProps) {
  const [internalValue, setInternalValue] = useState(value)
  const [loadingPredictions, setLoadingPredictions] = useState(false)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const trimmedQuery = useMemo(() => internalValue.trim(), [internalValue])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (event.target instanceof Node && !containerRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!trimmedQuery || trimmedQuery.length < MIN_QUERY_LENGTH) {
      setPredictions([])
      setLoadingPredictions(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoadingPredictions(true)
        const response = await fetch(`/api/geolocation?q=${encodeURIComponent(trimmedQuery)}`)
        if (!response.ok) {
          setPredictions([])
          return
        }
        const data = await response.json()
        const formattedPredictions: Prediction[] = (data?.predictions || []).map((item: any) => ({
          description: item.description,
          place_id: item.place_id
        }))
        setPredictions(formattedPredictions)
        setShowDropdown(formattedPredictions.length > 0)
      } catch (fetchError) {
        console.error('[AddressAutocompleteInput] Error fetching predictions', fetchError)
        setPredictions([])
      } finally {
        setLoadingPredictions(false)
      }
    }, DEBOUNCE_DELAY)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [trimmedQuery])

  const handleSelectPrediction = async (prediction: Prediction) => {
    setInternalValue(prediction.description)
    setPredictions([])
    setShowDropdown(false)
    onChange?.(prediction.description)

    try {
      const response = await fetch('/api/geolocation?type=forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: prediction.description })
      })

      if (!response.ok) {
        console.error('[AddressAutocompleteInput] Failed to resolve address', await response.text())
        return
      }

      const data = await response.json()
      const result = data?.result
      if (!result) return

      setInternalValue(result.address ?? result.formatted ?? prediction.description)
      onChange?.(result.address ?? result.formatted ?? prediction.description)

      onResolved?.({
        formatted: result.formatted ?? prediction.description,
        addressLine: result.address ?? prediction.description,
        city: result.city || undefined,
        state: result.state || undefined,
        postalCode: result.postalCode || undefined,
        latitude: result.lat ?? undefined,
        longitude: result.lng ?? undefined,
        components: result.components ?? undefined
      })
    } catch (resolutionError) {
      console.error('[AddressAutocompleteInput] Error resolving address', resolutionError)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {label ? (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <Input
          value={internalValue}
          disabled={disabled}
          onChange={(event) => {
            setInternalValue(event.target.value)
            onChange?.(event.target.value)
            if (!showDropdown) setShowDropdown(true)
          }}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowDropdown(true)
            }
          }}
          placeholder={placeholder ?? 'Digite o endereço completo'}
          className={cn(error ? 'border-red-500 focus-visible:ring-red-500' : '')}
        />
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-gray-500">
          Use as sugestões para garantir um endereço válido.
        </p>
      )}

      {showDropdown && (predictions.length > 0 || loadingPredictions) && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
          {loadingPredictions ? (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando endereços...
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {predictions.map((prediction) => (
                <li key={prediction.place_id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50"
                    onClick={() => handleSelectPrediction(prediction)}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 text-blue-500" />
                    <span>{prediction.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default AddressAutocompleteInput
