/**
 * Agenda Page - unified schedule view for clients and providers
 */

'use client'

import { useSession } from 'next-auth/react'
import { ProviderSchedule } from '@/components/dashboard/provider-schedule'
import { ClientHistory } from '@/components/dashboard/client-history'
import { Loader2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AgendaPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-bg via-white to-brand-teal/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-bg via-white to-brand-teal/5">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-brand-cyan/10 flex items-center justify-center">
                <Calendar className="h-10 w-10 text-brand-cyan" />
              </div>
              <h1 className="text-3xl font-bold text-brand-navy">Acesse sua agenda</h1>
              <p className="text-gray-600">
                Faça login para visualizar e gerenciar seus agendamentos.
              </p>
            </div>
            <Button asChild size="lg" className="shadow-md">
              <a href="/entrar">Fazer login</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isProvider = session.user.userType === 'SERVICE_PROVIDER'
  const heading = isProvider ? 'Agenda do Profissional' : 'Meus Agendamentos'
  const subheading = isProvider
    ? 'Gerencie solicitações, horários e confirmações com seus clientes.'
    : 'Acompanhe o andamento dos seus pedidos e agendamentos.'

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-white to-brand-teal/5">
      <div className="container mx-auto px-4 py-10 space-y-6">
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-3xl font-bold text-brand-navy">{heading}</h1>
          <p className="text-gray-600">{subheading}</p>
        </div>

        {isProvider ? (
          <ProviderSchedule providerId={session.user.id} initialTab="appointments" />
        ) : (
          <ClientHistory clientId={session.user.id} />
        )}
      </div>
    </div>
  )
}
