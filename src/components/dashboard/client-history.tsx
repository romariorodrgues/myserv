/**
 * Client History Component - Histórico de solicitações do cliente
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect } from 'react'
import { Clock, MapPin, Star, Filter, Search, ChevronDown, Calendar, User, Check } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'


interface ServiceRequest {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED' | 'HOLD'
  description: string
  preferredDate: string | null
  createdAt: string
  updatedAt: string
  address: string
  city: string
  state: string
  rating?: number
  review?: string
  price?: number
  finalPrice?: number
  paymentMethod?: string
  cancellationReason?: string
  cancelledBy?: string
  service: {
    id: string
    name: string
    category: string
  }
  serviceProvider: {
    id: string
    user: {
      name: string
      profileImage: string | null
    }
    rating?: number
    reviewCount?: number
  }
}

interface ClientHistoryProps {
  clientId?: string
}

const statusConfig = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  HOLD: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ACCEPTED: { label: 'Aceito', color: 'bg-blue-100 text-blue-800', icon: Calendar },
  REJECTED: { label: 'Rejeitado', color: 'bg-red-100 text-red-800', icon: Clock },
  COMPLETED: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: Clock },
  CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800', icon: Clock }
}

const paymentMethodLabels: Record<string, string> = {
  PIX: 'PIX',
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  BANK_TRANSFER: 'Transferência bancária',
  OTHER: 'Outro',
}

export function ClientHistory({ clientId }: ClientHistoryProps) {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'rating'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [cancelModal, setCancelModal] = useState<{ id: string; reason: string; loading: boolean } | null>(null)

  useEffect(() => {
  if (clientId) {
    fetchServiceHistory()
  }
}, [clientId])

  useEffect(() => {
    filterAndSortRequests()
  }, [requests, searchTerm, statusFilter, sortBy, sortOrder])

  const fetchServiceHistory = async () => {
    try {
      if (!clientId) return
      setLoading(true)
      
       const response = await fetch(`/api/requests/history?clientId=${clientId}`)
        const data = await response.json()

        setRequests(data)

      // Mock data for development - replace with actual API call
      // const mockData: ServiceRequest[] = [
      //   {
      //     id: '1',
      //     status: 'COMPLETED',
      //     description: 'Necessito de limpeza residencial completa para apartamento de 3 quartos',
      //     preferredDate: '2025-06-10T10:00:00Z',
      //     createdAt: '2025-06-08T09:00:00Z',
      //     updatedAt: '2025-06-10T16:00:00Z',
      //     address: 'Rua das Flores, 123',
      //     city: 'São Paulo',
      //     state: 'SP',
      //     rating: 5,
      //     review: 'Excelente trabalho! Muito satisfeito com o resultado.',
      //     price: 150,
      //     service: { id: '1', name: 'Limpeza Residencial', category: 'Limpeza' },
      //     serviceProvider: {
      //       id: '1',
      //       user: { name: 'Maria Silva', profileImage: null },
      //       rating: 4.8,
      //       reviewCount: 127
      //     }
      //   },
      //   {
      //     id: '2',
      //     status: 'PENDING',
      //     description: 'Instalação de ar condicionado split 12000 BTUs',
      //     preferredDate: '2025-06-15T14:00:00Z',
      //     createdAt: '2025-06-12T10:30:00Z',
      //     updatedAt: '2025-06-12T10:30:00Z',
      //     address: 'Av. Paulista, 1000',
      //     city: 'São Paulo',
      //     state: 'SP',
      //     price: 300,
      //     service: { id: '2', name: 'Instalação de Ar Condicionado', category: 'Técnico' },
      //     serviceProvider: {
      //       id: '2',
      //       user: { name: 'João Santos', profileImage: null },
      //       rating: 4.9,
      //       reviewCount: 89
      //     }
      //   },
      //   {
      //     id: '3',
      //     status: 'REJECTED',
      //     description: 'Reforma de banheiro - troca de azulejos e louças',
      //     preferredDate: '2025-06-20T08:00:00Z',
      //     createdAt: '2025-06-11T15:45:00Z',
      //     updatedAt: '2025-06-12T09:15:00Z',
      //     address: 'Rua dos Jardins, 456',
      //     city: 'São Paulo',
      //     state: 'SP',
      //     service: { id: '3', name: 'Reforma de Banheiro', category: 'Reforma' },
      //     serviceProvider: {
      //       id: '3',
      //       user: { name: 'Carlos Pereira', profileImage: null },
      //       rating: 4.5,
      //       reviewCount: 234
      //     }
      //   }
      // ]

      // // Simulate API delay
      // await new Promise(resolve => setTimeout(resolve, 1000))
      // setRequests(mockData)
      
    } catch (error) {
      console.error('Error fetching service history:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortRequests = () => {
    let filtered = [...requests]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.serviceProvider.user.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0
      
      switch (sortBy) {
        case 'date':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'status':
          compareValue = a.status.localeCompare(b.status)
          break
        case 'rating':
          compareValue = (a.rating || 0) - (b.rating || 0)
          break
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    setFilteredRequests(filtered)
  }

  const openCancelModalFor = (request: ServiceRequest) => {
    setCancelModal({ id: request.id, reason: '', loading: false })
  }

  const submitCancellation = async () => {
    if (!cancelModal) return
    if (!cancelModal.reason || cancelModal.reason.trim().length < 5) {
      toast.error('Conte-nos o motivo do cancelamento (mínimo 5 caracteres).')
      return
    }
    try {
      setCancelModal({ ...cancelModal, loading: true })
      const res = await fetch(`/api/bookings/${cancelModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          cancelReason: cancelModal.reason.trim(),
          cancelledBy: 'CLIENT',
        })
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Não foi possível cancelar o pedido.')
      toast.success('Pedido cancelado com sucesso.')
      setCancelModal(null)
      await fetchServiceHistory()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Erro ao cancelar o pedido. Tente novamente.')
      setCancelModal((current) => current ? { ...current, loading: false } : current)
    }
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

  const getStatusBadge = (status: ServiceRequest['status']) => {
    const config = statusConfig[status]
    const IconComponent = config.icon

    return (
      <Badge className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Solicitações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
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
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Histórico de Solicitações</span>
            <Badge variant="secondary">{requests.length}</Badge>
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
            
            
<div className="relative w-full sm:w-auto">
  <button
    onClick={() => setStatusMenuOpen(!statusMenuOpen)}
    className="w-full sm:w-auto px-3 py-2 border border-gray-300 bg-white rounded-md text-sm flex justify-between items-center"
  >
    <span>
      {{
        ALL: 'Todos os status',
        PENDING: 'Pendente',
        ACCEPTED: 'Aceito',
        COMPLETED: 'Concluído',
        REJECTED: 'Rejeitado',
        CANCELLED: 'Cancelado'
      }[statusFilter as keyof typeof statusConfig] ?? 'Todos os status'}
    </span>
    <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
  </button>

  {statusMenuOpen && (
    <div className="absolute z-10 mt-2 w-full sm:w-[220px] bg-white border border-gray-200 rounded-md shadow-lg p-2 space-y-1">
      {[
        { value: 'ALL', label: 'Todos os status' },
        { value: 'PENDING', label: 'Pendente' },
        { value: 'ACCEPTED', label: 'Aceito' },
        { value: 'COMPLETED', label: 'Concluído' },
        { value: 'REJECTED', label: 'Rejeitado' },
        { value: 'CANCELLED', label: 'Cancelado' }
      ].map((option) => (
        <button
          key={option.value}
          onClick={() => {
            setStatusFilter(option.value)
            setStatusMenuOpen(false)
          }}
          className={`flex items-center justify-between w-full px-3 py-1 text-sm rounded hover:bg-gray-100 ${
            statusFilter === option.value ? 'font-semibold text-blue-600' : 'text-gray-700'
          }`}
        >
          {option.label}
          {statusFilter === option.value && <Check className="w-4 h-4" />}
        </button>
      ))}
    </div>
  )}
</div>
            
            {/* <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Filtros
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button> */}
            <div className="relative w-full sm:w-auto">
  <Button
    variant="outline"
    size="sm"
    onClick={() => setFilterMenuOpen(!filterMenuOpen)}
    className="w-full sm:w-auto"
  >
    <Filter className="w-4 h-4 mr-1" />
    Filtros
    <ChevronDown className="w-3 h-3 ml-1" />
  </Button>

  {filterMenuOpen && (
    <div className="absolute z-10 mt-2 w-full sm:w-[220px] bg-white border border-gray-200 rounded-md shadow-lg p-2 space-y-2">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Ordenar por</p>
        {['date', 'status', 'rating'].map((option) => (
          <button
            key={option}
            onClick={() => {
              setSortBy(option as typeof sortBy)
              setFilterMenuOpen(false)
            }}
            className={`flex items-center justify-between w-full px-3 py-1 text-sm rounded hover:bg-gray-100 ${
              sortBy === option ? 'font-semibold text-blue-600' : 'text-gray-700'
            }`}
          >
            {option === 'date' ? 'Data' : option === 'status' ? 'Status' : 'Avaliação'}
            {sortBy === option && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Ordem</p>
        {['asc', 'desc'].map((order) => (
          <button
            key={order}
            onClick={() => {
              setSortOrder(order as typeof sortOrder)
              setFilterMenuOpen(false)
            }}
            className={`flex items-center justify-between w-full px-3 py-1 text-sm rounded hover:bg-gray-100 ${
              sortOrder === order ? 'font-semibold text-blue-600' : 'text-gray-700'
            }`}
          >
            {order === 'asc' ? 'Crescente' : 'Decrescente'}
            {sortOrder === order && <Check className="w-4 h-4" />}
          </button>
        ))}
      </div>
    </div>
  )}
</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredRequests.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {requests.length === 0 
                ? 'Você ainda não fez nenhuma solicitação de serviço'
                : 'Nenhuma solicitação encontrada com os filtros aplicados'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const canReview = request.status === 'COMPLETED' && !request.rating
              const canCancel = request.status === 'PENDING' || request.status === 'ACCEPTED' || request.status === 'HOLD'
              const hasActions = canReview || canCancel
              const displayPrice = request.finalPrice ?? request.price
              const paymentLabel = request.paymentMethod ? (paymentMethodLabels[request.paymentMethod] || request.paymentMethod) : null

              return (
                <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-3 lg:space-y-0">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-lg">{request.service.name}</h3>
                          <p className="text-sm text-gray-600">{request.service.category}</p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <p className="text-gray-700 text-sm">{request.description}</p>

                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{request.city}, {request.state}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Criado em {formatDate(request.createdAt)}</span>
                        </div>

                        {request.preferredDate && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Agendado para {formatDate(request.preferredDate)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {request.serviceProvider.user.profileImage ? (
                              <Image
                                src={request.serviceProvider.user.profileImage}
                                alt={request.serviceProvider.user.name}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <User className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <span className="text-sm font-medium">{request.serviceProvider.user.name}</span>
                        </div>

                        {request.serviceProvider.rating && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm">{request.serviceProvider.rating}</span>
                            <span className="text-sm text-gray-500">({request.serviceProvider.reviewCount})</span>
                          </div>
                        )}

                        {displayPrice != null && (
                          <div className="text-sm font-medium text-green-600">
                            R$ {displayPrice.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {paymentLabel && request.status === 'COMPLETED' && (
                        <div className="text-xs text-gray-500">Pagamento: {paymentLabel}</div>
                      )}

                      {request.status === 'CANCELLED' && request.cancellationReason && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <p className="text-sm text-gray-700">
                            <strong>Motivo do cancelamento:</strong> {request.cancellationReason}
                          </p>
                        </div>
                      )}

                      {request.rating && request.review && (
                        <div className="bg-gray-50 rounded-lg p-3 mt-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium">Sua avaliação:</span>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < request.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{request.review}</p>
                        </div>
                      )}
                    </div>

                    {hasActions && (
                      <div className="flex flex-col space-y-2 lg:ml-4">
                        {canReview && (
                          <a href={`/dashboard/cliente?tab=history&reviewBookingId=${request.id}`}>
                            <Button size="sm" variant="outline">
                              Avaliar Serviço
                            </Button>
                          </a>
                        )}

                        {canCancel && (
                          <Button size="sm" variant="outline" onClick={() => openCancelModalFor(request)}>
                            Cancelar
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>

    {cancelModal && (
      <div className="fixed inset-0 z-[1300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-brand-navy">Cancelar pedido</h3>
            <p className="text-sm text-gray-600">Conte ao profissional o motivo do cancelamento.</p>
          </div>
          <Textarea
            placeholder="Escreva o motivo do cancelamento"
            value={cancelModal.reason}
            onChange={(e) => setCancelModal((current) => current ? { ...current, reason: e.target.value } : current)}
            rows={4}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelModal(null)} disabled={cancelModal.loading}>
              Voltar
            </Button>
            <Button onClick={submitCancellation} disabled={cancelModal.loading}>
              {cancelModal.loading ? 'Cancelando...' : 'Confirmar cancelamento'}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
