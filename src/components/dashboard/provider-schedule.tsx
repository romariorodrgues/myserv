/**
 * Provider Schedule Management Component - Gestão de agenda do prestador
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Plus, Edit, Trash2, Save, X, Users, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  isAvailable: boolean
}

interface ScheduleDay {
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  isWorkingDay: boolean
  timeSlots: TimeSlot[]
}

interface Appointment {
  id: string
  date: string
  startTime: string
  endTime: string
  status: 'ACCEPTED' | 'PENDING' | 'CANCELLED' | 'COMPLETED' | 'REJECTED'
  type?: 'SCHEDULING' | 'QUOTE'
  client: {
    name: string
    phone?: string
  }
  service: {
    name: string
    duration: number // in minutes
  }
  notes?: string
}

interface ProviderScheduleProps {
  providerId?: string
}

const DAYS_OF_WEEK = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
]

const DEFAULT_TIME_SLOTS = [
  { startTime: '08:00', endTime: '09:00' },
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:00', endTime: '12:00' },
  { startTime: '13:00', endTime: '14:00' },
  { startTime: '14:00', endTime: '15:00' },
  { startTime: '15:00', endTime: '16:00' },
  { startTime: '16:00', endTime: '17:00' },
  { startTime: '17:00', endTime: '18:00' }
]

export function ProviderSchedule({ providerId, initialTab, initialDate }: ProviderScheduleProps & { initialTab?: 'schedule'|'appointments'|'settings'; initialDate?: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'schedule' | 'appointments' | 'settings'>(initialTab || 'schedule')
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0])
  const [showTimeSlotForm, setShowTimeSlotForm] = useState<number | null>(null)
  
  // Schedule data
  const [schedule, setSchedule] = useState<ScheduleDay[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showAllDates, setShowAllDates] = useState(false)
  const [apptStatusFilter, setApptStatusFilter] = useState<'ALL'|'PENDING'|'ACCEPTED'>('ALL')
  
  // Form data
  const [newTimeSlot, setNewTimeSlot] = useState({ startTime: '', endTime: '' })
  const [editingTimeSlot, setEditingTimeSlot] = useState<{ dayIndex: number, slotId: string } | null>(null)
  // Provider settings state
  const [autoAccept, setAutoAccept] = useState(false)
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true)
  const [reminders, setReminders] = useState(true)
  const [minAdvanceHours, setMinAdvanceHours] = useState<string>('0')
  const [maxAdvanceDays, setMaxAdvanceDays] = useState<string>('30')
  const [bufferMinutes, setBufferMinutes] = useState<string>('0')
  const [maxDaily, setMaxDaily] = useState<string>('0')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [confirmationMessage, setConfirmationMessage] = useState('')
  const [schedMap, setSchedMap] = useState<Record<string, { date: string; time: string }>>({})

  useEffect(() => {
    initializeSchedule()
    fetchAppointments()
    fetchSettings()
  }, [providerId])

  // Recarrega agendamentos ao trocar a data
  useEffect(() => {
    if (activeTab === 'appointments') fetchAppointments()
  }, [selectedDate, activeTab, showAllDates])

  const initializeSchedule = () => {
    // Initialize with default working days (Monday to Friday)
    const defaultSchedule: ScheduleDay[] = Array.from({ length: 7 }, (_, index) => ({
      dayOfWeek: index,
      isWorkingDay: index >= 1 && index <= 5, // Monday to Friday
      timeSlots: index >= 1 && index <= 5 ? DEFAULT_TIME_SLOTS.map((slot, slotIndex) => ({
        id: `slot-${index}-${slotIndex}`,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: true
      })) : []
    }))
    
    setSchedule(defaultSchedule)
    setLoading(false)
  }

  const fetchAppointments = async () => {
    try {
      const qs = new URLSearchParams({ providerId: providerId || '', type: 'appointments' })
      if (!showAllDates && selectedDate) qs.set('date', selectedDate)
      const response = await fetch(`/api/schedule?${qs.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      } else {
        // Fallback to mock data if API fails
        const mockAppointments: Appointment[] = [
          {
            id: '1',
            date: '2025-06-15',
            startTime: '09:00',
            endTime: '10:00',
            status: 'CONFIRMED',
            client: { name: 'João Silva', phone: '(11) 99999-1234' },
            service: { name: 'Limpeza Residencial', duration: 60 },
            notes: 'Apartamento 3 quartos, foco na cozinha'
          },
          {
            id: '2',
            date: '2025-06-15',
            startTime: '14:00',
            endTime: '15:30',
            status: 'PENDING',
            client: { name: 'Maria Santos', phone: '(11) 98888-5678' },
            service: { name: 'Limpeza Pós-Obra', duration: 90 }
          },
          {
            id: '3',
            date: '2025-06-16',
            startTime: '10:00',
            endTime: '11:00',
            status: 'CONFIRMED',
            client: { name: 'Carlos Pereira' },
            service: { name: 'Limpeza Comercial', duration: 60 }
          }
        ]
        setAppointments(mockAppointments)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      // Set empty appointments on error
      setAppointments([])
    }
  }

  const fetchSettings = async () => {
    try {
      const qs = new URLSearchParams({ providerId: providerId || '', type: 'settings' })
      const res = await fetch(`/api/schedule?${qs.toString()}`)
      const data = await res.json()
      if (data?.success && data?.settings) {
        const s = data.settings
        setAutoAccept(!!s.autoAccept)
        setNotifyWhatsapp(s.notifyWhatsapp !== false)
        setReminders(s.reminders !== false)
        setMinAdvanceHours(String(Number(s.minAdvanceHours ?? 0)))
        setMaxAdvanceDays(String(Number(s.maxAdvanceDays ?? 30)))
        setBufferMinutes(String(Number(s.bufferMinutes ?? 0)))
        setMaxDaily(String(Number(s.maxDaily ?? 0)))
        setWelcomeMessage(s.welcomeMessage || '')
        setConfirmationMessage(s.confirmationMessage || '')
      }
    } catch (e) {
      // ignore
    }
  }

  const saveSettings = async () => {
    try {
      const payload = {
        action: 'save_settings',
        providerId,
        settings: {
          autoAccept,
          notifyWhatsapp,
          reminders,
          minAdvanceHours: Number(minAdvanceHours || '0'),
          maxAdvanceDays: Number(maxAdvanceDays || '0'),
          bufferMinutes: Number(bufferMinutes || '0'),
          maxDaily: Number(maxDaily || '0'),
          welcomeMessage,
          confirmationMessage,
        }
      }
      const res = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Falha ao salvar')
      toast.success('Configurações salvas')
    } catch (e) {
      console.error(e)
      toast.error('Erro ao salvar configurações')
    }
  }

  const toggleWorkingDay = (dayIndex: number) => {
    setSchedule(prev => 
      prev.map((day, index) => 
        index === dayIndex 
          ? { ...day, isWorkingDay: !day.isWorkingDay }
          : day
      )
    )
  }

  const addTimeSlot = (dayIndex: number) => {
    if (!newTimeSlot.startTime || !newTimeSlot.endTime) {
      toast.error('Preencha os horários de início e fim')
      return
    }

    if (newTimeSlot.startTime >= newTimeSlot.endTime) {
      toast.error('Horário de início deve ser anterior ao horário de fim')
      return
    }

    const newSlot: TimeSlot = {
      id: `slot-${dayIndex}-${Date.now()}`,
      startTime: newTimeSlot.startTime,
      endTime: newTimeSlot.endTime,
      isAvailable: true
    }

    setSchedule(prev =>
      prev.map((day, index) =>
        index === dayIndex
          ? { 
              ...day, 
              timeSlots: [...day.timeSlots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime))
            }
          : day
      )
    )

    setNewTimeSlot({ startTime: '', endTime: '' })
    setShowTimeSlotForm(null)
    toast.success('Horário adicionado com sucesso!')
  }

  const removeTimeSlot = (dayIndex: number, slotId: string) => {
    setSchedule(prev =>
      prev.map((day, index) =>
        index === dayIndex
          ? { ...day, timeSlots: day.timeSlots.filter(slot => slot.id !== slotId) }
          : day
      )
    )
    toast.success('Horário removido com sucesso!')
  }

  const toggleTimeSlotAvailability = (dayIndex: number, slotId: string) => {
    setSchedule(prev =>
      prev.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              timeSlots: day.timeSlots.map(slot =>
                slot.id === slotId
                  ? { ...slot, isAvailable: !slot.isAvailable }
                  : slot
              )
            }
          : day
      )
    )
  }

  const saveSchedule = async () => {
    try {
      setSaving(true)
      
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          providerId,
          schedule: schedule.map(day => ({
            dayOfWeek: day.dayOfWeek,
            isWorkingDay: day.isWorkingDay,
            timeSlots: day.timeSlots.map(slot => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
              isAvailable: slot.isAvailable
            }))
          }))
        })
      })

      if (response.ok) {
        toast.success('Agenda salva com sucesso!')
      } else {
        throw new Error('Failed to save schedule')
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      toast.error('Erro ao salvar agenda. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // Agendar a partir de orçamento (QUOTE)
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
      await fetchAppointments()
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao agendar')
    }
  }

  const getAppointmentsForDate = (date: string) => {
    const list = showAllDates ? appointments : appointments.filter(apt => apt.date === date)
    return list.filter((apt) => apptStatusFilter === 'ALL' ? true : apt.status === apptStatusFilter)
  }

  // Ações: aceitar/recusar/concluir
  const updateAppointmentStatus = async (id: string, status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED') => {
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Falha ao atualizar')
      toast.success(status === 'ACCEPTED' ? 'Agendamento aceito' : status === 'REJECTED' ? 'Agendamento recusado' : 'Serviço marcado como concluído')
      await fetchAppointments()
    } catch (e) {
      console.error(e)
      toast.error('Erro ao atualizar agendamento')
    }
  }

  const getStatusBadge = (status: Appointment['status']) => {
    const config = {
      ACCEPTED: { label: 'Aceito', className: 'bg-green-100 text-green-800' },
      PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
      COMPLETED: { label: 'Concluído', className: 'bg-blue-100 text-blue-800' },
      REJECTED: { label: 'Recusado', className: 'bg-gray-100 text-gray-800' }
    }
    
    return (
      <Badge className={config[status].className}>
        {config[status].label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b">
            {[
              { id: 'schedule', label: 'Horários Disponíveis', icon: Clock },
              { id: 'appointments', label: 'Agendamentos', icon: Calendar },
              { id: 'settings', label: 'Configurações', icon: Users }
            ].map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Configurar Horários de Trabalho</span>
              </CardTitle>
              <Button onClick={saveSchedule} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Agenda'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {schedule.map((day, dayIndex) => (
                <div key={dayIndex} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium">{DAYS_OF_WEEK[dayIndex]}</h3>
                      <Switch
                        checked={day.isWorkingDay}
                        onCheckedChange={() => toggleWorkingDay(dayIndex)}
                      />
                      <span className="text-sm text-gray-500">
                        {day.isWorkingDay ? 'Dia de trabalho' : 'Dia de folga'}
                      </span>
                    </div>
                    
                    {day.isWorkingDay && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowTimeSlotForm(dayIndex)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Horário
                      </Button>
                    )}
                  </div>

                  {day.isWorkingDay && (
                    <div className="space-y-2">
                      {day.timeSlots.length === 0 ? (
                        <p className="text-gray-500 text-sm">Nenhum horário configurado</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {day.timeSlots.map((slot) => (
                            <div
                              key={slot.id}
                              className={`flex items-center justify-between p-3 border rounded-lg ${
                                slot.isAvailable 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                                <Switch
                                  checked={slot.isAvailable}
                                  onCheckedChange={() => toggleTimeSlotAvailability(dayIndex, slot.id)}
                                />
                              </div>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeTimeSlot(dayIndex, slot.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Time Slot Form */}
                      {showTimeSlotForm === dayIndex && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                          <h4 className="font-medium mb-3">Adicionar Novo Horário</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Horário de Início</Label>
                              <Input
                                type="time"
                                value={newTimeSlot.startTime}
                                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, startTime: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label>Horário de Fim</Label>
                              <Input
                                type="time"
                                value={newTimeSlot.endTime}
                                onChange={(e) => setNewTimeSlot(prev => ({ ...prev, endTime: e.target.value }))}
                              />
                            </div>
                          </div>
                          <div className="flex space-x-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => addTimeSlot(dayIndex)}
                            >
                              <Save className="w-4 h-4 mr-1" />
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowTimeSlotForm(null)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments Tab */}
      {activeTab === 'appointments' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Agendamentos</span>
              </CardTitle>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-filter">Data:</Label>
                  <Input
                    id="date-filter"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                    disabled={showAllDates}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={showAllDates} onCheckedChange={setShowAllDates} />
                  <span className="text-sm text-gray-600">Sem data específica</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={apptStatusFilter === 'ALL' ? 'default' : 'outline'} onClick={() => setApptStatusFilter('ALL')}>Todos</Button>
                  <Button size="sm" variant={apptStatusFilter === 'PENDING' ? 'default' : 'outline'} onClick={() => setApptStatusFilter('PENDING')}>Pendentes</Button>
                  <Button size="sm" variant={apptStatusFilter === 'ACCEPTED' ? 'default' : 'outline'} onClick={() => setApptStatusFilter('ACCEPTED')}>Aceitos</Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getAppointmentsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum agendamento encontrado</p>
                </div>
              ) : (
                getAppointmentsForDate(selectedDate).map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-3 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-lg">{appointment.service.name}</h3>
                          {appointment.type === 'QUOTE' && (
                            <Badge className="bg-purple-100 text-purple-800">Orçamento</Badge>
                          )}
                          {getStatusBadge(appointment.status)}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{appointment.startTime} - {appointment.endTime}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{appointment.client.name}</span>
                            </span>
                          </div>
                          
                          {appointment.client.phone && (
                            <p>Telefone: {appointment.client.phone}</p>
                          )}
                          
                          {appointment.notes && (
                            <p>Observações: {appointment.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {appointment.status === 'PENDING' && appointment.type !== 'QUOTE' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(appointment.id, 'ACCEPTED')}>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aceitar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(appointment.id, 'REJECTED')}>
                              <X className="w-4 h-4 mr-1" />
                              Recusar
                            </Button>
                          </>
                        )}
                        {appointment.status === 'PENDING' && appointment.type === 'QUOTE' && (
                          <div className="flex flex-wrap items-end gap-2">
                            {!schedMap[appointment.id] ? (
                              <Button size="sm" variant="outline" onClick={() => openScheduleFor(appointment.id)}>
                                <Clock className="w-4 h-4 mr-1" />
                                Agendar
                              </Button>
                            ) : (
                              <>
                                <div>
                                  <Label className="text-xs text-gray-600">Data</Label>
                                  <Input type="date" value={schedMap[appointment.id]?.date || ''} onChange={(e) => updateSchedField(appointment.id, 'date', e.target.value)} className="w-auto" />
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-600">Hora</Label>
                                  <Input type="time" value={schedMap[appointment.id]?.time || ''} onChange={(e) => updateSchedField(appointment.id, 'time', e.target.value)} className="w-auto" />
                                </div>
                                <Button size="sm" onClick={() => scheduleFromQuote(appointment.id)}>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Confirmar
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setSchedMap((m) => { const { [appointment.id]: _, ...rest } = m; return rest })}>
                                  <X className="w-4 h-4 mr-1" />
                                  Cancelar
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                        
                        {appointment.status === 'ACCEPTED' && (
                          <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(appointment.id, 'COMPLETED')}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Marcar como Concluído
                          </Button>
                        )}
                        
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Configurações de Agendamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="advance-booking">Antecedência Mínima (horas)</Label>
                  <Input
                    id="advance-booking"
                    type="number"
                    placeholder="2"
                    min="0"
                    max="168"
                    value={minAdvanceHours}
                    onChange={(e) => setMinAdvanceHours(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Tempo mínimo necessário entre o agendamento e o serviço
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-advance">Antecedência Máxima (dias)</Label>
                  <Input
                    id="max-advance"
                    type="number"
                    placeholder="30"
                    min="1"
                    max="365"
                    value={maxAdvanceDays}
                    onChange={(e) => setMaxAdvanceDays(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Até quantos dias no futuro aceitar agendamentos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buffer-time">Tempo de Intervalo (minutos)</Label>
                  <Input
                    id="buffer-time"
                    type="number"
                    placeholder="15"
                    min="0"
                    max="120"
                    value={bufferMinutes}
                    onChange={(e) => setBufferMinutes(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Tempo de intervalo entre agendamentos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-daily">Máximo de Agendamentos por Dia</Label>
                  <Input
                    id="max-daily"
                    type="number"
                    placeholder="10"
                    min="0"
                    max="50"
                    value={maxDaily}
                    onChange={(e) => setMaxDaily(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Limite de serviços por dia
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Confirmação Automática</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Aceitar Agendamentos Automaticamente</Label>
                    <p className="text-sm text-gray-500">
                      Novos agendamentos serão aceitos automaticamente se dentro dos horários disponíveis
                    </p>
                  </div>
                  <Switch checked={autoAccept} onCheckedChange={setAutoAccept} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Notificar por WhatsApp</Label>
                    <p className="text-sm text-gray-500">
                      Receber notificações de novos agendamentos via WhatsApp
                    </p>
                  </div>
                  <Switch checked={notifyWhatsapp} onCheckedChange={setNotifyWhatsapp} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Lembrete de Agendamentos</Label>
                    <p className="text-sm text-gray-500">
                      Enviar lembretes automáticos antes dos agendamentos
                    </p>
                  </div>
                  <Switch checked={reminders} onCheckedChange={setReminders} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Mensagens Automáticas</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="welcome-message">Mensagem de Boas-vindas</Label>
                  <Textarea
                    id="welcome-message"
                    placeholder="Olá! Obrigado por escolher nossos serviços..."
                    rows={3}
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmation-message">Mensagem de Confirmação</Label>
                  <Textarea
                    id="confirmation-message"
                    placeholder="Seu agendamento foi confirmado para..."
                    rows={3}
                    value={confirmationMessage}
                    onChange={(e) => setConfirmationMessage(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveSettings}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
