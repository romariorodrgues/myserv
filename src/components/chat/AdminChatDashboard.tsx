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
  const [admins, setAdmins] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [selectedAdminId, setSelectedAdminId] = useState<string>('')
  const [tabFilter, setTabFilter] = useState<'all' | 'awaiting' | 'inprogress' | 'mine'>('all')
  const [showClosed, setShowClosed] = useState(false)
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

  // Carregar lista de admins (para transferências futuras)
  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const res = await fetch('/api/admin/users')
        const data = await res.json().catch(() => ({}))
        if (res.ok && data?.data) {
          const onlyAdmins = data.data.filter((u: any) => u.userType === 'ADMIN' && u.isActive !== false)
          setAdmins(onlyAdmins.map((u: any) => ({ id: u.id, name: u.name || 'Admin', email: u.email })))
        }
      } catch (err) {
        console.error('Erro ao carregar admins', err)
      }
    }
    loadAdmins()
  }, [])

  // Polling para lista de chats (admin)
  useEffect(() => {
    const pollChats = async () => {
      try {
        const params = new URLSearchParams()
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
  }, [searchTerm, chats.length])

  // Load admin chats
  const loadChats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/chat/admin/list?${params}`)
      if (response.ok) {
        const data = await response.json()
        const mapped = (data.chats || []).map((chat: any) => {
          const activeAssign = chat.assignments?.[0]
          return {
            ...chat,
            assignedToId: activeAssign?.adminId || null,
            assignedTo: activeAssign?.admin || null,
          }
        })
        setChats(mapped)
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

  const refreshSelectedChat = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chat/${chatId}`)
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.chat) {
        const activeAssign = data.chat.assignments?.[0]
        const mapped = {
          ...data.chat,
          assignedToId: activeAssign?.adminId || null,
          assignedTo: activeAssign?.admin || null,
        }
        setSelectedChat(mapped)
        setChats((prev) =>
          prev.map((c) => (c.id === chatId ? mapped : c))
        )
      }
    } catch (err) {
      console.error('Erro ao atualizar chat selecionado', err)
    }
  }

  // Assign/transfer chat
  const assignChat = async (chatId: string, adminId?: string | null) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminId: adminId || session?.user?.id
        })
      })

      if (response.ok) {
        await loadChats()
        await refreshSelectedChat(chatId)
      }
    } catch (error) {
      console.error('Erro ao atribuir chat:', error)
    }
  }

  const unassignChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}/assign`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await loadChats()
        await refreshSelectedChat(chatId)
      }
    } catch (error) {
      console.error('Erro ao remover atribuição:', error)
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
  }, [session, searchTerm])

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
      case 'WAITING_USER': return 'bg-purple-500'
      case 'CLOSED': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Aberto'
      case 'IN_PROGRESS': return 'Em Atendimento'
      case 'WAITING_USER': return 'Aguardando usuário'
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
      case 'LOW': return 'Prioridade: baixa'
      case 'MEDIUM': return 'Prioridade: média'
      case 'HIGH': return 'Prioridade: alta'
      case 'URGENT': return 'Prioridade: urgente'
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
    if (!showClosed && chat.status === 'CLOSED') return false
    if (searchTerm && !chat.title.toLowerCase().includes(searchTerm.toLowerCase())) return false

    if (tabFilter === 'awaiting') {
      if (!(chat.status === 'OPEN' && !chat.assignedToId)) return false
    } else if (tabFilter === 'inprogress') {
      if (!(['IN_PROGRESS', 'WAITING_USER'].includes(chat.status))) return false
    } else if (tabFilter === 'mine') {
      if (!(chat.assignedToId && chat.assignedToId === session?.user?.id && chat.status !== 'CLOSED')) return false
    }
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
    <div className={`min-h-screen flex flex-col lg:flex-row ${className}`}>
      {/* Sidebar com lista de chats */}
      <div className="w-full lg:w-1/3 border-r bg-gray-50">
        <div className="p-3 sm:p-4 border-b">
          <h2 className="text-lg font-semibold mb-3 sm:mb-4">Dashboard de Suporte</h2>
          
          {/* Abas de agrupamento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
            {[
              { key: 'all', label: 'Todos', icon: MessageCircle },
              { key: 'awaiting', label: 'Aguardando', icon: Clock },
              { key: 'inprogress', label: 'Em atendimento', icon: Send },
              { key: 'mine', label: 'Meus', icon: User },
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={tabFilter === tab.key ? 'default' : 'outline'}
                size="sm"
                className="flex items-center justify-center gap-1 px-2 py-2 text-[11px] md:text-xs leading-tight whitespace-normal text-center min-h-[36px]"
                onClick={() => setTabFilter(tab.key as typeof tabFilter)}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </Button>
            ))}
          </div>

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

            <div className="flex items-center justify-between text-xs text-gray-600 bg-white border rounded-md px-3 py-2">
              <span className="mr-2">Incluir fechados</span>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <span className="text-[11px] text-gray-500">{showClosed ? 'Sim' : 'Não'}</span>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={showClosed}
                  onChange={(e) => setShowClosed(e.target.checked)}
                />
              </label>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[50vh] lg:h-[calc(100vh-200px)]">
          <div className="p-3 sm:p-4 space-y-2">
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm leading-tight line-clamp-2">{chat.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        por {chat.user?.name}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        {formatTime(chat.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge className={`${getStatusColor(chat.status)} text-[11px]`}>
                        {getStatusLabel(chat.status)}
                      </Badge>
                      <Badge className={`${getPriorityColor(chat.priority)} text-[11px]`}>
                        {getPriorityLabel(chat.priority)}
                      </Badge>
                      {chat._count?.messages > 0 && (
                        <span className="text-[11px] text-gray-500">
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
      <div className="flex-1 flex flex-col min-h-[50vh]">
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
                  <p className="text-sm text-gray-500">
                    {selectedChat.assignedTo
                      ? `Atribuído a: ${selectedChat.assignedTo.name}`
                      : 'Não atribuído'}
                  </p>
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
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => assignChat(selectedChat.id, session?.user?.id)}
                  disabled={selectedChat.assignedToId === session?.user?.id}
                >
                  <User className="h-4 w-4 mr-1" />
                  Atribuir a mim
                </Button>

                <div className="flex items-center gap-2">
                  <select
                    className="p-2 border rounded-md text-sm"
                    value={selectedAdminId}
                    onChange={(e) => setSelectedAdminId(e.target.value)}
                  >
                    <option value="">Transferir para...</option>
                    {admins.map((adm) => (
                      <option key={adm.id} value={adm.id}>
                        {adm.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!selectedAdminId}
                    onClick={() => {
                      if (selectedAdminId) assignChat(selectedChat.id, selectedAdminId)
                    }}
                  >
                    <User className="h-4 w-4 mr-1" />
                    Transferir
                  </Button>
                  {selectedChat.assignedToId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => unassignChat(selectedChat.id)}
                    >
                      Remover atribuição
                    </Button>
                  )}
                </div>

                {selectedChat.status === 'WAITING_USER' && (
                  <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                    Aguardando resposta do usuário
                  </Badge>
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
                
                {(selectedChat.status === 'OPEN' || selectedChat.status === 'IN_PROGRESS' || selectedChat.status === 'WAITING_USER') && (
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
