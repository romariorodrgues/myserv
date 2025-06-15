/**
 * Real-time notifications hook for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Hook for managing real-time notifications with polling and WebSocket support
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface Notification {
  id: string
  type: 'BOOKING_RECEIVED' | 'BOOKING_ACCEPTED' | 'BOOKING_REJECTED' | 'BOOKING_COMPLETED' | 
        'PAYMENT_RECEIVED' | 'PAYMENT_FAILED' | 'REVIEW_RECEIVED' | 'MESSAGE_RECEIVED' | 
        'SYSTEM_ALERT' | 'PROMOTION' | 'REMINDER'
  title: string
  message: string
  isRead: boolean
  data?: any
  createdAt: string
  updatedAt: string
}

interface NotificationFilters {
  unreadOnly?: boolean
  type?: string
  limit?: number
}

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  refresh: () => Promise<void>
  subscribe: () => void
  unsubscribe: () => void
}

export function useNotifications(filters: NotificationFilters = {}): UseNotificationsReturn {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    try {
      const params = new URLSearchParams()
      if (filters.unreadOnly) params.append('unreadOnly', 'true')
      if (filters.type) params.append('type', filters.type)
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/notifications?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unreadCount)
        setError(null)
      } else {
        setError(data.error || 'Erro ao carregar notificações')
      }
    } catch (err) {
      console.error('Fetch notifications error:', err)
      setError('Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, filters.unreadOnly, filters.type, filters.limit])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })

      const data = await response.json()

      if (data.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      } else {
        console.error('Mark as read error:', data.error)
      }
    } catch (error) {
      console.error('Mark as read error:', error)
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      })

      const data = await response.json()

      if (data.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        )
        setUnreadCount(0)
      } else {
        console.error('Mark all as read error:', data.error)
      }
    } catch (error) {
      console.error('Mark all as read error:', error)
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        )
        
        // Update unread count if deleted notification was unread
        const deletedNotification = notifications.find(n => n.id === notificationId)
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      } else {
        console.error('Delete notification error:', data.error)
      }
    } catch (error) {
      console.error('Delete notification error:', error)
    }
  }, [notifications])

  // Refresh notifications
  const refresh = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.unreadOnly) params.append('unreadOnly', 'true')
      if (filters.type) params.append('type', filters.type)
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/notifications?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unreadCount)
        setError(null)
      } else {
        setError(data.error || 'Erro ao carregar notificações')
      }
    } catch (err) {
      console.error('Refresh notifications error:', err)
      setError('Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, filters.unreadOnly, filters.type, filters.limit])

  // Subscribe to real-time updates (polling-based)
  const subscribe = useCallback(() => {
    if (isSubscribed || !session?.user?.id) return

    setIsSubscribed(true)
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(async () => {
      if (!session?.user?.id) return
      
      try {
        const params = new URLSearchParams()
        if (filters.unreadOnly) params.append('unreadOnly', 'true')
        if (filters.type) params.append('type', filters.type)
        if (filters.limit) params.append('limit', filters.limit.toString())

        const response = await fetch(`/api/notifications?${params.toString()}`)
        const data = await response.json()

        if (data.success) {
          setNotifications(data.data.notifications)
          setUnreadCount(data.data.unreadCount)
          setError(null)
        }
      } catch (err) {
        console.error('Poll notifications error:', err)
      }
    }, 30000)
    
    setPollInterval(interval)

    // Also check for notifications when window gains focus
    const handleFocus = async () => {
      if (!session?.user?.id) return
      
      try {
        const params = new URLSearchParams()
        if (filters.unreadOnly) params.append('unreadOnly', 'true')
        if (filters.type) params.append('type', filters.type)
        if (filters.limit) params.append('limit', filters.limit.toString())

        const response = await fetch(`/api/notifications?${params.toString()}`)
        const data = await response.json()

        if (data.success) {
          setNotifications(data.data.notifications)
          setUnreadCount(data.data.unreadCount)
          setError(null)
        }
      } catch (err) {
        console.error('Focus notifications error:', err)
      }
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [isSubscribed, session?.user?.id, filters.unreadOnly, filters.type, filters.limit])

  // Unsubscribe from real-time updates
  const unsubscribe = useCallback(() => {
    if (pollInterval) {
      clearInterval(pollInterval)
      setPollInterval(null)
    }
    setIsSubscribed(false)
  }, [pollInterval])

  // Initial fetch and subscription
  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    // Initial fetch
    const initialFetch = async () => {
      try {
        const params = new URLSearchParams()
        if (filters.unreadOnly) params.append('unreadOnly', 'true')
        if (filters.type) params.append('type', filters.type)
        if (filters.limit) params.append('limit', filters.limit.toString())

        const response = await fetch(`/api/notifications?${params.toString()}`)
        const data = await response.json()

        if (data.success) {
          setNotifications(data.data.notifications)
          setUnreadCount(data.data.unreadCount)
          setError(null)
        } else {
          setError(data.error || 'Erro ao carregar notificações')
        }
      } catch (err) {
        console.error('Initial fetch notifications error:', err)
        setError('Erro ao carregar notificações')
      } finally {
        setLoading(false)
      }
    }

    initialFetch()
    subscribe()

    return () => {
      unsubscribe()
    }
  }, [session?.user?.id, filters.unreadOnly, filters.type, filters.limit])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    subscribe,
    unsubscribe
  }
}

// Hook for notification count only (lighter weight)
export function useNotificationCount(): { count: number; loading: boolean } {
  const { data: session } = useSession()
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    const fetchCount = async () => {
      try {
        const response = await fetch('/api/notifications/count')
        const data = await response.json()

        if (data.success) {
          setCount(data.data.unreadCount)
        }
      } catch (error) {
        console.error('Fetch notification count error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCount()

    // Poll for count updates every 60 seconds
    const interval = setInterval(fetchCount, 60000)

    return () => clearInterval(interval)
  }, [session?.user?.id])

  return { count, loading }
}
