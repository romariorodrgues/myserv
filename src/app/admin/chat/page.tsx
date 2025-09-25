import { Suspense } from 'react'
import { AdminChatDashboard } from '@/components/chat/AdminChatDashboard'

export default function AdminChatPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="p-6">Carregando chat de suporte...</div>}>
        <AdminChatDashboard />
      </Suspense>
    </div>
  )
}
