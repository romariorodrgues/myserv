/**
 * Client Profile Settings Component - Configurações de perfil do cliente
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { ProfileVisibility } from '@/types/index'
import { getMyProfile } from '@/lib/api/get-my-profile'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { User, MapPin, Bell, Shield, Eye, EyeOff, Save, Navigation, Search, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ProfileImageUploadCompact } from '@/components/upload/profile-image-upload'
import { toast } from 'sonner'
import { updateMyProfile } from '@/lib/api/update-my-profile'
import type { ClientProfileData } from '@/types'
import { signOut, useSession } from 'next-auth/react'


// No props expected for this component
export function ClientProfileSettings() {
     const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'privacy' | 'security'>('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [profileData, setProfileData] = useState<ClientProfileData | null>(null)



  // Mock data - replace with actual data fetching
  // const [profileData, setProfileData] = useState<ClientProfileData>({
  //   id: 'client-1',
  //   name: 'João Cliente',
  //   email: 'joao.cliente@email.com',
  //   phone: '(11) 99999-1234',
  //   document: '123.456.789-00',
  //   bio: 'Cliente satisfeito com os serviços da plataforma MyServ.',
  //   profileImage: null,
  //   address: {
  //     street: 'Rua das Flores',
  //     number: '123',
  //     complement: 'Apto 45',
  //     district: 'Vila Madalena',
  //     city: 'São Paulo',
  //     state: 'SP',
  //     zipCode: '01234-567'
  //   },
  //   preferences: {
  //     emailNotifications: true,
  //     smsNotifications: false,
  //     whatsappNotifications: true,
  //     marketingEmails: false,
  //     serviceReminders: true,
  //     reviewRequests: true
  //   },
  //   privacy: {
  //     profileVisibility: ProfileVisibility.PUBLIC,
  //     showPhone: true,
  //     showEmail: false,
  //     showLocation: true
  //   }
  // })

const [passwordData, setPasswordData] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
  const [stateOptions, setStateOptions] = useState<Array<{ id: number; sigla: string; nome: string }>>([])
  const [statesLoading, setStatesLoading] = useState(false)
  const [cities, setCities] = useState<string[]>([])
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [deactivateReason, setDeactivateReason] = useState('')
  const [deactivating, setDeactivating] = useState(false)

  const updateAddress = useCallback((changes: Partial<NonNullable<ClientProfileData['address']>>) => {
    setProfileData((prev) => {
      if (!prev) return prev
      const currentAddress = {
        street: '',
        number: '',
        district: '',
        city: '',
        state: '',
        zipCode: '',
        complement: '',
        ...prev.address,
      }
      return {
        ...prev,
        address: {
          ...currentAddress,
          ...changes,
        },
      }
    })
  }, [])

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      if (!profileData) throw new Error('Perfil não carregado')
      await updateMyProfile(profileData)
      // Mock API call - replace with actual implementation
      // await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Erro ao salvar perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    try {
      setSaving(true)
      if (!profileData) throw new Error('Perfil não carregado')
       await updateMyProfile(profileData)
      // Mock API call
      // await new Promise(resolve => setTimeout(resolve, 800))
      
      toast.success('Preferências atualizadas com sucesso!')
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Erro ao salvar preferências. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }
  
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    try {
      setSaving(true)
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Senha alterada com sucesso!')
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Erro ao alterar senha. Verifique sua senha atual.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivateAccount = async () => {
    if (!deactivateReason.trim()) {
      toast.error('Informe um motivo para encerrar a conta.')
      return
    }

    try {
      setDeactivating(true)
      const response = await fetch('/api/users/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deactivateReason.trim() }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.success) {
        throw new Error(result?.error || 'Erro ao desativar conta')
      }

      toast.success('Conta desativada. Sentiremos sua falta!')
      setShowDeactivateModal(false)
      setDeactivateReason('')
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Error deactivating account:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao desativar conta')
    } finally {
      setDeactivating(false)
    }
  }

  const handleImageUpload = (imagePath: string | null) => {
    setProfileData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        profileImage: imagePath
      }
    })

    if (update && session?.user) {
      update({
        user: {
          ...session.user,
          profileImage: imagePath,
        },
      }).catch((error) => {
        console.error('Erro ao atualizar sessão após trocar foto de perfil:', error)
      })
    }

    toast.success('Foto de perfil atualizada!')
  }

  const updateProviderSettings = (
    changes: Partial<NonNullable<ClientProfileData['serviceProviderSettings']>>
  ) => {
    setProfileData(prev => {
      if (!prev) return prev
      const current = prev.serviceProviderSettings ?? {
        chargesTravel: false,
        travelCost: undefined,
        travelRatePerKm: undefined,
        travelMinimumFee: undefined,
        serviceRadiusKm: undefined,
        waivesTravelOnHire: false,
      }

      return {
        ...prev,
        serviceProviderSettings: {
          ...current,
          ...changes,
        },
      }
    })
  }

  const radiusValue = profileData?.serviceProviderSettings?.serviceRadiusKm ?? null

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'preferences', label: 'Notificações', icon: Bell },
    { id: 'privacy', label: 'Privacidade', icon: Eye },
    { id: 'security', label: 'Segurança', icon: Shield }
  ]

  useEffect(() => {
    let active = true
    const fetchStates = async () => {
      setStatesLoading(true)
      try {
        const response = await fetch('/api/locations/states')
        if (!response.ok) throw new Error('Falha ao buscar estados')
        const data = await response.json()
        if (!active) return
        if (data.success && Array.isArray(data.states)) {
          setStateOptions(data.states)
        } else {
          toast.error('Não foi possível carregar os estados.')
        }
      } catch (error) {
        console.error('Erro ao buscar estados:', error)
        if (active) toast.error('Não foi possível carregar os estados.')
      } finally {
        if (active) setStatesLoading(false)
      }
    }

    void fetchStates()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const uf = profileData?.address?.state?.toUpperCase()
    if (!uf) {
      setCities([])
      return
    }

    let active = true
    const fetchCities = async () => {
      setCitiesLoading(true)
      try {
        const response = await fetch(`/api/locations/cities?state=${uf}`)
        if (!response.ok) throw new Error('Falha ao buscar cidades')
        const data = await response.json()
        if (!active) return
        if (data.success && Array.isArray(data.cities)) {
          const names: string[] = data.cities.map((city: { nome: string }) => city.nome)
          setCities(names)
        } else {
          toast.error('Não foi possível carregar as cidades desse estado.')
          setCities([])
        }
      } catch (error) {
        console.error('Erro ao buscar cidades:', error)
        if (active) {
          toast.error('Não foi possível carregar as cidades desse estado.')
          setCities([])
        }
      } finally {
        if (active) setCitiesLoading(false)
      }
    }

    void fetchCities()
    return () => {
      active = false
    }
  }, [profileData?.address?.state])

  const stateOptionsWithCurrent = useMemo(() => {
    const currentState = profileData?.address?.state?.toUpperCase()
    if (!currentState) return stateOptions
    if (stateOptions.some((state) => state.sigla === currentState)) return stateOptions
    return [...stateOptions, { id: -1, sigla: currentState, nome: currentState }]
  }, [stateOptions, profileData?.address?.state])

  const cityOptions = useMemo(() => {
    const currentCity = profileData?.address?.city
    if (!currentCity) return cities
    if (cities.includes(currentCity)) return cities
    return [currentCity, ...cities]
  }, [cities, profileData?.address?.city])

  const handleStateChange = (value: string) => {
    const normalized = value.toUpperCase()
    updateAddress({ state: normalized, city: '' })
  }

  const handleCepLookup = async () => {
    const cep = profileData?.address?.zipCode?.replace(/\D/g, '')
    if (!cep || cep.length !== 8) {
      toast.error('Informe um CEP válido antes de buscar.')
      return
    }

    try {
      setCepLoading(true)
      const response = await fetch(`/api/locations/cep/${cep}`)
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'CEP não encontrado' }))
        throw new Error(payload.error || 'CEP não encontrado')
      }
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'CEP não encontrado')

      updateAddress({
        street: data.street ?? '',
        district: data.district ?? '',
        complement: data.complement ?? '',
        zipCode: data.cep ?? cep,
        state: (data.state ?? '').toUpperCase(),
        city: data.city ?? '',
      })

      setCities((prev) => {
        if (!data.city) return prev
        return prev.includes(data.city) ? prev : [data.city, ...prev]
      })

      toast.success('Endereço preenchido a partir do CEP.')
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      toast.error(error instanceof Error ? error.message : 'Não foi possível buscar o CEP.')
    } finally {
      setCepLoading(false)
    }
  }

useEffect(() => {
  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await getMyProfile()

      setProfileData({
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        profileImage: data.profileImage ?? null,
        userType: data.userType,
        description: data.description ?? '',
        cpfCnpj: data.cpfCnpj ?? '',
        termsAcceptedAt: data.termsAcceptedAt ?? null,
        termsVersion: data.termsVersion ?? null,
        deactivatedAt: data.deactivatedAt ?? null,
        address: {
          street: data.address?.street ?? '',
          number: data.address?.number ?? '',
          district: data.address?.district ?? '',
          city: data.address?.city ?? '',
          state: data.address?.state ?? '',
          zipCode: data.address?.zipCode ?? '',
          complement: data.address?.complement ?? '',
          latitude: data.address?.latitude,
          longitude: data.address?.longitude,
        },
        preferences: {
          emailNotifications: data.preferences?.emailNotifications ?? false,
          smsNotifications: data.preferences?.smsNotifications ?? false,
          whatsappNotifications: data.preferences?.whatsappNotifications ?? false,
          marketingEmails: data.preferences?.marketingEmails ?? false,
          serviceReminders: data.preferences?.serviceReminders ?? false,
          reviewRequests: data.preferences?.reviewRequests ?? false,
        },
        privacy: {
          profileVisibility: data.privacy?.profileVisibility ?? ProfileVisibility.PUBLIC,
          showPhone: data.privacy?.showPhone ?? false,
          showEmail: data.privacy?.showEmail ?? false,
          showLocation: data.privacy?.showLocation ?? false,
        },
        serviceProviderSettings: data.serviceProviderSettings
          ? {
              chargesTravel: data.serviceProviderSettings.chargesTravel,
              travelCost: data.serviceProviderSettings.travelCost,
              travelRatePerKm: data.serviceProviderSettings.travelRatePerKm,
              travelMinimumFee: data.serviceProviderSettings.travelMinimumFee,
              serviceRadiusKm: data.serviceProviderSettings.serviceRadiusKm,
              waivesTravelOnHire: data.serviceProviderSettings.waivesTravelOnHire,
            }
          : undefined,
        plan: data.plan,
      })
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      toast.error('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  fetchProfile()
}, [])

if (loading || !profileData) {
  return <div className="p-4">Carregando perfil...</div>
}

  return (
    <>
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap border-b">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'profile' | 'preferences' | 'privacy' | 'security')}
                  className={`flex flex-col items-center justify-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Informações do Perfil</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image (compact uploader only to evitar duplicação) */}
            <div className="flex items-center gap-6">
              <ProfileImageUploadCompact
                currentImage={profileData?.profileImage}
                userName={profileData?.name ?? ''}
                onImageUpdate={handleImageUpload}
              />
              <div>
                <h3 className="font-medium">Foto do Perfil</h3>
                <p className="text-sm text-gray-500">Adicione uma foto para que os profissionais possam te reconhecer</p>
              </div>
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={profileData?.name || ''}
                  onChange={(e) => setProfileData(prev => prev ? { ...prev, name: e.target.value } : prev)}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData?.email || ''}
                  onChange={(e) => setProfileData(prev => prev ? { ...prev, email: e.target.value } : prev)}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={profileData?.phone || ''}
                  onChange={(e) => setProfileData(prev => prev ? { ...prev, phone: e.target.value } : prev)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">CPF</Label>
                <Input
                  id="document"
                  value={profileData?.cpfCnpj || ''}
                  onChange={(e) => setProfileData(prev => prev ? { ...prev, cpfCnpj: e.target.value } : prev)}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Sobre você</Label>
              <Textarea
                id="description"
                value={profileData?.description || ''}
                onChange={(e) => setProfileData(prev => prev ? { ...prev, description: e.target.value } : prev)}
                placeholder="Conte um pouco sobre você..."
                rows={3}
              />
            </div>

            <Separator />

            {/* Address */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Endereço</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={profileData?.address?.street || ''}
                    onChange={(e) => updateAddress({ street: e.target.value })}
                    placeholder="Nome da rua"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={profileData?.address?.number || ''}
                    onChange={(e) => updateAddress({ number: e.target.value })}
                    placeholder="123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={profileData?.address?.complement || ''}
                    onChange={(e) => updateAddress({ complement: e.target.value })}
                    placeholder="Apto, sala..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">Bairro</Label>
                  <Input
                    id="district"
                    value={profileData?.address?.district || ''}
                    onChange={(e) => updateAddress({ district: e.target.value })}
                    placeholder="Nome do bairro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  {citiesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Carregando cidades...
                    </div>
                  ) : cityOptions.length > 0 ? (
                    <select
                      id="city"
                      value={profileData?.address?.city || ''}
                      onChange={(e) => updateAddress({ city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione...</option>
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id="city"
                      value={profileData?.address?.city || ''}
                      onChange={(e) => updateAddress({ city: e.target.value })}
                      placeholder="Digite sua cidade"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <select
                    id="state"
                    value={profileData?.address?.state || ''}
                    onChange={(e) => handleStateChange(e.target.value)}
                    disabled={statesLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  >
                    <option value="">Selecione...</option>
                    {stateOptionsWithCurrent
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map((state) => (
                        <option key={state.sigla} value={state.sigla}>
                          {state.nome} ({state.sigla})
                        </option>
                      ))}
                  </select>
                  {statesLoading && (
                    <p className="text-xs text-gray-500">Carregando lista de estados...</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <div className="flex items-end gap-2">
                    <Input
                      id="zipCode"
                      value={profileData?.address?.zipCode || ''}
                      onChange={(e) => updateAddress({ zipCode: e.target.value })}
                      placeholder="00000-000"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCepLookup}
                      disabled={cepLoading}
                    >
                      {cepLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-1" /> Buscar CEP
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {profileData?.userType === 'SERVICE_PROVIDER' && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
                    <Navigation className="w-5 h-5" />
                    <span>Configurações de deslocamento</span>
                  </h3>

                  <p className="text-sm text-gray-500 mb-4">
                    Defina como você cobra o deslocamento até o cliente. Esses valores são exibidos como estimativa,
                    não são cobrados pela plataforma.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between bg-gray-50 border rounded-lg p-4">
                      <div>
                        <p className="font-medium">Definir raio de atuação</p>
                        <p className="text-sm text-gray-500">
                          Limite a distância máxima para receber solicitações de novos clientes.
                        </p>
                      </div>
                      <Switch
                        checked={radiusValue != null}
                        onCheckedChange={(checked) =>
                          updateProviderSettings({
                            serviceRadiusKm: checked
                              ? Math.min(Math.max(radiusValue ?? 15, 1), 100)
                              : undefined,
                          })
                        }
                      />
                    </div>

                    {radiusValue != null && (
                      <div className="bg-white border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>1 km</span>
                          <span>100 km</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={100}
                          step={1}
                          value={radiusValue}
                          onChange={(event) =>
                            updateProviderSettings({
                              serviceRadiusKm: Number(event.target.value),
                            })
                          }
                          className="w-full"
                        />
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="font-semibold text-brand-navy">{radiusValue} km</span>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            step={1}
                            value={radiusValue}
                            onChange={(event) => {
                              const raw = event.target.value
                              const next = raw ? Math.min(Math.max(Number(raw), 1), 100) : 1
                              updateProviderSettings({ serviceRadiusKm: next })
                            }}
                            className="w-20 h-9"
                          />
                          <span className="text-xs text-gray-400">
                            Ajuste manualmente o valor em quilômetros.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 border rounded-lg p-4">
                    <div>
                      <p className="font-medium">Cobrar taxa de deslocamento</p>
                      <p className="text-sm text-gray-500">
                        Ative para informar um valor por quilômetro percorrido.
                      </p>
                    </div>
                    <Switch
                      checked={profileData.serviceProviderSettings?.chargesTravel ?? false}
                      onCheckedChange={(checked) =>
                        updateProviderSettings({ chargesTravel: checked })
                      }
                    />
                  </div>

                  {(profileData.serviceProviderSettings?.chargesTravel ?? false) && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="travelRatePerKm">Valor por km (R$)</Label>
                        <Input
                          id="travelRatePerKm"
                          type="number"
                          min="0"
                          step="0.1"
                          value={profileData.serviceProviderSettings?.travelRatePerKm ?? ''}
                          onChange={(e) =>
                            updateProviderSettings({
                              travelRatePerKm: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          placeholder="Ex.: 2.50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="travelMinimumFee">Taxa mínima (R$)</Label>
                        <Input
                          id="travelMinimumFee"
                          type="number"
                          min="0"
                          step="0.1"
                          value={profileData.serviceProviderSettings?.travelMinimumFee ?? ''}
                          onChange={(e) =>
                            updateProviderSettings({
                              travelMinimumFee: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          placeholder="Ex.: 20,00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="travelBaseFee">Taxa fixa adicional (opcional)</Label>
                        <Input
                          id="travelBaseFee"
                          type="number"
                          min="0"
                          step="0.1"
                          value={profileData.serviceProviderSettings?.travelCost ?? ''}
                          onChange={(e) =>
                            updateProviderSettings({
                              travelCost: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          placeholder="Ex.: 10,00"
                        />
                      </div>

                      <div className="col-span-full flex items-center justify-between bg-gray-50 border rounded-lg p-3">
                        <span className="text-sm text-gray-600">
                          Descontar a taxa de deslocamento quando o serviço for fechado?
                        </span>
                        <Switch
                          checked={profileData.serviceProviderSettings?.waivesTravelOnHire ?? false}
                          onCheckedChange={(checked) =>
                            updateProviderSettings({ waivesTravelOnHire: checked })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Preferências de Notificação</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Notificações por E-mail</Label>
                  <p className="text-sm text-gray-500">Receba atualizações importantes por e-mail</p>
                </div>
                <Switch
                  checked={profileData?.preferences?.emailNotifications}
                  onCheckedChange={(checked) =>
                    setProfileData(prev =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              emailNotifications: checked,
                              smsNotifications: prev.preferences?.smsNotifications ?? false,
                              whatsappNotifications: prev.preferences?.whatsappNotifications ?? false,
                              marketingEmails: prev.preferences?.marketingEmails ?? false,
                              serviceReminders: prev.preferences?.serviceReminders ?? false,
                              reviewRequests: prev.preferences?.reviewRequests ?? false,
                            }
                          }
                        : prev
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Notificações por SMS</Label>
                  <p className="text-sm text-gray-500">Receba confirmações e lembretes por SMS</p>
                </div>
                <Switch
                  checked={profileData?.preferences?.smsNotifications}
                  onCheckedChange={(checked) =>
                    setProfileData(prev =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              emailNotifications: prev.preferences?.emailNotifications ?? false,
                              smsNotifications: checked,
                              whatsappNotifications: prev.preferences?.whatsappNotifications ?? false,
                              marketingEmails: prev.preferences?.marketingEmails ?? false,
                              serviceReminders: prev.preferences?.serviceReminders ?? false,
                              reviewRequests: prev.preferences?.reviewRequests ?? false,
                            }
                          }
                        : prev
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Notificações por WhatsApp</Label>
                  <p className="text-sm text-gray-500">Receba mensagens via WhatsApp</p>
                </div>
                <Switch
                  checked={profileData?.preferences?.whatsappNotifications}
                  onCheckedChange={(checked) =>
                    setProfileData(prev =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              emailNotifications: prev.preferences?.emailNotifications ?? false,
                              smsNotifications: prev.preferences?.smsNotifications ?? false,
                              whatsappNotifications: checked,
                              marketingEmails: prev.preferences?.marketingEmails ?? false,
                              serviceReminders: prev.preferences?.serviceReminders ?? false,
                              reviewRequests: prev.preferences?.reviewRequests ?? false,
                            }
                          }
                        : prev
                    )
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>E-mails de Marketing</Label>
                  <p className="text-sm text-gray-500">Receba ofertas e novidades da plataforma</p>
                </div>
                  <Switch
                  checked={profileData?.preferences?.marketingEmails}
                  onCheckedChange={(checked) =>
                    setProfileData(prev =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              emailNotifications: prev.preferences?.emailNotifications ?? false,
                              smsNotifications: prev.preferences?.smsNotifications ?? false,
                              whatsappNotifications: prev.preferences?.whatsappNotifications ?? false,
                              marketingEmails: checked,
                              serviceReminders: prev.preferences?.serviceReminders ?? false,
                              reviewRequests: prev.preferences?.reviewRequests ?? false,
                            }
                          }
                        : prev
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Lembretes de Serviços</Label>
                  <p className="text-sm text-gray-500">Receba lembretes sobre seus agendamentos</p>
                </div>
                <Switch
                  checked={profileData?.preferences?.serviceReminders}
                  onCheckedChange={(checked) =>
                    setProfileData(prev =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              emailNotifications: prev.preferences?.emailNotifications ?? false,
                              smsNotifications: prev.preferences?.smsNotifications ?? false,
                              whatsappNotifications: prev.preferences?.whatsappNotifications ?? false,
                              marketingEmails: prev.preferences?.marketingEmails ?? false,
                              serviceReminders: checked,
                              reviewRequests: prev.preferences?.reviewRequests ?? false,
                            }
                          }
                        : prev
                    )
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Solicitações de Avaliação</Label>
                  <p className="text-sm text-gray-500">Receba pedidos para avaliar serviços</p>
                </div>
                <Switch
                  checked={profileData?.preferences?.reviewRequests || false}
                  onCheckedChange={(checked) =>
                    setProfileData(prev =>
                      prev
                        ? {
                            ...prev,
                            preferences: {
                              emailNotifications: prev.preferences?.emailNotifications ?? false,
                              smsNotifications: prev.preferences?.smsNotifications ?? false,
                              whatsappNotifications: prev.preferences?.whatsappNotifications ?? false,
                              marketingEmails: prev.preferences?.marketingEmails ?? false,
                              serviceReminders: prev.preferences?.serviceReminders ?? false,
                              reviewRequests: checked,
                            }
                          }
                        : prev
                    )
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSavePreferences} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Configurações de Privacidade</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Visibilidade do Perfil</Label>
                <p className="text-sm text-gray-600">
                  Seu perfil permanece público para que clientes possam encontrar seus serviços.
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Mostrar Telefone</Label>
                  <p className="text-sm text-gray-500">Permita que profissionais vejam seu telefone</p>
                </div>
                <Switch
                  checked={profileData?.privacy?.showPhone}
                  onCheckedChange={(checked) => setProfileData(prev =>
                    prev
                      ? {
                          ...prev,
                          privacy: {
                            ...prev.privacy,
                            showPhone: checked,
                            profileVisibility: prev.privacy?.profileVisibility ?? ProfileVisibility.PUBLIC,
                            showEmail: prev.privacy?.showEmail ?? false,
                            showLocation: prev.privacy?.showLocation ?? false,
                          }
                        }
                      : prev
                  )}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Mostrar E-mail</Label>
                  <p className="text-sm text-gray-500">Permita que profissionais vejam seu e-mail</p>
                </div>
                  <Switch
                  checked={profileData?.privacy?.showEmail}
                  onCheckedChange={(checked) => setProfileData(prev =>
                    prev
                      ? {
                          ...prev,
                          privacy: {
                            ...prev.privacy,
                            showEmail: checked,
                            profileVisibility: prev.privacy?.profileVisibility ?? ProfileVisibility.PUBLIC,
                            showPhone: prev.privacy?.showPhone ?? false,
                            showLocation: prev.privacy?.showLocation ?? false,
                          }
                        }
                      : prev
                  )}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Mostrar Localização</Label>
                  <p className="text-sm text-gray-500">Permita que profissionais vejam sua localização</p>
                </div>
                <Switch
                  checked={profileData?.privacy?.showLocation}
                  onCheckedChange={(checked) => setProfileData(prev =>
                    prev
                      ? {
                          ...prev,
                          privacy: {
                            ...prev.privacy,
                            showLocation: checked,
                            profileVisibility: prev.privacy?.profileVisibility ?? ProfileVisibility.PUBLIC,
                            showPhone: prev.privacy?.showPhone ?? false,
                            showEmail: prev.privacy?.showEmail ?? false,
                          }
                        }
                      : prev
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSavePreferences} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Segurança da Conta</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Alterar Senha</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Digite sua senha atual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Digite sua nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirme sua nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  >
                    {saving ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-red-600">Zona de Perigo</h3>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Excluir Conta</h4>
                <p className="text-sm text-red-700 mb-4">
                  Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeactivateReason('')
                    setShowDeactivateModal(true)
                  }}
                >
                  Solicitar Exclusão da Conta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>

    {showDeactivateModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-red-600">Deseja realmente desativar sua conta?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Conte para nós o motivo da sua saída. Essa informação nos ajuda a melhorar a plataforma.
            </p>
            <Textarea
              value={deactivateReason}
              onChange={(event) => setDeactivateReason(event.target.value)}
              placeholder="Motivo da desativação"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (deactivating) return
                  setShowDeactivateModal(false)
                  setDeactivateReason('')
                }}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeactivateAccount} disabled={deactivating}>
                {deactivating ? 'Enviando...' : 'Confirmar desativação'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
    </>
  )
}
