import { prisma } from '@/lib/prisma'
import { parseServiceUnits, type ServiceUnit } from '@/lib/service-units'

export async function getServiceUnitsFromSettings(): Promise<ServiceUnit[]> {
  const setting = await prisma.systemSettings.findUnique({ where: { key: 'SERVICE_UNITS' } })
  return parseServiceUnits(setting?.value)
}

export async function getServiceUnitIds(): Promise<string[]> {
  const units = await getServiceUnitsFromSettings()
  return units.map((unit) => unit.id)
}
