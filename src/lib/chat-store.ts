import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    name: string
    email: string
    role: string
  }
}

export interface SupportChat {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  userId: string
  assignedToId?: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  messages: ChatMessage[]
  _count: {
    messages: number
  }
}

export interface TypingUser {
  userId: string
  userName: string
  chatId: string
}

interface ChatState {
  // Chats
  chats: SupportChat[]
  currentChat: SupportChat | null
  isLoading: boolean
  
  // Messages
  messages: Record<string, ChatMessage[]>
  isLoadingMessages: boolean
  
  // Typing indicators
  typingUsers: TypingUser[]
  
  // Actions
  setChats: (chats: SupportChat[]) => void
  addChat: (chat: SupportChat) => void
  updateChat: (chatId: string, updates: Partial<SupportChat>) => void
  removeChat: (chatId: string) => void
  
  setCurrentChat: (chat: SupportChat | null) => void
  
  setMessages: (chatId: string, messages: ChatMessage[]) => void
  addMessage: (message: ChatMessage) => void
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void
  
  setLoading: (loading: boolean) => void
  setLoadingMessages: (loading: boolean) => void
  
  addTypingUser: (typingUser: TypingUser) => void
  removeTypingUser: (userId: string, chatId: string) => void
  clearTypingUsers: (chatId: string) => void
  
  // Utility methods
  getChatById: (chatId: string) => SupportChat | undefined
  getUnreadCount: () => number
  getChatUnreadCount: (chatId: string) => number
  markChatAsRead: (chatId: string) => void
  
  // Reset
  reset: () => void
}

const initialState = {
  chats: [],
  currentChat: null,
  isLoading: false,
  messages: {},
  isLoadingMessages: false,
  typingUsers: []
}

export const useChatStore = create<ChatState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Chat actions
    setChats: (chats) => set({ chats: Array.isArray(chats) ? chats : [] }),
    
    addChat: (chat) => set((state) => ({
      chats: [chat, ...state.chats]
    })),
    
    updateChat: (chatId, updates) => set((state) => ({
      chats: state.chats.map(chat =>
        chat.id === chatId ? { ...chat, ...updates } : chat
      ),
      currentChat: state.currentChat?.id === chatId
        ? { ...state.currentChat, ...updates }
        : state.currentChat
    })),
    
    removeChat: (chatId) => set((state) => ({
      chats: state.chats.filter(chat => chat.id !== chatId),
      currentChat: state.currentChat?.id === chatId ? null : state.currentChat,
      messages: Object.fromEntries(
        Object.entries(state.messages).filter(([id]) => id !== chatId)
      )
    })),
    
    setCurrentChat: (chat) => set({ currentChat: chat }),
    
    // Message actions
    setMessages: (chatId, messages) => set((state) => ({
      messages: { ...state.messages, [chatId]: Array.isArray(messages) ? messages : [] }
    })),
    
    addMessage: (message) => set((state) => {
      const chatMessages = state.messages[message.chatId] || []
      const updatedMessages = [...chatMessages, message]
      
      // Atualizar também o chat com a nova contagem
      const updatedChats = state.chats.map(chat => {
        if (chat.id === message.chatId) {
          return {
            ...chat,
            _count: { messages: updatedMessages.length },
            updatedAt: message.createdAt
          }
        }
        return chat
      })
      
      return {
        messages: { ...state.messages, [message.chatId]: updatedMessages },
        chats: updatedChats
      }
    }),
    
    updateMessage: (messageId, updates) => set((state) => {
      const newMessages = { ...state.messages }
      
      Object.keys(newMessages).forEach(chatId => {
        newMessages[chatId] = newMessages[chatId].map(msg =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        )
      })
      
      return { messages: newMessages }
    }),
    
    // Loading states
    setLoading: (loading) => set({ isLoading: loading }),
    setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
    
    // Typing actions
    addTypingUser: (typingUser) => set((state) => {
      const filtered = state.typingUsers.filter(
        u => !(u.userId === typingUser.userId && u.chatId === typingUser.chatId)
      )
      return { typingUsers: [...filtered, typingUser] }
    }),
    
    removeTypingUser: (userId, chatId) => set((state) => ({
      typingUsers: state.typingUsers.filter(
        u => !(u.userId === userId && u.chatId === chatId)
      )
    })),
    
    clearTypingUsers: (chatId) => set((state) => ({
      typingUsers: state.typingUsers.filter(u => u.chatId !== chatId)
    })),
    
    // Utility methods
    getChatById: (chatId) => {
      const state = get()
      return state.chats.find(chat => chat.id === chatId)
    },
    
    getUnreadCount: () => {
      const state = get()
      return state.chats.reduce((total, chat) => {
        const messages = state.messages[chat.id] || []
        const unreadCount = messages.filter(msg => !msg.isRead).length
        return total + unreadCount
      }, 0)
    },
    
    getChatUnreadCount: (chatId) => {
      const state = get()
      const messages = state.messages[chatId] || []
      return messages.filter(msg => !msg.isRead).length
    },
    
    markChatAsRead: (chatId) => set((state) => {
      const messages = state.messages[chatId] || []
      const updatedMessages = messages.map(msg => ({ ...msg, isRead: true }))
      
      return {
        messages: { ...state.messages, [chatId]: updatedMessages }
      }
    }),
    
    // Reset
    reset: () => set(initialState)
  }))
)

// Seletores para performance
export const selectChats = (state: ChatState) => state.chats
export const selectCurrentChat = (state: ChatState) => state.currentChat
export const selectMessages = (chatId: string) => (state: ChatState) => 
  state.messages[chatId] || []
export const selectTypingUsers = (chatId: string) => (state: ChatState) =>
  state.typingUsers.filter(u => u.chatId === chatId)
export const selectIsLoading = (state: ChatState) => state.isLoading
export const selectIsLoadingMessages = (state: ChatState) => state.isLoadingMessages
