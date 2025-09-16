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
    planUnlockPrice: '4.90',
    planMonthlyPrice: '39.90',
    planEnterprisePrice: '',
  })

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
          planEnterprisePrice: s.PLAN_ENTERPRISE_PRICE || prev.planEnterprisePrice,
        }))
      } catch { /* noop */ }
    }
    load()
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
            PLAN_ENTERPRISE_PRICE: settings.planEnterprisePrice,
          }
        })
      })
      alert('Configurações salvas com sucesso!')
    } catch (e) {
      alert('Erro ao salvar configurações')
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
                  href="/admin/services"
                  className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100"
                >
                  🛠️ Serviços
                </Link>
                <Link 
                  href="/admin/categories"
                  className="block px-3 py-2 rounded-md text-sm hover:bg-gray-100"
                >
                  🧭 Categorias
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Desbloqueio por solicitação (R$)</label>
                  <Input value={settings.planUnlockPrice} onChange={(e) => setSettings(p => ({...p, planUnlockPrice: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Plano Mensal Profissional (R$)</label>
                  <Input value={settings.planMonthlyPrice} onChange={(e) => setSettings(p => ({...p, planMonthlyPrice: e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Plano Empresarial (R$) — opcional</label>
                  <Input value={settings.planEnterprisePrice} onChange={(e) => setSettings(p => ({...p, planEnterprisePrice: e.target.value}))} />
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
