/**
 * Real-time notifications component for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Component for displaying and managing real-time notifications
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Bell, 
  BellDot, 
  Check, 
  CheckCheck, 
  Trash2, 
  X,
  Calendar,
  DollarSign,
  Star,
  MessageCircle,
  AlertTriangle,
  Gift,
  Clock,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNotifications, Notification } from '@/hooks/use-notifications'
import { useSession } from 'next-auth/react'

interface NotificationDropdownProps {
  className?: string
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  onClick?: (notification: Notification) => void
}

interface NotificationCenterProps {
  className?: string
}

// Get icon for notification type
function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'BOOKING_RECEIVED':
    case 'BOOKING_ACCEPTED':
    case 'BOOKING_REJECTED':
    case 'BOOKING_COMPLETED':
      return Calendar
    case 'PAYMENT_RECEIVED':
    case 'PAYMENT_FAILED':
      return DollarSign
    case 'REVIEW_RECEIVED':
      return Star
    case 'MESSAGE_RECEIVED':
      return MessageCircle
    case 'SYSTEM_ALERT':
      return AlertTriangle
    case 'PROMOTION':
      return Gift
    case 'REMINDER':
      return Clock
    default:
      return Bell
  }
}

// Get color for notification type
function getNotificationColor(type: Notification['type']) {
  switch (type) {
    case 'BOOKING_RECEIVED':
      return 'text-blue-500 bg-blue-50'
    case 'BOOKING_ACCEPTED':
      return 'text-green-500 bg-green-50'
    case 'BOOKING_REJECTED':
      return 'text-red-500 bg-red-50'
    case 'BOOKING_COMPLETED':
      return 'text-purple-500 bg-purple-50'
    case 'PAYMENT_RECEIVED':
      return 'text-green-500 bg-green-50'
    case 'PAYMENT_FAILED':
      return 'text-red-500 bg-red-50'
    case 'REVIEW_RECEIVED':
      return 'text-yellow-500 bg-yellow-50'
    case 'MESSAGE_RECEIVED':
      return 'text-blue-500 bg-blue-50'
    case 'SYSTEM_ALERT':
      return 'text-orange-500 bg-orange-50'
    case 'PROMOTION':
      return 'text-pink-500 bg-pink-50'
    case 'REMINDER':
      return 'text-gray-500 bg-gray-50'
    default:
      return 'text-gray-500 bg-gray-50'
  }
}

// Individual notification item
function NotificationItem({ notification, onMarkAsRead, onDelete, onClick }: NotificationItemProps) {
  const IconComponent = getNotificationIcon(notification.type)
  const colorClasses = getNotificationColor(notification.type)
  
  const timeAgo = new Date(notification.createdAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    onClick?.(notification)
  }

  return (
    <div
      className={`group relative p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-blue-50/30' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${colorClasses}`}>
          <IconComponent className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium text-gray-900 ${!notification.isRead ? 'font-semibold' : ''}`}>
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {timeAgo}
              </p>
            </div>
            
            {!notification.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-1" />
            )}
          </div>
        </div>
        
        {/* Action buttons (shown on hover) */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead(notification.id)
              }}
              className="h-8 w-8 p-0"
              title="Marcar como lida"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(notification.id)
            }}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Notification dropdown for header
export function NotificationDropdown({ className = '' }: NotificationDropdownProps) {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh 
  } = useNotifications({ limit: 10 })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!session) return null

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 p-0"
      >
        {unreadCount > 0 ? (
          <BellDot className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 shadow-lg z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificações</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refresh}
                  disabled={loading}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Marcar todas
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <CardDescription>
                {unreadCount} notificação{unreadCount > 1 ? 'ões' : ''} não lida{unreadCount > 1 ? 's' : ''}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="p-0 max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <p>{error}</p>
                <Button variant="ghost" size="sm" onClick={refresh} className="mt-2">
                  Tentar novamente
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onClick={() => {
                      // Handle notification click (navigate, show modal, etc.)
                      console.log('Notification clicked:', notification)
                    }}
                  />
                ))}
                
                <div className="p-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsOpen(false)
                      // Navigate to notifications page
                      window.location.href = '/notifications'
                    }}
                    className="w-full"
                  >
                    Ver todas as notificações
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Full notification center component
export function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh 
  } = useNotifications()

  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Central de Notificações</span>
              </CardTitle>
              <CardDescription>
                Acompanhe todas as suas notificações em tempo real
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="h-8"
                >
                  Todas ({notifications.length})
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                  className="h-8"
                >
                  Não lidas ({unreadCount})
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Marcar todas como lidas
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
              <Button variant="ghost" onClick={refresh} className="mt-4">
                Tentar novamente
              </Button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">
                {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
              </p>
              <p className="text-sm mt-2">
                {filter === 'unread' 
                  ? 'Você está em dia com suas notificações!'
                  : 'Quando você receber notificações, elas aparecerão aqui.'
                }
              </p>
            </div>
          ) : (
            <div>
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={(notification) => {
                    // Handle notification click
                    console.log('Notification clicked:', notification)
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
