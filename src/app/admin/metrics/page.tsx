/**
 * Integration metrics dashboard for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Metrics {
  payments: {
    total: number
    successful: number
    failed: number
    pending: number
    totalAmount: number
  }
  notifications: {
    sent: number
    delivered: number
    failed: number
    whatsappSent: number
    emailSent: number
  }
  geocoding: {
    requests: number
    cached: number
    errors: number
    cacheHitRate: number
  }
  apiRequests: {
    total: number
    rateLimited: number
    errors: number
    averageResponseTime: number
  }
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchMetrics()

    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/metrics/summary', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Falha ao carregar métricas')
      }
      const data = await response.json() as { success?: boolean; metrics?: Metrics & { updatedAt?: string } }
      if (!data.success || !data.metrics) {
        throw new Error('Resposta inválida do servidor')
      }
      const updatedAt = data.metrics.updatedAt ? new Date(data.metrics.updatedAt) : new Date()
      setMetrics(data.metrics)
      setLastUpdated(updatedAt)
    } catch (error) {
      console.error('Erro ao carregar métricas:', error)
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }

  const getSuccessRate = (successful: number, total: number): number => {
    return total > 0 ? Math.round((successful / total) * 100) : 0
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Carregando métricas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <p className="text-gray-500">Erro ao carregar métricas</p>
          <Button onClick={fetchMetrics} className="mt-4">
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Métricas das Integrações</h1>
          <p className="text-gray-600">
            Monitoramento em tempo real das integrações MyServ
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-1">
              Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
        
        <Button onClick={fetchMetrics} disabled={loading}>
          {loading ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Payment Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              💳 Pagamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total:</span>
                <span className="font-medium">{metrics.payments.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Taxa de Sucesso:</span>
                <span className="font-medium text-green-600">
                  {getSuccessRate(metrics.payments.successful, metrics.payments.total)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Valor Total:</span>
                <span className="font-medium text-blue-600">
                  {formatCurrency(metrics.payments.totalAmount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              🔔 Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Enviadas:</span>
                <span className="font-medium">{metrics.notifications.sent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Entregues:</span>
                <span className="font-medium text-green-600">
                  {metrics.notifications.delivered}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Taxa de Entrega:</span>
                <span className="font-medium">
                  {getSuccessRate(metrics.notifications.delivered, metrics.notifications.sent)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Geocoding Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              🗺️ Geocodificação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Requisições:</span>
                <span className="font-medium">{metrics.geocoding.requests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Cache Hit:</span>
                <span className="font-medium text-green-600">
                  {metrics.geocoding.cacheHitRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Erros:</span>
                <span className="font-medium text-red-600">
                  {metrics.geocoding.errors}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              ⚡ Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Requisições:</span>
                <span className="font-medium">{metrics.apiRequests.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Rate Limited:</span>
                <span className="font-medium text-yellow-600">
                  {metrics.apiRequests.rateLimited}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Tempo Médio:</span>
                <span className="font-medium">
                  {metrics.apiRequests.averageResponseTime}ms
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes dos Pagamentos</CardTitle>
            <CardDescription>
              Distribuição por status nos últimos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Aprovados</span>
                </div>
                <span className="font-medium">{metrics.payments.successful}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Pendentes</span>
                </div>
                <span className="font-medium">{metrics.payments.pending}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Falharam</span>
                </div>
                <span className="font-medium">{metrics.payments.failed}</span>
              </div>

              {/* Progress bars */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: `${(metrics.payments.successful / metrics.payments.total) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle>Canais de Notificação</CardTitle>
            <CardDescription>
              Distribuição por canal de envio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">📱 WhatsApp</span>
                </div>
                <span className="font-medium">{metrics.notifications.whatsappSent}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">📧 Email</span>
                </div>
                <span className="font-medium">{metrics.notifications.emailSent}</span>
              </div>

              {/* Progress bars */}
              <div className="mt-4 space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>WhatsApp</span>
                    <span>{Math.round((metrics.notifications.whatsappSent / metrics.notifications.sent) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(metrics.notifications.whatsappSent / metrics.notifications.sent) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Email</span>
                    <span>{Math.round((metrics.notifications.emailSent / metrics.notifications.sent) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(metrics.notifications.emailSent / metrics.notifications.sent) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
