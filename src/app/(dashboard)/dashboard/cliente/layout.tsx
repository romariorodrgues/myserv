// src/app/(dashboard)/dashboard/cliente/layout.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ClienteDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Redireciona se não estiver logado
  if (!session?.user) {
    return redirect('/entrar')
  }

  // Redireciona se o usuário não for CLIENTE
  if (session.user.userType !== 'CLIENT') {
    return redirect('/')
  }

  return <>{children}</>
}
