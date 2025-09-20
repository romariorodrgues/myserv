import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const endpoint = process.env.SPACES_PUBLIC_ENDPOINT!
const region = process.env.SPACES_PUBLIC_REGION!
const accessKeyId = process.env.SPACES_PUBLIC_KEY!
const secretAccessKey = process.env.SPACES_PUBLIC_SECRET!

export const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle: false,
  credentials: { accessKeyId, secretAccessKey },
})

export async function createAvatarPresignedPost(params: { bucket: string; key: string; maxMB?: number; contentType?: string }) {
  const maxMB = params.maxMB ?? Number(process.env.MAX_UPLOAD_MB || 5)
  const conditions: any[] = [
    ['content-length-range', 1, maxMB * 1024 * 1024],
    ['starts-with', '$Content-Type', 'image/'],
    { 'Cache-Control': 'public, max-age=31536000, immutable' },
    ['starts-with', '$key', 'public/avatars/'],
    ['eq', '$acl', 'public-read'],
  ]

  const { url, fields } = await createPresignedPost(s3, {
    Bucket: params.bucket,
    Key: params.key,
    Conditions: conditions,
    Fields: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': params.contentType || 'image/jpeg',
      acl: 'public-read',
    },
    Expires: 60,
  })
  return { url, fields }
}

export async function putObjectPublic(bucket: string, key: string, body: Buffer | Uint8Array | string, contentType?: string) {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, CacheControl: 'public, max-age=31536000, immutable', ACL: 'public-read' as any }))
}

export async function getObjectPresignedUrl(bucket: string, key: string, expiresIn = 60) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  return getSignedUrl(s3, command, { expiresIn })
}
