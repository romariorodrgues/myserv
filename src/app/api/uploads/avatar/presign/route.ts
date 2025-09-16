import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'
import { createAvatarPresignedPost } from '@/lib/spaces'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })

    const { mime, filename } = await req.json()
    if (!mime || typeof mime !== 'string' || !mime.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Tipo inválido' }, { status: 400 })
    }

    const bucket = process.env.SPACES_PUBLIC_BUCKET!
    const ext = (filename?.split('.').pop() || mime.split('/')[1] || 'jpg').toLowerCase()
    const hash = crypto.randomBytes(8).toString('hex')
    const key = `public/avatars/${session.user.id}/${Date.now()}-${hash}.${ext}`

    const maxMB = Number(process.env.MAX_UPLOAD_MB || 5)
    const { url, fields } = await createAvatarPresignedPost({ bucket, key, maxMB, contentType: mime })

    const cdnHost = (process.env.SPACES_PUBLIC_CDN_HOST || '').replace(/^https?:\/\//, '')
    return NextResponse.json({ success: true, data: { url, fields, key, cdnHost } })
  } catch (e) {
    console.error('avatar presign error', e)
    return NextResponse.json({ success: false, error: 'Erro ao gerar URL de upload' }, { status: 500 })
  }
}

