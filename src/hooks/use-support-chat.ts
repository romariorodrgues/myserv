import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useChatStore, SupportChat, ChatMessage } from '@/lib/chat-store'
import { useSocket } from './use-socket'

interface CreateChatData {
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

export function useSupportChat() {
  const { data: session, status } = useSession()
  const socket = useSocket()
  
  const {
    chats,
    currentChat,
    messages,
    isLoading,
    isLoadingMessages,
    typingUsers,
    setChats,
    addChat,
    updateChat,
    setCurrentChat,
    setMessages,
    addMessage,
    setLoading,
    setLoadingMessages,
    addTypingUser,
    removeTypingUser,
    clearTypingUsers,
    getChatById,
    markChatAsRead
  } = useChatStore()

  const [error, setError] = useState<string | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Só executar se estiver autenticado
  const isAuthenticated = status === 'authenticated' && session?.user?.id

  // Socket event handlers + Polling fallback
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: ChatMessage) => {
      console.log('Received new message via socket:', message)
      addMessage(message)
    }

    const handleChatUpdate = (updatedChat: SupportChat) => {
      console.log('Received chat update via socket:', updatedChat)
      updateChat(updatedChat.id, updatedChat)
    }

    const handleTypingStart = (data: { userId: string; userName: string; chatId: string }) => {
      addTypingUser(data)
    }

    const handleTypingStop = (data: { userId: string; chatId: string }) => {
      removeTypingUser(data.userId, data.chatId)
    }

    socket.on('message-received', handleNewMessage)
    socket.on('chat-status-updated', handleChatUpdate)
    socket.on('user-typing', handleTypingStart)
    socket.on('user-typing', handleTypingStop)

