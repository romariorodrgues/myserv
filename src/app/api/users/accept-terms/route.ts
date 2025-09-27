import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getCurrentTermsVersion } from '@/lib/legal'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as { version?: string }
    const submittedVersion = body.version?.trim()
    const version = submittedVersion && submittedVersion.length > 0
      ? submittedVersion
      : await getCurrentTermsVersion()

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        termsAcceptedAt: new Date(),
        termsVersion: version,
      },
    })

    return NextResponse.json({ success: true, version })
  } catch (error) {
    console.error('[POST /api/users/accept-terms]', error)
    return NextResponse.json({ error: 'Erro ao registrar aceite dos termos' }, { status: 500 })
  }
}
