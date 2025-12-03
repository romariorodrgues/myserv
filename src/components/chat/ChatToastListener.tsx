'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSocket } from '@/hooks/use-socket'

interface SupportSocketMessage {
  id: string
  chatId: string
  senderId: string
  content: string
  isFromAdmin?: boolean
  createdAt?: string
}

export function ChatToastListener() {
  const { data: session } = useSession()
  const socket = useSocket()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!socket || !session?.user?.id) return

    const handler = (message: SupportSocketMessage) => {
      // Ignorar mensagens enviadas pelo próprio usuário
      if (message?.senderId === session.user.id) return

      // Se já está na tela do chat admin, não precisa tostar
      const isAdmin = (session.user as any)?.userType === 'ADMIN'
      if (isAdmin && pathname?.startsWith('/admin/chat')) return

      const title = isAdmin ? 'Nova mensagem de suporte' : 'Resposta do suporte'
      const description = message?.content?.slice(0, 140) || 'Mensagem nova'

      toast.message(title, {
        description,
        action: {
          label: 'Abrir',
          onClick: () => {
            if (isAdmin) {
              router.push(message?.chatId ? `/admin/chat?chatId=${message.chatId}` : '/admin/chat')
            } else {
              if (typeof window !== 'undefined' && message?.chatId) {
                window.sessionStorage.setItem('support-chat:target', message.chatId)
                window.dispatchEvent(new CustomEvent('support-chat:open', { detail: { chatId: message.chatId } }))
              }
              router.push('/ajuda')
            }
          },
        },
        duration: 6000,
      })
    }

    socket.on('message-received', handler)
    return () => {
      socket.off('message-received', handler)
    }
  }, [socket, session?.user?.id, pathname, router])

  return null
}
