/**
 * Admin settings page for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState } from 'react'
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
    maxServicePrice: '5000.00'
  })

  const handleSave = () => {
    // Save settings to database
    console.log('Saving settings:', settings)
    alert('Configurações salvas com sucesso!')
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
