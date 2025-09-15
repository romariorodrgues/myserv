import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProfessionalDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Redireciona para login se não estiver logado
  if (!session?.user) {
    return redirect('/entrar')
  }

  // Redireciona para home caso não seja SERVICE_PROVIDER
  if (session.user.userType !== 'SERVICE_PROVIDER') {
    return redirect('/')
  }

  return <>{children}</>
}
