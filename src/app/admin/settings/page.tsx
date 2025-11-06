/**
 * Admin settings page for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DEFAULT_SERVICE_UNITS,
  sanitizeUnitId,
  type ServiceUnit,
} from '@/lib/service-units'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    commissionRate: '0.10',
    schedulingFee: '5.00',
    requestExpiryHours: '24',
    maxServiceRadius: '50',
    minServicePrice: '20.00',
    maxServicePrice: '5000.00',
    // Contatos
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    socialFacebook: '',
    socialInstagram: '',
    // Planos
    planUnlockPrice: '2.99',
    planMonthlyPrice: '15.99',
  })
  const [legalContent, setLegalContent] = useState({
    terms: '',
    privacy: '',
    version: '',
    termsUpdatedAt: '',
    privacyUpdatedAt: '',
  })
const [initialLegal, setInitialLegal] = useState({ terms: '', privacy: '' })
const [legalLoading, setLegalLoading] = useState(true)
const [savingLegal, setSavingLegal] = useState(false)
  const [serviceUnits, setServiceUnits] = useState<ServiceUnit[]>(DEFAULT_SERVICE_UNITS)
  const [unitsLoading, setUnitsLoading] = useState(true)
  const [unitsSaving, setUnitsSaving] = useState(false)

  useEffect(() => {
    // Carrega system settings para contatos
    const load = async () => {
      try {
        const res = await fetch('/api/system-settings', { cache: 'no-store' })
        const data = await res.json()
        const s = data.settings || {}
        setSettings(prev => ({
          ...prev,
          contactEmail: s.CONTACT_EMAIL || prev.contactEmail,
          contactPhone: s.CONTACT_PHONE || prev.contactPhone,
          contactAddress: s.CONTACT_ADDRESS || prev.contactAddress,
          socialFacebook: s.SOCIAL_FACEBOOK_URL || prev.socialFacebook,
          socialInstagram: s.SOCIAL_INSTAGRAM_URL || prev.socialInstagram,
          planUnlockPrice: s.PLAN_UNLOCK_PRICE || prev.planUnlockPrice,
          planMonthlyPrice: s.PLAN_MONTHLY_PRICE || prev.planMonthlyPrice,
        }))
      } catch { /* noop */ }
    }
    load()
  }, [])

  useEffect(() => {
    const loadUnits = async () => {
      try {
        setUnitsLoading(true)
        const res = await fetch('/api/service-units', { cache: 'no-store' })
        if (!res.ok) {
          setServiceUnits(DEFAULT_SERVICE_UNITS)
          return
        }
        const data = await res.json()
        if (Array.isArray(data.units) && data.units.length > 0) {
          setServiceUnits(data.units)
        } else {
          setServiceUnits(DEFAULT_SERVICE_UNITS)
        }
      } catch (error) {
        console.error('Erro ao carregar unidades', error)
        setServiceUnits(DEFAULT_SERVICE_UNITS)
      } finally {
        setUnitsLoading(false)
      }
    }
    loadUnits()
  }, [])

  useEffect(() => {
    const loadLegal = async () => {
      try {
        setLegalLoading(true)
        const res = await fetch('/api/admin/legal', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        setLegalContent({
          terms: data.terms ?? '',
          privacy: data.privacy ?? '',
          version: data.version ?? '',
          termsUpdatedAt: data.termsUpdatedAt ?? '',
          privacyUpdatedAt: data.privacyUpdatedAt ?? '',
        })
        setInitialLegal({
          terms: data.terms ?? '',
          privacy: data.privacy ?? '',
        })
      } catch (error) {
        console.error('Erro ao carregar textos legais', error)
      } finally {
        setLegalLoading(false)
      }
    }

    loadLegal()
  }, [])

  const handleSave = async () => {
    // Salva apenas contatos no endpoint de system-settings
    try {
      await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: {
            CONTACT_EMAIL: settings.contactEmail,
            CONTACT_PHONE: settings.contactPhone,
            CONTACT_ADDRESS: settings.contactAddress,
            SOCIAL_FACEBOOK_URL: settings.socialFacebook,
            SOCIAL_INSTAGRAM_URL: settings.socialInstagram,
            PLAN_UNLOCK_PRICE: settings.planUnlockPrice,
            PLAN_MONTHLY_PRICE: settings.planMonthlyPrice,
          }
        })
      })
      alert('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações', error)
      alert('Erro ao salvar configurações')
    }
  }

  const handleSaveLegal = async () => {
    try {
      setSavingLegal(true)
      const response = await fetch('/api/admin/legal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terms: legalContent.terms,
          privacy: legalContent.privacy,
        })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Erro ao atualizar textos legais')
      }

      setLegalContent(prev => ({
        ...prev,
        version: data.version ?? prev.version,
        termsUpdatedAt: data.termsUpdatedAt ?? prev.termsUpdatedAt,
        privacyUpdatedAt: data.privacyUpdatedAt ?? prev.privacyUpdatedAt,
      }))
      setInitialLegal({
        terms: legalContent.terms,
        privacy: legalContent.privacy,
      })
      alert('Textos legais atualizados com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar textos legais', error)
      alert('Erro ao atualizar textos legais')
    } finally {
      setSavingLegal(false)
    }
  }

  const legalHasChanges =
    legalContent.terms !== initialLegal.terms || legalContent.privacy !== initialLegal.privacy

  const formatTimestamp = (value: string) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('pt-BR')
  }

  const updateUnitField = (index: number, field: 'id' | 'label', value: string) => {
    setServiceUnits((current) =>
      current.map((unit, idx) =>
        idx === index
          ? {
              ...unit,
              [field]: field === 'id' ? sanitizeUnitId(value) : value,
            }
          : unit
      )
    )
  }

  const addUnit = () => {
    setServiceUnits((current) => [...current, { id: '', label: '' }])
  }

  const removeUnit = (index: number) => {
    setServiceUnits((current) => current.filter((_, idx) => idx !== index))
  }

  const handleSaveUnits = async () => {
    try {
      setUnitsSaving(true)
      const response = await fetch('/api/service-units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ units: serviceUnits }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Erro ao salvar unidades')
      }
      if (Array.isArray(data.units) && data.units.length > 0) {
        setServiceUnits(data.units)
      } else {
        setServiceUnits(DEFAULT_SERVICE_UNITS)
      }
      alert('Unidades atualizadas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar unidades', error)
      alert('Erro ao salvar unidades')
    } finally {
      setUnitsSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Configurações do Sistema</h1>
        <p className="text-gray-600">Gerencie as configurações gerais da plataforma MyServ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Menu de Administração</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-2">
                <Link 
                  href="/admin/dashboard"
                  className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100"
                >
                  📊 Dashboard
                </Link>
                <Link 
                  href="/admin/reports"
                  className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100"
                >
                  📈 Relatórios
                </Link>
                <Link 
                  href="/admin/integrations"
                  className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100"
                >
                  🔌 Integrações
                </Link>
                <Link 
                  href="/admin/payments"
                  className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100"
                >
                  💳 Pagamentos
                </Link>
                <Link 
                  href="/admin/coupons"
                  className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100"
                >
                  🎟️ Cupons
                </Link>
                <Link 
                  href="/admin/users"
                  className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100"
                >
                  👥 Usuários
                </Link>
                <Link 
                  href="/admin/categories"
                  className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100"
                >
                  🛠️ Serviços
                </Link>
                <div className="border-t pt-2 mt-4">
                  <span className="block px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-md">
                    ⚙️ Configurações
                  </span>
                </div>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Financeiras</CardTitle>
              <CardDescription>
                Configure as taxas e valores padrão da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Taxa de Comissão (%)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings.commissionRate}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      commissionRate: e.target.value 
                    }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Taxa cobrada sobre cada serviço (0.10 = 10%)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Taxa de Agendamento (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.schedulingFee}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      schedulingFee: e.target.value 
                    }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Taxa fixa por agendamento
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Valor Mínimo de Serviço (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.minServicePrice}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      minServicePrice: e.target.value 
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Valor Máximo de Serviço (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={settings.maxServicePrice}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      maxServicePrice: e.target.value 
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Configure o comportamento geral da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Expiração de Solicitações (horas)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.requestExpiryHours}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      requestExpiryHours: e.target.value 
                    }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tempo limite para resposta dos profissionais
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Raio Máximo de Atendimento (km)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="200"
                    value={settings.maxServiceRadius}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      maxServiceRadius: e.target.value 
                    }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Distância máxima para busca de profissionais
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contatos (Footer) */}
          <Card>
            <CardHeader>
              <CardTitle>Contato exibido no site</CardTitle>
              <CardDescription>Edite os dados mostrados no rodapé do site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">E-mail de contato</label>
                  <Input value={settings.contactEmail} onChange={(e) => setSettings(p => ({...p, contactEmail: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone/WhatsApp</label>
                  <Input value={settings.contactPhone} onChange={(e) => setSettings(p => ({...p, contactPhone: e.target.value}))} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Endereço</label>
                  <Input value={settings.contactAddress} onChange={(e) => setSettings(p => ({...p, contactAddress: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Facebook URL</label>
                  <Input value={settings.socialFacebook} onChange={(e) => setSettings(p => ({...p, socialFacebook: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Instagram URL</label>
                  <Input value={settings.socialInstagram} onChange={(e) => setSettings(p => ({...p, socialInstagram: e.target.value}))} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Planos */}
          <Card>
            <CardHeader>
              <CardTitle>Planos</CardTitle>
              <CardDescription>Valores exibidos em toda a plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Desbloqueio por solicitação (R$)</label>
                  <Input value={settings.planUnlockPrice} onChange={(e) => setSettings(p => ({...p, planUnlockPrice: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Plano Mensal Profissional (R$)</label>
                  <Input value={settings.planMonthlyPrice} onChange={(e) => setSettings(p => ({...p, planMonthlyPrice: e.target.value}))} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Units */}
          <Card>
            <CardHeader>
              <CardTitle>Unidades de cobrança</CardTitle>
              <CardDescription>Liste as unidades disponíveis para os prestadores ao definir preços de serviço.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {unitsLoading ? (
                <p className="text-sm text-gray-500">Carregando unidades...</p>
              ) : (
                <div className="space-y-3">
                  {serviceUnits.map((unit, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-gray-600 block mb-1">Identificador</label>
                        <Input
                          placeholder="EX: HOUR"
                          value={unit.id}
                          onChange={(e) => updateUnitField(index, 'id', e.target.value)}
                        />
                        <p className="text-[11px] text-gray-500 mt-1">Somente letras, números, sublinhado (_) ou hífen (-).</p>
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-xs font-medium text-gray-600 block mb-1">Rótulo exibido</label>
                        <Input
                          placeholder="Por hora"
                          value={unit.label}
                          onChange={(e) => updateUnitField(index, 'label', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-5 flex justify-end">
                        {serviceUnits.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeUnit(index)}>
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div>
                    <Button type="button" variant="outline" onClick={addUnit}>
                      Adicionar unidade
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button type="button" onClick={handleSaveUnits} disabled={unitsSaving || unitsLoading}>
                  {unitsSaving ? 'Salvando...' : 'Salvar unidades'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Legal Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Textos Legais</CardTitle>
              <CardDescription>
                Atualize os Termos de Uso e a Política de Privacidade exibidos na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Termos de Uso</label>
                    <span className="text-xs text-gray-500">
                      {legalLoading ? 'Carregando...' : `Atualizado: ${formatTimestamp(legalContent.termsUpdatedAt)}`}
                    </span>
                  </div>
                  <Textarea
                    rows={10}
                    value={legalContent.terms}
                    onChange={(e) => setLegalContent(prev => ({ ...prev, terms: e.target.value }))}
                    disabled={legalLoading || savingLegal}
                    placeholder="Cole aqui os termos de uso vigentes"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Política de Privacidade</label>
                    <span className="text-xs text-gray-500">
                      {legalLoading ? 'Carregando...' : `Atualizado: ${formatTimestamp(legalContent.privacyUpdatedAt)}`}
                    </span>
                  </div>
                  <Textarea
                    rows={10}
                    value={legalContent.privacy}
                    onChange={(e) => setLegalContent(prev => ({ ...prev, privacy: e.target.value }))}
                    disabled={legalLoading || savingLegal}
                    placeholder="Cole aqui a política de privacidade vigente"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    {legalContent.version ? `Versão atual: ${legalContent.version}` : 'Versão atual: —'}
                  </span>
                  <Button
                    onClick={handleSaveLegal}
                    disabled={legalLoading || savingLegal || !legalHasChanges}
                  >
                    {savingLegal ? 'Salvando...' : 'Salvar textos legais'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status das Integrações</CardTitle>
              <CardDescription>
                Visualização rápida do status das integrações externas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">💳 Pagamentos (MercadoPago)</span>
                  <span className="text-sm text-red-600">❌ Não configurado</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">📱 WhatsApp (ChatPro)</span>
                  <span className="text-sm text-red-600">❌ Não configurado</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">📧 Email (SMTP)</span>
                  <span className="text-sm text-red-600">❌ Não configurado</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">🗺️ Google Maps</span>
                  <span className="text-sm text-red-600">❌ Não configurado</span>
                </div>
              </div>
              
              <div className="mt-4">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/admin/integrations">
                    Configurar Integrações
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
