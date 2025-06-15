/**
 * WhatsApp communication utilities for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Utilities for generating WhatsApp links and handling direct communication
 */

export interface WhatsAppContactData {
  name: string
  phone: string
  serviceName?: string
  bookingId?: string
  message?: string
}

/**
 * Sanitizes phone number to WhatsApp format (only numbers)
 */
export function sanitizePhoneForWhatsApp(phone: string): string {
  // Remove all non-numeric characters
  const numbersOnly = phone.replace(/\D/g, '')
  
  // Ensure it starts with country code (55 for Brazil)
  if (numbersOnly.length === 11 && !numbersOnly.startsWith('55')) {
    return `55${numbersOnly}`
  }
  
  if (numbersOnly.length === 10 && !numbersOnly.startsWith('55')) {
    return `55${numbersOnly}`
  }
  
  return numbersOnly
}

/**
 * Generates WhatsApp web link for direct communication
 */
export function generateWhatsAppLink(contact: WhatsAppContactData): string {
  const sanitizedPhone = sanitizePhoneForWhatsApp(contact.phone)
  
  // Default message template
  let message = contact.message || 
    `Olá ${contact.name}! Entro em contato através da plataforma MyServ`
  
  if (contact.serviceName) {
    message += ` sobre o serviço de ${contact.serviceName}`
  }
  
  if (contact.bookingId) {
    message += ` (Reserva: ${contact.bookingId})`
  }
  
  message += '. Como posso ajudá-lo(a)?'
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message)
  
  return `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`
}

/**
 * Generates client message for contacting provider
 */
export function generateClientMessage(providerName: string, serviceName: string, bookingId: string): string {
  return `Olá ${providerName}! Sou cliente da plataforma MyServ e gostaria de conversar sobre o serviço de ${serviceName} (Reserva: ${bookingId}). Obrigado!`
}

/**
 * Generates provider message for contacting client
 */
export function generateProviderMessage(clientName: string, serviceName: string, bookingId: string): string {
  return `Olá ${clientName}! Sou o profissional da plataforma MyServ responsável pelo seu serviço de ${serviceName} (Reserva: ${bookingId}). Como posso ajudá-lo(a)?`
}

/**
 * Checks if phone number is valid for WhatsApp
 */
export function isValidWhatsAppPhone(phone: string): boolean {
  const sanitized = sanitizePhoneForWhatsApp(phone)
  return sanitized.length >= 12 && sanitized.length <= 15
}

/**
 * Formats phone number for display
 */
export function formatPhoneForDisplay(phone: string): string {
  const numbers = phone.replace(/\D/g, '')
  
  if (numbers.length === 11) {
    // Format: (11) 99999-9999
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
  }
  
  if (numbers.length === 10) {
    // Format: (11) 9999-9999
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
  }
  
  return phone
}
