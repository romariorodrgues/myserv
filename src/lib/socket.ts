import { Server } from 'socket.io'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Singleton para o servidor Socket.io
let io: Server | null = null

export function getSocketServer(): Server | null {
  return io
}

export function initializeSocketServer(httpServer: any) {
  if (!io) {
    const allowedOrigins = new Set<string>()
    const envOrigins = [process.env.NEXTAUTH_URL, process.env.BASE_URL]
    for (const origin of envOrigins) {
      if (origin) allowedOrigins.add(origin.replace(/\/$/, ''))
    }
    allowedOrigins.add('http://localhost:3000')
    allowedOrigins.add('https://localhost:3000')

    io = new Server(httpServer, {
      path: '/api/socketio',
      transports: ['polling'],
      cors: {
        origin: Array.from(allowedOrigins),
        methods: ['GET', 'POST'],
        credentials: true
      }
    })

    io.on('connection', async (socket) => {
      console.log('Client connected:', socket.id)

      // Autenticação do socket
      socket.on('authenticate', async (token) => {
        try {
          console.log('Authenticating socket with token:', token)
          // Verificar token/sessão aqui
          // Por simplicidade, vamos usar user ID direto
          const userId = token?.userId
          if (userId) {
            socket.data.userId = userId
            socket.join(`user:${userId}`)
            console.log(`User ${userId} authenticated and joined user room`)
          }
        } catch (error) {
          console.error('Socket authentication error:', error)
          socket.disconnect()
        }
      })

      // Entrar em um chat específico
      socket.on('join-chat', (chatId: string) => {
        if (socket.data.userId) {
          socket.join(`chat:${chatId}`)
          console.log(`User ${socket.data.userId} joined chat ${chatId}`)
        } else {
          console.log('User not authenticated, cannot join chat')
        }
      })

      // Sair de um chat
      socket.on('leave-chat', (chatId: string) => {
        socket.leave(`chat:${chatId}`)
        console.log(`User ${socket.data.userId} left chat ${chatId}`)
      })

      // Usuário começou a digitar
      socket.on('typing-start', (chatId: string) => {
        if (socket.data.userId) {
          socket.to(`chat:${chatId}`).emit('user-typing', {
            userId: socket.data.userId,
            chatId,
            isTyping: true
          })
        }
      })

      // Usuário parou de digitar
      socket.on('typing-stop', (chatId: string) => {
        if (socket.data.userId) {
          socket.to(`chat:${chatId}`).emit('user-typing', {
            userId: socket.data.userId,
            chatId,
            isTyping: false
          })
        }
      })

      // Marcar mensagem como lida
      socket.on('mark-read', (data: { chatId: string; messageId: string }) => {
        socket.to(`chat:${data.chatId}`).emit('message-read', {
          messageId: data.messageId,
          readBy: socket.data.userId,
          readAt: new Date()
        })
      })

      // Disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })

    console.log('Socket.io server initialized')
  }

  return io
}

// Utilitários para emitir eventos
export const socketService = {
  // Emitir nova mensagem para o chat
  emitMessage: (chatId: string, message: any) => {
    if (io) {
      io.to(`chat:${chatId}`).emit('message-received', message)
    }
  },

  // Emitir confirmação de envio
  emitMessageSent: (userId: string, message: any) => {
    if (io) {
      io.to(`user:${userId}`).emit('message-sent', message)
    }
  },

  // Emitir atribuição de chat
  emitChatAssigned: (adminId: string, assignment: any) => {
    if (io) {
      io.to(`user:${adminId}`).emit('chat-assigned', assignment)
    }
  },

  // Emitir fechamento de chat
  emitChatClosed: (chatId: string, closedBy: string) => {
    if (io) {
      io.to(`chat:${chatId}`).emit('chat-closed', {
        chatId,
        closedBy,
        closedAt: new Date()
      })
    }
  },

  // Emitir novo chat para admins
  emitNewChatToAdmins: (chat: any) => {
    if (io) {
      io.emit('new-chat-available', chat)
    }
  },

  // Emitir atualização de status
  emitStatusUpdate: (chatId: string, status: string) => {
    if (io) {
      io.to(`chat:${chatId}`).emit('chat-status-updated', {
        chatId,
        status,
        updatedAt: new Date()
      })
    }
  }
}

export default socketService
