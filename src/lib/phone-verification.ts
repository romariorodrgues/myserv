import { prisma } from '@/lib/prisma'
import { WhatsAppService } from './whatsapp-service'

const DEFAULT_PHONE_TTL_MINUTES = Number(process.env.PHONE_VERIFICATION_TTL_MINUTES || '10')

export function generatePhoneVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function getPhoneVerificationExpiryDate() {
  return new Date(Date.now() + DEFAULT_PHONE_TTL_MINUTES * 60 * 1000)
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export function isPhoneVerificationExpired(expiresAt?: Date | string | null) {
  if (!expiresAt) return false
  const timestamp = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime()
  return Number.isFinite(timestamp) && timestamp < Date.now()
}

interface IssueCodeParams {
  userId: string
  phone: string
  name?: string | null
}

export async function issuePhoneVerificationCode({ userId, phone, name }: IssueCodeParams) {
  const sanitizedPhone = normalizePhone(phone)
  if (sanitizedPhone.length < 10) {
    throw new Error('Telefone inválido')
  }
  const code = generatePhoneVerificationCode()
  const expiresAt = getPhoneVerificationExpiryDate()
  await prisma.user.update({
    where: { id: userId },
    data: {
      phone: sanitizedPhone,
      phoneVerified: false,
      phoneVerificationCode: code,
      phoneVerificationExpiresAt: expiresAt,
      phoneVerificationSentAt: new Date(),
    },
  })

  try {
    await WhatsAppService.sendPhoneVerificationCode({
      phone: sanitizedPhone,
      name: name ?? 'Usuário',
      code,
    })
  } catch (error) {
    console.error('[phone verification] failed to send WhatsApp OTP', error)
  }
}
