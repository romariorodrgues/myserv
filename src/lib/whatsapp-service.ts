/**
 * WhatsApp notification service for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles WhatsApp notifications via ChatPro API
 */

import axios from 'axios'

export interface WhatsAppMessage {
  to: string
  message: string
  type?: 'text' | 'template'
  templateName?: string
  templateParams?: string[]
}

export interface NotificationData {
  userPhone: string
  userName: string
  serviceName?: string
  bookingId?: string
  providerName?: string
  clientName?: string
  scheduledDate?: string
  amount?: number
  status?: string
}

export class WhatsAppService {
  private static baseUrl = process.env.CHATPRO_API_URL
  private static apiKey = process.env.CHATPRO_API_KEY
  private static phoneNumber = process.env.CHATPRO_PHONE_NUMBER

  /**
   * Send a WhatsApp message via ChatPro API
   */
  private static async sendMessage(data: WhatsAppMessage): Promise<boolean> {
    try {
      if (!this.baseUrl || !this.apiKey) {
        console.warn('ChatPro API not configured')
        return false
      }

      const response = await axios.post(
        `${this.baseUrl}/send-message`,
        {
          phone: data.to,
          message: data.message,
          type: data.type || 'text'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )

      return response.status === 200
    } catch (error) {
      console.error('WhatsApp send error:', error)
      return false
    }
  }

  /**
   * Format phone number for WhatsApp (Brazilian format)
   */
  private static formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')
    
    // Ensure it starts with 55 (Brazil country code)
    if (digits.startsWith('55')) {
      return digits
    } else if (digits.length === 11) {
      return `55${digits}`
    } else if (digits.length === 10) {
      return `55${digits}`
    }
    
    return digits
  }

  /**
   * Send booking request notification to service provider
   */
  static async notifyBookingRequest(data: NotificationData): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(data.userPhone)
    
    const message = `🔔 *Nova Solicitação de Serviço - MyServ*

Olá ${data.userName}! 

Você recebeu uma nova solicitação:
📋 Serviço: ${data.serviceName}
👤 Cliente: ${data.clientName}
📅 Data: ${data.scheduledDate || 'A combinar'}
💰 Valor: ${data.amount ? `R$ ${data.amount.toFixed(2)}` : 'A negociar'}

Acesse seu dashboard para aceitar ou recusar esta solicitação.

🌐 ${process.env.NEXTAUTH_URL}/dashboard/profissional

---
*MyServ - Conectando você aos melhores profissionais*`

