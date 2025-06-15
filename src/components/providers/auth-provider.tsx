/**
 * Authentication context provider for MyServ
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { SessionProvider } from 'next-auth/react'
import type { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>
}
