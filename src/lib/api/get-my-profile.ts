import { ClientProfileData } from '@/types/index'

export async function getMyProfile(): Promise<ClientProfileData> {
  const res = await fetch('/api/users/me', {
    cache: 'no-store',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Erro ao buscar perfil')
  const data = await res.json()
  return data.user
}
