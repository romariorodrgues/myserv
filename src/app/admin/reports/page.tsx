/**
 * Admin Reports page
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AdminReports } from '@/components/admin/admin-reports'

export default function AdminReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/entrar')
      return
    }

    if (session.user.userType !== 'ADMIN') {
      router.push('/dashboard/cliente')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || session.user.userType !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Relatórios e Analytics
          </h1>
          <p className="text-gray-600 mt-2">
            Acompanhe o desempenho da plataforma MyServ
          </p>
        </div>

        {/* Reports Component */}
        <AdminReports />
      </div>
    </div>
  )
}
