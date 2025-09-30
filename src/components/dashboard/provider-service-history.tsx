/**
 * Provider Service History Component - Histórico de serviços do prestador
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect } from 'react'
import { History, Star, Clock, MapPin, User, Filter, Search, Calendar, DollarSign, TrendingUp, Award } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

interface ServiceHistory {
  id: string
  status: 'COMPLETED' | 'CANCELLED'
  description: string
  completedAt: string
  address: string
  city: string
  state: string
  duration?: number // in minutes
  price: number
  rating?: number
  review?: string
  service: {
    id: string
    name: string
    category: string
  }
  client: {
    id: string
    name: string
    profileImage: string | null
    totalBookings?: number
    ratingAverage?: number | null
    ratingCount?: number
  }
  payment: {
    method: 'CREDIT' | 'DEBIT' | 'PIX' | 'CASH'
    status: 'PAID' | 'PENDING' | 'CANCELLED'
    fee?: number
  }
}

interface ServiceStats {
  totalServices: number
  totalEarnings: number
  averageRating: number
  completionRate: number
  repeatClients: number
  thisMonth: {
    services: number
    earnings: number
  }
  topServices: Array<{
    name: string
    count: number
    earnings: number
  }>
}

interface ProviderServiceHistoryProps {
  providerId?: string
}

const statusConfig = {
  COMPLETED: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
}

const paymentMethodConfig = {
  CREDIT: 'Cartão de Crédito',
  DEBIT: 'Cartão de Débito',
  PIX: 'PIX',
  CASH: 'Dinheiro'
}

export function ProviderServiceHistory({ providerId }: ProviderServiceHistoryProps) {
  const [loading, setLoading] = useState(true)
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([])
  const [filteredHistory, setFilteredHistory] = useState<ServiceHistory[]>([])
  const [stats, setStats] = useState<ServiceStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL')
  const [dateFilter, setDateFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS'>('ALL')
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'rating'>('date')

  useEffect(() => {
    fetchServiceHistory()
    fetchStats()
  }, [providerId])

  useEffect(() => {
    filterAndSortHistory()
  }, [serviceHistory, searchTerm, statusFilter, dateFilter, sortBy])

  const fetchServiceHistory = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (providerId) params.set('providerId', providerId)
      params.set('limit', '50')
      const res = await fetch(`/api/providers/history?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setServiceHistory(data.data.items)
        setStats(data.data.stats)
        return
      }
      // fallback vazio
      const mockHistory: ServiceHistory[] = [
        {
          id: '1',
          status: 'COMPLETED',
          description: 'Limpeza completa de apartamento 3 quartos com foco em cozinha e banheiros',
          completedAt: '2025-06-10T16:00:00Z',
          address: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          duration: 180,
          price: 150,
          rating: 5,
          review: 'Excelente trabalho! Muito caprichosa e pontual. Recomendo!',
          service: { id: '1', name: 'Limpeza Residencial', category: 'Limpeza' },
          client: { 
            id: 'client-1', 
            name: 'João Silva', 
            profileImage: null,
            totalBookings: 3
          },
          payment: {
            method: 'PIX',
            status: 'PAID',
            fee: 7.5
          }
        },
        {
          id: '2',
          status: 'COMPLETED',
          description: 'Limpeza pós-obra em escritório comercial',
          completedAt: '2025-06-08T14:30:00Z',
          address: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          duration: 240,
          price: 300,
          rating: 4,
          review: 'Bom trabalho, mas poderia ter sido mais rápido.',
          service: { id: '2', name: 'Limpeza Pós-Obra', category: 'Limpeza' },
          client: { 
            id: 'client-2', 
            name: 'Maria Santos', 
            profileImage: null,
            totalBookings: 1
          },
          payment: {
            method: 'CREDIT',
            status: 'PAID',
            fee: 15
          }
        },
        {
          id: '3',
          status: 'COMPLETED',
          description: 'Limpeza residencial semanal - casa 2 quartos',
          completedAt: '2025-06-05T10:00:00Z',
          address: 'Rua dos Jardins, 456',
          city: 'São Paulo',
          state: 'SP',
          duration: 120,
          price: 100,
          rating: 5,
          review: 'Sempre impecável! Já é a quarta vez que contrato e sempre fico muito satisfeita.',
          service: { id: '1', name: 'Limpeza Residencial', category: 'Limpeza' },
          client: { 
            id: 'client-3', 
            name: 'Ana Costa', 
            profileImage: null,
            totalBookings: 4
          },
          payment: {
            method: 'PIX',
            status: 'PAID',
            fee: 5
          }
        },
        {
          id: '4',
          status: 'CANCELLED',
          description: 'Limpeza de apartamento - cancelado pelo cliente',
          completedAt: '2025-06-03T09:00:00Z',
          address: 'Rua Central, 789',
          city: 'São Paulo',
          state: 'SP',
          price: 0,
          service: { id: '1', name: 'Limpeza Residencial', category: 'Limpeza' },
          client: { 
            id: 'client-4', 
            name: 'Pedro Oliveira', 
            profileImage: null,
            totalBookings: 0
          },
          payment: {
            method: 'PIX',
            status: 'CANCELLED'
          }
        }
      ]

      setServiceHistory(mockHistory)
      
    } catch (error) {
      console.error('Error fetching service history:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Mock stats - replace with actual API call
      const mockStats: ServiceStats = {
        totalServices: 47,
        totalEarnings: 6850,
        averageRating: 4.8,
        completionRate: 95.7,
        repeatClients: 12,
        thisMonth: {
          services: 8,
          earnings: 1200
        },
        topServices: [
          { name: 'Limpeza Residencial', count: 35, earnings: 4200 },
          { name: 'Limpeza Pós-Obra', count: 8, earnings: 2100 },
          { name: 'Limpeza Comercial', count: 4, earnings: 550 }
        ]
      }
      
      setStats(mockStats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const filterAndSortHistory = () => {
    let filtered = [...serviceHistory]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.city.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    // Filter by date
    if (dateFilter !== 'ALL') {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      const start3MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

      filtered = filtered.filter(item => {
        const itemDate = new Date(item.completedAt)
        
        switch (dateFilter) {
          case 'THIS_MONTH':
            return itemDate >= startOfMonth
          case 'LAST_MONTH':
            return itemDate >= startOfLastMonth && itemDate <= endOfLastMonth
          case 'LAST_3_MONTHS':
            return itemDate >= start3MonthsAgo
          default:
            return true
        }
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        case 'price':
          return b.price - a.price
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        default:
          return 0
      }
    })

    setFilteredHistory(filtered)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`
    }
    return `${mins}min`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Serviços</CardTitle>
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <History className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Serviços</p>
                  <p className="text-2xl font-bold">{stats.totalServices}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Ganho</p>
                  <p className="text-2xl font-bold">R$ {stats.totalEarnings.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Avaliação Média</p>
                  <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold">{stats.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main History Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>Histórico de Serviços</span>
              <Badge variant="secondary">{serviceHistory.length}</Badge>
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar serviços..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="ALL">Todos os status</option>
                <option value="COMPLETED">Concluído</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
              
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="ALL">Todos os períodos</option>
                <option value="THIS_MONTH">Este mês</option>
                <option value="LAST_MONTH">Mês passado</option>
                <option value="LAST_3_MONTHS">Últimos 3 meses</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {serviceHistory.length === 0 
                  ? 'Você ainda não concluiu nenhum serviço'
                  : 'Nenhum serviço encontrado com os filtros aplicados'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-3 lg:space-y-0">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-lg">{item.service.name}</h3>
                          <p className="text-sm text-gray-600">{item.service.category}</p>
                        </div>
                        <Badge className={statusConfig[item.status].color}>
                          {statusConfig[item.status].label}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 text-sm">{item.description}</p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(item.completedAt)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{item.city}, {item.state}</span>
                        </div>
                        
                        {item.duration && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(item.duration)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {item.client.profileImage ? (
                            <Image
                              src={item.client.profileImage}
                                alt={item.client.name}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <User className="w-4 h-4 text-gray-500" />
                            )}
                        </div>
                        <span className="text-sm font-medium">{item.client.name}</span>
                        {item.client.ratingAverage != null && item.client.ratingCount && item.client.ratingCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Star className="w-3 h-3 fill-current" />
                            {item.client.ratingAverage.toFixed(1)} ({item.client.ratingCount})
                          </span>
                        )}
                        {item.client.totalBookings && item.client.totalBookings > 1 && (
                          <Badge variant="outline" className="text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            Cliente Fiel
                          </Badge>
                          )}
                        </div>
                        
                        {item.rating && (
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < item.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-sm ml-1">({item.rating})</span>
                          </div>
                        )}
                      </div>
                      
                      {item.review && (
                        <div className="bg-gray-50 rounded-lg p-3 mt-3">
                          <p className="text-sm text-gray-700 italic">"{item.review}"</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="lg:ml-6 lg:text-right space-y-2">
                      <div className="text-lg font-semibold text-green-600">
                        R$ {item.price.toFixed(2)}
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <div>{paymentMethodConfig[item.payment.method]}</div>
                        <div className={`font-medium ${
                          item.payment.status === 'PAID' ? 'text-green-600' : 
                          item.payment.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {item.payment.status === 'PAID' ? 'Pago' : 
                           item.payment.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                        </div>
                        {item.payment.fee && item.payment.status === 'PAID' && (
                          <div className="text-xs">Taxa: R$ {item.payment.fee.toFixed(2)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
