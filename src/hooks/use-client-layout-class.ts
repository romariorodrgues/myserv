
'use client'
import { useEffect, useState } from 'react'

export function useClientLayoutClass() {
  const [className, setClassName] = useState(
    'font-sans antialiased bg-white text-black min-h-screen'
  )

  useEffect(() => {
    setClassName(
      'font-sans antialiased bg-gradient-to-br from-brand-bg via-white to-brand-teal/10 min-h-screen text-primary transition-colors duration-300'
    )
  }, [])

  return className
}
