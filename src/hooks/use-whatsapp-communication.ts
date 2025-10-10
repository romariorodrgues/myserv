/**
 * WhatsApp Communication Hook for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 *
 * Ensures contact between cliente e prestador só é liberado
 * após o desbloqueio do lead (pagamento avulso) ou assinatura ativa.
 */

import { useMemo } from 'react'
import {
  generateClientMessage,
  generateProviderMessage,
  type WhatsAppContactData,
} from '@/lib/whatsapp-utils'
import type { SubscriptionResponse } from '@/app/api/payments/subscribe/route'

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

interface UseWhatsAppCommunicationProps {
  booking: Booking
  userType: 'CLIENT' | 'SERVICE_PROVIDER'
  subscription: SubscriptionResponse | null | undefined
}

function hasActiveSubscription(subscription?: SubscriptionResponse | null) {
  if (!subscription) return false
  if (subscription.status !== 'ACTIVE') return false
  if (!subscription.endDate) return true
  return new Date(subscription.endDate) >= new Date()
}

export function useWhatsAppCommunication({
  booking,
  userType,
  subscription,
}: UseWhatsAppCommunicationProps) {
  const unlockedByPlan = hasActiveSubscription(subscription)
  const unlockedByLead = booking.payment?.status === 'APPROVED'
  const leadUnlocked = unlockedByPlan || unlockedByLead

  const hasPhoneNumber = useMemo(() => {
    return userType === 'CLIENT'
      ? Boolean(booking.serviceProvider?.user.phone)
      : Boolean(booking.client?.phone)
  }, [booking.client, booking.serviceProvider, userType])

  const canCommunicate = useMemo(() => {
    if (!hasPhoneNumber) return false

    if (userType === 'CLIENT') {
      // Cliente só fala após o prestador aceitar e liberar o contato
      if (booking.status !== 'ACCEPTED' && booking.status !== 'COMPLETED') return false
      return leadUnlocked
    }

    // Prestador
    if (booking.status === 'REJECTED') return false
    if (booking.status === 'PENDING') return false
    return leadUnlocked
  }, [booking.status, leadUnlocked, hasPhoneNumber, userType])

  const contactData = useMemo<WhatsAppContactData | null>(() => {
    if (!canCommunicate) return null

    if (userType === 'CLIENT' && booking.serviceProvider?.user.phone) {
      const provider = booking.serviceProvider.user
      return {
        name: provider.name,
        phone: provider.phone,
        serviceName: booking.service.name,
        bookingId: booking.id,
        message: generateClientMessage(provider.name, booking.service.name, booking.id),
      }
    }

    if (userType === 'SERVICE_PROVIDER' && booking.client?.phone) {
      const client = booking.client
      return {
        name: client.name,
        phone: client.phone,
        serviceName: booking.service.name,
        bookingId: booking.id,
        message: generateProviderMessage(client.name, booking.service.name, booking.id),
      }
    }

    return null
  }, [booking, canCommunicate, userType])

  const communicationStatus = useMemo(() => {
    if (booking.status === 'PENDING') {
      return {
        canCommunicate: false,
        reason:
          userType === 'CLIENT'
            ? 'Aguardando o prestador aceitar o pedido'
            : 'Aceite o pedido para desbloquear o contato',
      }
    }

    if (booking.status === 'REJECTED') {
      return {
        canCommunicate: false,
        reason: 'Solicitação foi rejeitada',
      }
    }

    if (!hasPhoneNumber) {
      return {
        canCommunicate: false,
        reason: 'Número de telefone não disponível',
      }
    }

    if (!leadUnlocked) {
      if (userType === 'CLIENT') {
        return {
          canCommunicate: false,
          reason: 'O prestador precisa liberar o contato',
        }
      }

      return {
        canCommunicate: false,
        reason: unlockedByPlan
          ? 'Plano profissional inativo. Renove para liberar os contatos.'
          : 'Libere este cliente para visualizar o contato',
      }
    }

    if (booking.status === 'ACCEPTED') {
      return {
        canCommunicate: true,
        reason: 'Solicitação aceita - comunicação liberada',
      }
    }

    if (booking.status === 'COMPLETED') {
      return {
        canCommunicate: true,
        reason: 'Serviço concluído - comunicação disponível',
      }
    }

    return {
      canCommunicate: false,
      reason: 'Status não permite comunicação',
    }
  }, [booking.status, hasPhoneNumber, leadUnlocked, unlockedByPlan, userType])

  return {
    canCommunicate,
    contactData,
    communicationStatus,
  }
}
