import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const providerReviewSchema = z.object({
  serviceRequestId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.userType !== 'SERVICE_PROVIDER') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = providerReviewSchema.parse(await request.json())

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: body.serviceRequestId },
      select: {
        id: true,
        providerId: true,
        clientId: true,
        status: true,
        providerReviewGivenAt: true,
      },
    })

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
    }

    if (serviceRequest.providerId !== session.user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    if (serviceRequest.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Só é possível avaliar após a conclusão do serviço' }, { status: 400 })
    }

    if (serviceRequest.providerReviewGivenAt) {
      return NextResponse.json({ error: 'Você já avaliou este cliente' }, { status: 400 })
    }

    await prisma.serviceRequest.update({
      where: { id: body.serviceRequestId },
      data: {
        providerReviewRating: body.rating,
        providerReviewComment: body.comment ?? null,
        providerReviewGivenAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[POST /reviews/provider]', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao enviar avaliação' }, { status: 500 })
  }
}
