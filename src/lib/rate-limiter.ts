/**
 * Rate limiting middleware for MyServ APIs
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class RateLimiter {
  private store: RateLimitStore = {}
  private windowMs: number
  private maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const window = this.store[identifier]

    if (!window || now > window.resetTime) {
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.windowMs
      }
      return true
    }

    if (window.count >= this.maxRequests) {
      return false
    }

    window.count++
    return true
  }

  getRemainingRequests(identifier: string): number {
    const window = this.store[identifier]
    if (!window || Date.now() > window.resetTime) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - window.count)
  }

  getResetTime(identifier: string): number {
    const window = this.store[identifier]
    if (!window || Date.now() > window.resetTime) {
      return Date.now() + this.windowMs
    }
    return window.resetTime
  }
}

// Different rate limits for different endpoints
const rateLimiters = {
  payments: new RateLimiter(60000, 10), // 10 requests per minute for payments
  notifications: new RateLimiter(60000, 30), // 30 requests per minute for notifications
  integrations: new RateLimiter(60000, 20), // 20 requests per minute for integrations
  general: new RateLimiter(60000, 100) // 100 requests per minute for general APIs
}

export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiterType: keyof typeof rateLimiters = 'general'
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Get client identifier (IP address or user ID)
    const identifier = request.ip || 
                      request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'

    const limiter = rateLimiters[limiterType]
    
    if (!limiter.isAllowed(identifier)) {
      const resetTime = limiter.getResetTime(identifier)
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limiter.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toString(),
            'Retry-After': retryAfter.toString()
          }
        }
      )
    }

    // Add rate limit headers to successful responses
    const response = await handler(request)
    const remaining = limiter.getRemainingRequests(identifier)
    const resetTime = limiter.getResetTime(identifier)

    response.headers.set('X-RateLimit-Limit', limiter.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', resetTime.toString())

    return response
  }
}

export { rateLimiters }
