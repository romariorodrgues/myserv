/**
 * Maps Demo page to showcase Interactive Maps integration
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InteractiveMap } from '@/components/maps/interactive-map'

// Sample service provider locations in São Paulo
const sampleLocations = [
  {
    lat: -23.5505,
    lng: -46.6333,
    title: 'Centro de São Paulo',
    address: 'Praça da Sé, São Paulo, SP',
    type: 'service' as const
  },
  {
    lat: -23.5629,
    lng: -46.6544,
    title: 'Vila Madalena',
    address: 'Vila Madalena, São Paulo, SP',
    type: 'provider' as const
  },
  {
    lat: -23.5475,
    lng: -46.6361,
    title: 'Liberdade',
    address: 'Liberdade, São Paulo, SP',
    type: 'provider' as const
  },
  {
    lat: -23.5878,
    lng: -46.6324,
    title: 'Brooklin',
    address: 'Brooklin, São Paulo, SP',
    type: 'service' as const
  }
]

export default function MapsDemo() {
  const [selectedLocations, setSelectedLocations] = useState(sampleLocations.slice(0, 2))
  const [mapCenter, setMapCenter] = useState({ lat: -23.5505, lng: -46.6333 })

  const handleLocationSelect = (location: any) => {
    console.log('Selected location:', location)
  }

  const addAllLocations = () => {
    setSelectedLocations(sampleLocations)
  }

  const clearLocations = () => {
    setSelectedLocations([])
  }

  const centerOnVilaMadalena = () => {
    setMapCenter({ lat: -23.5629, lng: -46.6544 })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Google Maps Integration Demo
          </h1>
          <p className="text-gray-600">
            Demonstração do componente InteractiveMap com integração completa do Google Maps
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Controles do Mapa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button 
                    onClick={addAllLocations} 
                    className="w-full"
                    variant="outline"
                  >
                    Mostrar Todas as Localizações
                  </Button>
                  <Button 
                    onClick={clearLocations} 
                    className="w-full"
                    variant="outline"
                  >
                    Limpar Mapa
                  </Button>
                  <Button 
                    onClick={centerOnVilaMadalena} 
                    className="w-full"
                    variant="outline"
                  >
                    Centralizar em Vila Madalena
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Localizações Ativas:</h4>
                  <div className="space-y-2">
                    {selectedLocations.map((location, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{location.title}</span>
                        <Badge variant={location.type === 'provider' ? 'default' : 'secondary'}>
                          {location.type === 'provider' ? 'Prestador' : 'Serviço'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features List */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Recursos Implementados</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Integração Google Maps API
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Marcadores personalizados
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Detecção de localização
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Busca de endereços
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Cálculo de rotas
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    InfoWindows interativas
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Map Container */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Mapa Interativo</CardTitle>
              </CardHeader>
              <CardContent>
                <InteractiveMap
                  locations={selectedLocations}
                  center={mapCenter}
                  zoom={12}
                  height="600px"
                  showSearch={true}
                  showDirections={true}
                  onLocationSelect={handleLocationSelect}
                  className="rounded-lg overflow-hidden"
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                🗺️ Google Maps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Integração completa com a API do Google Maps para geolocalização, 
                busca de endereços e cálculo de distâncias.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                📊 Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Sistema de relatórios com gráficos interativos, métricas de negócio 
                e exportação de dados em múltiplos formatos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                📅 Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                API completa de agendamento com gestão de disponibilidade, 
                conflitos de horários e integração com calendário.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