    return this.sendMessage({
      to: formattedPhone,
      message
    })
  }

  /**
   * Send booking confirmation notification to client
   */
  static async notifyBookingConfirmed(data: NotificationData): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(data.userPhone)
    
    const message = `✅ *Solicitação Aceita - MyServ*

Ótima notícia, ${data.userName}!

Sua solicitação foi aceita:
📋 Serviço: ${data.serviceName}
👨‍🔧 Profissional: ${data.providerName}
📅 Data: ${data.scheduledDate || 'A combinar'}
💰 Valor: ${data.amount ? `R$ ${data.amount.toFixed(2)}` : 'A negociar'}

O profissional entrará em contato para finalizar os detalhes.

🌐 ${process.env.NEXTAUTH_URL}/dashboard/cliente

---
*MyServ - Conectando você aos melhores profissionais*`

    return this.sendMessage({
      to: formattedPhone,
      message
    })
  }

  /**
   * Send booking rejection notification to client
   */
  static async notifyBookingRejected(data: NotificationData): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(data.userPhone)
    
    const message = `❌ *Solicitação Recusada - MyServ*

Olá ${data.userName},

Infelizmente sua solicitação foi recusada pelo profissional.

📋 Serviço: ${data.serviceName}
👨‍🔧 Profissional: ${data.providerName}

Não se preocupe! Você pode solicitar o mesmo serviço para outros profissionais.

🔍 Buscar outros profissionais: ${process.env.NEXTAUTH_URL}/servicos

---
*MyServ - Conectando você aos melhores profissionais*`

    return this.sendMessage({
      to: formattedPhone,
      message
    })
  }

  /**
   * Send service completion notification
   */
  static async notifyServiceCompleted(data: NotificationData): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(data.userPhone)
    
    const message = `🎉 *Serviço Concluído - MyServ*

Parabéns ${data.userName}!

Seu serviço foi concluído:
📋 Serviço: ${data.serviceName}
👨‍🔧 Profissional: ${data.providerName}
💰 Valor: ${data.amount ? `R$ ${data.amount.toFixed(2)}` : 'Conforme combinado'}

Que tal avaliar o profissional? Sua opinião é muito importante!

⭐ Avaliar serviço: ${process.env.NEXTAUTH_URL}/dashboard/cliente

---
*MyServ - Conectando você aos melhores profissionais*`

    return this.sendMessage({
      to: formattedPhone,
      message
    })
  }

  /**
   * Send payment reminder notification
   */
  static async notifyPaymentReminder(data: NotificationData): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(data.userPhone)
    
    const message = `💳 *Lembrete de Pagamento - MyServ*

Olá ${data.userName},

Você tem um pagamento pendente:
📋 Serviço: ${data.serviceName}
👨‍🔧 Profissional: ${data.providerName}
💰 Valor: R$ ${data.amount?.toFixed(2)}

Finalize seu pagamento para concluir o processo.

💳 Pagar agora: ${process.env.NEXTAUTH_URL}/dashboard/cliente

---
*MyServ - Conectando você aos melhores profissionais*`

    return this.sendMessage({
      to: formattedPhone,
      message
    })
  }

  static async sendPhoneVerificationCode(params: { phone: string; code: string; name?: string }): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(params.phone)
    const message = `🔐 *Verificação de Telefone - MyServ*

Olá ${params.name || 'Usuário'}!

Use o código abaixo para confirmar seu telefone:
👉 *${params.code}*

Este código expira em poucos minutos. Se você não solicitou, ignore esta mensagem.

---
*MyServ - Segurança para você continuar usando a plataforma*`

    return this.sendMessage({
      to: formattedPhone,
      message,
    })
  }

  /**
   * Send password reset link via WhatsApp
   */
  static async sendPasswordResetCode(params: { phone: string; name?: string; link: string }): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(params.phone)
    const message = `🔑 *Redefinição de Senha - MyServ*

Olá ${params.name || 'Usuário'}!

Recebemos um pedido para redefinir sua senha. Acesse o link abaixo para criar uma nova:
👉 ${params.link}

Se você não solicitou, ignore esta mensagem.

---
*MyServ - Segurança para você continuar usando a plataforma*`

    return this.sendMessage({
      to: formattedPhone,
      message,
    })
  }

  /**
   * Send welcome message to new users
   */
  static async sendWelcomeMessage(data: NotificationData): Promise<boolean> {
    const formattedPhone = this.formatPhoneNumber(data.userPhone)
    
    const message = `🎉 *Bem-vindo ao MyServ!*

Olá ${data.userName}!

Seja bem-vindo à maior plataforma de serviços do Brasil! 

🔍 Encontre profissionais qualificados
📅 Agende com facilidade
💳 Pagamentos seguros
⭐ Avaliações reais

Comece agora mesmo:
🌐 ${process.env.NEXTAUTH_URL}

Precisando de ajuda? Responda esta mensagem!

---
*MyServ - Conectando você aos melhores profissionais*`

    return this.sendMessage({
      to: formattedPhone,
      message
    })
  }

  /**
   * Test WhatsApp connection
   */
  static async testConnection(): Promise<boolean> {
    if (!this.phoneNumber) {
      console.warn('Test phone number not configured')
      return false
    }

    return this.sendMessage({
      to: this.phoneNumber,
      message: '🧪 Teste de conexão MyServ - WhatsApp funcionando!'
    })
  }
}

export default WhatsAppService
