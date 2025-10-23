/**
 * Provider Price Management Component - Gerenciamento de preços do prestador
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useCallback } from 'react'
import { useState, useEffect } from 'react'
import { DollarSign, Edit, Save, X, Plus, Trash2, Copy, Eye } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import CascadingCategoryPicker, { type CascCat } from '@/components/categories/cascading-category-picker'
import { DEFAULT_SERVICE_UNITS, type ServiceUnit } from '@/lib/service-units'

interface ServicePrice {
  id: string
  serviceProviderServiceId: string
  name: string
  category: string
  categoryId: string 
  description?: string
  basePrice: number | null
  unit: string
  // customUnit?: string
  // minPrice?: number
  // maxPrice?: number
  isActive: boolean
  isPromotional: boolean
  promotionalPrice?: number
  promotionalEndDate?: string
  offersScheduling?: boolean
  offersQuoting?: boolean
  providesHomeService?: boolean
  providesLocalService?: boolean
  chargesTravel?: boolean
  quoteFee?: number
  allowScheduling?: boolean
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

const POPULAR_TEMPLATES: PriceTemplate[] = [
  { id: '1', name: 'Limpeza Residencial', category: 'Limpeza', basePrice: 120, unit: 'FIXED' },
  { id: '2', name: 'Limpeza Comercial', category: 'Limpeza', basePrice: 25, unit: 'SQUARE_METER' },
  { id: '3', name: 'Instalação Elétrica', category: 'Elétrica', basePrice: 80, unit: 'HOUR' },
  { id: '4', name: 'Pintura', category: 'Pintura', basePrice: 35, unit: 'SQUARE_METER' },
  { id: '5', name: 'Jardinagem', category: 'Jardinagem', basePrice: 60, unit: 'HOUR' }
]

export function ProviderPriceManagement() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [services, setServices] = useState<ServicePrice[]>([])
  const [editingService, setEditingService] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showAddService, setShowAddService] = useState(false)
  const [categories, setCategories] = useState<Array<{id: string; name: string}>>([])
  const [unitOptions, setUnitOptions] = useState<ServiceUnit[]>(DEFAULT_SERVICE_UNITS)
  const [unitsLoading, setUnitsLoading] = useState(false)

  const [leafCategoryId, setLeafCategoryId] = useState<string | null>(null)
  const [selectedLeaf, setSelectedLeaf] = useState<CascCat | null>(null)

  const [newService, setNewService] = useState({
    name: '',
    description: '',
    basePrice: 0,
    unit: DEFAULT_SERVICE_UNITS[0]?.id ?? 'FIXED',
    categoryId: '',
    isActive: true,
    isPromotional: false,
    offersScheduling: false,
    offersQuoting: true,
    providesHomeService: false,
    providesLocalService: true,
    chargesTravel: false,
    quoteFee: 0,
    // customUnit: '',
    promotionalPrice: 0,
    promotionalEndDate: '',
    variations: [],
    addOns: [],
  })

  const leafAllowsScheduling = selectedLeaf?.allowScheduling ?? true
  const newServiceSchedulingEnabled = leafAllowsScheduling && !!newService.offersScheduling


type APIService = Omit<ServicePrice, 'category' | 'categoryId'> & {
  category: { id: string; name: string; icon?: string; allowScheduling?: boolean }
  serviceProviderServiceId: string
}


  // Busca os serviços reais do prestador
  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/services/my-services')
      const data = await res.json()

      if (!data.success) {
        console.error('Erro ao carregar serviços:', data.error)
        return
      }

      setServices(
        data.services.map((s: APIService) => ({
          id: s.id,
          serviceProviderServiceId: s.serviceProviderServiceId,
          name: s.name,
          category: s.category.name,
          categoryId: s.category?.id ?? '',
          description: s.description,
          basePrice: s.basePrice,
          unit: s.unit || 'FIXED',
          // customUnit: s.customUnit || '',
          // minPrice: s.minPrice || s.basePrice,
          // maxPrice: s.maxPrice || s.basePrice,
          isActive: s.isActive ?? true,
          isPromotional: s.isPromotional ?? false,
          offersScheduling: s.offersScheduling ?? false,
          offersQuoting: s.offersQuoting ?? true,
          allowScheduling: s.category?.allowScheduling ?? true,
          providesHomeService: s.providesHomeService ?? false,
          providesLocalService: s.providesLocalService ?? true,
          chargesTravel: s.chargesTravel ?? false,
          quoteFee: s.quoteFee ?? 0,
          promotionalPrice: s.promotionalPrice ?? null,
          promotionalEndDate: s.promotionalEndDate ?? null,
          variations: s.variations ?? [],
          addOns: s.addOns ?? [],
          competitorPrices: s.competitorPrices ?? []
        }))
      )
      console.log('[SERVIÇOS CARREGADOS]', data.services)

    } catch (error) {
      console.error('Erro ao buscar serviços:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const loadUnits = async () => {
      try {
        setUnitsLoading(true)
        const res = await fetch('/api/service-units', { cache: 'no-store' })
        if (!res.ok) {
          setUnitOptions(DEFAULT_SERVICE_UNITS)
          return
        }
        const data = await res.json()
        if (Array.isArray(data.units) && data.units.length > 0) {
          setUnitOptions(data.units)
        } else {
          setUnitOptions(DEFAULT_SERVICE_UNITS)
        }
      } catch (error) {
        console.error('Erro ao carregar unidades de cobrança:', error)
        setUnitOptions(DEFAULT_SERVICE_UNITS)
      } finally {
        setUnitsLoading(false)
      }
    }

    loadUnits()
  }, [])

  useEffect(() => {
    if (!unitOptions.length) return
    setNewService(prev => (
      unitOptions.some(option => option.id === prev.unit)
        ? prev
        : { ...prev, unit: unitOptions[0].id }
    ))
  }, [unitOptions])

  const getUnitLabel = useCallback(
    (id: string) => unitOptions.find((option) => option.id === id)?.label ?? id,
    [unitOptions]
  )

useEffect(() => {
  

 const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?active=true')
      const data = await res.json()
      setCategories((data.categories ?? []).map((c: any) => ({ id: c.id, name: c.name })))

    } catch (err) {
      console.error('Erro ao buscar categorias:', err)
    }
  }


  fetchCategories()
  fetchServices()
}, [fetchServices])



const handleUpdateService = async (service: ServicePrice) => {
  try {
    setSaving(true);
    const current = services.find(s => s.serviceProviderServiceId === service.serviceProviderServiceId)
    const body: any = {
      // ⚠️ usamos SEMPRE o ID do vínculo (ServiceProviderService)
      serviceProviderServiceId: service.serviceProviderServiceId,
      basePrice: service.offersScheduling ? service.basePrice : null,
      unit: service.unit,
      description: typeof service.description === 'string' ? service.description : undefined,
      isActive: service.isActive,
      offersScheduling: service.offersScheduling,
      offersQuoting: service.offersQuoting,
      providesHomeService: !!service.providesHomeService,
      providesLocalService: service.providesLocalService,
      chargesTravel: !!service.chargesTravel,
      quoteFee: typeof service.quoteFee === 'number' ? service.quoteFee : undefined,
    }
    if (service.categoryId && service.categoryId !== current?.categoryId) {
      body.leafCategoryId = service.categoryId
    }

    const res = await fetch('/api/services/my-services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Erro ao atualizar serviço.');

    await fetchServices();
    setEditingService(null);
    toast.success('Serviço atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    toast.error('Erro ao salvar serviço');
  } finally {
    setSaving(false);
  }
};




  const handleAddService = async () => {
  if (!leafCategoryId) {
    toast.error('Selecione uma subcategoria (folha)');
    return;
  }

  try {
    setSaving(true);

    const basePricePayload = newService.offersScheduling && Number.isFinite(Number(newService.basePrice))
      ? Number(newService.basePrice)
      : undefined

    const res = await fetch('/api/services/my-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leafCategoryId,
        basePrice: basePricePayload,
        unit: newService.unit,                         // string/enum que você usa na UI
        description: newService.description || undefined,
        isActive: newService.isActive, // opcional
        offersScheduling: newService.offersScheduling,
        offersQuoting: newService.offersQuoting,
        providesHomeService: newService.providesHomeService,
        providesLocalService: newService.providesLocalService,
        chargesTravel: newService.providesHomeService ? newService.chargesTravel : false,
        quoteFee: newService.offersQuoting ? Number(newService.quoteFee || 0) : 0,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Erro ao adicionar serviço.');

    await fetchServices();
    // limpa só os campos realmente usados
    setLeafCategoryId(null);
    setNewService(prev => ({
      ...prev,
      description: '',
      basePrice: 0,
      offersScheduling: false,
      offersQuoting: true,
      providesHomeService: false,
      providesLocalService: true,
      chargesTravel: false,
      quoteFee: 0,
    } as any));
    setShowAddService(false);
    toast.success('Serviço adicionado com sucesso!');
  } catch (error) {
    console.error('Error adding service:', error);
    toast.error('Erro ao adicionar serviço');
  } finally {
    setSaving(false);
  }
};


const handleDeleteService = async (service: ServicePrice) => {
  if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

  try {
    setSaving(true);

    const res = await fetch(`/api/services/my-services?id=${service.serviceProviderServiceId}`, {
  method: 'DELETE'
})


    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data?.error || 'Erro ao excluir serviço.');

    await fetchServices();
    toast.success('Serviço excluído com sucesso!');
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    toast.error('Erro ao excluir serviço');
  } finally {
    setSaving(false);
  }
};


const toggleServiceStatus = async (serviceProviderServiceId: string) => {
  try {
    const service = services.find(s => s.serviceProviderServiceId === serviceProviderServiceId);
    if (!service) return;

    await handleUpdateService({
      ...service,
      isActive: !service.isActive,
    });
  } catch (error) {
    console.error('Error toggling service status:', error);
    toast.error('Erro ao alterar status do serviço');
  }
};


    const handleTemplateClick = (template: PriceTemplate) => {
    const matchedCategory = categories.find(cat => cat.name === template.category)

    if (!matchedCategory) {
      toast.error('Categoria do template não encontrada')
      return
    }

    const unitId = unitOptions.some((option) => option.id === template.unit)
      ? template.unit
      : unitOptions[0]?.id ?? template.unit

    setNewService({
      name: template.name,
      description: '',
      basePrice: template.basePrice,
      unit: unitId,
      categoryId: matchedCategory.id,
      isActive: true,
      isPromotional: false,
      offersScheduling: false,
      offersQuoting: true,
      providesHomeService: false,
      providesLocalService: true,
      chargesTravel: false,
      // customUnit: '',
      promotionalPrice: 0,
      promotionalEndDate: '',
      variations: [],
      addOns: [],
      quoteFee: 0,
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

  const getCompetitorComparison = (service: ServicePrice) => {
    if (!service.competitorPrices || service.competitorPrices.length === 0) return null
    
    const avgCompetitorPrice = service.competitorPrices.reduce((sum, comp) => sum + comp.price, 0) / service.competitorPrices.length
    const myPriceBase = (service.isPromotional && service.promotionalPrice ? service.promotionalPrice : service.basePrice) ?? 0
    const difference = ((myPriceBase - avgCompetitorPrice) / avgCompetitorPrice) * 100
    
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
          <CardTitle>Meus Serviços</CardTitle>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Meus Serviços</span>
              <Badge variant="secondary">{services.length}</Badge>
            </CardTitle>
            
        <div className="flex flex-wrap gap-2">
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
                  {/* <Input
                    id="service-name"
                    value={newService.name || ''}
                    onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Limpeza Residencial"
                  /> */}
                  <Input
                  id="service-name"
                  value={newService.name}
                  readOnly
                  placeholder="Selecione o serviço acima"
                />


                </div>
                
                <div className="space-y-2">
                  {/* <Label htmlFor="service-category">Categoria *</Label> */}
                  {/* <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newService.categoryId}
                    onChange={(e) =>
                      setNewService(prev => ({ ...prev, categoryId: e.target.value }))
                    }
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select> */}
                  <Label>Selecione o serviço (categoria em cascata)</Label>
                <CascadingCategoryPicker
                value={selectedLeaf?.id ?? null}
                onChange={(leafId, path) => {
                  const leaf = path.at(-1) ?? null
                  setSelectedLeaf(leaf)
                  setLeafCategoryId(leafId ?? null)
                  setNewService(prev => ({
                    ...prev,
                    categoryId: leafId ?? '',
                    name: leaf?.name ?? '',   // nome padronizado da leaf
                    offersScheduling: leaf?.allowScheduling ? prev.offersScheduling ?? false : false,
                  }))
                }}
              />
                <p className="text-xs text-gray-500 mt-1">
    Selecione uma subcategoria (folha). O nome do serviço virá do catálogo canônico.
  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service-price">Preço Base *</Label>
                  <Input
                    id="service-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newServiceSchedulingEnabled ? newService.basePrice || '' : ''}
                    onChange={(e) => setNewService(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                    placeholder={newServiceSchedulingEnabled ? '0.00' : 'Disponível com agendamento'}
                    disabled={!newServiceSchedulingEnabled}
                  />
                  {!leafAllowsScheduling ? (
                    <p className="text-xs text-gray-500">Esta categoria aceita apenas solicitações de orçamento; o preço base não será exibido.</p>
                  ) : !newServiceSchedulingEnabled ? (
                    <p className="text-xs text-gray-500">Ative o agendamento para definir um preço base.</p>
                  ) : null}
                </div>
                
        <div className="space-y-2">
          <Label htmlFor="service-unit">Unidade de Cobrança</Label>
          <select
            id="service-unit"
            value={newService.unit || 'FIXED'}
            onChange={(e) => setNewService(prev => ({ ...prev, unit: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={unitsLoading || unitOptions.length === 0}
          >
            {unitOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
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
              
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                  <Switch
                    checked={newService.offersQuoting}
                    onCheckedChange={(checked: boolean) => setNewService(prev => ({
                      ...prev,
                      offersQuoting: checked,
                      quoteFee: checked ? prev.quoteFee ?? 0 : 0,
                    }))}
                    className="shrink-0"
                  />
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Permitir pedidos de orçamento</Label>
                    <p className="text-xs text-gray-500 leading-relaxed">Clientes poderão enviar uma solicitação antes de contratar.</p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                  <Switch
                    checked={leafAllowsScheduling ? newService.offersScheduling : false}
                    onCheckedChange={(checked: boolean) => setNewService(prev => ({
                      ...prev,
                      offersScheduling: leafAllowsScheduling ? checked : false,
                    }))}
                    disabled={!leafAllowsScheduling}
                    className="shrink-0"
                  />
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Oferecer agendamento</Label>
                    {!selectedLeaf?.allowScheduling && (
                      <p className="text-xs text-gray-500">Esta categoria só aceita solicitações de orçamento.</p>
                    )}
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                  <Switch
                    checked={newService.providesHomeService || false}
                    onCheckedChange={(checked: boolean) => setNewService(prev => ({
                      ...prev,
                      providesHomeService: checked,
                      chargesTravel: checked ? prev.chargesTravel : false,
                    }))}
                    className="shrink-0"
                  />
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Atendimento a domicílio</Label>
                    <p className="text-xs text-gray-500 leading-relaxed">Mostra aos clientes que você atende no endereço deles.</p>
                  </div>
                </div>

                {newService.providesHomeService && (
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                    <Switch
                      checked={newService.chargesTravel || false}
                      onCheckedChange={(checked: boolean) => setNewService(prev => ({ ...prev, chargesTravel: checked }))}
                      className="shrink-0"
                    />
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Cobrar deslocamento</Label>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Quando desabilitado, o cliente verá &quot;Deslocamento grátis&quot; nas simulações.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                  <Switch
                    checked={newService.providesLocalService !== false}
                    onCheckedChange={(checked: boolean) => setNewService(prev => ({ ...prev, providesLocalService: checked }))}
                    className="shrink-0"
                  />
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Atendimento no seu local</Label>
                    <p className="text-xs text-gray-500 leading-relaxed">Indica que o cliente pode ir até o seu endereço ou estabelecimento.</p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                  <Switch
                    checked={newService.isActive || false}
                    onCheckedChange={(checked: boolean) => setNewService(prev => ({ ...prev, isActive: checked }))}
                    className="shrink-0"
                  />
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Serviço ativo</Label>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                  <Switch
                    checked={newService.isPromotional || false}
                    onCheckedChange={(checked: boolean) => setNewService(prev => ({ ...prev, isPromotional: checked }))}
                    className="shrink-0"
                  />
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Preço promocional</Label>
                  </div>
                </div>
              </div>

              {newService.offersQuoting && (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quote-fee">Taxa de orçamento (opcional)</Label>
                    <Input
                      id="quote-fee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newService.quoteFee ?? 0}
                      onChange={(e) => setNewService(prev => ({
                        ...prev,
                        quoteFee: Math.max(0, parseFloat(e.target.value) || 0),
                      }))}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500">Será exibida ao cliente no subtotal quando ele solicitar um orçamento.</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                    onSave={handleUpdateService}
                    onCancel={() => setEditingService(null)}
                    saving={saving}
                    categories={categories}
                    unitOptions={unitOptions}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-3 lg:space-y-0">
                      <div className="flex-1">
                    <div className="mb-3 space-y-2">
                      <h3 className="text-lg font-medium leading-snug break-words">{service.name}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{service.category}</Badge>
                        {service.isActive ? (
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
                        )}
                        {service.isPromotional && (
                          <Badge className="bg-red-100 text-red-800">Promoção</Badge>
                        )}
                        {service.allowScheduling ? (
                          service.offersScheduling ? (
                            <Badge className="bg-blue-100 text-blue-800">Agendamento ativo</Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800">Só orçamento</Badge>
                          )
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800">Somente orçamento</Badge>
                        )}
                        {service.offersQuoting === false && (
                          <Badge className="bg-gray-200 text-gray-800">Orçamento desativado</Badge>
                        )}
                        {service.offersQuoting !== false && (service.quoteFee ?? 0) > 0 && (
                          <Badge className="bg-purple-100 text-purple-800">Taxa de orçamento R$ {(service.quoteFee ?? 0).toFixed(2)}</Badge>
                        )}
                        {service.providesHomeService && (
                          <Badge className="bg-brand-cyan/10 text-brand-cyan">Atende a domicílio</Badge>
                        )}
                        {service.providesHomeService && (
                          service.chargesTravel
                            ? <Badge className="bg-rose-100 text-rose-700">Cobra deslocamento</Badge>
                            : <Badge className="bg-emerald-100 text-emerald-700">Deslocamento grátis</Badge>
                        )}
                        {service.providesLocalService !== false && (
                          <Badge className="bg-blue-50 text-blue-800">Atendimento no local</Badge>
                        )}
                      </div>
                    </div>
                        
                        {service.description && (
                          <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500">Preço Base</Label>
                            <p className="text-lg font-semibold">
                              R$ {(service.basePrice ?? 0).toFixed(2)}
                              <span className="text-sm text-gray-500 ml-1">
                                {getUnitLabel(service.unit)}
                                {/* {service.unit === 'CUSTOM' && service.customUnit && ` (${service.customUnit})`} */}
                              </span>
                            </p>
                          </div>
                          
                          {service.isPromotional && service.promotionalPrice && (
                            <div>
                              <Label className="text-xs text-gray-500">Preço Promocional</Label>
                              <p className="text-lg font-semibold text-red-600">
                                R$ {(service.promotionalPrice ?? 0).toFixed(2)}
                                <span className="text-sm text-gray-500 ml-1">
                                  {getUnitLabel(service.unit)}
                                </span>
                              </p>
                              {service.promotionalEndDate && (
                                <p className="text-xs text-gray-500">
                                  Até {new Date(service.promotionalEndDate).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* {service.minPrice && service.maxPrice && (
                            <div>
                              <Label className="text-xs text-gray-500">Faixa de Preço</Label>
                              <p className="text-sm">
                                R$ {service.minPrice} - R$ {service.maxPrice}
                              </p>
                            </div>
                          )} */}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <Switch
                          checked={service.isActive}
                          onCheckedChange={() => toggleServiceStatus(service.serviceProviderServiceId)}
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
                          onClick={() => handleDeleteService(service)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Variations and Add-ons */}
                    {(((service.variations?.length ?? 0) > 0) || ((service.addOns?.length ?? 0) > 0))
                       && (
                      <div className="space-y-3">
                        <Separator />
                        
                        {(service.variations.length ?? 0) > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Variações</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              {service.variations?.map((variation) => (
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
                        
                        {(service.addOns.length??0) > 0 && (
                          <div>
                            <Label className="text-sm font-medium">Adicionais</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                              {service.addOns?.map((addOn) => (
                                <div key={addOn.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm">{addOn.name}</span>
                                  <span className="text-sm font-medium">+R$ {(addOn.price ?? 0).toFixed(2)}</span>
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
                              Média: R$ {(comparison.avgPrice??0).toFixed(2)}
                            </span>
                            <Badge className={
                              comparison.difference > 10 ? 'bg-red-100 text-red-800' :
                              comparison.difference < -10 ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {comparison.difference > 0 ? '+' : ''}{(comparison.difference??0).toFixed(1)}%
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
                <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTemplateClick(template)}>
                  <h3 className="font-medium">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.category}</p>
                  <p className="text-lg font-semibold mt-2">
                    R$ {(template.basePrice??0).toFixed(2)}
                    <span className="text-sm text-gray-500 ml-1">
                      {getUnitLabel(template.unit)}
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
  categories: { id: string; name: string }[]
  unitOptions: Array<{ id: string; label: string }>
}


function ServiceEditForm({ service, onSave, onCancel, saving, categories, unitOptions }: ServiceEditFormProps) {
  const [editedService, setEditedService] = useState<ServicePrice>({ ...service })
  const [editedLeafId, setEditedLeafId] = useState<string | null>(service.categoryId || null)

  useEffect(() => {
    if (!unitOptions.length) return
    setEditedService((prev) =>
      unitOptions.some((option) => option.id === prev.unit)
        ? prev
        : { ...prev, unit: unitOptions[0].id }
    )
  }, [unitOptions])

  const handleSave = () => {
    const next = { ...editedService }
    if (!next.categoryId) {
      const fallbackCategory = categories.find(c => c.name === service.category)
      if (fallbackCategory) {
        next.categoryId = fallbackCategory.id
      }
    }
    if (!(next.allowScheduling ?? true)) {
      next.offersScheduling = false
    }
    if (!next.offersQuoting) {
      next.quoteFee = 0
    } else {
      next.quoteFee = Math.max(0, Number(next.quoteFee ?? 0))
    }
    if (!next.providesHomeService) {
      next.chargesTravel = false
    }
    onSave(next)
  }

  const allowsScheduling = editedService.allowScheduling ?? true
  const schedulingEnabled = allowsScheduling && !!editedService.offersScheduling

  const handleToggleHomeService = (checked: boolean) => {
    setEditedService(prev => ({
      ...prev,
      providesHomeService: checked,
      chargesTravel: checked ? prev.chargesTravel : false,
    }))
  }


  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome do Serviço</Label>
          <Input value={editedService.name} readOnly />
          <p className="text-xs text-gray-500">
            O nome é padronizado pelo catálogo. Para mudar, selecione outra subcategoria (folha) abaixo e salve.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <CascadingCategoryPicker
            value={editedLeafId}
            onChange={(leafId, path) => {
              const leaf = path.at(-1)
              setEditedLeafId(leafId)
              setEditedService(prev => ({
                ...prev,
                categoryId: leafId ?? prev.categoryId,
                name: leaf?.name ?? prev.name, // pré-visualização do nome canônico
                allowScheduling: leaf?.allowScheduling ?? prev.allowScheduling,
                offersScheduling: leaf?.allowScheduling ? prev.offersScheduling ?? false : false,
              }))
            }}
          />
          {!editedLeafId && (
            <p className="text-xs text-gray-500">Selecione uma subcategoria (folha) para alterar este serviço.</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Preço Base</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={schedulingEnabled ? editedService.basePrice ?? '' : ''}
            onChange={(e) =>
              setEditedService(prev => ({
                ...prev,
                basePrice: parseFloat(e.target.value) || 0
              }))
            }
            placeholder={schedulingEnabled ? '0.00' : 'Disponível com agendamento'}
            disabled={!schedulingEnabled}
          />
          {!allowsScheduling ? (
            <p className="text-xs text-gray-500">Categoria sem agendamento: o preço base será combinado no orçamento.</p>
          ) : !schedulingEnabled ? (
            <p className="text-xs text-gray-500">Ative o agendamento para definir um preço base.</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Unidade</Label>
          <select
            value={editedService.unit}
            onChange={(e) =>
              setEditedService(prev => ({ ...prev, unit: e.target.value as any }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {unitOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          value={editedService.description || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setEditedService(prev => ({ ...prev, description: e.target.value }))
          }
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        <div className="flex items-center space-x-2">
          <Switch
            checked={editedService.offersQuoting ?? true}
            onCheckedChange={(checked: boolean) =>
              setEditedService(prev => ({
                ...prev,
                offersQuoting: checked,
                quoteFee: checked ? prev.quoteFee ?? 0 : 0,
              }))
            }
          />
          <div>
            <Label>Permitir pedidos de orçamento</Label>
            <p className="text-xs text-gray-500">Clientes poderão enviar solicitações antes de fechar.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={allowsScheduling ? (editedService.offersScheduling ?? false) : false}
            onCheckedChange={(checked: boolean) =>
              setEditedService(prev => ({ ...prev, offersScheduling: checked }))
            }
            disabled={!allowsScheduling}
          />
          <div>
            <Label>Oferecer agendamento</Label>
            {!allowsScheduling && (
              <p className="text-xs text-gray-500">Esta categoria aceita apenas solicitações de orçamento.</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={editedService.providesHomeService || false}
            onCheckedChange={handleToggleHomeService}
          />
          <div>
            <Label>Atendimento a domicílio</Label>
            <p className="text-xs text-gray-500">Mostra aos clientes que você atende no endereço deles.</p>
          </div>
        </div>

        {editedService.providesHomeService && (
          <div className="flex items-center space-x-2">
            <Switch
              checked={editedService.chargesTravel || false}
              onCheckedChange={(checked: boolean) =>
                setEditedService(prev => ({ ...prev, chargesTravel: checked }))
              }
            />
            <div>
              <Label>Cobrar deslocamento</Label>
              <p className="text-xs text-gray-500">Desligado = o cliente verá &quot;Deslocamento grátis&quot;.</p>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            checked={editedService.providesLocalService !== false}
            onCheckedChange={(checked: boolean) =>
              setEditedService(prev => ({ ...prev, providesLocalService: checked }))
            }
          />
          <div>
            <Label>Atendimento no seu local</Label>
            <p className="text-xs text-gray-500">O cliente pode ir até você para receber o serviço.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={editedService.isActive}
            onCheckedChange={(checked: boolean) =>
              setEditedService(prev => ({ ...prev, isActive: checked }))
            }
          />
          <Label>Ativo</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={editedService.isPromotional}
            onCheckedChange={(checked: boolean) =>
              setEditedService(prev => ({ ...prev, isPromotional: checked }))
            }
          />
          <Label>Promocional</Label>
        </div>
      </div>

      {editedService.offersQuoting !== false && (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="edit-quote-fee">Taxa de orçamento</Label>
            <Input
              id="edit-quote-fee"
              type="number"
              min="0"
              step="0.01"
              value={editedService.quoteFee ?? 0}
              onChange={(e) =>
                setEditedService(prev => ({
                  ...prev,
                  quoteFee: Math.max(0, parseFloat(e.target.value) || 0),
                }))
              }
            />
            <p className="text-xs text-gray-500">Exibida ao cliente no subtotal do orçamento.</p>
          </div>
        </div>
      )}

      {editedService.isPromotional && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Preço Promocional</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editedService.promotionalPrice || ''}
              onChange={(e) =>
                setEditedService(prev => ({
                  ...prev,
                  promotionalPrice: parseFloat(e.target.value) || 0
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Data de Término</Label>
            <Input
              type="date"
              value={
                editedService.promotionalEndDate
                  ? editedService.promotionalEndDate.split('T')[0]
                  : ''
              }
              onChange={(e) =>
                setEditedService(prev => ({
                  ...prev,
                  promotionalEndDate: e.target.value
                    ? `${e.target.value}T23:59:59Z`
                    : undefined
                }))
              }
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
