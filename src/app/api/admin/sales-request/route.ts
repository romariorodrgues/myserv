import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const provider = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, userType: true } })
    if (!provider || provider.userType !== 'SERVICE_PROVIDER') {
      return NextResponse.json({ error: 'Apenas prestadores podem solicitar contato empresarial' }, { status: 400 })
    }

    const admins = await prisma.user.findMany({ where: { userType: 'ADMIN', isActive: true }, select: { id: true } })
    if (admins.length === 0) return NextResponse.json({ error: 'Nenhum admin encontrado' }, { status: 500 })

    await prisma.notification.createMany({
      data: admins.map(a => ({
        userId: a.id,
        type: 'SYSTEM_ALERT',
        title: 'Solicitação de plano empresarial',
        message: `O prestador ${provider.name} (${provider.email}) solicitou contato para Plano Empresarial.`,
        data: { providerId: provider.id, kind: 'PROFESSIONAL_PLAN_REQUEST' } as any,
      }))
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[SALES_REQUEST]', e)
    return NextResponse.json({ error: 'Erro ao registrar solicitação' }, { status: 500 })
  }
}
