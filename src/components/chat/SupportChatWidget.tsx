'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import clsx from 'clsx'
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2,
  Phone,
  Mail,
  Clock,
  User
} from 'lucide-react'
import { useSupportChat } from '@/hooks/use-support-chat'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SupportChatWidgetProps {
  initialMessage?: string
}

export function SupportChatWidget({ initialMessage }: SupportChatWidgetProps) {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [chatTitle, setChatTitle] = useState('')
  const [chatDescription, setChatDescription] = useState('')
  const [showNewChatForm, setShowNewChatForm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isDesktop, setIsDesktop] = useState(false)

  // SEMPRE chamar o hook (sem condições)
  const {
    chats,
    currentChat,
    messages,
    loading,
    loadingMessages,
    createChat,
    sendMessage,
    loadChats,
    loadChat,
    setCurrentChat,
    startTyping,
    typingUsers,
    socket, // Para debug
    getChatById,
  } = useSupportChat()

  // Debug do socket
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && socket) {
      console.debug('SupportChatWidget socket conectado:', socket.id)
    }
  }, [socket])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Carregar chats quando abrir
  useEffect(() => {
    if (isOpen && session?.user?.id) {
      loadChats()
    }
  }, [isOpen, session?.user?.id, loadChats])

  // Carregar mensagens quando selecionar um chat
  useEffect(() => {
    const loadChatMessages = async () => {
      if (!currentChat) return

      try {
        const response = await fetch(`/api/chat/${currentChat.id}/messages`)
        if (response.ok) {
          const data = await response.json()
          if (process.env.NODE_ENV !== 'production') {
            console.debug('Loaded messages for chat', currentChat.id, data.messages?.length ?? 0)
          }
        }
      } catch (error) {
        console.error('Error loading chat messages:', error)
      }
    }

    if (currentChat) {
      loadChatMessages()
    }
  }, [currentChat])

  // Auto scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Aplicar mensagem inicial se fornecida
  useEffect(() => {
    if (initialMessage && isOpen && !currentChat) {
      setChatDescription(initialMessage)
      setShowNewChatForm(true)
    }
  }, [initialMessage, isOpen, currentChat])

  const handleCreateChat = async () => {
    if (!chatTitle.trim() || !chatDescription.trim()) return

    try {
      await createChat({
        title: chatTitle,
        description: chatDescription,
        priority: 'MEDIUM'
      })
      setChatTitle('')
      setChatDescription('')
      setShowNewChatForm(false)
    } catch (error) {
      console.error('Erro ao criar chat:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentChat) return

    try {
      await sendMessage(currentChat.id, newMessage.trim(), 'TEXT')
      setNewMessage('')
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (showNewChatForm) {
        handleCreateChat()
      } else {
        handleSendMessage()
      }
    }
  }

  const handleTyping = () => {
    if (currentChat) {
      startTyping(currentChat.id)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-500'
      case 'IN_PROGRESS': return 'bg-yellow-500'
      case 'CLOSED': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Aberto'
      case 'IN_PROGRESS': return 'Em Atendimento'
      case 'CLOSED': return 'Fechado'
      default: return status
    }
  }

  const formatMessageTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      })
    } catch {
      return 'agora'
    }
  }

  const currentTypingUsers = typingUsers.filter((user: any) => 
    currentChat && user.chatId === currentChat.id && user.userId !== session?.user?.id
  )

  const openChatById = useCallback(async (chatId: string) => {
    if (!chatId) return
    setShowNewChatForm(false)
    try {
      const existing = getChatById(chatId)
      if (!existing) {
        await loadChats()
      }
      await loadChat(chatId)
    } catch (error) {
      console.error('Erro ao abrir chat de suporte:', error)
    }
  }, [getChatById, loadChat, loadChats])

  const handleExternalOpen = useCallback((event: Event) => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return
    }

    const detail = (event as CustomEvent<{ initialMessage?: string; initialTitle?: string; forceNewChat?: boolean; chatId?: string }>).detail || {}

    setIsOpen(true)
    setIsMinimized(false)

    if (detail.chatId) {
      openChatById(detail.chatId)
      return
    }

    if (!currentChat || detail.forceNewChat) {
      if (detail.forceNewChat) {
        setCurrentChat(null)
      }
      setShowNewChatForm(true)
      if (typeof detail.initialTitle === 'string') {
        setChatTitle(detail.initialTitle)
      }
      if (typeof detail.initialMessage === 'string') {
        setChatDescription(detail.initialMessage)
      }
    }
  }, [currentChat, openChatById, session?.user?.id, setCurrentChat, status])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('support-chat:open', handleExternalOpen)
    return () => {
      window.removeEventListener('support-chat:open', handleExternalOpen)
    }
  }, [handleExternalOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (status !== 'authenticated' || !session?.user?.id) return
    const storedChatId = window.sessionStorage.getItem('support-chat:target')
    if (storedChatId) {
      window.sessionStorage.removeItem('support-chat:target')
      setIsOpen(true)
      setIsMinimized(false)
      openChatById(storedChatId)
    }
  }, [openChatById, session?.user?.id, status])

  const isAuthenticated = status === 'authenticated' && !!session?.user?.id
  const userType = (session.user as any)?.userType
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

  // Polling de mensagens não lidas (lado cliente)
  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/chat/unread-count')
        const data = await res.json().catch(() => ({}))
        if (!cancelled && data?.success) {
          setUnreadMessagesCount(data.unread ?? 0)
        }
      } catch {
        /* ignore */
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isAuthenticated])

  // Bump ao receber mensagem do admin via socket
  useEffect(() => {
    if (!socket || userType === 'ADMIN') return
    const handler = (message: any) => {
      if (message?.isFromAdmin) {
        setUnreadMessagesCount((prev) => prev + 1)
      }
    }
    socket.on('message-received', handler)
    return () => {
      socket.off('message-received', handler)
    }
  }, [socket, userType])

  // Botão flutuante
  const floatingButtonClasses = useMemo(() => {
    if (isDesktop) {
      return 'right-4 bottom-4 sm:right-6 sm:bottom-6 xl:right-10 xl:bottom-10'
    }
    return 'left-4 right-4 bottom-20 sm:bottom-24'
  }, [isDesktop])

  const minimizedContainerClasses = useMemo(() => {
    if (isDesktop) {
      return 'right-4 bottom-4 sm:right-6 sm:bottom-6 xl:right-10 xl:bottom-10'
    }
    return 'left-4 right-4 bottom-20 sm:bottom-24'
  }, [isDesktop])

  const openContainerClasses = useMemo(() => {
    if (isDesktop) {
      return 'right-4 bottom-4 sm:right-6 sm:bottom-6 xl:right-10 xl:bottom-10'
    }
    return 'left-4 right-4 bottom-20 sm:bottom-24 w-full'
  }, [isDesktop])

  const widgetSizeClasses = useMemo(() => {
    if (isDesktop) {
      return 'w-[min(22rem,calc(100vw-3rem))] max-h-[calc(100vh-120px)] h-[min(600px,calc(100vh-140px))]'
    }
    return 'w-full max-w-md mx-auto h-[min(75vh,calc(100vh-140px))] max-h-[calc(100vh-120px)]'
  }, [isDesktop])

  // Se não estiver autenticado, não renderizar
  if (!isAuthenticated) {
    return null
  }

  if (userType === 'ADMIN') {
    return null // Admins usam o dashboard específico
  }

  if (!isOpen) {
    return (
      <div className={clsx('fixed z-[1200]', floatingButtonClasses)}>
        <div className="relative">
          <Button
            onClick={() => setIsOpen(true)}
            size="icon"
            className={`h-14 w-14 rounded-full bg-brand-cyan hover:bg-brand-cyan/90 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 ${
              unreadMessagesCount > 0 ? 'animate-pulse' : ''
            }`}
            title="Chat de Suporte"
            style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}
            aria-label="Abrir chat de suporte"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
          
          {/* Badge de notificação */}
          {unreadMessagesCount > 0 && (
            <Badge className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 h-5 w-5 p-0 flex items-center justify-center bg-brand-teal text-white text-[10px] border-2 border-white rounded-full animate-bounce">
              {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
            </Badge>
          )}
        </div>
      </div>
    )
  }

  // Widget minimizado
  if (isMinimized) {
    return (
      <div className={clsx('fixed z-[1200]', minimizedContainerClasses)}>
        <Card className={`shadow-xl border border-brand-cyan/20 bg-white/95 backdrop-blur-sm ${
          isDesktop ? 'w-80' : 'w-full max-w-md mx-auto'
        }`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-brand-navy to-brand-cyan text-white rounded-t-lg">
            <CardTitle className="text-sm font-medium">Chat de Suporte</CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
                className="hover:bg-white/20 text-white h-6 w-6 p-0"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 text-white h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Widget completo
  return (
    <div className={clsx('fixed z-[1200]', openContainerClasses)}>
      <Card
        className={`shadow-2xl flex flex-col border border-brand-cyan/20 bg-white/95 backdrop-blur-sm ${
          isDesktop ? widgetSizeClasses : clsx(widgetSizeClasses, 'max-w-md')
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-brand-navy to-brand-cyan text-white rounded-t-lg">
          <CardTitle className="text-sm font-medium">
            {currentChat ? currentChat.title : 'Chat de Suporte'}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="hover:bg-white/20 text-white h-6 w-6 p-0"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 text-white h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Lista de chats ou formulário */}
          {!currentChat && (
            <div className="p-4 border-b">
              {showNewChatForm ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Título do seu problema"
                    value={chatTitle}
                    onChange={(e) => setChatTitle(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <textarea
                    className="w-full p-2 border rounded-md resize-none"
                    rows={3}
                    placeholder="Descreva seu problema em detalhes"
                    value={chatDescription}
                    onChange={(e) => setChatDescription(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateChat}
                      disabled={!chatTitle.trim() || !chatDescription.trim() || loading}
                      size="sm"
                    >
                      Criar Chat
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewChatForm(false)}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowNewChatForm(true)}
                  className="w-full bg-brand-cyan hover:bg-brand-cyan/90 text-white"
                  disabled={loading}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Novo Chat de Suporte
                </Button>
              )}
            </div>
          )}

          {/* Lista de chats existentes */}
          {!currentChat && Array.isArray(chats) && chats.length > 0 && (
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Seus Chats</h4>
                {chats.map((chat: any) => (
                  <div
                    key={chat.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setCurrentChat(chat)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{chat.title}</h5>
                        <p className="text-xs text-gray-500 mt-1">
                          {chat.description && chat.description.length > 60
                            ? `${chat.description.substring(0, 60)}...`
                            : chat.description || 'Sem descrição'
                          }
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={getStatusColor(chat.status)}>
                          {getStatusLabel(chat.status)}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {formatMessageTime(chat.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Chat ativo */}
          {currentChat && (
            <>
              {/* Header do chat */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentChat(null)}
                  >
                    ← Voltar
                  </Button>
                  <div className="flex gap-1">
                    <Badge className={getStatusColor(currentChat.status)}>
                      {getStatusLabel(currentChat.status)}
                    </Badge>
                  </div>
                </div>
                {currentChat.assignedTo && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    Atendido por: {currentChat.assignedTo.name}
                  </div>
                )}
              </div>

              {/* Mensagens */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {loadingMessages ? (
                    <div className="text-center text-gray-500">
                      Carregando mensagens...
                    </div>
                  ) : !Array.isArray(messages) || messages.length === 0 ? (
                    <div className="text-center text-gray-500">
                      Nenhuma mensagem ainda
                    </div>
                  ) : (
                    messages.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === session.user.id 
                            ? 'justify-end' 
                            : message.senderId === 'system'
                            ? 'justify-center'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.senderId === session.user.id
                              ? 'bg-blue-500 text-white'
                              : message.senderId === 'system'
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {message.senderId !== session.user.id && message.senderId !== 'system' && (
                            <div className="text-xs font-medium mb-1">
                              {message.sender.name}
                            </div>
                          )}
                          {message.senderId === 'system' && (
                            <div className="text-xs font-medium mb-1 text-orange-600">
                              🔔 Sistema
                            </div>
                          )}
                          <div className="text-sm">{message.content}</div>
                          <div className={`text-xs mt-1 ${
                            message.senderId === session.user.id
                              ? 'text-blue-100'
                              : message.senderId === 'system'
                              ? 'text-orange-600'
                              : 'text-gray-500'
                          }`}>
                            {formatMessageTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Indicador de digitação */}
                  {currentTypingUsers.length > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                        <div className="text-sm">
                          {currentTypingUsers.map((u: any) => u.userName).join(', ')} 
                          {currentTypingUsers.length === 1 ? ' está' : ' estão'} digitando...
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input de mensagem */}
              {currentChat.status !== 'CLOSED' ? (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        handleTyping()
                      }}
                      onKeyPress={handleKeyPress}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t bg-gray-50">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">
                      ✅ Atendimento finalizado
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      Caso precise de mais ajuda, inicie um novo atendimento
                    </div>
                    <Button
                      onClick={() => {
                        setCurrentChat(null)
                        setShowNewChatForm(true)
                      }}
                      size="sm"
                      className="bg-brand-cyan hover:bg-brand-cyan/90 text-white"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Novo Atendimento
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
