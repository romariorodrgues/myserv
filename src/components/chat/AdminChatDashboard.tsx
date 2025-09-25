'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/hooks/use-socket'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageCircle, 
  Clock, 
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Send
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useSearchParams } from 'next/navigation'

interface AdminChatDashboardProps {
  className?: string
}

export function AdminChatDashboard({ className }: AdminChatDashboardProps) {
  const { data: session } = useSession()
  const socket = useSocket()
  const [chats, setChats] = useState<any[]>([])
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const searchParams = useSearchParams()
  const targetChatId = searchParams?.get('chatId') ?? null

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: any) => {
      setMessages(prev => [...prev, message])
      
      // Atualizar lista de chats se necessário
      setChats(prev => prev.map(chat => 
        chat.id === message.chatId 
          ? { ...chat, updatedAt: new Date().toISOString() }
          : chat
      ))
    }

    const handleStatusUpdate = (data: { chatId: string; status: string }) => {
      setChats(prev => prev.map(chat => 
        chat.id === data.chatId 
          ? { ...chat, status: data.status, updatedAt: new Date().toISOString() }
          : chat
      ))
      
      if (selectedChat?.id === data.chatId) {
        setSelectedChat((prev: any) => prev ? { ...prev, status: data.status } : null)
      }
    }

    socket.on('message-received', handleNewMessage)
    socket.on('chat-status-updated', handleStatusUpdate)

    return () => {
      socket.off('message-received', handleNewMessage)
      socket.off('chat-status-updated', handleStatusUpdate)
    }
  }, [socket, selectedChat])

  // Join chat room when selecting a chat
  useEffect(() => {
    if (socket && selectedChat) {
      socket.emit('join-chat', selectedChat.id)
      return () => {
        socket.emit('leave-chat', selectedChat.id)
      }
    }
  }, [socket, selectedChat])

  // Polling fallback para tempo real (admin)
  useEffect(() => {
    if (!selectedChat) return

    console.log('Admin: Starting polling for chat:', selectedChat.id)
    
    const pollMessages = async () => {
      try {
        const response = await fetch(`/api/chat/${selectedChat.id}/messages`)
        if (response.ok) {
          const data = await response.json()
          const newMessages = Array.isArray(data.messages) ? data.messages : []
          
          // Só atualizar se há mensagens novas
          if (newMessages.length !== messages.length) {
            console.log('Admin: Polling found new messages, updating...')
            setMessages(newMessages)
          }
        }
      } catch (error) {
        console.error('Admin: Error polling messages:', error)
      }
    }

    // Poll a cada 1.5 segundos (mais frequente para admin)
    const pollInterval = setInterval(pollMessages, 1500)

    // Load inicial
    pollMessages()

    return () => {
      console.log('Admin: Stopping polling for chat:', selectedChat.id)
      clearInterval(pollInterval)
    }
  }, [selectedChat, messages.length])

  // Polling para lista de chats (admin)
  useEffect(() => {
    const pollChats = async () => {
      try {
        const params = new URLSearchParams()
        if (statusFilter !== 'all') {
          params.append('status', statusFilter)
        }
        if (searchTerm) {
          params.append('search', searchTerm)
        }

        const response = await fetch(`/api/chat/admin/list?${params}`)
        if (response.ok) {
          const data = await response.json()
          const newChats = data.chats || []
          
          // Atualizar se há mudanças na quantidade de chats
          if (newChats.length !== chats.length) {
            console.log('Admin: Polling found chat list changes, updating...')
            setChats(newChats)
          }
        }
      } catch (error) {
        console.error('Admin: Error polling chats:', error)
      }
    }

    // Poll lista de chats a cada 5 segundos
    const pollInterval = setInterval(pollChats, 5000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [statusFilter, searchTerm, chats.length])

  // Load admin chats
  const loadChats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/chat/admin/list?${params}`)
      if (response.ok) {
        const data = await response.json()
        setChats(data.chats || [])
      }
    } catch (error) {
      console.error('Erro ao carregar chats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load chat messages
  const loadMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return

    try {
      const response = await fetch(`/api/chat/${selectedChat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          type: 'TEXT'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    }
  }

  // Assign chat to admin
  const assignChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminId: session?.user?.id
        })
      })

      if (response.ok) {
        loadChats()
        if (selectedChat?.id === chatId) {
          const data = await response.json()
          setSelectedChat(data.chat)
        }
      }
    } catch (error) {
      console.error('Erro ao atribuir chat:', error)
    }
  }

  // Update chat status
  const updateChatStatus = async (chatId: string, status: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        // Atualizar estado local imediatamente
        setChats(prev => prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, status, updatedAt: new Date().toISOString() }
            : chat
        ))
        
        if (selectedChat?.id === chatId) {
          const data = await response.json()
          setSelectedChat(data.chat)
        }
        
        // Se fechou o chat, adicionar mensagem do sistema
        if (status === 'CLOSED') {
          console.log('Admin closed chat, adding system message')
          const systemMessage = {
            id: `system-closed-${Date.now()}`,
            chatId: chatId,
            senderId: 'system',
            content: 'Atendimento finalizado pelo administrador.',
            type: 'SYSTEM',
            isFromAdmin: true,
            createdAt: new Date().toISOString(),
            sender: {
              id: 'system',
              name: 'Sistema',
              userType: 'SYSTEM'
            }
          }
          setMessages(prev => [...prev, systemMessage])
        }
        
        // Recarregar para garantir sincronização
        loadChats()
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  useEffect(() => {
    if (session?.user) {
      loadChats()
    }
  }, [session, statusFilter, searchTerm])

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id)
    }
  }, [selectedChat])

  useEffect(() => {
    if (!targetChatId) return
    if (selectedChat?.id === targetChatId) return

    const existing = chats.find((chat) => chat.id === targetChatId)
    if (existing) {
      setSelectedChat(existing)
      return
    }

    const fetchAndSelect = async () => {
      try {
        const response = await fetch(`/api/chat/${targetChatId}`)
        if (!response.ok) return
        const data = await response.json()
        if (data.chat) {
          setSelectedChat(data.chat)
        }
      } catch (error) {
        console.error('Erro ao carregar chat da URL:', error)
      }
    }

    fetchAndSelect()
  }, [chats, selectedChat, targetChatId])

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-500'
      case 'MEDIUM': return 'bg-blue-500'
      case 'HIGH': return 'bg-orange-500'
      case 'URGENT': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'Baixa'
      case 'MEDIUM': return 'Média'
      case 'HIGH': return 'Alta'
      case 'URGENT': return 'Urgente'
      default: return priority
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      })
    } catch {
      return 'agora'
    }
  }

  const filteredChats = chats.filter(chat => {
    if (statusFilter !== 'all' && chat.status !== statusFilter) return false
    if (searchTerm && !chat.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  if (!session?.user) {
    return (
      <div className="p-8 text-center">
        <p>Você precisa estar logado para acessar o dashboard.</p>
      </div>
    )
  }

  return (
    <div className={`h-screen flex ${className}`}>
      {/* Sidebar com lista de chats */}
      <div className="w-1/3 border-r bg-gray-50">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-4">Dashboard de Suporte</h2>
          
          {/* Filtros */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="all">Todos os Status</option>
              <option value="OPEN">Aberto</option>
              <option value="IN_PROGRESS">Em Atendimento</option>
              <option value="CLOSED">Fechado</option>
            </select>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="p-4 space-y-2">
            {loading ? (
              <div className="text-center text-gray-500">Carregando...</div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center text-gray-500">Nenhum chat encontrado</div>
            ) : (
              filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{chat.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        por {chat.user?.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(chat.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={getStatusColor(chat.status)}>
                        {getStatusLabel(chat.status)}
                      </Badge>
                      <Badge className={getPriorityColor(chat.priority)}>
                        {getPriorityLabel(chat.priority)}
                      </Badge>
                      {chat._count?.messages > 0 && (
                        <span className="text-xs text-gray-500">
                          {chat._count.messages} msgs
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Área principal do chat */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Header do chat */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedChat.title}</h3>
                  <p className="text-sm text-gray-500">
                    Cliente: {selectedChat.user?.name} • {selectedChat.user?.email}
                  </p>
                  {selectedChat.assignedTo && (
                    <p className="text-sm text-gray-500">
                      Atribuído a: {selectedChat.assignedTo.name}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(selectedChat.status)}>
                    {getStatusLabel(selectedChat.status)}
                  </Badge>
                  <Badge className={getPriorityColor(selectedChat.priority)}>
                    {getPriorityLabel(selectedChat.priority)}
                  </Badge>
                </div>
              </div>

              {/* Ações do admin */}
              <div className="flex gap-2 mt-3">
                {!selectedChat.assignedToId && (
                  <Button
                    size="sm"
                    onClick={() => assignChat(selectedChat.id)}
                  >
                    <User className="h-4 w-4 mr-1" />
                    Atribuir a Mim
                  </Button>
                )}
                
                {selectedChat.status === 'OPEN' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateChatStatus(selectedChat.id, 'IN_PROGRESS')}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Em Andamento
                  </Button>
                )}
                
                {(selectedChat.status === 'OPEN' || selectedChat.status === 'IN_PROGRESS') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateChatStatus(selectedChat.id, 'CLOSED')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Resolver
                  </Button>
                )}
                
                {selectedChat.status !== 'CLOSED' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateChatStatus(selectedChat.id, 'CLOSED')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Fechar
                  </Button>
                )}
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500">
                    Nenhuma mensagem ainda
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === session.user.id 
                          ? 'justify-end' 
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.senderId === session.user.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.senderId !== session.user.id && (
                          <div className="text-xs font-medium mb-1">
                            {message.sender?.name}
                          </div>
                        )}
                        <div className="text-sm">{message.content}</div>
                        <div className={`text-xs mt-1 ${
                          message.senderId === session.user.id
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        }`}>
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Input de mensagem */}
            {selectedChat.status !== 'CLOSED' && (
              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua resposta..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Selecione um chat para ver as mensagens</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
