/**
 * Middleware for route protection and authentication
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
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
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/protected/:path*'
  ]
}
