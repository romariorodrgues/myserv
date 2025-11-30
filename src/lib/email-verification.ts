/**
 * Utilities for handling email verification tokens
 */

import crypto from 'crypto'

const DEFAULT_TTL_HOURS = Number(process.env.EMAIL_VERIFICATION_TTL_HOURS || '72')

const getBaseUrl = () => {
  const envUrl =
    process.env.EMAIL_VERIFICATION_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

  return (envUrl && envUrl.trim().length > 0 ? envUrl : 'http://localhost:3000').replace(/\/$/, '')
}

export const getEmailVerificationTtlMs = () => DEFAULT_TTL_HOURS * 60 * 60 * 1000

export function generateEmailVerificationToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function getEmailVerificationExpiryDate() {
  return new Date(Date.now() + getEmailVerificationTtlMs())
}

export function buildEmailVerificationLink(token: string) {
  return `${getBaseUrl()}/confirmar-email?token=${encodeURIComponent(token)}`
}

export function isVerificationExpired(expiresAt?: Date | string | null) {
  if (!expiresAt) return false
  const expires = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime()
  return Number.isFinite(expires) && expires < Date.now()
}
