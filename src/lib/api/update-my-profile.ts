import { ClientProfileData } from '@/types/index'

export async function updateMyProfile(profile: Partial<ClientProfileData>) {
  const res = await fetch('/api/users/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })

  if (!res.ok) throw new Error('Erro ao atualizar perfil')
  return res.json()
}
