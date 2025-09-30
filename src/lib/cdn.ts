export function cdnImageUrl(key?: string | null): string {
  if (!key) return ''
  const trimmed = key.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/')) return trimmed
  const host = (process.env.NEXT_PUBLIC_SPACES_PUBLIC_CDN_HOST || process.env.SPACES_PUBLIC_CDN_HOST || '').replace(/^https?:\/\//, '')
  let normalizedKey = trimmed
  while (normalizedKey.startsWith('/')) {
    normalizedKey = normalizedKey.slice(1)
  }
  if (host) {
    return `https://${host}/${normalizedKey}`
  }
  return `/${normalizedKey}`
}
