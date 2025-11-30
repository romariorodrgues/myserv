/**
 * Utilities for password reset token generation and validation
 */

import crypto from 'crypto'

const DEFAULT_RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || '60')

const getBaseUrl = () => {
  const envUrl =
    process.env.PASSWORD_RESET_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

  return (envUrl && envUrl.trim().length > 0 ? envUrl : 'http://localhost:3000').replace(/\/$/, '')
}

export function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function getPasswordResetExpiryDate() {
  return new Date(Date.now() + DEFAULT_RESET_TTL_MINUTES * 60 * 1000)
}

export function buildPasswordResetLink(token: string) {
  return `${getBaseUrl()}/resetar-senha?token=${encodeURIComponent(token)}`
}

export function isPasswordResetExpired(expiresAt?: Date | string | null) {
  if (!expiresAt) return false
  const expires = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime()
  return Number.isFinite(expires) && expires < Date.now()
}
