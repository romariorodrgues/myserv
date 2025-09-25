/**
 * Service Provider Dashboard page
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, Suspense, useCallback } from 'react'
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
import PlansSettings from '@/components/dashboard/plans-settings'
import { ClientProfileSettings } from '@/components/dashboard/client-profile-settings'
import axios from 'axios'
import PaymentHistory from '@/components/dashboard/payments-history'
import React from 'react'
import { TermsConsentPrompt } from '@/components/legal/terms-consent'
import { SupportChatWidgetWrapper } from '@/components/chat/SupportChatWidgetWrapper'
import { ProviderReviewModal } from '@/components/dashboard/provider-review-modal'

const formatCurrency = (value?: number | null) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—'

interface ProviderBooking {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'HOLD'
  requestType?: 'SCHEDULING' | 'QUOTE'
  description: string
  preferredDate: string | null
  createdAt: string
  address: string
  city: string
  state: string
  estimatedPrice?: number | null
  finalPrice?: number | null
  travelCost?: number | null
  basePriceSnapshot?: number | null
  travelDistanceKm?: number | null
  travelDurationMinutes?: number | null
  travelRatePerKmSnapshot?: number | null
  travelMinimumFeeSnapshot?: number | null
  travelFixedFeeSnapshot?: number | null
  providerReviewRating?: number | null
  providerReviewComment?: string | null
  providerReviewGivenAt?: string | null
  service: {
    name: string
  }
  client: {
    id?: string
    name: string
    profileImage: string | null
    phone?: string
  }
  payment?: {
    status: 'PENDING' | 'APPROVED' | 'FAILED' | 'REFUNDED'
  }
}

type TDashboardTab = 'overview' | 'schedule' | 'history' | 'metrics' | 'pricing' | 'settings'

function ProviderDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [avgRating, setAvgRating] = useState<number>(0)
  const [totalReviews, setTotalReviews] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<TDashboardTab>('overview')
  const { data: bookings, isLoading, isFetching, refetch: refetchBookings } = useQuery<ProviderBooking[]>({
    queryKey: ['bookings'],
    initialData: [],
    queryFn: async () => {
      const { data } = await axios.get(`/api/bookings/with-payments?providerId=${currentSession.user.id}`);
      return data.bookings;
    },
  })
  const fetchRatings = useCallback(async () => {
    const currentSession = session
    if (!currentSession?.user?.id) return
    try {
      const res = await fetch(`/api/reviews?serviceProviderId=${currentSession.user.id}&limit=1`)
      if (res.ok) {
        const data = await res.json()
        const stats = data?.data?.statistics
        if (stats) {
          setAvgRating(stats.averageRating || 0)
          setTotalReviews(stats.totalReviews || 0)
        }
      }
    } catch (e) {
      console.error('Error fetching provider ratings:', e)
    }
  }, [session])

  const fetchProviderPendingReviews = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetch(`/api/reviews/pending?providerId=${session.user.id}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.success) {
        setPendingProviderReviews(data.data.count ?? 0)
        setProviderPendingItems(data.data.items ?? [])
      }
    } catch (error) {
      console.error('Error fetching provider pending reviews:', error)
    }
  }, [session?.user?.id])

  const hasProfileImage = Boolean((session?.user as any)?.profileImage || (session?.user as any)?.image)

  useEffect(() => {
    if (status === 'loading') return; // Sessão ainda está carregando
    
    const currentSession = session /* || mockSession; */
    
    if (!currentSession) {
      router.push('/entrar');
      return;
    }
    
    if (currentSession.user.userType !== 'SERVICE_PROVIDER') {
      router.push('/dashboard/cliente');
      return;
    }

    // Gate: perfil em análise
    if (!currentSession.user.isApproved) {
      setActiveTab('overview')
      return
    }
    
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'schedule', 'history', 'metrics', 'pricing', 'settings'].includes(tab)) {
      setActiveTab(tab as 'overview' | 'schedule' | 'history' | 'metrics' | 'pricing' | 'settings');
    }
    
    fetchRatings();
    fetchProviderPendingReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [status, session, router, searchParams, fetchProviderPendingReviews]);

    /** 
     * A função a baixo está sendo executada em looping
     * fetchBookings()
     * 
     * Dicas para solução:
     * 1 - entender o que a mesma retorna e qual a importância dela para o fluxo da página
     * 2 - verificar se a função realmente deve ser chamada em umm useEffect
     * 3 - verificar se todos os estados que estão como dependencia do useEffect realmente precisam estar lá
     * 4 - Utilizar o react-query para fazer a requisição de dados poderá simplificar o fluxo além de evitar loops infinitos
     * 
     * OBS.: A página está quebrando devido a função está comentada
    */


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
        await fetchProviderPendingReviews()

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

  const [schedMap, setSchedMap] = useState<Record<string, { date: string; time: string }>>({})
  const [openPricingId, setOpenPricingId] = useState<string | null>(null)
  const [pendingProviderReviews, setPendingProviderReviews] = useState(0)
  const [providerPendingItems, setProviderPendingItems] = useState<Array<{ id: string; client: { id: string; name: string; profileImage?: string | null }; serviceName: string }>>([])
  const [providerReviewBookingId, setProviderReviewBookingId] = useState<string | null>(null)
  const openScheduleFor = (id: string) => {
    setSchedMap((m) => ({ ...m, [id]: m[id] || { date: new Date().toISOString().split('T')[0], time: '' } }))
  }
  const updateSchedField = (id: string, field: 'date'|'time', value: string) => {
    setSchedMap((m) => ({ ...m, [id]: { ...(m[id] || { date: '', time: '' }), [field]: value } }))
  }
  const scheduleFromQuote = async (id: string) => {
    const payload = schedMap[id]
    if (!payload?.date || !payload?.time) { alert('Selecione data e horário'); return }
    try {
      const res = await fetch(`/api/bookings/${id}/schedule`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scheduledDate: payload.date, scheduledTime: payload.time }) })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Falha ao agendar')
      await refetchBookings()
      alert('Orçamento agendado e aceito!')
    } catch (e) {
      alert((e as any)?.message || 'Erro ao agendar')
    }
  }

  useEffect(() => {
    if (status === 'loading') return // Still loading

    // Check URL params for active tab
    const tab = searchParams.get('tab')
    if (tab && ['overview', 'schedule', 'history', 'metrics', 'pricing', 'settings'].includes(tab)) {
      setActiveTab(tab as TDashboardTab)
    }

  }, [searchParams, status])

  if (!session && status === 'unauthenticated') {
    router.push('/entrar')
    return
  }

  if (session && session.user.userType !== 'SERVICE_PROVIDER') {
    router.push('/dashboard/cliente')
    return
  }

  if (!session) {
    return null
  }

  const underReview = session.user.userType === 'SERVICE_PROVIDER' && !session.user.isApproved

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

  const currentSession = session
  const pendingBookings = bookings.filter(b => b.status === 'PENDING' || b.status === 'HOLD').length
  const acceptedBookings = bookings.filter(b => b.status === 'ACCEPTED').length
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'schedule', label: 'Agenda', icon: Calendar },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'metrics', label: 'Métricas', icon: BarChart3 },
    { id: 'pricing', label: 'Serviços', icon: DollarSign },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ]

  if (underReview && activeTab !== 'settings') {
    return (
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard do Prestador</h1>
            <p className="text-muted-foreground">
              Olá, {currentSession?.user?.name || 'Prestador'}! Seu cadastro está em análise.
            </p>
          </div>
        </div>

        <div className="border-b">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActiveTab = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActiveTab
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

        <div className="max-w-3xl mx-auto py-10">
          <Card>
            <CardHeader>
              <CardTitle>Perfil em análise</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">Seu cadastro como prestador está em revisão. Em até 72h você deve receber uma resposta.</p>
              <p className="text-gray-600 mb-6">Acesse Configurações para completar seu perfil (foto, dados) e acelerar a aprovação.</p>
              <div className="flex gap-2">
                <Button onClick={() => setActiveTab('settings')}>Ir para Configurações</Button>
              </div>
            </CardContent>
          </Card>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard do Prestador</h1>
          <p className="text-muted-foreground">
            Olá, {currentSession?.user?.name || 'Prestador'}! Gerencie seus serviços e agendamentos
          </p>
        </div>
      </div>

      {!hasProfileImage && (
        <Card className="border border-dashed border-orange-200 bg-orange-50/70">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-800">Adicione uma foto de perfil</p>
              <p className="text-xs text-orange-700">
                Fotos de perfil aceleram a aprovação e aumentam a confiança dos clientes na sua página profissional.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setActiveTab('settings')}>
              Atualizar foto
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
      {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
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
      {underReview && activeTab !== 'settings' ? (
        <div className="max-w-3xl mx-auto py-10">
          <Card>
            <CardHeader>
              <CardTitle>Perfil em análise</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">Seu cadastro como prestador está em revisão. Em até 72h você deve receber uma resposta.</p>
              <p className="text-gray-600 mb-6">Acesse Configurações para completar seu perfil (foto, dados) e acelerar a aprovação.</p>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/dashboard/profissional?tab=settings')}>Ir para Configurações</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : activeTab === 'overview' && (
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
                    <ProviderMonthlyEarnings />
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
                    <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
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
                  Gerenciar Serviços
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

          <Card>
            <CardHeader>
              <CardTitle>Avaliações pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingProviderReviews > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Você tem {pendingProviderReviews} avaliação{pendingProviderReviews > 1 ? 's' : ''} para registrar.
                  </p>
                  <div className="space-y-3">
                    {providerPendingItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-cyan/10 flex items-center justify-center text-brand-cyan font-semibold">
                            {item.client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-brand-navy">{item.client.name}</p>
                            <p className="text-xs text-muted-foreground">{item.serviceName}</p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => setProviderReviewBookingId(item.id)}>
                          Avaliar
                        </Button>
                      </div>
                    ))}
                  </div>
                  {providerPendingItems.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      Mostrando 3 de {pendingProviderReviews}. Finalize uma avaliação para ver as próximas.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma avaliação pendente no momento.
                </p>
              )}
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
                      .filter(booking => booking.status === 'PENDING' || booking.status === 'HOLD')
                      .slice(0, 3)
                      .map((booking) => {
                        const basePrice = booking.basePriceSnapshot ?? null
                        const travelCost = booking.travelCost ?? null
                        const totalEstimate = booking.estimatedPrice ?? ((basePrice ?? 0) + (travelCost ?? 0))
                        const distanceLabel = typeof booking.travelDistanceKm === 'number' ? `${booking.travelDistanceKm.toFixed(1)} km` : null
                        const isPricingOpen = openPricingId === booking.id

                        return (
                        <div key={booking.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{booking.service.name}</p>
                            <div className="flex gap-2 items-center">
                              {booking.requestType === 'QUOTE' && (
                                <Badge className="bg-purple-100 text-purple-800">Orçamento</Badge>
                              )}
                              <Badge variant="outline" className="text-yellow-600">Pendente</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{booking.client.name}</p>
                          <p className="text-sm text-muted-foreground mb-3">{booking.description}</p>

                          <div className="mb-3 rounded-lg border bg-gray-50 p-3 text-sm text-gray-700 space-y-2">
                            <div className="flex items-center justify-between">
                              <span>Serviço base</span>
                              <span>{formatCurrency(basePrice)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Deslocamento</span>
                              <span>
                                {formatCurrency(travelCost)}
                                {distanceLabel && (
                                  <span className="text-xs text-gray-500 ml-2">({distanceLabel})</span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between font-semibold text-brand-navy border-t pt-2">
                              <span>Total estimado</span>
                              <span>{formatCurrency(totalEstimate)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                              <span>
                                {booking.travelRatePerKmSnapshot != null
                                  ? `Taxa por km: R$ ${booking.travelRatePerKmSnapshot.toFixed(2)}`
                                  : 'Taxa por km não configurada'}
                              </span>
                              <button
                                type="button"
                                className="text-brand-cyan hover:underline"
                                onClick={() => setOpenPricingId((prev) => prev === booking.id ? null : booking.id)}
                              >
                                {isPricingOpen ? 'Ocultar detalhes' : 'Detalhes de preço'}
                              </button>
                            </div>

                            {isPricingOpen && (
                              <div className="mt-2 space-y-1 text-xs text-gray-600">
                                <div>Taxa fixa: {formatCurrency(booking.travelFixedFeeSnapshot)}</div>
                                {booking.travelMinimumFeeSnapshot != null && (
                                  <div>Taxa mínima configurada: {formatCurrency(booking.travelMinimumFeeSnapshot)}</div>
                                )}
                                {typeof booking.travelDurationMinutes === 'number' && (
                                  <div>Duração estimada: ~{Math.round(booking.travelDurationMinutes)} min</div>
                                )}
                                {!distanceLabel && (
                                  <div>Mantenha os endereços atualizados para obter uma distância precisa.</div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action buttons for pending bookings */}
                          <div className="flex flex-col gap-2 mb-3">
                            {booking.requestType === 'QUOTE' ? (
                              <>
                                {!schedMap[booking.id] ? (
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => openScheduleFor(booking.id)}>Agendar</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleBookingAction(booking.id, 'REJECTED')}>Recusar</Button>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-end gap-2">
                                    <div>
                                      <label className="text-xs text-gray-600">Data</label>
                                      <input type="date" value={schedMap[booking.id]?.date || ''} onChange={(e) => updateSchedField(booking.id, 'date', e.target.value)} className="block border rounded px-2 py-1 text-sm" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-600">Hora</label>
                                      <input type="time" value={schedMap[booking.id]?.time || ''} onChange={(e) => updateSchedField(booking.id, 'time', e.target.value)} className="block border rounded px-2 py-1 text-sm" />
                                    </div>
                                    <Button size="sm" onClick={() => scheduleFromQuote(booking.id)}>Confirmar</Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSchedMap((m) => {
                                        const next = { ...m }
                                        delete next[booking.id]
                                        return next
                                      })}
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleBookingAction(booking.id, 'ACCEPTED')}>Aceitar</Button>
                                <Button size="sm" variant="outline" onClick={() => handleBookingAction(booking.id, 'REJECTED')}>Rejeitar</Button>
                              </div>
                            )}
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
                      )})
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Nenhuma solicitação pendente</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link href="/dashboard/profissional?tab=settings">
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
                  .filter(booking => (booking.status === 'ACCEPTED' && booking.payment?.status === 'APPROVED') || booking.status === 'COMPLETED')
                  .length > 0 ? (
                  bookings
                    .filter(booking => (booking.status === 'ACCEPTED' && booking.payment?.status === 'APPROVED') || booking.status === 'COMPLETED')
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
                {(() => {
                  const now = new Date()
                  const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                  const inLast30 = (d?: string | null) => (d ? (new Date(d) >= days30 && new Date(d) <= now) : false)
                  const recent = bookings.filter(b => inLast30(b.createdAt))
                  const responded = recent.filter(b => b.status !== 'PENDING').length
                  const rate = recent.length > 0 ? Math.round((responded / recent.length) * 100) : null
                  return (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="font-semibold">Taxa de Resposta</h3>
                      <p className="text-2xl font-bold text-blue-600">{rate === null ? '—' : `${rate}%`}</p>
                      <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
                    </div>
                  )
                })()}

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Satisfação</h3>
                  <p className="text-2xl font-bold text-green-600">{avgRating.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">{totalReviews} avaliações</p>
                </div>

                <MonthlyAverageRevenueCard bookings={bookings} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'schedule' && currentSession?.user?.id && (
        <ProviderSchedule providerId={currentSession.user.id} />
      )}

      {activeTab === 'history' && currentSession?.user?.id && (
        <ProviderServiceHistory providerId={currentSession.user.id} />
      )}

      {activeTab === 'metrics' && currentSession?.user?.id && (
        <ProviderMetrics providerId={currentSession.user.id} />
      )}

      {activeTab === 'pricing' && currentSession?.user?.id && (
        <ProviderPriceManagement/>
      )}

      {activeTab === 'settings' && (
        <div className='flex gap-4 flex-col'>
          <ClientProfileSettings />
          <PlansSettings />
          <PaymentHistory />
        </div>
      )}
    </div>
    {providerReviewBookingId && (
      <ProviderReviewModal
        bookingId={providerReviewBookingId}
        onClose={() => setProviderReviewBookingId(null)}
        onSubmitted={() => {
          const reviewId = providerReviewBookingId
          setProviderReviewBookingId(null)
          if (reviewId) {
            setProviderPendingItems((items) => items.filter((item) => item.id !== reviewId))
            setPendingProviderReviews((count) => Math.max(0, count - 1))
          }
          fetchProviderPendingReviews()
        }}
      />
    )}
    </>
  )
}

export default function ProviderDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProviderDashboardContent />
    </Suspense>
  )
}

function ProviderMonthlyEarnings() {
  const { data, isLoading } = useQuery<{ success: boolean; data?: { net: number } }>({
    queryKey: ['provider-earnings'],
    queryFn: async () => {
      const res = await fetch('/api/providers/earnings')
      return res.json()
    },
  })
  const value = data?.data?.net ?? 0
  const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  return <p className="text-2xl font-bold">{isLoading ? '—' : formatted}</p>
}

function MonthlyAverageRevenueCard({ bookings }: { bookings: ProviderBooking[] }) {
  const { data } = useQuery<{ success: boolean; data?: { net: number } }>({
    queryKey: ['provider-earnings'],
    queryFn: async () => {
      const res = await fetch('/api/providers/earnings')
      return res.json()
    },
  })
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const inCurrentMonth = (d?: string | null) => (d ? (new Date(d) >= monthStart && new Date(d) <= now) : false)
  const monthPaidCount = bookings.filter(b => inCurrentMonth(b.createdAt) && b.payment?.status === 'COMPLETED').length
  const net = data?.data?.net ?? 0
  const average = monthPaidCount > 0 ? net / monthPaidCount : 0
  const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(average)
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <DollarSign className="w-8 h-8 text-purple-600" />
      </div>
      <h3 className="font-semibold">Receita Média</h3>
      <p className="text-2xl font-bold text-purple-600">{formatted}</p>
      <p className="text-sm text-muted-foreground">Por serviço (mês atual)</p>
    </div>
  )
}
