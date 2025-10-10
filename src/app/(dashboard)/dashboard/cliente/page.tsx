/**
 * Complete Client Dashboard page
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { LucideIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Calendar, Search, Star, Clock, MapPin, CheckCircle, XCircle, AlertCircle, User, Heart, Settings, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClientHistory } from '@/components/dashboard/client-history'
import { ClientFavorites } from '@/components/dashboard/client-favorites'
import { ClientProfileSettings } from '@/components/dashboard/client-profile-settings'
import { BookingWhatsAppContact } from '@/components/whatsapp/booking-whatsapp-contact'
import { ClientReviewModal } from '@/components/dashboard/client-review-modal'
import { TermsConsentPrompt } from '@/components/legal/terms-consent'
import { SupportChatWidgetWrapper } from '@/components/chat/SupportChatWidgetWrapper'


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
    status: 'PENDING' | 'APPROVED' | 'FAILED' | 'REFUNDED'
  }
}

function ClientDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const reviewBookingParam = searchParams.get('reviewBookingId')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabOption>('overview')
  const [pendingReviews, setPendingReviews] = useState(0)
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null)

    type TabOption = 'overview' | 'history' | 'favorites' | 'settings'

  const tabs: { id: TabOption; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Visão Geral', icon: User },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'favorites', label: 'Favoritos', icon: Heart },
  { id: 'settings', label: 'Configurações', icon: Settings }
]
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/entrar')
    }
  }, [status, router])

  const fetchBookings = useCallback(async () => {
    if (!session?.user?.id) return []
    const response = await fetch(`/api/bookings/with-payments?clientId=${session.user.id}`)
    if (response.ok) {
      const data = await response.json()
      return data.bookings as Booking[]
    }
    return []
  }, [session?.user?.id])

  const bookingsQuery = useQuery({
    queryKey: ['client-bookings', session?.user?.id],
    queryFn: fetchBookings,
    enabled: !!session?.user?.id,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    initialData: [] as Booking[],
  })

  const fetchPendingReviews = useCallback(async () => {
    try {
      if (!session?.user?.id) return
      const res = await fetch(`/api/reviews/pending?clientId=${session.user.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) setPendingReviews(data.data.count)
      }
    } catch (e) {
      console.error('Error fetching pending reviews:', e)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (tabParam && ['overview', 'history', 'favorites', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam as TabOption)
    }
  }, [tabParam])

  useEffect(() => {
    if (reviewBookingParam) {
      setReviewBookingId(reviewBookingParam)
    }
  }, [reviewBookingParam])

  useEffect(() => {
    if (!session?.user?.id) return

    let cancelled = false
    const execute = async () => {
      setLoading(true)
      try {
        const data = await fetchBookings()
        if (!cancelled) setBookings(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
      if (!cancelled) fetchPendingReviews()
    }

    execute()

    return () => {
      cancelled = true
    }
  }, [session?.user?.id, fetchBookings, fetchPendingReviews])

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  if (status !== 'authenticated') {
    return null
  }

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
  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
    ACCEPTED: { label: 'Aceito', className: 'bg-green-100 text-green-800' },
    REJECTED: { label: 'Rejeitado', className: 'bg-red-100 text-red-800' },
    COMPLETED: { label: 'Concluído', className: 'bg-blue-100 text-blue-800' },
    CANCELLED: { label: 'Cancelado', className: 'bg-gray-200 text-gray-700' },
    HOLD: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' }
  }
    
    const cfg = statusConfig[status] ?? { label: status, className: 'bg-gray-200 text-gray-700' }
    return (
      <Badge className={cfg.className}>
        {cfg.label}
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

  if (loading && (!bookingsQuery.data || bookingsQuery.data.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }


  return (
    <>
    <TermsConsentPrompt />
    <SupportChatWidgetWrapper />
    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-navy">Dashboard do Cliente</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Bem-vindo de volta, {session?.user?.name ?? 'usuário'}!
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/servicos">
              <Search className="h-4 w-4 mr-2" />
              Buscar Serviços
            </Link>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      {/* <div className="border-b">
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
      </div> */}
      <div className="border-b">
  <nav className="flex flex-wrap justify-between sm:justify-start gap-1 sm:gap-4 overflow-x-auto pb-1">
    {tabs.map((tab) => {
      const Icon = tab.icon
      const isActive = activeTab === tab.id
      return (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as TabOption)}
          className={`flex flex-col items-center justify-center min-w-[120px] px-2 py-2 text-sm font-semibold transition-colors border-b-4 rounded-t-md ${
            isActive
              ? 'text-[#00a9d4] border-[#00a9d4]'
              : 'text-gray-500 border-transparent hover:text-[#00a9d4]'
          }`}
        >
          <Icon className="w-[18px] h-[18px] mb-1" />
          {tab.label}
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
                    <p className="text-2xl font-bold">{pendingReviews}</p>
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
                      className="flex flex-col md:flex-row md:items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex-shrink-0 md:mt-1">
                        {getStatusIcon(booking.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <h3 className="text-sm font-medium text-foreground truncate">
                            {booking.service.name}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {booking.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <div className="inline-flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{booking.serviceProvider.user.name}</span>
                          </div>
                          
                          <div className="inline-flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{booking.city}, {booking.state}</span>
                          </div>
                          
                          {booking.preferredDate && (
                            <div className="inline-flex items-center space-x-1">
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Button className="h-24 flex-col justify-center text-center" variant="outline" asChild>
                  <Link href="/servicos">
                    <Search className="h-6 w-6 mb-2" />
                    Buscar Serviços
                  </Link>
                </Button>
                
                <Button className="h-24 flex-col justify-center text-center" variant="outline" onClick={() => setActiveTab('history')}>
                  <History className="h-6 w-6 mb-2" />
                  Ver Histórico
                </Button>
                
                <Button className="h-24 flex-col justify-center text-center" variant="outline" onClick={() => setActiveTab('favorites')}>
                  <Heart className="h-6 w-6 mb-2" />
                  Meus Favoritos
                </Button>
                
                <Button className="h-24 flex-col justify-center text-center" variant="outline" onClick={() => setActiveTab('settings')}>
                  <Settings className="h-6 w-6 mb-2" />
                  Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && session?.user?.id && (
        <ClientHistory clientId={session.user.id} />
      )}

      {activeTab === 'favorites' && session?.user?.id && (
  <ClientFavorites clientId={session?.user?.id} />
)}


      {activeTab === 'settings' && (
        <ClientProfileSettings />
      )}

      {reviewBookingId && (
        <ClientReviewModal
          bookingId={reviewBookingId}
          onClose={() => setReviewBookingId(null)}
          onSubmitted={() => {
            fetchPendingReviews()
          }}
        />
      )}
    </div>
    </>
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
