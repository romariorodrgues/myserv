/**
 * Provider Price Management Component - Gerenciamento de preços do prestador
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Edit, Save, X, Plus, Trash2, TrendingUp, AlertCircle, Copy, Eye } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface ServicePrice {
  id: string
  name: string
  category: string
  description?: string
  basePrice: number
  unit: 'HOUR' | 'FIXED' | 'SQUARE_METER' | 'ROOM' | 'CUSTOM'
  customUnit?: string
  minPrice?: number
  maxPrice?: number
  isActive: boolean
  isPromotional: boolean
  promotionalPrice?: number
  promotionalEndDate?: string
  variations: Array<{
    id: string
    name: string
    description?: string
    priceModifier: number // percentage or fixed amount
    modifierType: 'PERCENTAGE' | 'FIXED'
  }>
  addOns: Array<{
    id: string
    name: string
    description?: string
    price: number
    isOptional: boolean
  }>
  competitorPrices?: Array<{
    competitor: string
    price: number
    lastUpdated: string
  }>
}

interface PriceTemplate {
  id: string
  name: string
  category: string
  basePrice: number
  unit: string
}

interface ProviderPriceManagementProps {
  providerId?: string
}

const UNIT_LABELS = {
  HOUR: 'Por hora',
  FIXED: 'Preço fixo',
  SQUARE_METER: 'Por m²',
  ROOM: 'Por cômodo',
  CUSTOM: 'Personalizado'
}

const POPULAR_TEMPLATES: PriceTemplate[] = [
  { id: '1', name: 'Limpeza Residencial', category: 'Limpeza', basePrice: 120, unit: 'FIXED' },
  { id: '2', name: 'Limpeza Comercial', category: 'Limpeza', basePrice: 25, unit: 'SQUARE_METER' },
  { id: '3', name: 'Instalação Elétrica', category: 'Elétrica', basePrice: 80, unit: 'HOUR' },
  { id: '4', name: 'Pintura', category: 'Pintura', basePrice: 35, unit: 'SQUARE_METER' },
  { id: '5', name: 'Jardinagem', category: 'Jardinagem', basePrice: 60, unit: 'HOUR' }
]

export function ProviderPriceManagement({ providerId }: ProviderPriceManagementProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [services, setServices] = useState<ServicePrice[]>([])
  const [editingService, setEditingService] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showAddService, setShowAddService] = useState(false)
  
  const [newService, setNewService] = useState<Partial<ServicePrice>>({
    name: '',
    category: '',
    description: '',
    basePrice: 0,
    unit: 'FIXED',
    isActive: true,
    isPromotional: false,
    variations: [],
    addOns: []
  })

  useEffect(() => {
    fetchServices()
  }, [providerId])

  const fetchServices = async () => {
    try {
      setLoading(true)
      
      // Mock data - replace with actual API call
      const mockServices: ServicePrice[] = [
        {
          id: '1',
          name: 'Limpeza Residencial Básica',
          category: 'Limpeza',
          description: 'Limpeza completa de casa ou apartamento até 3 quartos',
          basePrice: 120,
          unit: 'FIXED',
          minPrice: 80,
          maxPrice: 200,
          isActive: true,
          isPromotional: false,
          variations: [
            { id: '1', name: 'Casa Grande (4+ quartos)', description: 'Acréscimo para casas maiores', priceModifier: 30, modifierType: 'PERCENTAGE' },
            { id: '2', name: 'Limpeza Pesada', description: 'Para limpezas mais intensas', priceModifier: 50, modifierType: 'FIXED' }
          ],
          addOns: [
            { id: '1', name: 'Limpeza de Geladeira', description: 'Limpeza interna da geladeira', price: 25, isOptional: true },
            { id: '2', name: 'Limpeza de Forno', description: 'Limpeza interna do forno', price: 20, isOptional: true }
          ],
          competitorPrices: [
            { competitor: 'CleanPro', price: 110, lastUpdated: '2025-06-10T10:00:00Z' },
            { competitor: 'LimpFácil', price: 135, lastUpdated: '2025-06-08T15:30:00Z' }
          ]
        },
        {
          id: '2',
          name: 'Limpeza Pós-Obra',
          category: 'Limpeza',
          description: 'Limpeza especializada após reformas e construções',
          basePrice: 45,
          unit: 'SQUARE_METER',
          minPrice: 200,
          maxPrice: 800,
          isActive: true,
          isPromotional: true,
          promotionalPrice: 38,
          promotionalEndDate: '2025-07-31T23:59:59Z',
          variations: [
            { id: '3', name: 'Obra Pesada', description: 'Para obras com muito entulho', priceModifier: 25, modifierType: 'PERCENTAGE' }
          ],
          addOns: [
            { id: '3', name: 'Remoção de Entulho', description: 'Remoção de entulho pequeno', price: 100, isOptional: true }
          ]
        },
        {
          id: '3',
          name: 'Limpeza de Escritório',
          category: 'Limpeza',
          description: 'Limpeza periódica de ambientes comerciais',
          basePrice: 65,
          unit: 'HOUR',
          isActive: false,
          isPromotional: false,
          variations: [],
          addOns: []
        }
      ]

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setServices(mockServices)
      
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveService = async (service: ServicePrice) => {
    try {
      setSaving(true)
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setServices(prev => 
        prev.map(s => s.id === service.id ? service : s)
      )
      
      setEditingService(null)
      toast.success('Serviço atualizado com sucesso!')
      
    } catch (error) {
      console.error('Error saving service:', error)
      toast.error('Erro ao salvar serviço')
    } finally {
      setSaving(false)
    }
  }

  const handleAddService = async () => {
    if (!newService.name || !newService.category || !newService.basePrice) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      setSaving(true)
      
      const serviceToAdd: ServicePrice = {
        id: Date.now().toString(),
        name: newService.name!,
        category: newService.category!,
        description: newService.description,
        basePrice: newService.basePrice!,
        unit: newService.unit!,
        customUnit: newService.customUnit,
        minPrice: newService.minPrice,
        maxPrice: newService.maxPrice,
        isActive: newService.isActive!,
        isPromotional: newService.isPromotional!,
        promotionalPrice: newService.promotionalPrice,
        promotionalEndDate: newService.promotionalEndDate,
        variations: [],
        addOns: []
      }

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setServices(prev => [...prev, serviceToAdd])
      setNewService({
        name: '',
        category: '',
        description: '',
        basePrice: 0,
        unit: 'FIXED',
        isActive: true,
        isPromotional: false,
        variations: [],
        addOns: []
      })
      setShowAddService(false)
      toast.success('Serviço adicionado com sucesso!')
      
    } catch (error) {
      console.error('Error adding service:', error)
      toast.error('Erro ao adicionar serviço')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    try {
      setSaving(true)
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setServices(prev => prev.filter(s => s.id !== serviceId))
      toast.success('Serviço excluído com sucesso!')
      
    } catch (error) {
      console.error('Error deleting service:', error)
      toast.error('Erro ao excluir serviço')
    } finally {
      setSaving(false)
    }
  }

  const toggleServiceStatus = async (serviceId: string) => {
    try {
      const service = services.find(s => s.id === serviceId)
      if (!service) return

      const updatedService = { ...service, isActive: !service.isActive }
      await handleSaveService(updatedService)
      
    } catch (error) {
      console.error('Error toggling service status:', error)
      toast.error('Erro ao alterar status do serviço')
    }
  }

  const useTemplate = (template: PriceTemplate) => {
    setNewService({
      name: template.name,
      category: template.category,
      basePrice: template.basePrice,
      unit: template.unit as any,
      description: '',
      isActive: true,
      isPromotional: false,
      variations: [],
      addOns: []
    })
    setShowTemplates(false)
    setShowAddService(true)
  }

  const duplicateService = (service: ServicePrice) => {
    const duplicated = {
      ...service,
      id: Date.now().toString(),
      name: `${service.name} (Cópia)`,
      isActive: false
    }
    
    setServices(prev => [...prev, duplicated])
    toast.success('Serviço duplicado com sucesso!')
  }

  const calculateFinalPrice = (service: ServicePrice, quantity: number = 1) => {
    const basePrice = service.isPromotional && service.promotionalPrice 
      ? service.promotionalPrice 
      : service.basePrice
      
    return basePrice * quantity
  }

  const getCompetitorComparison = (service: ServicePrice) => {
    if (!service.competitorPrices || service.competitorPrices.length === 0) return null
    
    const avgCompetitorPrice = service.competitorPrices.reduce((sum, comp) => sum + comp.price, 0) / service.competitorPrices.length
    const myPrice = service.isPromotional && service.promotionalPrice ? service.promotionalPrice : service.basePrice
    const difference = ((myPrice - avgCompetitorPrice) / avgCompetitorPrice) * 100
    
    return {
      avgPrice: avgCompetitorPrice,
      difference,
      isCompetitive: Math.abs(difference) <= 10
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Preços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Gerenciamento de Preços</span>
              <Badge variant="secondary">{services.length}</Badge>
            </CardTitle>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowTemplates(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Templates
              </Button>
              <Button onClick={() => setShowAddService(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Serviço
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Services List */}
      <div className="space-y-4">
        {services.map((service) => {
          const isEditing = editingService === service.id
          const comparison = getCompetitorComparison(service)
          
          return (
            <Card key={service.id}>
              <CardContent className="p-6">
                {isEditing ? (
                  <ServiceEditForm
                    service={service}
                    onSave={handleSaveService}
                    onCancel={() => setEditingService(null)}
                    saving={saving}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-3 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium">{service.name}</h3>
                          <Badge variant="outline">{service.category}</Badge>
                          {service.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
                          )}
                          {service.isPromotional && (
                            <Badge className="bg-red-100 text-red-800">Promoção</Badge>
                          )}
                        </div>
                        
                        {service.description && (
                          <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500">Preço Base</Label>
                            <p className="text-lg font-semibold">
                              R$ {service.basePrice.toFixed(2)}
                              <span className="text-sm text-gray-500 ml-1">
                                {UNIT_LABELS[service.unit]}
                                {service.unit === 'CUSTOM' && service.customUnit && ` (${service.customUnit})`}
                              </span>
                            </p>
                          </div>
                          
                          {service.isPromotional && service.promotionalPrice && (
                            <div>
                              <Label className="text-xs text-gray-500">Preço Promocional</Label>
                              <p className="text-lg font-semibold text-red-600">
                                R$ {service.promotionalPrice.toFixed(2)}
                                <span className="text-sm text-gray-500 ml-1">
                                  {UNIT_LABELS[service.unit]}
                                </span>
                              </p>
                              {service.promotionalEndDate && (
                                <p className="text-xs text-gray-500">
                                  Até {new Date(service.promotionalEndDate).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {service.minPrice && service.maxPrice && (
                            <div>
                              <Label className="text-xs text-gray-500">Faixa de Preço</Label>
                              <p className="text-sm">
                                R$ {service.minPrice} - R$ {service.maxPrice}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={service.isActive}
                          onCheckedChange={() => toggleServiceStatus(service.id)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => duplicateService(service)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingService(service.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Variations and Add-ons */}
                    {(service.variations.length > 0 || service.addOns.length > 0) && (
                      <div className="space-y-3">
                        <Separator />
                        
                        {service.variations.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Variações</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              {service.variations.map((variation) => (
                                <div key={variation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm">{variation.name}</span>
                                  <span className="text-sm font-medium">
                                    {variation.modifierType === 'PERCENTAGE' ? '+' : '+'}{variation.priceModifier}
                                    {variation.modifierType === 'PERCENTAGE' ? '%' : ' R$'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {service.addOns.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Adicionais</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              {service.addOns.map((addOn) => (
                                <div key={addOn.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm">{addOn.name}</span>
                                  <span className="text-sm font-medium">+R$ {addOn.price.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Competitor Comparison */}
                    {comparison && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Comparação com Concorrentes</Label>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">
                              Média: R$ {comparison.avgPrice.toFixed(2)}
                            </span>
                            <Badge className={
                              comparison.difference > 10 ? 'bg-red-100 text-red-800' :
                              comparison.difference < -10 ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {comparison.difference > 0 ? '+' : ''}{comparison.difference.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add Service Modal */}
      {showAddService && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Adicionar Novo Serviço</CardTitle>
              <Button variant="ghost" onClick={() => setShowAddService(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="service-name">Nome do Serviço *</Label>
                  <Input
                    id="service-name"
                    value={newService.name || ''}
                    onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Limpeza Residencial"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service-category">Categoria *</Label>
                  <Input
                    id="service-category"
                    value={newService.category || ''}
                    onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Ex: Limpeza"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service-price">Preço Base *</Label>
                  <Input
                    id="service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newService.basePrice || ''}
                    onChange={(e) => setNewService(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service-unit">Unidade de Cobrança</Label>
                  <select
                    id="service-unit"
                    value={newService.unit || 'FIXED'}
                    onChange={(e) => setNewService(prev => ({ ...prev, unit: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(UNIT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="service-description">Descrição</Label>
                <Textarea
                  id="service-description"
                  value={newService.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o que está incluso no serviço..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newService.isActive || false}
                    onCheckedChange={(checked: boolean) => setNewService(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>Serviço ativo</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newService.isPromotional || false}
                    onCheckedChange={(checked: boolean) => setNewService(prev => ({ ...prev, isPromotional: checked }))}
                  />
                  <Label>Preço promocional</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddService(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddService} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Serviço'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Templates de Serviços</CardTitle>
              <Button variant="ghost" onClick={() => setShowTemplates(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {POPULAR_TEMPLATES.map((template) => (
                <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => useTemplate(template)}>
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.category}</p>
                  <p className="text-lg font-semibold mt-2">
                    R$ {template.basePrice.toFixed(2)}
                    <span className="text-sm text-gray-500 ml-1">
                      {UNIT_LABELS[template.unit as keyof typeof UNIT_LABELS]}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Service Edit Form Component
interface ServiceEditFormProps {
  service: ServicePrice
  onSave: (service: ServicePrice) => void
  onCancel: () => void
  saving: boolean
}

function ServiceEditForm({ service, onSave, onCancel, saving }: ServiceEditFormProps) {
  const [editedService, setEditedService] = useState<ServicePrice>({ ...service })

  const handleSave = () => {
    onSave(editedService)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Serviço</Label>
          <Input
            value={editedService.name}
            onChange={(e) => setEditedService(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Input
            value={editedService.category}
            onChange={(e) => setEditedService(prev => ({ ...prev, category: e.target.value }))}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Preço Base</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={editedService.basePrice}
            onChange={(e) => setEditedService(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Unidade</Label>
          <select
            value={editedService.unit}
            onChange={(e) => setEditedService(prev => ({ ...prev, unit: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(UNIT_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          value={editedService.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedService(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Switch
            checked={editedService.isActive}
            onCheckedChange={(checked: boolean) => setEditedService(prev => ({ ...prev, isActive: checked }))}
          />
          <Label>Ativo</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={editedService.isPromotional}
            onCheckedChange={(checked: boolean) => setEditedService(prev => ({ ...prev, isPromotional: checked }))}
          />
          <Label>Promocional</Label>
        </div>
      </div>
      
      {editedService.isPromotional && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Preço Promocional</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editedService.promotionalPrice || ''}
              onChange={(e) => setEditedService(prev => ({ ...prev, promotionalPrice: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Data de Término</Label>
            <Input
              type="date"
              value={editedService.promotionalEndDate ? editedService.promotionalEndDate.split('T')[0] : ''}
              onChange={(e) => setEditedService(prev => ({ ...prev, promotionalEndDate: e.target.value ? `${e.target.value}T23:59:59Z` : undefined }))}
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  )
}
