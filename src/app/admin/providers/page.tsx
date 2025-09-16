/**
 * Admin Service Providers Approval Page
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Página específica para aprovação de profissionais
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  UserCheck, 
  Clock, 
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
  MapPin,
  Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cdnImageUrl } from '@/lib/cdn'
import { Card } from '@/components/ui/card'

interface ServiceProvider {
  id: string
  name: string
  email: string
  phone: string
  isApproved: boolean
  isActive: boolean
  profileImage?: string | null
  createdAt: string
  description?: string
  cpfCnpj?: string
  dateOfBirth?: string
  gender?: string
  maritalStatus?: string
  address?: {
    city: string
    state: string
    street: string
    district: string
  }
  serviceProvider?: {
    hasScheduling: boolean
    hasQuoting: boolean
    chargesTravel: boolean
    travelCost?: number
    services: Array<{
      id: string
      basePrice?: number
      description?: string
      service: {
        name: string
        category: {
          name: string
          icon: string
        }
      }
    }>
  }
}

export default function AdminProvidersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null)
  const [toggleTarget, setToggleTarget] = useState<ServiceProvider | null>(null)
  const [toggleReason, setToggleReason] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/entrar')
      return
    }

    if (session.user.userType !== 'ADMIN') {
      router.push('/dashboard/cliente')
      return
    }

    fetchProviders()
  }, [session, status, router])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/providers')
      const data = await response.json()

      if (data.success) {
        setProviders(data.data)
      } else {
        console.error('Erro ao carregar profissionais:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveProvider = async (providerId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${providerId}/approve`, {
        method: 'PATCH'
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchProviders()
        setSelectedProvider(null)
        alert('Profissional aprovado com sucesso!')
      } else {
        alert('Erro ao aprovar profissional: ' + data.error)
      }
    } catch (error) {
      alert('Erro ao aprovar profissional')
      console.error(error)
    }
  }

  const handleRejectProvider = async (providerId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${providerId}/reject`, {
        method: 'PATCH'
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchProviders()
        setSelectedProvider(null)
        alert('Profissional rejeitado.')
      } else {
        alert('Erro ao rejeitar profissional: ' + data.error)
      }
    } catch (error) {
      alert('Erro ao rejeitar profissional')
      console.error(error)
    }
  }

  const pendingProviders = providers.filter(p => !p.isApproved)
  const approvedProviders = providers.filter(p => p.isApproved)

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || session.user.userType !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Aprovação de Profissionais</h1>
              <p className="text-gray-600 mt-2">
                Analise e aprove novos profissionais que desejam oferecer serviços na plataforma.
              </p>
            </div>
            <div className="space-x-4">
              <Button variant="outline" onClick={() => router.push('/admin/users')}>
                Todos os Usuários
              </Button>
              <Button onClick={() => router.push('/admin/dashboard')}>
                Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Aguardando Aprovação</p>
                <p className="text-2xl font-bold">{pendingProviders.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Profissionais Aprovados</p>
                <p className="text-2xl font-bold">{approvedProviders.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Briefcase className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total de Profissionais</p>
                <p className="text-2xl font-bold">{providers.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Providers */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-yellow-600" />
              Pendentes de Aprovação ({pendingProviders.length})
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pendingProviders.map((provider) => (
                <Card key={provider.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {provider.profileImage ? (
                          <img src={cdnImageUrl(provider.profileImage)} alt={provider.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200" />
                        )}
                        <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                      </div>
                      <div className="text-sm text-gray-500 space-y-1 mt-2">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {provider.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {provider.phone}
                        </div>
                        {provider.address && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {provider.address.city}, {provider.address.state}
                          </div>
                        )}
                        {provider.cpfCnpj && (
                          <div className="flex items-center">
                            <span className="w-4 h-4 mr-1">🆔</span>
                            {provider.cpfCnpj}
                          </div>
                        )}
                      </div>
                      
                      {provider.serviceProvider?.services && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600">Serviços oferecidos:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {provider.serviceProvider.services.map((service) => (
                              <span key={service.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {service.service.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Cadastrado em: {new Date(provider.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => setSelectedProvider(provider)}
                        variant="outline"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveProvider(provider.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectProvider(provider.id)}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setToggleTarget(provider); setToggleReason('') }}
                      >
                        {provider.isActive ? 'Desativar' : 'Ativar'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {pendingProviders.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Nenhum profissional aguardando aprovação.</p>
                </div>
              )}
            </div>
          </div>

          {/* Provider Details Modal */}
          {selectedProvider && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card className="max-w-2xl w-full max-h-96 overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">Detalhes do Profissional</h3>
                    <Button variant="outline" onClick={() => setSelectedProvider(null)}>
                      Fechar
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedProvider.profileImage && (
                      <div className="flex justify-center">
                        <img src={cdnImageUrl(selectedProvider.profileImage)} alt={selectedProvider.name} className="w-24 h-24 rounded-full object-cover" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">Informações Pessoais</h4>
                      <div className="mt-2 space-y-2">
                        <p><strong>Nome:</strong> {selectedProvider.name}</p>
                        <p><strong>Email:</strong> {selectedProvider.email}</p>
                        <p><strong>Telefone:</strong> {selectedProvider.phone}</p>
                        {selectedProvider.cpfCnpj && (
                          <p><strong>CPF/CNPJ:</strong> {selectedProvider.cpfCnpj}</p>
                        )}
                        {selectedProvider.dateOfBirth && (
                          <p><strong>Data de nascimento:</strong> {new Date(selectedProvider.dateOfBirth).toLocaleDateString('pt-BR')}</p>
                        )}
                        {selectedProvider.gender && (
                          <p><strong>Gênero:</strong> {selectedProvider.gender}</p>
                        )}
                        {selectedProvider.maritalStatus && (
                          <p><strong>Estado civil:</strong> {selectedProvider.maritalStatus}</p>
                        )}
                        <p><strong>Status:</strong> {selectedProvider.isActive ? 'Ativo' : 'Desativado'} {selectedProvider.isApproved ? '(Aprovado)' : '(Pendente)'}</p>
                        {selectedProvider.description && (
                          <p><strong>Descrição:</strong> {selectedProvider.description}</p>
                        )}
                      </div>
                    </div>
                    
                    {selectedProvider.address && (
                      <div>
                        <h4 className="font-medium text-gray-900">Endereço</h4>
                        <div className="mt-2">
                          <p>{selectedProvider.address.street}</p>
                          <p>{selectedProvider.address.district}</p>
                          <p>{selectedProvider.address.city}, {selectedProvider.address.state}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedProvider.serviceProvider && (
                      <div>
                        <h4 className="font-medium text-gray-900">Configurações de Serviço</h4>
                        <div className="mt-2 space-y-1">
                          <p><strong>Oferece agendamento:</strong> {selectedProvider.serviceProvider.hasScheduling ? 'Sim' : 'Não'}</p>
                          <p><strong>Oferece orçamento:</strong> {selectedProvider.serviceProvider.hasQuoting ? 'Sim' : 'Não'}</p>
                          <p><strong>Cobra taxa de deslocamento:</strong> {selectedProvider.serviceProvider.chargesTravel ? 'Sim' : 'Não'}</p>
                          {selectedProvider.serviceProvider.travelCost && (
                            <p><strong>Taxa de deslocamento:</strong> R$ {selectedProvider.serviceProvider.travelCost.toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {selectedProvider.serviceProvider?.services && (
                      <div>
                        <h4 className="font-medium text-gray-900">Serviços Oferecidos</h4>
                        <div className="mt-2 space-y-2">
                          {selectedProvider.serviceProvider.services.map((service) => (
                            <div key={service.id} className="p-3 bg-gray-50 rounded">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{service.service.name}</p>
                                  <p className="text-sm text-gray-600">{service.service.category.name}</p>
                                  {service.description && (
                                    <p className="text-sm text-gray-700 mt-1">{service.description}</p>
                                  )}
                                </div>
                                {service.basePrice && (
                                  <p className="text-sm font-medium text-green-600">
                                    R$ {service.basePrice.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-4 mt-6">
                    <Button
                      onClick={() => handleApproveProvider(selectedProvider.id)}
                      className="bg-green-600 hover:bg-green-700 flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aprovar Profissional
                    </Button>
                    <Button
                      onClick={() => handleRejectProvider(selectedProvider.id)}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50 flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Toggle Active Modal */}
          {toggleTarget && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <Card className="max-w-md w-full">
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">
                    {toggleTarget.isActive ? 'Desativar usuário' : 'Ativar usuário'}
                  </h3>
                  {toggleTarget.isActive && (
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Motivo da desativação (obrigatório)</label>
                      <textarea className="w-full border rounded p-2" rows={3} value={toggleReason} onChange={(e) => setToggleReason(e.target.value)} />
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setToggleTarget(null)}>Cancelar</Button>
                    <Button onClick={async () => {
                      try {
                        const res = await fetch(`/api/admin/users/${toggleTarget.id}/toggle-active`, {
                          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ active: !toggleTarget.isActive, reason: toggleReason })
                        })
                        const d = await res.json()
                        if (!res.ok || !d.success) throw new Error(d?.error || 'Falha ao atualizar')
                        setToggleTarget(null)
                        setToggleReason('')
                        fetchProviders()
                      } catch (e: any) {
                        alert(e?.message || 'Erro ao atualizar usuário')
                      }
                    }}>
                      Confirmar
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Recently Approved */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Recentemente Aprovados
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {approvedProviders.slice(0, 10).map((provider) => (
                <Card key={provider.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{provider.name}</h3>
                      <p className="text-sm text-gray-500">{provider.email}</p>
                      {provider.serviceProvider?.services && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {provider.serviceProvider.services.slice(0, 2).map((service) => (
                            <span key={service.id} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {service.service.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Aprovado
                    </span>
                  </div>
                </Card>
              ))}
              
              {approvedProviders.length === 0 && (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Nenhum profissional aprovado ainda.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
