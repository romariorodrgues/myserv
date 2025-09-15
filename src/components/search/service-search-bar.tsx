'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AddressSearch from '@/components/maps/address-search'
import ServiceSuggestInput from '@/components/services/service-suggest-input' // <- seu suggest já criado
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

type SelectedService =
  | { type: 'leaf'; id: string; name: string }
  | { type: 'text'; q: string }
  | null

export default function ServiceSearchBar() {
  const router = useRouter()
  const params = useSearchParams()

  // estado inicial vindo da URL (permite deep-link/sharing)
  const [serviceSel, setServiceSel] = useState<SelectedService>(() => {
    const leafCategoryId = params.get('leafCategoryId')
    const q = params.get('q')
    if (leafCategoryId) return { type: 'leaf', id: leafCategoryId, name: '' }
    if (q) return { type: 'text', q }
    return null
  })

  const [city, setCity] = useState<string>(params.get('city') ?? '')
  const [state, setStateUF] = useState<string>(params.get('state') ?? '')
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({
    lat: params.get('lat') ? Number(params.get('lat')) : undefined,
    lng: params.get('lng') ? Number(params.get('lng')) : undefined,
  })
  const [radiusKm, setRadiusKm] = useState<number>(Number(params.get('radiusKm') ?? 30))
  const [sortBy, setSortBy] = useState<'RELEVANCE' | 'PRICE_LOW' | 'PRICE_HIGH' | 'NEWEST'>(
    (params.get('sortBy') as any) || 'RELEVANCE'
  )

  // quando o usuário seleciona um serviço no suggest
  const handleServiceSelect = (item: { id?: string; name: string; type: 'leaf' | 'text' }) => {
    if (item.type === 'leaf' && item.id) setServiceSel({ type: 'leaf', id: item.id, name: item.name })
    else setServiceSel({ type: 'text', q: item.name })
  }

  // quando seleciona um endereço
  const handleAddressSelect = (loc: {
    latitude: number; longitude: number; formattedAddress: string; address: { city?: string; state?: string }
  }) => {
    setCoords({ lat: loc.latitude, lng: loc.longitude })
    const c = loc.address.city ?? ''
    const uf = loc.address.state ?? ''
    setCity(c)
    setStateUF(uf)
  }

  const buildQuery = () => {
    const sp = new URLSearchParams()

    // serviço
    if (serviceSel?.type === 'leaf') sp.set('leafCategoryId', serviceSel.id)
    else if (serviceSel?.type === 'text' && serviceSel.q.trim()) sp.set('q', serviceSel.q.trim())

    // localização
    if (city) sp.set('city', city)
    if (state) sp.set('state', state)
    if (coords.lat != null && coords.lng != null) {
      sp.set('lat', String(coords.lat))
      sp.set('lng', String(coords.lng))
      sp.set('radiusKm', String(radiusKm))
    }

    // ordenação + paginação
    sp.set('sortBy', sortBy)
    sp.set('page', '1') // reseta na nova busca
    sp.set('limit', '20')

    return sp.toString()
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/pesquisa?${buildQuery()}`)
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>Serviço</Label>
          {/* Seu suggest deve chamar handleServiceSelect com {type:'leaf'|'text', id?, name} */}
          <ServiceSuggestInput
            placeholder="Ex.: lavagem de estofados"
            defaultValue={serviceSel?.type === 'text' ? serviceSel.q : ''}
            onSelect={handleServiceSelect}
          />
        </div>

        <div>
          <Label>Localização</Label>
          <AddressSearch
            placeholder="Cidade, endereço ou CEP"
            onAddressSelect={handleAddressSelect}
            className="w-full"
          />
          {/* mostra cidade/UF resolvidos (opcional) */}
          {(city || state) && (
            <div className="text-xs text-muted-foreground mt-1">
              {city}{city && state ? ', ' : ''}{state}
            </div>
          )}
        </div>

        <div>
          <Label>Ordenar por</Label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="RELEVANCE">Relevância</option>
            <option value="PRICE_LOW">Menor preço</option>
            <option value="PRICE_HIGH">Maior preço</option>
            <option value="NEWEST">Mais recentes</option>
          </select>
        </div>
      </div>

      {/* Raio — só faz sentido se tiver coordenadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-2">
          <Label>Raio (km)</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[radiusKm]}
              min={1}
              max={200}
              step={1}
              onValueChange={([v]) => setRadiusKm(v)}
              disabled={coords.lat == null || coords.lng == null}
            />
            <Input
              type="number"
              min={1}
              max={200}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
              className="w-24"
              disabled={coords.lat == null || coords.lng == null}
            />
          </div>
          {coords.lat == null && (
            <div className="text-xs text-muted-foreground mt-1">
              Dica: clique no botão de localização na caixa de endereço para habilitar o filtro por raio.
            </div>
          )}
        </div>
        <div className="flex md:justify-end">
          <Button type="submit" className="w-full md:w-auto">Buscar</Button>
        </div>
      </div>
    </form>
  )
}
