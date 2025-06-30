// src/components/layout/client-layout-wrapper.tsx
'use client'

import { useEffect, useState } from 'react'

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const className = isClient
    ? 'font-sans antialiased bg-gradient-to-br from-brand-bg via-white to-brand-teal/10 min-h-screen text-primary transition-colors duration-300'
    : 'font-sans antialiased bg-white text-black min-h-screen'

  return (
    <div className={className}>
      {children}
    </div>
  )
}
