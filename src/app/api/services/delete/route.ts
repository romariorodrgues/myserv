import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const deleteSchema = z.object({
  // id do vínculo ServiceProviderService
  id: z.string().uuid()
})

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.userType !== 'SERVICE_PROVIDER') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', issues: parsed.error.issues },
      { status: 400 }
    )
  }

  try {
    const { id } = parsed.data

    // Apaga SOMENTE o vínculo do prestador com o serviço
    const del = await prisma.serviceProviderService.deleteMany({
      where: {
        id,
        serviceProvider: { userId: session.user.id } // garante que é do prestador logado
      }
    })

    if (del.count === 0) {
      return NextResponse.json(
        { error: 'Serviço não encontrado ou não pertence ao prestador' },
        { status: 404 }
      )
    }

    // ❌ NÃO apague o Service canônico aqui.
    // Se quiser fazer uma limpeza de órfãos no futuro, faça num job offline
    // e com regras claras (ex.: só apagar Services marcados como "custom" e sem vínculos).

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE_SERVICE]', err)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
