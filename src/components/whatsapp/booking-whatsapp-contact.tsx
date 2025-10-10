/**
 * Booking WhatsApp Contact component for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WhatsAppButton } from '@/components/whatsapp/whatsapp-button'
import { useWhatsAppCommunication } from '@/hooks/use-whatsapp-communication'
import { MessageCircle, User, Phone, CheckCircle2, Clock, XCircle, LockKeyholeOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useVerifyPlan from '@/hooks/use-verify-plan'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

interface Booking {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
  service: {
    name: string
  }
  client?: {
    name: string
    phone?: string
  }
  serviceProvider?: {
    user: {
      name: string
      phone?: string
    }
  }
  payment?: {
    status: 'PENDING' | 'APPROVED' | 'FAILED' | 'REFUNDED'
  }
}

interface BookingWhatsAppContactProps {
  booking: Booking
  userType: 'CLIENT' | 'SERVICE_PROVIDER'
  variant?: 'compact' | 'full'
}

export function BookingWhatsAppContact({
  booking,
  userType,
  variant = 'compact',
}: BookingWhatsAppContactProps) {
  const verifyPlan = useVerifyPlan()
  const subscription = userType === 'SERVICE_PROVIDER' ? verifyPlan.subscription : null
  const plan = userType === 'SERVICE_PROVIDER' ? verifyPlan.plan : 'Start'

  const { canCommunicate, contactData, communicationStatus } = useWhatsAppCommunication({
    booking,
    userType,
    subscription,
  })

  const unlockLeadMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post('/api/payments', {
        bookingId: booking.id,
        amount: 19.9,
        gateway: 'mercadopago',
        type: 'LEAD_UNLOCK',
      })
      return data
    },
    onSuccess: (data) => {
      if (data?.checkout?.initPoint) {
        window.open(data.checkout.initPoint, '_blank', 'noopener,noreferrer')
      }
    },
  })

  const renderLockedStateForProvider = () => {
    const actionLabel = plan === 'Premium' ? 'Renovar plano' : 'Liberar contato'
    const showAction = userType === 'SERVICE_PROVIDER'

    if (variant === 'compact') {
      return (
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{communicationStatus.reason}</span>
          </div>
          {showAction && (
            <div>
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => unlockLeadMutation.mutate()}
                disabled={unlockLeadMutation.isPending}
              >
                <LockKeyholeOpen size={16} />
                <span>{unlockLeadMutation.isPending ? 'Gerando checkout...' : actionLabel}</span>
              </Button>
            </div>
          )}
        </div>
      )
    }

    return (
      <Card className="border-dashed border-gray-300">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {booking.status === 'PENDING' && <Clock className="w-5 h-5 text-yellow-500" />}
              {booking.status === 'REJECTED' && <XCircle className="w-5 h-5 text-red-500" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Comunicação via WhatsApp</p>
              <p className="text-xs text-muted-foreground">{communicationStatus.reason}</p>
            </div>
            {showAction && (
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => unlockLeadMutation.mutate()}
                disabled={unlockLeadMutation.isPending}
              >
                <LockKeyholeOpen size={16} />
                <span>{unlockLeadMutation.isPending ? 'Gerando checkout...' : actionLabel}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!canCommunicate) {
    if (userType === 'CLIENT') {
      if (variant === 'compact') {
        return (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            <span>{communicationStatus.reason}</span>
          </div>
        )
      }

      return (
        <Card className="border-dashed border-gray-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {booking.status === 'PENDING' && <Clock className="w-5 h-5 text-yellow-500" />}
                {booking.status === 'REJECTED' && <XCircle className="w-5 h-5 text-red-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Comunicação via WhatsApp</p>
                <p className="text-xs text-muted-foreground">{communicationStatus.reason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return renderLockedStateForProvider()
  }

  if (!contactData) {
    return null
  }

  const contactName =
    userType === 'CLIENT'
      ? booking.serviceProvider?.user.name
      : booking.client?.name
  const contactPhone =
    userType === 'CLIENT'
      ? booking.serviceProvider?.user.phone
      : booking.client?.phone

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-800">Comunicação liberada</span>
        </div>
        <WhatsAppButton contact={contactData} size="sm" variant="default" showPhone={false}>
          Conversar
        </WhatsAppButton>
      </div>
    )
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h4 className="text-sm font-medium text-green-800">
                Comunicação via WhatsApp Disponível
              </h4>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-green-700">
                <User className="w-4 h-4" />
                <span>{contactName}</span>
              </div>

              {contactPhone && (
                <div className="flex items-center space-x-2 text-sm text-green-700">
                  <Phone className="w-4 h-4" />
                  <span>{contactPhone}</span>
                </div>
              )}

              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {userType === 'CLIENT' ? 'Profissional' : 'Cliente'}
              </Badge>
            </div>
          </div>

          <div className="flex-shrink-0 ml-4">
            <WhatsAppButton contact={contactData} size="default" variant="default" showPhone={false}>
              Iniciar Conversa
            </WhatsAppButton>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-green-200">
          <p className="text-xs text-green-600">
            {booking.status === 'COMPLETED'
              ? 'Serviço concluído - mantenha o contato com seu cliente.'
              : 'Solicitação aceita - alinhe os detalhes diretamente pelo WhatsApp.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
