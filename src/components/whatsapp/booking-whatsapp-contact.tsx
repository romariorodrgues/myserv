/**
 * Booking WhatsApp Contact component for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Component that displays WhatsApp contact button within booking cards
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WhatsAppButton } from '@/components/whatsapp/whatsapp-button'
import { useWhatsAppCommunication } from '@/hooks/use-whatsapp-communication'
import { MessageCircle, User, Phone, CheckCircle2, Clock, XCircle } from 'lucide-react'

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

interface BookingWhatsAppContactProps {
  booking: Booking
  userType: 'CLIENT' | 'SERVICE_PROVIDER'
  variant?: 'compact' | 'full'
}

export function BookingWhatsAppContact({ 
  booking, 
  userType, 
  variant = 'compact' 
}: BookingWhatsAppContactProps) {
  const { canCommunicate, contactData, communicationStatus } = useWhatsAppCommunication({
    booking,
    userType
  })

  if (!canCommunicate) {
    if (variant === 'compact') {
      return (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
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
              {booking.status === 'ACCEPTED' && booking.payment?.status !== 'COMPLETED' && (
                <Clock className="w-5 h-5 text-yellow-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Comunicação via WhatsApp
              </p>
              <p className="text-xs text-muted-foreground">
                {communicationStatus.reason}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!contactData) {
    return null
  }

  const contactName = userType === 'CLIENT' 
    ? booking.serviceProvider?.user.name 
    : booking.client?.name

  const contactPhone = userType === 'CLIENT'
    ? booking.serviceProvider?.user.phone
    : booking.client?.phone

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-800">Comunicação liberada</span>
        </div>
        <WhatsAppButton
          contact={contactData}
          size="sm"
          variant="default"
          showPhone={false}
        >
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
            <WhatsAppButton
              contact={contactData}
              size="default"
              variant="default"
              showPhone={false}
            >
              Iniciar Conversa
            </WhatsAppButton>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-green-200">
          <p className="text-xs text-green-600">
            {booking.status === 'COMPLETED' 
              ? 'Serviço concluído - Entre em contato para dúvidas ou avaliação'
              : 'Pagamento confirmado - Converse diretamente para alinhar detalhes'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
