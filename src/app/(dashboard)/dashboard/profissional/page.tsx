/**
 * Service Provider Dashboard page
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  DollarSign,
  Star,
  Users,
  Settings,
  TrendingUp,
  BarChart3,
  Clock, CheckCircle,
  AlertCircle,
  History,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProviderSchedule } from '@/components/dashboard/provider-schedule'
import { ProviderServiceHistory } from '@/components/dashboard/provider-service-history'
import { ProviderMetrics } from '@/components/dashboard/provider-metrics'
import { ProviderPriceManagement } from '@/components/dashboard/provider-price-management'
import { BookingWhatsAppContact } from '@/components/whatsapp/booking-whatsapp-contact'
import { useQuery } from '@tanstack/react-query'

interface Booking {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
  description: string
  preferredDate: string | null
  createdAt: string
  address: string
  city: string
  state: string
  service: {
    name: string
  }
  client: {
    name: string
    profileImage: string | null
    phone?: string
  }
  payment?: {
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  }
}

type TDashboardTab = 'overview' | 'schedule' | 'history' | 'metrics' | 'pricing' | 'settings'

function ProviderDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TDashboardTab>('overview')
  
  // Temporary mock data for development
  const mockSession = useMemo(
    () => ({ user: { name: 'João Prestador', userType: 'SERVICE_PROVIDER', id: 'provider-1' } }),
    []
  )


  const fetchBookings = async (): Promise<Booking[]> => {
    const currentSession = session || mockSession
    if (!currentSession?.user?.id) {
      return []
    }

    try {
      // Get providerId from authenticated session - using new API with payment info
      const response = await fetch(`/api/bookings/with-payments?providerId=${currentSession.user.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.bookings) {
          return data.bookings
        }
        return []
      } else {
        // Mock data for development with payment status
        const mockBookings: Booking[] = [
          {
            id: '1',
            status: 'ACCEPTED',
            description: 'Instalação de ar condicionado',
            preferredDate: '2025-06-15T14:00:00Z',
            createdAt: '2025-06-13T10:00:00Z',
            address: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'SP',
            service: { name: 'Instalação de Ar Condicionado' },
            client: { 
              name: 'Maria Silva', 
              profileImage: null,
              phone: '(11) 99999-1111'
            },
            payment: { status: 'COMPLETED' }
          },
          {
            id: '2',
            status: 'ACCEPTED',
            description: 'Reparo em sistema elétrico',
            preferredDate: '2025-06-16T09:00:00Z',
            createdAt: '2025-06-12T15:30:00Z',
            address: 'Av. Paulista, 456',
            city: 'São Paulo',
            state: 'SP',
            service: { name: 'Reparo Elétrico' },
            client: { 
              name: 'Carlos Santos', 
              profileImage: null,
              phone: '(11) 98888-2222'
            },
            payment: { status: 'PENDING' }
          }
        ]
        return mockBookings;
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      return [];
    }
  }

  const { data: bookings, isLoading, isFetching, refetch: refetchBookings } = useQuery<Booking[]>({
    queryKey: ['fetch-bookings'],
    initialData: [],
    queryFn: fetchBookings,
  })

  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    // Check URL params for active tab
    const tab = searchParams.get('tab')
    if (tab && ['overview', 'schedule', 'history', 'metrics', 'pricing', 'settings'].includes(tab)) {
      setActiveTab(tab as TDashboardTab)
    }
    
    const currentSession = session || mockSession
    if (!currentSession) {
      router.push('/entrar')
      return
    }

    if (currentSession.user.userType !== 'SERVICE_PROVIDER') {
      router.push('/dashboard/cliente')
      return
    }

  }, [session, status, router, searchParams, mockSession])

  const handleBookingAction = async (bookingId: string, newStatus: 'ACCEPTED' | 'REJECTED' | 'COMPLETED') => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        // Refresh bookings list
        await refetchBookings()
        
        const statusText = newStatus === 'ACCEPTED' ? 'aceita' : newStatus === 'REJECTED' ? 'rejeitada' : 'marcada como concluída'
        alert(`Solicitação ${statusText} com sucesso!`)
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Erro ao atualizar status')
    }
  }

  if (isLoading || isFetching) {
    return (
      <div className="space-y-6 p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const currentSession = session || mockSession
  const pendingBookings = bookings.filter(b => b.status === 'PENDING').length
  const acceptedBookings = bookings.filter(b => b.status === 'ACCEPTED').length
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'schedule', label: 'Agenda', icon: Calendar },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'metrics', label: 'Métricas', icon: BarChart3 },
    { id: 'pricing', label: 'Preços', icon: DollarSign },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ]

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard do Prestador</h1>
          <p className="text-muted-foreground">
            Olá, {currentSession?.user?.name || 'Prestador'}! Gerencie seus serviços e agendamentos
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TDashboardTab)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Ganhos do Mês</p>
                    <p className="text-2xl font-bold">R$ 2.850,00</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Agendamentos</p>
                    <p className="text-2xl font-bold">{acceptedBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Avaliação</p>
                    <p className="text-2xl font-bold">4.8</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-muted-foreground">Clientes</p>
                    <p className="text-2xl font-bold">{completedBookings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button className="h-20 flex-col" variant="outline" onClick={() => setActiveTab('schedule')}>
                  <Calendar className="h-6 w-6 mb-2" />
                  Gerenciar Agenda
                </Button>
                
                <Button className="h-20 flex-col" variant="outline" onClick={() => setActiveTab('pricing')}>
                  <DollarSign className="h-6 w-6 mb-2" />
                  Configurar Preços
                </Button>
                
                <Button className="h-20 flex-col" variant="outline" onClick={() => setActiveTab('history')}>
                  <History className="h-6 w-6 mb-2" />
                  Ver Histórico
                </Button>
                
                <Button className="h-20 flex-col" variant="outline" onClick={() => setActiveTab('metrics')}>
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Ver Métricas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Próximos Agendamentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Próximos Agendamentos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {acceptedBookings > 0 ? (
                    bookings
                      .filter(booking => booking.status === 'ACCEPTED')
                      .slice(0, 3)
                      .map((booking) => (
                        <div key={booking.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{booking.service.name}</p>
                            <p className="text-sm text-muted-foreground">{booking.client.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString('pt-BR') : 'Data a definir'}
                            </p>
                            
                            {/* WhatsApp Communication Section */}
                            <div className="mt-2">
                              <BookingWhatsAppContact
                                booking={booking}
                                userType="SERVICE_PROVIDER"
                                variant="compact"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Nenhum agendamento próximo</p>
                      <p className="text-sm">Configure sua agenda para receber solicitações</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Solicitações Pendentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Solicitações Pendentes</span>
                  {pendingBookings > 0 && (
                    <Badge variant="secondary">{pendingBookings}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingBookings > 0 ? (
                    bookings
                      .filter(booking => booking.status === 'PENDING')
                      .slice(0, 3)
                      .map((booking) => (
                        <div key={booking.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{booking.service.name}</p>
                            <Badge variant="outline" className="text-yellow-600">
                              Pendente
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{booking.client.name}</p>
                          <p className="text-sm text-muted-foreground mb-3">{booking.description}</p>
                          
                          {/* Action buttons for pending bookings */}
                          <div className="flex space-x-2 mb-3">
                            <Button 
                              size="sm" 
                              onClick={() => handleBookingAction(booking.id, 'ACCEPTED')}
                            >
                              Aceitar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleBookingAction(booking.id, 'REJECTED')}
                            >
                              Rejeitar
                            </Button>
                          </div>
                          
                          {/* WhatsApp Communication for accepted bookings with completed payment */}
                          {booking.status !== 'PENDING' && (
                            <BookingWhatsAppContact
                              booking={booking}
                              userType="SERVICE_PROVIDER"
                              variant="compact"
                            />
                          )}
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Nenhuma solicitação pendente</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link href="/prestador/perfil">
                          Configurar Perfil
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* WhatsApp Communication Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Comunicação com Clientes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings
                  .filter(booking => (booking.status === 'ACCEPTED' && booking.payment?.status === 'COMPLETED') || booking.status === 'COMPLETED')
                  .length > 0 ? (
                  bookings
                    .filter(booking => (booking.status === 'ACCEPTED' && booking.payment?.status === 'COMPLETED') || booking.status === 'COMPLETED')
                    .slice(0, 3)
                    .map((booking) => (
                      <div key={booking.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium">{booking.service.name}</h4>
                            <p className="text-sm text-muted-foreground">Cliente: {booking.client.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {booking.status === 'COMPLETED' ? 'Serviço concluído' : 'Pagamento confirmado'}
                            </p>
                          </div>
                        </div>
                        
                        <BookingWhatsAppContact
                          booking={booking}
                          userType="SERVICE_PROVIDER"
                          variant="full"
                        />
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Nenhum cliente disponível para comunicação</p>
                    <p className="text-sm">Aceite solicitações e aguarde confirmação de pagamento</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Visão Geral de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Taxa de Resposta</h3>
                  <p className="text-2xl font-bold text-blue-600">95%</p>
                  <p className="text-sm text-muted-foreground">Última semana</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Satisfação</h3>
                  <p className="text-2xl font-bold text-green-600">4.8</p>
                  <p className="text-sm text-muted-foreground">23 avaliações</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Receita Média</h3>
                  <p className="text-2xl font-bold text-purple-600">R$ 180</p>
                  <p className="text-sm text-muted-foreground">Por serviço</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'schedule' && (
        <ProviderSchedule providerId={currentSession.user.id} />
      )}

      {activeTab === 'history' && (
        <ProviderServiceHistory providerId={currentSession.user.id} />
      )}

      {activeTab === 'metrics' && (
        <ProviderMetrics providerId={currentSession.user.id} />
      )}

      {activeTab === 'pricing' && (
        <ProviderPriceManagement providerId={currentSession.user.id} />
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Prestador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Configurações avançadas do prestador em desenvolvimento...
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" asChild>
                  <Link href="/prestador/perfil">
                    <User className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/prestador/servicos">
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar Serviços
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ProviderDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProviderDashboardContent />
    </Suspense>
  )
}
