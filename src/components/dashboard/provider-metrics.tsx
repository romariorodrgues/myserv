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

interface PerformanceMetrics {
  overview: {
    totalServices: number
    totalEarnings: number
    averageRating: number
    completionRate: number
    responseTime: number // in hours
    repeatClientRate: number
  }
  monthly: {
    current: {
      services: number
      earnings: number
      newClients: number
      rating: number
    }
    previous: {
      services: number
      earnings: number
      newClients: number
      rating: number
    }
    growth: {
      services: number
      earnings: number
      newClients: number
      rating: number
    }
  }
  weekly: Array<{
    week: string
    services: number
    earnings: number
    rating: number
  }>
  categories: Array<{
    name: string
    services: number
    earnings: number
    rating: number
    growth: number
  }>
  achievements: Array<{
    id: string
    title: string
    description: string
    icon: string
    unlockedAt: string
    progress?: number
    target?: number
  }>
  goals: Array<{
    id: string
    title: string
    current: number
    target: number
    deadline: string
    type: 'services' | 'earnings' | 'rating' | 'clients'
  }>
}

interface ProviderMetricsProps {
  providerId?: string
}

export function ProviderMetrics({ providerId }: ProviderMetricsProps) {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month')

  useEffect(() => {
    fetchMetrics()
  }, [providerId, selectedPeriod])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      
      // Mock data - replace with actual API call
      const mockMetrics: PerformanceMetrics = {
        overview: {
          totalServices: 127,
          totalEarnings: 18450,
          averageRating: 4.8,
          completionRate: 96.5,
          responseTime: 2.5,
          repeatClientRate: 68
        },
        monthly: {
          current: {
            services: 15,
            earnings: 2100,
            newClients: 8,
            rating: 4.9
          },
          previous: {
            services: 12,
            earnings: 1680,
            newClients: 6,
            rating: 4.7
          },
          growth: {
            services: 25,
            earnings: 25,
            newClients: 33.3,
            rating: 4.3
          }
        },
        weekly: [
          { week: 'Sem 1', services: 4, earnings: 560, rating: 4.8 },
          { week: 'Sem 2', services: 3, earnings: 420, rating: 4.9 },
          { week: 'Sem 3', services: 5, earnings: 700, rating: 4.9 },
          { week: 'Sem 4', services: 3, earnings: 420, rating: 5.0 }
        ],
        categories: [
          { name: 'Limpeza Residencial', services: 45, earnings: 6750, rating: 4.9, growth: 15 },
          { name: 'Limpeza Comercial', services: 32, earnings: 6400, rating: 4.7, growth: 8 },
          { name: 'Limpeza Pós-Obra', services: 28, earnings: 4200, rating: 4.8, growth: 22 },
          { name: 'Limpeza de Escritório', services: 22, earnings: 1100, rating: 4.6, growth: -5 }
        ],
        achievements: [
          {
            id: '1',
            title: 'Primeira Avaliação 5 Estrelas',
            description: 'Recebeu sua primeira avaliação perfeita',
            icon: 'star',
            unlockedAt: '2025-01-15T10:00:00Z'
          },
          {
            id: '2',
            title: 'Cliente Fiel',
            description: 'Teve um cliente que contratou seus serviços 5 vezes',
            icon: 'heart',
            unlockedAt: '2025-02-20T14:30:00Z'
          },
          {
            id: '3',
            title: 'Resposta Rápida',
            description: 'Manteve tempo de resposta abaixo de 2 horas por 30 dias',
            icon: 'lightning',
            unlockedAt: '2025-03-10T09:15:00Z'
          },
          {
            id: '4',
            title: 'Profissional 100+',
            description: 'Completou mais de 100 serviços',
            icon: 'trophy',
            unlockedAt: '2025-05-01T16:45:00Z'
          }
        ],
        goals: [
          {
            id: '1',
            title: 'Serviços Este Mês',
            current: 15,
            target: 20,
            deadline: '2025-06-30',
            type: 'services'
          },
          {
            id: '2',
            title: 'Ganhos Este Mês',
            current: 2100,
            target: 2500,
            deadline: '2025-06-30',
            type: 'earnings'
          },
          {
            id: '3',
            title: 'Manter Avaliação',
            current: 4.9,
            target: 4.8,
            deadline: '2025-06-30',
            type: 'rating'
          }
        ]
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMetrics(mockMetrics)
      
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

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
                <p className={`text-sm ${getGrowthColor(metrics.monthly.growth.services)}`}>
                  {formatGrowth(metrics.monthly.growth.services)} este mês
                </p>
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
                <p className={`text-sm ${getGrowthColor(metrics.monthly.growth.earnings)}`}>
                  {formatGrowth(metrics.monthly.growth.earnings)} este mês
                </p>
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

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Metas do Mês</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {metrics.goals.map((goal) => {
              const IconComponent = getGoalIcon(goal.type)
              const progress = (goal.current / goal.target) * 100
              const isCompleted = goal.current >= goal.target
              
              return (
                <div key={goal.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-medium">{goal.title}</h3>
                        <p className="text-sm text-gray-500">
                          {goal.type === 'earnings' ? formatCurrency(goal.current) : goal.current} de{' '}
                          {goal.type === 'earnings' ? formatCurrency(goal.target) : goal.target}
                        </p>
                      </div>
                    </div>
                    {isCompleted && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Concluída
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{progress.toFixed(1)}% concluída</span>
                      <span>Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

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

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Conquistas Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-3 p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{achievement.title}</h3>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
