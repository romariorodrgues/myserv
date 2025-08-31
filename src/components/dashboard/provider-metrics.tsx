/**
 * Provider Performance Metrics Component - Métricas de performance do prestador
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Star, Users, DollarSign, Calendar, Clock, Target, Award, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

type MetricsResponse = {
  success: boolean
  data: {
    overview: {
      totalServices: number
      totalEarnings: number
      averageRating: number
      completionRate: number
      responseTime: number | null
      repeatClientRate: number
    }
    monthly: { current: { services: number; earnings: number; newClients: number; rating: number } }
    responseRate: number | null
    categories: Array<{ name: string; services: number; earnings: number; rating: number; growth: number }>
  }
}

interface ProviderMetricsProps {
  providerId?: string
}

export function ProviderMetrics({ providerId }: ProviderMetricsProps) {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<MetricsResponse['data'] | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/providers/metrics${providerId ? `?providerId=${providerId}` : ''}`)
        const data: MetricsResponse = await res.json()
        if (data.success) setMetrics(data.data)
      } catch (error) {
        console.error('Error fetching metrics:', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [providerId, selectedPeriod])

  // (fetchMetrics removido: agora usamos fetch inline no useEffect)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatGrowth = (growth: number) => {
    const sign = growth > 0 ? '+' : ''
    return `${sign}${growth.toFixed(1)}%`
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'services': return Calendar
      case 'earnings': return DollarSign
      case 'rating': return Star
      case 'clients': return Users
      default: return Target
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Performance</CardTitle>
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
      </div>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Erro ao carregar métricas</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Serviços</p>
                <p className="text-2xl font-bold">{metrics.overview.totalServices}</p>
                <p className="text-sm text-gray-600">Este mês: {metrics.monthly.current.services}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ganho</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.overview.totalEarnings)}</p>
                <p className="text-sm text-gray-600">Este mês: {formatCurrency(metrics.monthly.current.earnings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avaliação Média</p>
                <p className="text-2xl font-bold">{metrics.overview.averageRating.toFixed(1)}</p>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(metrics.overview.averageRating) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                <p className="text-2xl font-bold">{metrics.overview.completionRate}%</p>
                <Progress value={metrics.overview.completionRate} className="w-20 h-2 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo de Resposta</p>
                <p className="text-2xl font-bold">{metrics.overview.responseTime}h</p>
                <p className="text-sm text-gray-500">Média de resposta</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-pink-100 rounded-lg">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes Fiéis</p>
                <p className="text-2xl font-bold">{metrics.overview.repeatClientRate}%</p>
                <p className="text-sm text-gray-500">Taxa de recontratação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals removidos nesta versão (a API não retorna metas definidas) */}

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Performance por Categoria</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{category.name}</h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span>{category.services} serviços</span>
                    <span>{formatCurrency(category.earnings)}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span>{category.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-sm font-medium ${getGrowthColor(category.growth)}`}>
                    {formatGrowth(category.growth)}
                  </p>
                  <p className="text-xs text-gray-500">vs. mês anterior</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements removidos nesta versão */}
    </div>
  )
}
