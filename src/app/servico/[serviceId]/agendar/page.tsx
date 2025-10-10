/**
 * Scheduling Step - Escolher data e horário na agenda do prestador
 * Mostra os horários disponíveis do prestador e cria um ServiceRequest PENDING.
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'

type Slot = { startTime: string; endTime: string; isAvailable: boolean; id?: string }
type Day = { dayOfWeek: number; isWorkingDay: boolean; timeSlots: Slot[] }

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function AgendarPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const q = useSearchParams()

  const serviceId = params.serviceId as string
  const providerId = q.get('providerId') || ''

  const [schedule, setSchedule] = useState<Day[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [successMsg, setSuccessMsg] = useState<string>('')

  useEffect(() => {
    if (!providerId) { setLoading(false); return }
    ;(async () => {
      try {
        setLoading(true)
        const qs = new URLSearchParams({ providerId, date: selectedDate })
        const res = await fetch(`/api/schedule?${qs.toString()}`)
        const data = await res.json()
        if (data.success) setSchedule(data.schedule || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [providerId, selectedDate])

  const slotsForSelectedDate = useMemo(() => {
    const date = new Date(selectedDate)
    const dow = date.getDay() // 0-6
    const day = schedule.find(d => d.dayOfWeek === dow)
    return (day?.isWorkingDay ? day.timeSlots : []) || []
  }, [schedule, selectedDate])

  const availableSlots = useMemo(() => {
    return slotsForSelectedDate
      .filter(s => s.isAvailable)
      .filter(s => {
        if (!selectedDate) return true
        const slotDateTime = new Date(`${selectedDate}T${s.startTime}`)
        if (Number.isNaN(slotDateTime.getTime())) return false
        return slotDateTime.getTime() > Date.now()
      })
  }, [slotsForSelectedDate, selectedDate])

  const canProceed = useMemo(() => !!selectedDate && !!selectedTime && availableSlots.some(s => s.startTime === selectedTime), [availableSlots, selectedDate, selectedTime])

  useEffect(() => {
    if (!selectedTime) return
    const stillAvailable = availableSlots.some((slot) => slot.startTime === selectedTime)
    if (!stillAvailable) {
      setSelectedTime('')
    }
  }, [availableSlots, selectedTime])

  const createAppointment = async () => {
    if (!session?.user?.id) { alert('Faça login como cliente para agendar.'); return }
    if (!providerId) { alert('Prestador inválido'); return }
    if (!canProceed) { alert('Selecione data e horário'); return }

    const slotDateTime = new Date(`${selectedDate}T${selectedTime}`)
    if (Number.isNaN(slotDateTime.getTime())) {
      alert('Horário selecionado inválido. Escolha outra opção.')
      return
    }
    if (slotDateTime.getTime() <= Date.now()) {
      alert('Não é possível agendar para um horário que já passou. Escolha outro horário.')
      return
    }

    try {
      setSubmitting(true)
      // Recupera os dados preenchidos na página anterior
      let pending: any = null
      try { const raw = sessionStorage.getItem('pendingBooking'); if (raw) pending = JSON.parse(raw) } catch {}
      if (!pending) {
        alert('Finalize o preenchimento das informações do pedido antes de escolher o horário.')
        router.push(`/servico/${serviceId}/solicitar?providerId=${providerId}`)
        return
      }

      const payload = {
        ...pending,
        preferredDate: selectedDate,
        preferredTime: selectedTime,
      }

      if (!payload.description || payload.description.trim().length < 10) {
        alert('Descreva o serviço com pelo menos 10 caracteres antes de confirmar o pedido.')
        return
      }

      if (!payload.clientPhone || payload.clientPhone.trim().length < 10) {
        alert('Informe um telefone válido para que o profissional possa entrar em contato.')
        return
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || 'Erro ao criar solicitação')
      try { sessionStorage.removeItem('pendingBooking') } catch {}
      setSuccessMsg('Pedido enviado! O profissional será notificado e responderá em até 24h.')
    } catch (e: any) {
      alert(e?.message || 'Erro ao criar solicitação')
    } finally {
      setSubmitting(false)
    }
  }

  if (!providerId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <Card>
            <CardContent className="p-6">Prestador inválido.</CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-white to-brand-teal/5 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-navy">
              <Calendar className="h-5 w-5" /> Escolha uma data e horário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {successMsg ? (
              <div className="rounded-md border bg-white p-6">
                <p className="text-brand-navy font-medium mb-1">{successMsg}</p>
                <p className="text-sm text-gray-600">Você receberá uma notificação quando o profissional aceitar.</p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => router.push('/dashboard/cliente')}>Ir para o Dashboard</Button>
                  <Button variant="outline" onClick={() => router.push(`/servico/${serviceId}/solicitar?providerId=${providerId}`)}>Voltar ao serviço</Button>
                </div>
              </div>
            ) : loading ? (
              <div className="text-gray-600">Carregando agenda…</div>
            ) : (
              <>
                <div>
                  <label className="text-sm text-gray-600">Data</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2">Horários Disponíveis ({DAYS[new Date(selectedDate).getDay()]})</div>
                  {availableSlots.length === 0 ? (
                    <div className="text-gray-500">Sem horários disponíveis para esta data.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableSlots.map((s, idx) => (
                        <button
                          key={`${s.startTime}-${idx}`}
                          onClick={() => setSelectedTime(s.startTime)}
                          className={`px-3 py-2 rounded border text-sm ${selectedTime === s.startTime ? 'border-brand-cyan bg-brand-cyan/10' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                          <span className="inline-flex items-center"><Clock className="h-4 w-4 mr-1" />{s.startTime}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button onClick={createAppointment} disabled={!canProceed || submitting}>
                    {submitting ? 'Enviando…' : 'Confirmar Pedido'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