    return () => {
      socket.off('message-received', handleNewMessage)
      socket.off('chat-status-updated', handleChatUpdate)
      socket.off('user-typing', handleTypingStart)
      socket.off('user-typing', handleTypingStop)
    }
  }, [socket, addMessage, updateChat, addTypingUser, removeTypingUser])

  // Polling fallback para tempo real (caso Socket.io falhe)
  useEffect(() => {
    if (!isAuthenticated || !currentChat) return

    console.log('Starting polling for chat:', currentChat.id)
    
    const pollMessages = async () => {
      try {
        const response = await fetch(`/api/chat/${currentChat.id}/messages`)
        if (response.ok) {
          const data = await response.json()
          const newMessages = Array.isArray(data.messages) ? data.messages : []
          
          // Só atualizar se há mensagens novas
          if (newMessages.length !== messages.length) {
            console.log('Polling found new messages, updating...')
            setMessages(currentChat.id, newMessages)
          }
        }
      } catch (error) {
        console.error('Error polling messages:', error)
      }
    }

    const pollChatStatus = async () => {
      try {
        const response = await fetch(`/api/chat/${currentChat.id}`)
        if (response.ok) {
          const data = await response.json()
          const chatData = data.chat
          
          // Verificar se o status mudou
          if (chatData && chatData.status !== currentChat.status) {
            console.log('Chat status changed from', currentChat.status, 'to', chatData.status)
            updateChat(currentChat.id, { ...currentChat, status: chatData.status })
            
            // Se foi fechado, adicionar mensagem do sistema
            if (chatData.status === 'CLOSED') {
              const systemMessage = {
                id: `system-${Date.now()}`,
                chatId: currentChat.id,
                senderId: 'system',
                content: 'Este atendimento foi finalizado. Caso precise de mais ajuda, inicie um novo atendimento.',
                type: 'SYSTEM' as const,
                isFromAdmin: true,
                isRead: false,
                createdAt: new Date().toISOString(),
                sender: {
                  id: 'system',
                  name: 'Sistema',
                  email: 'system@myserv.com',
                  role: 'SYSTEM'
                }
              }
              addMessage(systemMessage)
            }
          }
        }
      } catch (error) {
        console.error('Error polling chat status:', error)
      }
    }

    // Poll mensagens a cada 2 segundos
    const pollMessagesInterval = setInterval(pollMessages, 2000)
    
    // Poll status a cada 3 segundos
    const pollStatusInterval = setInterval(pollChatStatus, 3000)

    return () => {
      console.log('Stopping polling for chat:', currentChat.id)
      clearInterval(pollMessagesInterval)
      clearInterval(pollStatusInterval)
    }
  }, [isAuthenticated, currentChat, messages.length, setMessages, updateChat, addMessage])

  // Load user chats
  const loadChats = useCallback(async (status?: string) => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (status) params.append('status', status)

      const response = await fetch(`/api/chat?${params}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar chats')
      }

      const data = await response.json()
      setChats(Array.isArray(data.chats) ? data.chats : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, setChats, setLoading])

  // Load specific chat
  const loadChat = useCallback(async (chatId: string) => {
    if (!isAuthenticated) return

    try {
      setLoadingMessages(true)
      setError(null)

      const response = await fetch(`/api/chat/${chatId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar chat')
      }

      const data = await response.json()
      setCurrentChat(data.chat)

      // Load messages
      const messagesResponse = await fetch(`/api/chat/${chatId}/messages`)
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()
        setMessages(chatId, Array.isArray(messagesData.messages) ? messagesData.messages : [])
      }

      // Join chat room
      if (socket) {
        socket.emit('join_chat', { chatId })
      }

      // Mark as read
      markChatAsRead(chatId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoadingMessages(false)
    }
  }, [isAuthenticated, setCurrentChat, setMessages, setLoadingMessages, socket, markChatAsRead])

  // Create new chat
  const createChat = useCallback(async (data: CreateChatData) => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Erro ao criar chat')
      }

      const result = await response.json()
      const newChat = result.chat

      addChat(newChat)
      setCurrentChat(newChat)
      setMessages(newChat.id, [])

      // Join chat room
      if (socket) {
        socket.emit('join_chat', { chatId: newChat.id })
      }

      return newChat
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, addChat, setCurrentChat, setMessages, setLoading, socket])

  // Send message
  const sendMessage = useCallback(async (chatId: string, content: string, type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT') => {
    if (!isAuthenticated || !content.trim()) return

    try {
      setError(null)

      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content.trim(),
          type
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem')
      }

      const result = await response.json()
      
      // Add message immediately to show in UI
      addMessage(result.message)

      // Stop typing
      stopTyping()

      return result.message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    }
  }, [isAuthenticated])

  // Start typing
  const startTyping = useCallback((chatId: string) => {
    if (!socket || !isAuthenticated) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Emit typing start
    socket.emit('typing_start', {
      chatId,
      userId: session.user.id,
      userName: session.user.name || 'Usuário'
    })

    // Auto stop after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)
  }, [socket, session?.user])

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!socket || !isAuthenticated || !currentChat) return

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    // Emit typing stop
    socket.emit('typing_stop', {
      chatId: currentChat.id,
      userId: session.user.id
    })
  }, [socket, session?.user?.id, currentChat])

  // Close chat
  const closeChat = useCallback(async (chatId: string) => {
    if (!isAuthenticated) return

    try {
      setError(null)

      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'CLOSED'
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao fechar chat')
      }

      const result = await response.json()
      updateChat(chatId, result.chat)

      return result.chat
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    }
  }, [isAuthenticated, updateChat])

  // Get current chat messages
  const currentChatMessages = currentChat ? messages[currentChat.id] || [] : []

  return {
    // State
    chats,
    currentChat,
    messages: currentChatMessages,
    loading: isLoading,
    loadingMessages: isLoadingMessages,
    error,
    typingUsers,
    socket, // Para debug

    // Actions
    loadChats,
    loadChat,
    createChat,
    sendMessage,
    closeChat,
    setCurrentChat,
    
    // Typing
    startTyping,
    stopTyping,

    // Utils
    getChatById,
    markChatAsRead
  }
}
