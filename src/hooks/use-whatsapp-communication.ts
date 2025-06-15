/**
 * WhatsApp Communication Hook for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Hook to manage WhatsApp communication logic between clients and providers
 */

import { useMemo } from 'react'
import { 
  generateClientMessage, 
  generateProviderMessage,
  type WhatsAppContactData 
} from '@/lib/whatsapp-utils'

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
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  }
}

interface UseWhatsAppCommunicationProps {
  booking: Booking
  userType: 'CLIENT' | 'SERVICE_PROVIDER'
}

export function useWhatsAppCommunication({ booking, userType }: UseWhatsAppCommunicationProps) {
  const canCommunicate = useMemo(() => {
    // Only allow communication when:
    // 1. Booking is accepted AND payment is completed
    // 2. OR booking is completed (for post-service communication)
    return (
      (booking.status === 'ACCEPTED' && booking.payment?.status === 'COMPLETED') ||
      booking.status === 'COMPLETED'
    )
  }, [booking.status, booking.payment?.status])

  const contactData = useMemo(() => {
    if (!canCommunicate) return null

    if (userType === 'CLIENT' && booking.serviceProvider) {
      // Client wants to contact provider
      const provider = booking.serviceProvider.user
      if (!provider.phone) return null
      
      return {
        name: provider.name,
        phone: provider.phone,
        serviceName: booking.service.name,
        bookingId: booking.id,
        message: generateClientMessage(provider.name, booking.service.name, booking.id)
      } as WhatsAppContactData
    }

    if (userType === 'SERVICE_PROVIDER' && booking.client) {
      // Provider wants to contact client
      const client = booking.client
      if (!client.phone) return null
      
      return {
        name: client.name,
        phone: client.phone,
        serviceName: booking.service.name,
        bookingId: booking.id,
        message: generateProviderMessage(client.name, booking.service.name, booking.id)
      } as WhatsAppContactData
    }

    return null
  }, [canCommunicate, userType, booking, booking.serviceProvider, booking.client])

  const communicationStatus = useMemo(() => {
    if (booking.status === 'PENDING') {
      return {
        canCommunicate: false,
        reason: 'Aguardando aceite do profissional'
      }
    }

    if (booking.status === 'REJECTED') {
      return {
        canCommunicate: false,
        reason: 'Solicitação foi rejeitada'
      }
    }

    if (booking.status === 'ACCEPTED' && booking.payment?.status !== 'COMPLETED') {
      return {
        canCommunicate: false,
        reason: 'Aguardando confirmação do pagamento'
      }
    }

    // Check if phone number is available
    const hasPhoneNumber = userType === 'CLIENT' 
      ? Boolean(booking.serviceProvider?.user.phone)
      : Boolean(booking.client?.phone)

    if (!hasPhoneNumber) {
      return {
        canCommunicate: false,
        reason: 'Número de telefone não disponível'
      }
    }

    if (booking.status === 'ACCEPTED' && booking.payment?.status === 'COMPLETED') {
      return {
        canCommunicate: true,
        reason: 'Pagamento confirmado - comunicação liberada'
      }
    }

    if (booking.status === 'COMPLETED') {
      return {
        canCommunicate: true,
        reason: 'Serviço concluído - comunicação disponível'
      }
    }

    return {
      canCommunicate: false,
      reason: 'Status não permite comunicação'
    }
  }, [booking.status, booking.payment?.status, booking.serviceProvider, booking.client, userType])

  return {
    canCommunicate,
    contactData,
    communicationStatus
  }
}
