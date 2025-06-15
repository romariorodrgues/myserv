/**
 * Client Profile Settings Component - Configurações de perfil do cliente
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState } from 'react'
import { User, Phone, Mail, MapPin, Bell, Shield, CreditCard, Eye, EyeOff, Save } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ProfileImageUploadCompact } from '@/components/upload/profile-image-upload'
import { toast } from 'sonner'
import Image from 'next/image'

interface ClientProfileData {
  id: string
  name: string
  email: string
  phone?: string
  document?: string
  bio?: string
  profileImage?: string | null
  address?: {
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
  }
  preferences: {
    emailNotifications: boolean
    smsNotifications: boolean
    whatsappNotifications: boolean
    marketingEmails: boolean
    serviceReminders: boolean
    reviewRequests: boolean
  }
  privacy: {
    profileVisibility: 'PUBLIC' | 'PRIVATE'
    showPhone: boolean
    showEmail: boolean
    showLocation: boolean
  }
}

interface ClientProfileSettingsProps {
  clientId?: string
}

export function ClientProfileSettings({ clientId }: ClientProfileSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'privacy' | 'security'>('profile')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Mock data - replace with actual data fetching
  const [profileData, setProfileData] = useState<ClientProfileData>({
    id: 'client-1',
    name: 'João Cliente',
    email: 'joao.cliente@email.com',
    phone: '(11) 99999-1234',
    document: '123.456.789-00',
    bio: 'Cliente satisfeito com os serviços da plataforma MyServ.',
    profileImage: null,
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      whatsappNotifications: true,
      marketingEmails: false,
      serviceReminders: true,
      reviewRequests: true
    },
    privacy: {
      profileVisibility: 'PUBLIC',
      showPhone: true,
      showEmail: false,
      showLocation: true
    }
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
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
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
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

  const handleImageUpload = (imagePath: string | null) => {
    setProfileData(prev => ({
      ...prev,
      profileImage: imagePath
    }))
    toast.success('Foto de perfil atualizada!')
  }

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'preferences', label: 'Notificações', icon: Bell },
    { id: 'privacy', label: 'Privacidade', icon: Eye },
    { id: 'security', label: 'Segurança', icon: Shield }
  ]

  return (
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
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
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
            {/* Profile Image */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {profileData.profileImage ? (
                    <Image
                      src={profileData.profileImage}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="rounded-full"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-500" />
                  )}
                </div>
                <ProfileImageUploadCompact
                  currentImage={profileData.profileImage}
                  userName={profileData.name}
                  onImageUpdate={handleImageUpload}
                />
              </div>
              <div>
                <h3 className="font-medium">Foto do Perfil</h3>
                <p className="text-sm text-gray-500">
                  Adicione uma foto para que os profissionais possam te reconhecer
                </p>
              </div>
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={profileData.phone || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">CPF</Label>
                <Input
                  id="document"
                  value={profileData.document || ''}
                  onChange={(e) => setProfileData(prev => ({ ...prev, document: e.target.value }))}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Sobre você</Label>
              <Textarea
                id="bio"
                value={profileData.bio || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
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
                    value={profileData.address?.street || ''}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      address: { ...prev.address, street: e.target.value }
                    }))}
                    placeholder="Nome da rua"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={profileData.address?.number || ''}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      address: { ...prev.address, number: e.target.value }
                    }))}
                    placeholder="123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={profileData.address?.complement || ''}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      address: { ...prev.address, complement: e.target.value }
                    }))}
                    placeholder="Apto, sala..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={profileData.address?.neighborhood || ''}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      address: { ...prev.address, neighborhood: e.target.value }
                    }))}
                    placeholder="Nome do bairro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={profileData.address?.city || ''}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      address: { ...prev.address, city: e.target.value }
                    }))}
                    placeholder="Nome da cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <select
                    id="state"
                    value={profileData.address?.state || ''}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      address: { ...prev.address, state: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    <option value="SP">São Paulo</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="MG">Minas Gerais</option>
                    {/* Add more states */}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={profileData.address?.zipCode || ''}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      address: { ...prev.address, zipCode: e.target.value }
                    }))}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

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
                  checked={profileData.preferences.emailNotifications}
                  onCheckedChange={(checked) => setProfileData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, emailNotifications: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Notificações por SMS</Label>
                  <p className="text-sm text-gray-500">Receba confirmações e lembretes por SMS</p>
                </div>
                <Switch
                  checked={profileData.preferences.smsNotifications}
                  onCheckedChange={(checked) => setProfileData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, smsNotifications: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Notificações por WhatsApp</Label>
                  <p className="text-sm text-gray-500">Receba mensagens via WhatsApp</p>
                </div>
                <Switch
                  checked={profileData.preferences.whatsappNotifications}
                  onCheckedChange={(checked) => setProfileData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, whatsappNotifications: checked }
                  }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>E-mails de Marketing</Label>
                  <p className="text-sm text-gray-500">Receba ofertas e novidades da plataforma</p>
                </div>
                <Switch
                  checked={profileData.preferences.marketingEmails}
                  onCheckedChange={(checked) => setProfileData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, marketingEmails: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Lembretes de Serviços</Label>
                  <p className="text-sm text-gray-500">Receba lembretes sobre seus agendamentos</p>
                </div>
                <Switch
                  checked={profileData.preferences.serviceReminders}
                  onCheckedChange={(checked) => setProfileData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, serviceReminders: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Solicitações de Avaliação</Label>
                  <p className="text-sm text-gray-500">Receba pedidos para avaliar serviços</p>
                </div>
                <Switch
                  checked={profileData.preferences.reviewRequests}
                  onCheckedChange={(checked) => setProfileData(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, reviewRequests: checked }
                  }))}
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
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="PUBLIC"
                      checked={profileData.privacy.profileVisibility === 'PUBLIC'}
                      onChange={() => setProfileData(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, profileVisibility: 'PUBLIC' }
                      }))}
                      className="text-blue-600"
                    />
                    <span>Público - Qualquer pessoa pode ver seu perfil</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="PRIVATE"
                      checked={profileData.privacy.profileVisibility === 'PRIVATE'}
                      onChange={() => setProfileData(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, profileVisibility: 'PRIVATE' }
                      }))}
                      className="text-blue-600"
                    />
                    <span>Privado - Apenas profissionais podem ver</span>
                  </label>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Mostrar Telefone</Label>
                  <p className="text-sm text-gray-500">Permita que profissionais vejam seu telefone</p>
                </div>
                <Switch
                  checked={profileData.privacy.showPhone}
                  onCheckedChange={(checked) => setProfileData(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, showPhone: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Mostrar E-mail</Label>
                  <p className="text-sm text-gray-500">Permita que profissionais vejam seu e-mail</p>
                </div>
                <Switch
                  checked={profileData.privacy.showEmail}
                  onCheckedChange={(checked) => setProfileData(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, showEmail: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Mostrar Localização</Label>
                  <p className="text-sm text-gray-500">Permita que profissionais vejam sua localização</p>
                </div>
                <Switch
                  checked={profileData.privacy.showLocation}
                  onCheckedChange={(checked) => setProfileData(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, showLocation: checked }
                  }))}
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
                <Button variant="destructive" size="sm">
                  Solicitar Exclusão da Conta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
