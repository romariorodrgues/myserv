'use client'

import { useEffect, useState } from 'react'
import { SupportChatWidget } from './SupportChatWidget'

export function SupportChatWidgetWrapper() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return <SupportChatWidget />
}
