/**
 * WhatsApp Contact Button component for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Button component to initiate WhatsApp conversations between clients and providers
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, ExternalLink } from 'lucide-react'
import { 
  generateWhatsAppLink, 
  formatPhoneForDisplay, 
  isValidWhatsAppPhone,
  type WhatsAppContactData 
} from '@/lib/whatsapp-utils'

interface WhatsAppButtonProps {
  contact: WhatsAppContactData
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  disabled?: boolean
  showPhone?: boolean
  children?: React.ReactNode
}

export function WhatsAppButton({ 
  contact, 
  variant = 'default',
  size = 'default',
  className = '',
  disabled = false,
  showPhone = true,
  children 
}: WhatsAppButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleWhatsAppClick = () => {
    if (disabled || !isValidWhatsAppPhone(contact.phone)) {
      return
    }

    setIsLoading(true)
    
    try {
      const whatsappUrl = generateWhatsAppLink(contact)
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Error opening WhatsApp:', error)
    } finally {
      // Reset loading state after a brief delay
      setTimeout(() => setIsLoading(false), 1000)
    }
  }

  const isPhoneValid = isValidWhatsAppPhone(contact.phone)

  if (!isPhoneValid) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled={true}
        className={`opacity-50 cursor-not-allowed ${className}`}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        WhatsApp indisponível
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleWhatsAppClick}
      disabled={disabled || isLoading}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      {isLoading ? (
        'Abrindo WhatsApp...'
      ) : children ? (
        children
      ) : (
        <span className="flex items-center">
          Conversar no WhatsApp
          <ExternalLink className="w-3 h-3 ml-1" />
        </span>
      )}
      {showPhone && !isLoading && (
        <span className="ml-2 text-xs opacity-75">
          {formatPhoneForDisplay(contact.phone)}
        </span>
      )}
    </Button>
  )
}

interface WhatsAppContactCardProps {
  contact: WhatsAppContactData
  title: string
  description?: string
  showAvatar?: boolean
  className?: string
}

export function WhatsAppContactCard({
  contact,
  title,
  description,
  showAvatar = true,
  className = ''
}: WhatsAppContactCardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        {showAvatar && (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
        )}
        
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{title}</h4>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {formatPhoneForDisplay(contact.phone)}
          </p>
        </div>
      </div>
      
      <div className="mt-3">
        <WhatsAppButton 
          contact={contact}
          variant="outline"
          size="sm"
          showPhone={false}
          className="w-full"
        >
          Iniciar conversa
        </WhatsAppButton>
      </div>
    </div>
  )
}
