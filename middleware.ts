/**
 * Middleware for route protection and authentication
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Redireciona /entrar e /cadastrar quando já autenticado
    const token = (req as any).nextauth?.token
    const { pathname } = req.nextUrl
    if (token && (pathname === '/entrar' || pathname === '/cadastrar')) {
      const url = req.nextUrl.clone()
      url.pathname = '/perfil'
      return NextResponse.redirect(url)
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to public routes
        if (pathname.startsWith('/api/auth') || 
            pathname.startsWith('/entrar') || 
            pathname.startsWith('/cadastrar') ||
            pathname.startsWith('/como-funciona') ||
            pathname.startsWith('/seja-profissional') ||
            pathname === '/') {
          return true
        }
        
        // Require authentication for dashboard routes
        if (pathname.startsWith('/dashboard')) {
          return !!token
        }
        
        // Admin routes require admin user type
        if (pathname.startsWith('/admin')) {
          return token?.userType === 'ADMIN'
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/entrar',
    '/cadastrar',
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/protected/:path*'
  ]
}
