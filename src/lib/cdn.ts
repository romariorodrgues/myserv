export function cdnImageUrl(key?: string | null): string {
  if (!key) return ''
  if (/^https?:\/\//i.test(key)) return key
  const host = (process.env.NEXT_PUBLIC_SPACES_PUBLIC_CDN_HOST || process.env.SPACES_PUBLIC_CDN_HOST || '').replace(/^https?:\/\//, '')
  return host ? `https://${host}/${key}` : key
}

