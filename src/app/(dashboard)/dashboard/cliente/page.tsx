/**
 * Complete Client Dashboard page
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

// import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { Calendar, Search, Star, Clock, MapPin, CheckCircle, XCircle, AlertCircle, User, Heart, Settings, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClientHistory } from '@/components/dashboard/client-history'
import { ClientFavorites } from '@/components/dashboard/client-favorites'
import { ClientProfileSettings } from '@/components/dashboard/client-profile-settings'
import { BookingWhatsAppContact } from '@/components/whatsapp/booking-whatsapp-contact'

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
  serviceProvider: {
    user: {
      name: string
      profileImage: string | null
      phone?: string
    }
  }
  payment?: {
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  }
}

function ClientDashboardContent() {
  // const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'favorites' | 'settings'>('overview')
  
  // Temporary mock data for development
  const session = { user: { name: 'João Cliente', userType: 'CLIENT', id: 'client-1' } }

  const fetchBookings = useCallback(async () => {
    try {
      // Fetch bookings with payment information for WhatsApp communication
      const response = await fetch(`/api/bookings/with-payments?clientId=${session.user.id}`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings)
      } else {
        // Mock data for development with payment status
        const mockBookings: Booking[] = [
          {
            id: '1',
            status: 'ACCEPTED',
            description: 'Limpeza residencial completa para apartamento de 3 quartos',
            preferredDate: '2025-06-15T10:00:00Z',
            createdAt: '2025-06-10T09:00:00Z',
            address: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'SP',
            service: { name: 'Limpeza Residencial' },
            serviceProvider: {
              user: { 
                name: 'Maria Silva', 
                profileImage: null,
                phone: '(11) 99999-1234'
              }
            },
            payment: { status: 'COMPLETED' }
          },
          {
            id: '2',
            status: 'ACCEPTED',
            description: 'Instalação de ar condicionado split',
            preferredDate: '2025-06-18T14:00:00Z',
            createdAt: '2025-06-12T11:30:00Z',
            address: 'Av. Paulista, 1000',
            city: 'São Paulo',
            state: 'SP',
            service: { name: 'Instalação de Ar Condicionado' },
            serviceProvider: {
              user: { 
                name: 'João Santos', 
                profileImage: null,
                phone: '(11) 98888-5678'
              }
            },
            payment: { status: 'PENDING' }
          }
        ]
        setBookings(mockBookings)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      // Set mock data on error
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [session.user.id])

  useEffect(() => {
    // Check URL params for active tab
    const tab = searchParams.get('tab')
    if (tab && ['overview', 'history', 'favorites', 'settings'].includes(tab)) {
      setActiveTab(tab as any)
    }
    
    fetchBookings()
  }, [searchParams, fetchBookings])

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: Booking['status']) => {
    const statusConfig = {
      PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      ACCEPTED: { label: 'Aceito', className: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Rejeitado', className: 'bg-red-100 text-red-800' },
      COMPLETED: { label: 'Concluído', className: 'bg-blue-100 text-blue-800' }
    }
    
    return (
      <Badge className={statusConfig[status].className}>
        {statusConfig[status].label}
      </Badge>
    )
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'favorites', label: 'Favoritos', icon: Heart },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard do Cliente</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {session.user.name}!
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button asChild>
            <Link href="/servicos">
              <Search className="h-4 w-4 mr-2" />
              Buscar Serviços
            </Link>
          </Button>
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
                onClick={() => setActiveTab(tab.id as any)}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Solicitações Ativas</p>
                    <p className="text-2xl font-bold">
                      {bookings.filter(b => b.status === 'PENDING' || b.status === 'ACCEPTED').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Serviços Concluídos</p>
                    <p className="text-2xl font-bold">
                      {bookings.filter(b => b.status === 'COMPLETED').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avaliações Pendentes</p>
                    <p className="text-2xl font-bold">2</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Solicitações Recentes</CardTitle>
                <Button variant="outline" onClick={() => setActiveTab('history')}>
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Você ainda não fez nenhuma solicitação de serviço
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/servicos">
                      Buscar Serviços
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 3).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-start space-x-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(booking.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-foreground truncate">
                            {booking.service.name}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {booking.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{booking.serviceProvider.user.name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{booking.city}, {booking.state}</span>
                          </div>
                          
                          {booking.preferredDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(booking.preferredDate)}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* WhatsApp Communication Section */}
                        <div className="mt-3 pt-3 border-t">
                          <BookingWhatsAppContact
                            booking={booking}
                            userType="CLIENT"
                            variant="compact"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button className="h-20 flex-col" variant="outline" asChild>
                  <Link href="/servicos">
                    <Search className="h-6 w-6 mb-2" />
                    Buscar Serviços
                  </Link>
                </Button>
                
                <Button className="h-20 flex-col" variant="outline" onClick={() => setActiveTab('history')}>
                  <History className="h-6 w-6 mb-2" />
                  Ver Histórico
                </Button>
                
                <Button className="h-20 flex-col" variant="outline" onClick={() => setActiveTab('favorites')}>
                  <Heart className="h-6 w-6 mb-2" />
                  Meus Favoritos
                </Button>
                
                <Button className="h-20 flex-col" variant="outline" onClick={() => setActiveTab('settings')}>
                  <Settings className="h-6 w-6 mb-2" />
                  Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <ClientHistory clientId={session.user.id} />
      )}

      {activeTab === 'favorites' && (
        <ClientFavorites clientId={session.user.id} />
      )}

      {activeTab === 'settings' && (
        <ClientProfileSettings clientId={session.user.id} />
      )}
    </div>
  )
}

export default function ClientDashboard() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    }>
      <ClientDashboardContent />
    </Suspense>
  )
}
