/**
 * Email service for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Handles email notifications and communications
 */

import nodemailer from 'nodemailer'
import { NotificationData } from './whatsapp-service'
import { buildEmailVerificationLink } from './email-verification'
import { buildPasswordResetLink } from './password-reset'

export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  /**
   * Send email
   */
  private static async sendEmail(data: EmailData): Promise<boolean> {
    try {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.warn('Email not configured')
        return false
      }

      const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER

      await this.transporter.sendMail({
        from: `"MyServ" <${fromEmail}>`,
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html,
      })

      return true
    } catch (error) {
      console.error('Email send error:', error)
      return false
    }
  }

  /**
   * Generate email template
   */
  private static generateTemplate(title: string, content: string, ctaText?: string, ctaLink?: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .cta-button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>MyServ</h1>
          <p>Conectando você aos melhores profissionais</p>
        </div>
        <div class="content">
          <h2>${title}</h2>
          ${content}
          ${ctaText && ctaLink ? `<a href="${ctaLink}" class="cta-button">${ctaText}</a>` : ''}
        </div>
        <div class="footer">
          <p>© 2025 MyServ. Todos os direitos reservados.</p>
          <p>Esta é uma mensagem automática, não responda este email.</p>
        </div>
      </div>
    </body>
    </html>
    `
  }

  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    const content = `
      <p>Olá <strong>${userName}</strong>!</p>
      <p>Seja muito bem-vindo(a) ao MyServ, a maior plataforma de serviços do Brasil!</p>
      <p>Agora você pode:</p>
      <ul>
        <li>🔍 Encontrar profissionais qualificados em sua região</li>
        <li>📅 Agendar serviços com facilidade</li>
        <li>💳 Realizar pagamentos seguros</li>
        <li>⭐ Avaliar e ser avaliado</li>
      </ul>
      <p>Comece agora mesmo e descubra como é fácil encontrar o profissional perfeito para suas necessidades!</p>
    `

    return this.sendEmail({
      to: userEmail,
      subject: '🎉 Bem-vindo ao MyServ!',
      html: this.generateTemplate(
        'Bem-vindo ao MyServ!',
        content,
        'Acessar Plataforma',
        process.env.NEXTAUTH_URL
      )
    })
  }

  static async sendEmailVerificationEmail(params: { email: string; name: string; token: string }): Promise<boolean> {
    const content = `
      <p>Olá, <strong>${params.name}</strong>!</p>
      <p>Recebemos um pedido para confirmar seu e-mail no MyServ. Para concluir o cadastro, clique no botão abaixo.</p>
      <p><strong>Validade:</strong> o link expira em 72 horas por segurança.</p>
      <p>Se você não solicitou este cadastro, pode ignorar este e-mail.</p>
    `

    return this.sendEmail({
      to: params.email,
      subject: 'MyServ - Confirme seu e-mail',
      html: this.generateTemplate(
        'Confirmação de e-mail',
        content,
        'Confirmar e-mail',
        buildEmailVerificationLink(params.token)
      )
    })
  }

  static async sendPasswordResetEmail(params: { email: string; name: string; token: string }): Promise<boolean> {
    const content = `
      <p>Olá, <strong>${params.name}</strong>.</p>
      <p>Recebemos um pedido para redefinir sua senha no MyServ. Para continuar, clique no botão abaixo e crie uma nova senha.</p>
      <p><strong>Validade:</strong> o link expira em 60 minutos para sua segurança.</p>
      <p>Se você não solicitou esta alteração, ignore este e-mail. Sua senha permanecerá a mesma.</p>
    `

    return this.sendEmail({
      to: params.email,
      subject: 'MyServ - Redefinir sua senha',
      html: this.generateTemplate(
        'Redefinição de senha',
        content,
        'Criar nova senha',
        buildPasswordResetLink(params.token)
      )
    })
  }

  /**
   * Send booking confirmation email
   */
  static async sendBookingConfirmationEmail(data: NotificationData & { userEmail: string }): Promise<boolean> {
    const content = `
      <p>Olá <strong>${data.userName}</strong>!</p>
      <p>Sua solicitação de serviço foi aceita! 🎉</p>
      <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p><strong>📋 Serviço:</strong> ${data.serviceName}</p>
        <p><strong>👨‍🔧 Profissional:</strong> ${data.providerName}</p>
        <p><strong>📅 Data:</strong> ${data.scheduledDate || 'A combinar'}</p>
        <p><strong>💰 Valor:</strong> ${data.amount ? `R$ ${data.amount.toFixed(2)}` : 'A negociar'}</p>
      </div>
      <p>O profissional entrará em contato em breve para finalizar os detalhes.</p>
      <p>Acompanhe o status da sua solicitação no dashboard.</p>
    `

    return this.sendEmail({
      to: data.userEmail,
      subject: '✅ Solicitação Aceita - MyServ',
      html: this.generateTemplate(
        'Solicitação Aceita!',
        content,
        'Ver Dashboard',
        `${process.env.NEXTAUTH_URL}/dashboard/cliente`
      )
    })
  }

  /**
   * Send booking rejection email
   */
  static async sendBookingRejectionEmail(data: NotificationData & { userEmail: string }): Promise<boolean> {
    const content = `
      <p>Olá <strong>${data.userName}</strong>,</p>
      <p>Infelizmente sua solicitação de serviço foi recusada pelo profissional.</p>
      <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p><strong>📋 Serviço:</strong> ${data.serviceName}</p>
        <p><strong>👨‍🔧 Profissional:</strong> ${data.providerName}</p>
      </div>
      <p>Não se preocupe! Você pode solicitar o mesmo serviço para outros profissionais em nossa plataforma.</p>
      <p>Continue sua busca e encontre o profissional ideal!</p>
    `

    return this.sendEmail({
      to: data.userEmail,
      subject: '❌ Solicitação Recusada - MyServ',
      html: this.generateTemplate(
        'Solicitação Recusada',
        content,
        'Buscar Outros Profissionais',
        `${process.env.NEXTAUTH_URL}/servicos`
      )
    })
  }

  /**
   * Send service completion email
   */
  static async sendServiceCompletionEmail(data: NotificationData & { userEmail: string }): Promise<boolean> {
    const content = `
      <p>Parabéns <strong>${data.userName}</strong>! 🎉</p>
      <p>Seu serviço foi concluído com sucesso!</p>
      <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p><strong>📋 Serviço:</strong> ${data.serviceName}</p>
        <p><strong>👨‍🔧 Profissional:</strong> ${data.providerName}</p>
        <p><strong>💰 Valor:</strong> ${data.amount ? `R$ ${data.amount.toFixed(2)}` : 'Conforme combinado'}</p>
      </div>
      <p>Esperamos que você tenha ficado satisfeito(a) com o serviço!</p>
      <p>Que tal avaliar o profissional? Sua opinião é muito importante para nossa comunidade.</p>
    `

    return this.sendEmail({
      to: data.userEmail,
      subject: '🎉 Serviço Concluído - MyServ',
      html: this.generateTemplate(
        'Serviço Concluído!',
        content,
        'Avaliar Profissional',
        `${process.env.NEXTAUTH_URL}/dashboard/cliente`
      )
    })
  }

  /**
   * Send payment reminder email
   */
  static async sendPaymentReminderEmail(data: NotificationData & { userEmail: string }): Promise<boolean> {
    const content = `
      <p>Olá <strong>${data.userName}</strong>,</p>
      <p>Você tem um pagamento pendente para finalizar:</p>
      <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p><strong>📋 Serviço:</strong> ${data.serviceName}</p>
        <p><strong>👨‍🔧 Profissional:</strong> ${data.providerName}</p>
        <p><strong>💰 Valor:</strong> R$ ${data.amount?.toFixed(2)}</p>
      </div>
      <p>Finalize seu pagamento para concluir o processo e liberar o profissional.</p>
      <p>Pagamentos seguros via MercadoPago ou Pix.</p>
    `

    return this.sendEmail({
      to: data.userEmail,
      subject: '💳 Lembrete de Pagamento - MyServ',
      html: this.generateTemplate(
        'Pagamento Pendente',
        content,
        'Pagar Agora',
        `${process.env.NEXTAUTH_URL}/dashboard/cliente`
      )
    })
  }

  /**
   * Send new service request notification to provider
   */
  static async sendNewRequestNotificationEmail(data: NotificationData & { userEmail: string }): Promise<boolean> {
    const content = `
      <p>Olá <strong>${data.userName}</strong>!</p>
      <p>Você recebeu uma nova solicitação de serviço! 🔔</p>
      <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p><strong>📋 Serviço:</strong> ${data.serviceName}</p>
        <p><strong>👤 Cliente:</strong> ${data.clientName}</p>
        <p><strong>📅 Data:</strong> ${data.scheduledDate || 'A combinar'}</p>
        <p><strong>💰 Valor:</strong> ${data.amount ? `R$ ${data.amount.toFixed(2)}` : 'A negociar'}</p>
      </div>
      <p>Acesse seu dashboard para aceitar ou recusar esta solicitação.</p>
      <p>Lembre-se: quanto mais rápido você responder, melhor será sua classificação na plataforma!</p>
    `

    return this.sendEmail({
      to: data.userEmail,
      subject: '🔔 Nova Solicitação de Serviço - MyServ',
      html: this.generateTemplate(
        'Nova Solicitação!',
        content,
        'Ver Solicitação',
        `${process.env.NEXTAUTH_URL}/dashboard/profissional`
      )
    })
  }

  /**
   * Test email connection
   */
  static async testConnection(testEmail: string): Promise<boolean> {
    return this.sendEmail({
      to: testEmail,
      subject: '🧪 Teste de Email - MyServ',
      html: this.generateTemplate(
        'Teste de Conexão',
        '<p>Se você está lendo este email, a configuração está funcionando perfeitamente! ✅</p>',
        'Acessar MyServ',
        process.env.NEXTAUTH_URL
      )
    })
  }
}

export default EmailService
