/**
 * Notifications page for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { NotificationsComponent } from '@/components/notifications/notifications'

export default function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notificações</h1>
        <p className="text-gray-600">Acompanhe todas as atualizações importantes</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <NotificationsComponent 
          userId="current-user" 
          showHeader={false}
          maxItems={50}
        />
      </div>
    </div>
  )
}
