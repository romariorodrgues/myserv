export type ServiceUnit = {
  id: string
  label: string
}

export const DEFAULT_SERVICE_UNITS: ServiceUnit[] = [
  { id: 'FIXED', label: 'Preço fixo' },
  { id: 'HOUR', label: 'Por hora' },
  { id: 'SQUARE_METER', label: 'Por m²' },
  { id: 'ROOM', label: 'Por cômodo' },
  { id: 'CUSTOM', label: 'Personalizado' },
]

export function sanitizeUnitId(raw: string): string {
  return raw
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .toUpperCase()
}

export function normalizeServiceUnits(
  units: Array<Partial<ServiceUnit>>,
  { fallbackToDefault = true }: { fallbackToDefault?: boolean } = {},
): ServiceUnit[] {
  const normalized = units
    .map((item) => {
      const label = typeof item.label === 'string' ? item.label.trim() : ''
      const rawId = typeof item.id === 'string' ? item.id.trim() : ''
      if (!label) return null
      const sanitizedId = sanitizeUnitId(rawId || label)
      if (!sanitizedId) return null
      return { id: sanitizedId, label }
    })
    .filter((item): item is ServiceUnit => Boolean(item))

  const seen = new Set<string>()
  const deduped: ServiceUnit[] = []

  for (const unit of normalized) {
    if (seen.has(unit.id)) continue
    seen.add(unit.id)
    deduped.push(unit)
  }

  if (deduped.length > 0) {
    return deduped
  }

  return fallbackToDefault ? DEFAULT_SERVICE_UNITS : []
}

export function parseServiceUnits(value?: string | null): ServiceUnit[] {
  if (!value) return DEFAULT_SERVICE_UNITS
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return DEFAULT_SERVICE_UNITS
    return normalizeServiceUnits(parsed)
  } catch {
    return DEFAULT_SERVICE_UNITS
  }
}

export function isValidUnit(units: ServiceUnit[], value: string): boolean {
  return units.some((unit) => unit.id === value)
}
