/**
 * Admin Users Management Page
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Página para gerenciamento de usuários e aprovação de profissionais
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface User {
  id: string
  name: string
  email: string
  phone: string
  userType: 'CLIENT' | 'SERVICE_PROVIDER' | 'ADMIN'
  isActive: boolean
  isApproved: boolean
  createdAt: string
  address?: {
    city: string
    state: string
  }
  serviceProvider?: {
    hasScheduling: boolean
    hasQuoting: boolean
    services: Array<{
      service: {
        name: string
        category: {
          name: string
        }
      }
    }>
  }
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

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

    fetchUsers()
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      const data = await response.json()

      if (data.success) {
        setUsers(data.data)
      } else {
        console.error('Erro ao carregar usuários:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'PATCH'
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchUsers()
      } else {
        alert('Erro ao aprovar usuário: ' + data.error)
      }
    } catch (error) {
      alert('Erro ao aprovar usuário')
      console.error(error)
    }
  }

  const handleRejectUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'PATCH'
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchUsers()
      } else {
        alert('Erro ao rejeitar usuário: ' + data.error)
      }
    } catch (error) {
      alert('Erro ao rejeitar usuário')
      console.error(error)
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      })
      
      const data = await response.json()
      
      if (data.success) {
        fetchUsers()
      } else {
        alert('Erro ao alterar status: ' + data.error)
      }
    } catch (error) {
      alert('Erro ao alterar status')
      console.error(error)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'ALL' || user.userType === filterType
    
    const matchesStatus = filterStatus === 'ALL' ||
      (filterStatus === 'APPROVED' && user.isApproved) ||
      (filterStatus === 'PENDING' && !user.isApproved && user.userType === 'SERVICE_PROVIDER') ||
      (filterStatus === 'ACTIVE' && user.isActive) ||
      (filterStatus === 'INACTIVE' && !user.isActive)
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (user: User) => {
    if (!user.isActive) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Inativo</span>
    }
    
    if (user.userType === 'SERVICE_PROVIDER' && !user.isApproved) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Pendente</span>
    }
    
    return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Ativo</span>
  }

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case 'CLIENT': return 'Cliente'
      case 'SERVICE_PROVIDER': return 'Profissional'
      case 'ADMIN': return 'Administrador'
      default: return userType
    }
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
              <p className="text-gray-600 mt-2">
                Gerencie usuários, aprove profissionais e monitore atividades da plataforma.
              </p>
            </div>
            <Button onClick={() => router.push('/admin/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total de Usuários</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Profissionais Aprovados</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.userType === 'SERVICE_PROVIDER' && u.isApproved).length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Aguardando Aprovação</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.userType === 'SERVICE_PROVIDER' && !u.isApproved).length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <UserX className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Usuários Inativos</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => !u.isActive).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="CLIENT">Clientes</option>
              <option value="SERVICE_PROVIDER">Profissionais</option>
              <option value="ADMIN">Administradores</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
              <option value="APPROVED">Aprovados</option>
              <option value="PENDING">Pendentes</option>
            </select>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getUserTypeLabel(user.userType)}</span>
                      {user.serviceProvider && (
                        <div className="text-xs text-gray-500">
                          {user.serviceProvider.services.map(s => s.service.category.name).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.address && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {user.address.city}, {user.address.state}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {user.userType === 'SERVICE_PROVIDER' && !user.isApproved && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApproveUser(user.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectUser(user.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className={user.isActive ? 'text-red-600 border-red-600 hover:bg-red-50' : 'text-green-600 border-green-600 hover:bg-green-50'}
                      >
                        {user.isActive ? 'Desativar' : 'Ativar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum usuário encontrado com os filtros selecionados.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
