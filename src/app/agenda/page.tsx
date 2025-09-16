/**
 * Schedule Page - Página de Agenda
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, Loader2, Phone, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Appointment {
  id: string
  serviceId: string
  serviceName: string
  category: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'
  type: 'SCHEDULING' | 'QUOTE'
  scheduledDate?: string
  description?: string
  budget?: number
  userRole: 'CLIENT' | 'PROVIDER'
  otherUser: {
    id: string
    name: string
    profileImage?: string
    phone: string
  } | null
  createdAt: string
}

export default function AgendaPage() {
  const { data: session } = useSession()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'pending' | 'accepted' | 'completed' | 'open'>('upcoming')
  const [schedMap, setSchedMap] = useState<Record<string, { date: string; time: string }>>({})

  // Fetch appointments on component mount
  useEffect(() => {
    if (session?.user) {
      fetchAppointments()
    } else {
      setLoading(false)
    }
  }, [session, filter])

  // Default providers to "pending" to surface quotes without horário
  useEffect(() => {
    if (session?.user?.userType === 'SERVICE_PROVIDER' && filter === 'upcoming') {
      setFilter('open') // Sem data específica: pendentes + aceitos
    }
  }, [session?.user?.userType, filter])

  const fetchAppointments = async () => {
    try {
      const params = new URLSearchParams()
      if (filter === 'upcoming') {
        params.append('upcoming', 'true')
      } else if (filter === 'pending') {
        params.append('status', 'PENDING')
      } else if (filter === 'accepted') {
        params.append('status', 'ACCEPTED')
      } else if (filter === 'completed') {
        params.append('status', 'COMPLETED')
      } else if (filter === 'open') {
        params.append('open', 'true') // PENDING + ACCEPTED
      }

      const response = await fetch(`/api/appointments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      } else {
        console.error('Failed to fetch appointments')
        toast.error('Erro ao carregar agendamentos')
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  const openScheduleFor = (id: string) => {
    setSchedMap((m) => ({ ...m, [id]: m[id] || { date: new Date().toISOString().split('T')[0], time: '' } }))
  }
  const updateSchedField = (id: string, field: 'date'|'time', value: string) => {
    setSchedMap((m) => ({ ...m, [id]: { ...(m[id] || { date: '', time: '' }), [field]: value } }))
  }
  const scheduleFromQuote = async (id: string) => {
    const payload = schedMap[id]
    if (!payload?.date || !payload?.time) { toast.error('Selecione data e horário'); return }
    try {
      const res = await fetch(`/api/bookings/${id}/schedule`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scheduledDate: payload.date, scheduledTime: payload.time }) })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Falha ao agendar')
      toast.success('Orçamento agendado e aceito!')
      setSchedMap((m) => { const { [id]: _, ...rest } = m; return rest })
      fetchAppointments()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao agendar')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: 'secondary' as const, label: 'Pendente', icon: AlertCircle },
      HOLD: { variant: 'secondary' as const, label: 'Pendente', icon: AlertCircle },
      ACCEPTED: { variant: 'default' as const, label: 'Confirmado', icon: CheckCircle },
      COMPLETED: { variant: 'default' as const, label: 'Concluído', icon: CheckCircle },
      REJECTED: { variant: 'destructive' as const, label: 'Rejeitado', icon: XCircle },
      CANCELLED: { variant: 'destructive' as const, label: 'Cancelado', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-bg via-white to-brand-teal/5">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-navy mb-2">
              Minha Agenda
            </h1>
            <p className="text-gray-600">
              Gerencie seus agendamentos e compromissos
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
          </div>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-bg via-white to-brand-teal/5">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-navy mb-2">
              Minha Agenda
            </h1>
            <p className="text-gray-600">
              Gerencie seus agendamentos e compromissos
            </p>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Faça login para ver sua agenda
              </h3>
              <p className="text-gray-500 mb-6">
                Entre na sua conta para acessar seus agendamentos
              </p>
              <Button asChild>
                <a href="/entrar">Fazer Login</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Calculate stats
  const stats = {
    pending: appointments.filter(a => a.status === 'PENDING').length,
    confirmed: appointments.filter(a => a.status === 'ACCEPTED').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    total: appointments.length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-white to-brand-teal/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-navy mb-2">
            Minha Agenda
          </h1>
          <p className="text-gray-600">
            Gerencie seus agendamentos e compromissos
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {/* Opções de filtro, incluindo "Sem data específica" (open) */}
          {[
            { key: 'open', label: 'Sem data específica' },
            { key: 'pending', label: 'Pendentes' },
            { key: 'accepted', label: 'Aceitos' },
            { key: 'completed', label: 'Concluídos' },
            { key: 'upcoming', label: 'Próximos' },
            { key: 'all', label: 'Todos' }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tab.key as any)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pendente</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.confirmed}</div>
              <div className="text-sm text-gray-600">Confirmado</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.completed}</div>
              <div className="text-sm text-gray-600">Concluído</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-brand-navy mb-1">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        {appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-brand-navy text-lg">
                          {appointment.serviceName}
                        </h3>
                        {appointment.type === 'QUOTE' && (
                          <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">Orçamento</span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-1">{appointment.category}</p>
                      {appointment.otherUser && (
                        <div className="flex items-center gap-1 text-gray-600 mb-2">
                          <User className="h-4 w-4" />
                          <span>
                            {appointment.userRole === 'CLIENT' ? 'Prestador: ' : 'Cliente: '}
                            {appointment.otherUser.name}
                          </span>
                        </div>
                      )}
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>

                  {appointment.description && (
                    <p className="text-gray-600 mb-4">{appointment.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {appointment.scheduledDate && (
                      <>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{formatDate(appointment.scheduledDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{formatTime(appointment.scheduledDate)}</span>
                        </div>
                      </>
                    )}
                    {appointment.budget && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Orçamento: R$ {appointment.budget.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {appointment.otherUser && (
                    <div className="flex gap-2 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Ligar
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                      {appointment.status === 'PENDING' && appointment.userRole === 'PROVIDER' && appointment.type === 'SCHEDULING' && (
                        <>
                          <Button size="sm">Aceitar</Button>
                          <Button variant="destructive" size="sm">Rejeitar</Button>
                        </>
                      )}
                      {appointment.status === 'PENDING' && appointment.userRole === 'PROVIDER' && appointment.type === 'QUOTE' && (
                        <div className="flex flex-wrap items-end gap-2">
                          {!schedMap[appointment.id] ? (
                            <Button size="sm" onClick={() => openScheduleFor(appointment.id)}>Agendar</Button>
                          ) : (
                            <>
                              <div>
                                <label className="text-xs text-gray-600">Data</label>
                                <input type="date" value={schedMap[appointment.id]?.date || ''} onChange={(e) => updateSchedField(appointment.id, 'date', e.target.value)} className="block border rounded px-2 py-1 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">Hora</label>
                                <input type="time" value={schedMap[appointment.id]?.time || ''} onChange={(e) => updateSchedField(appointment.id, 'time', e.target.value)} className="block border rounded px-2 py-1 text-sm" />
                              </div>
                              <Button size="sm" onClick={() => scheduleFromQuote(appointment.id)}>Confirmar</Button>
                              <Button size="sm" variant="outline" onClick={() => setSchedMap((m) => { const { [appointment.id]: _, ...rest } = m; return rest })}>Cancelar</Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhum agendamento encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'pending' 
                  ? 'Você não tem agendamentos pendentes no momento'
                  : filter === 'completed'
                  ? 'Você ainda não tem agendamentos concluídos'
                  : 'Seus agendamentos aparecerão aqui quando você solicitar serviços'
                }
              </p>
              <Button asChild>
                <a href="/pesquisa">Buscar Serviços</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
