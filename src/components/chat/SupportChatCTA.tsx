'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface SupportChatCTAProps {
  label?: string
  initialTitle?: string
  initialMessage?: string
  forceNewChat?: boolean
  className?: string
}

export function SupportChatCTA({
  label = 'Iniciar chat com suporte',
  initialTitle,
  initialMessage,
  forceNewChat = false,
  className,
}: SupportChatCTAProps) {
  const { status } = useSession()
  const router = useRouter()

  const handleClick = () => {
    if (status !== 'authenticated') {
      const callbackUrl = encodeURIComponent(window.location.pathname ?? '/ajuda')
      router.push(`/entrar?callbackUrl=${callbackUrl}`)
      return
    }

    window.dispatchEvent(
      new CustomEvent('support-chat:open', {
        detail: {
          initialTitle,
          initialMessage,
          forceNewChat,
        },
      })
    )
  }

  return (
    <Button onClick={handleClick} className={className}>
      {label}
    </Button>
  )
}
