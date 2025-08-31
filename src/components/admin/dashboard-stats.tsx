'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  UserCheck, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Shield,
  Settings,
  BarChart3,
  Activity,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface AdminStats {
  overview: {
    totalUsers: number
    totalClients: number
    totalProviders: number
    pendingProviders: number
    totalBookings: number
    totalRevenue: number
    totalReviews: number
    averageRating: number
  }
  monthly: {
    bookings: number
    revenue: number
    userGrowth: number
    revenueGrowth: number
  }
  recentActivity: Array<{
    id: string
    type: string
    description: string
    client: string
    date: string
    status: string
  }>
  topServices: Array<{
    id: string
    title: string
    category: string
    requestCount: number
  }>
  systemHealth: {
    server: string
    database: string
    apis: string
  }
}

export function AdminDashboardStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stats')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar estatísticas')
      }

      setStats(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="ml-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <Button onClick={fetchStats} variant="outline" size="sm" className="mt-2">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    const isPositive = value >= 0
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.totalUsers}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Clientes: {stats.overview.totalClients}</span>
            <span className="mx-2 text-gray-300">•</span>
            <span className="text-gray-500">Profissionais: {stats.overview.totalProviders}</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Profissionais Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.pendingProviders}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total de Agendamentos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overview.totalBookings}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Este mês: {stats.monthly.bookings}</span>
            <span className="ml-2">{formatPercentage(stats.monthly.userGrowth)}</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.overview.totalRevenue)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">Este mês: {formatCurrency(stats.monthly.revenue)}</span>
            <span className="ml-2">{formatPercentage(stats.monthly.revenueGrowth)}</span>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Button 
          size="lg" 
          className="h-24 flex flex-col items-center justify-center space-y-2"
          onClick={() => window.location.href = '/admin/providers'}
        >
          <UserCheck className="w-6 h-6" />
          <span>Aprovar Profissionais</span>
          {stats.overview.pendingProviders > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {stats.overview.pendingProviders}
            </span>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          className="h-24 flex flex-col items-center justify-center space-y-2"
          onClick={() => window.location.href = '/admin/chat'}
        >
          <Activity className="w-6 h-6" />
          <span>Gerenciar Chats</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          className="h-24 flex flex-col items-center justify-center space-y-2"
          onClick={() => window.location.href = '/admin/users'}
        >
          <Users className="w-6 h-6" />
          <span>Gerenciar Usuários</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="lg" 
          className="h-24 flex flex-col items-center justify-center space-y-2"
          onClick={() => window.location.href = '/admin/metrics'}
        >
          <BarChart3 className="w-6 h-6" />
          <span>Relatórios</span>
        </Button>

        <Button 
          variant="outline" 
          size="lg" 
          className="h-24 flex flex-col items-center justify-center space-y-2"
          onClick={() => window.location.href = '/admin/settings'}
        >
          <Settings className="w-6 h-6" />
          <span>Configurações</span>
        </Button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Atividade Recente
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500">Cliente: {activity.client}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activity.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    activity.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </Card>

        {/* Top Services */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Serviços Mais Solicitados
          </h2>
          <div className="space-y-4">
            {stats.topServices.length > 0 ? (
              stats.topServices.map((service, index) => (
                <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{service.title}</p>
                      <p className="text-sm text-gray-500">{service.category}</p>
                    </div>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                    {service.requestCount} solicitações
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum serviço registrado</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Reviews Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2" />
          Resumo de Avaliações
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {stats.overview.averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(stats.overview.averageRating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">Avaliação Média</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {stats.overview.totalReviews}
            </div>
            <p className="text-sm text-gray-500 mt-1">Total de Avaliações</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats.overview.totalReviews > 0 
                ? Math.round((stats.overview.averageRating / 5) * 100)
                : 0}%
            </div>
            <p className="text-sm text-gray-500 mt-1">Satisfação</p>
          </div>
        </div>
      </Card>

      {/* System Health */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Status do Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-900">Servidor</p>
                <p className="text-sm text-green-700 capitalize">{stats.systemHealth.server}</p>
              </div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-900">Database</p>
                <p className="text-sm text-green-700 capitalize">{stats.systemHealth.database}</p>
              </div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-900">APIs</p>
                <p className="text-sm text-green-700 capitalize">{stats.systemHealth.apis}</p>
              </div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </Card>
    </div>
  )
}
