/**
 * Utility functions for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Common utility functions used across the application
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines multiple class names and merges Tailwind classes efficiently
 * Prevents duplicate utility classes and properly handles conflicting classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats currency values according to Brazilian Real (BRL) format
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Formats a date to Brazilian format (dd/mm/yyyy)
 */
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

/**
 * Formats a phone number to Brazilian format
 * e.g., (11) 98765-4321
 */
export function formatPhone(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Check if it's a valid phone number
  if (cleaned.length < 10) {
    return phone // Return original if invalid
  }
  
  // Format according to Brazilian standards
  if (cleaned.length === 11) {
    // Mobile phone with 9 prefix (11) 98765-4321
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`
  } else {
    // Landline (11) 8765-4321
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6, 10)}`
  }
}

/**
 * Truncates a string to a maximum length and adds ellipsis if needed
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str
  }
  return str.slice(0, maxLength) + '...'
}

/**
 * Gets initials from a name (up to 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '?'
  
  const names = name.trim().split(' ')
  if (names.length === 1) {
    return names[0].substring(0, 2).toUpperCase()
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
}

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: never[]) => unknown>(
  func: T, 
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Validate CPF
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  
  if (cleaned.length !== 11 || /^(\d)\1{10}$/.test(cleaned)) {
    return false
  }

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  
  let remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  
  remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(10))) return false

  return true
}

/**
 * Validate CNPJ
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cleaned)) return false
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum1 = 0
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(cleaned.charAt(i)) * weights1[i]
  }
  const remainder1 = sum1 % 11
  const digit1 = remainder1 === 0 || remainder1 === 1 ? 0 : 11 - remainder1
  if (parseInt(cleaned.charAt(12)) !== digit1) return false
  let sum2 = 0
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(cleaned.charAt(i)) * weights2[i]
  }
  const remainder2 = sum2 % 11
  const digit2 = remainder2 === 0 || remainder2 === 1 ? 0 : 11 - remainder2
  return parseInt(cleaned.charAt(13)) === digit2
}

/**
 * Safely parses JSON without throwing an exception
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}
