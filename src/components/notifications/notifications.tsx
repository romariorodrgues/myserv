/**
 * Real-time notifications component for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  sentVia: string
}

interface NotificationsComponentProps {
  userId?: string
  showHeader?: boolean
  maxItems?: number
}

export function NotificationsComponent({ 
  userId = 'current-user', 
  showHeader = true,
  maxItems = 10 
}: NotificationsComponentProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchNotifications()
    const onFocus = () => fetchNotifications()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [userId])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds,
          markAsRead: true
        }),
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notificationIds.includes(notif.id) 
              ? { ...notif, isRead: true }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
      }
    } catch (error) {
      console.error('Erro ao marcar notificações como lidas:', error)
    }
  }

  const markAllAsRead = () => {
    const unreadIds = notifications
      .filter(notif => !notif.isRead)
      .map(notif => notif.id)
    
    if (unreadIds.length > 0) {
      markAsRead(unreadIds)
    }
  }

  const getNotificationIcon = (type: string) => {
    const icons = {
      WELCOME: '🎉',
      BOOKING_REQUEST: '🔔',
      BOOKING_CONFIRMED: '✅',
      BOOKING_REJECTED: '❌',
      SERVICE_COMPLETED: '🎉',
      PAYMENT_REMINDER: '💳',
      PAYMENT_COMPLETED: '💰'
    }
    return icons[type as keyof typeof icons] || '📢'
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - notifDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Agora mesmo'
    if (diffInMinutes < 60) return `${diffInMinutes}min`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  const displayedNotifications = showAll ? notifications : notifications.slice(0, maxItems)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Carregando notificações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {showHeader && (
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600">
                {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <p>Nenhuma notificação ainda</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedNotifications.map((notification) => (
            <Card 
              key={notification.id}
              className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
              }`}
              onClick={() => !notification.isRead && markAsRead([notification.id])}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-medium text-sm leading-tight">
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      {notification.sentVia.split(',').map((channel, index) => (
                        <span 
                          key={index}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                        >
                          {channel === 'whatsapp' ? '📱 WhatsApp' : 
                           channel === 'email' ? '📧 Email' : 
                           channel}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {!showAll && notifications.length > maxItems && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAll(true)}
            >
              Ver todas as {notifications.length} notificações
            </Button>
          )}
          
          {showAll && notifications.length > maxItems && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAll(false)}
            >
              Mostrar menos
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Hook for notification count (for header/badge)
export function useNotificationCount(userId: string) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(`/api/notifications?userId=${userId}&unreadOnly=true`)
        const data = await response.json()
        
        if (data.success) {
          setCount(data.unreadCount)
        }
      } catch (error) {
        console.error('Erro ao carregar contador de notificações:', error)
      }
    }

    fetchCount()
    
    // Poll for updates
    const interval = setInterval(fetchCount, 60000) // Every minute
    
    return () => clearInterval(interval)
  }, [userId])

  return count
}
