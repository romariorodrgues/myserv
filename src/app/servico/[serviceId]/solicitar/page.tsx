/**
 * Service Request/Booking Page
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Page for clients to request a service from providers
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Calendar, Clock, MapPin, Phone, Mail, User, LogIn } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string
  category: {
    name: string
    icon: string
  }
  providers: {
    id: string
    basePrice: number
    description: string
    isActive: boolean
    serviceProvider: {
      id: string
      hasScheduling: boolean
      hasQuoting: boolean
      user: {
        name: string
        profileImage: string | null
      }
    }
  }[]
}

interface BookingData {
  serviceId: string
  providerId: string
  description: string
  preferredDate: string
  preferredTime: string
  clientName: string
  clientPhone: string
  clientEmail: string
  address: string
  city: string
  state: string
  zipCode: string
}

export default function ServiceRequestPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const serviceId = params.serviceId as string

  const [service, setService] = useState<Service | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [bookingData, setBookingData] = useState<BookingData>({
    serviceId,
    providerId: '',
    description: '',
    preferredDate: '',
    preferredTime: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  })

  const fetchUserProfile = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch(`/api/users/${session.user.id}`)
      if (response.ok) {
        const data = await response.json()
        
        // Preencher dados do formulário com informações do usuário
        setBookingData(prev => ({
          ...prev,
          clientName: data.user.name || '',
          clientEmail: data.user.email || '',
          clientPhone: data.user.phone || '',
          address: data.user.address?.street ? 
            `${data.user.address.street}, ${data.user.address.number || ''}` : '',
          city: data.user.address?.city || '',
          state: data.user.address?.state || '',
          zipCode: data.user.address?.zipCode || ''
        }))
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }, [session?.user?.id])

  const fetchService = useCallback(async () => {
    try {
      const response = await fetch(`/api/services/${serviceId}`)
      if (response.ok) {
        const data = await response.json()
        setService(data.service)
      }
    } catch (error) {
      console.error('Error fetching service:', error)
    } finally {
      setLoading(false)
    }
  }, [serviceId])

  useEffect(() => {
    fetchService()
    if (session?.user?.id) {
      fetchUserProfile()
    }
  }, [fetchService, fetchUserProfile, session?.user?.id])

  const handleInputChange = (field: keyof BookingData, value: string) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProviderSelect = (providerServiceId: string) => {
    // Encontrar o provider e usar o serviceProvider.id
    const selectedProviderData = service?.providers.find(p => p.id === providerServiceId)
    if (selectedProviderData) {
      setSelectedProvider(providerServiceId)
      setBookingData(prev => ({
        ...prev,
        providerId: selectedProviderData.serviceProvider.id
      }))
    }
  }

  const isFormValid = () => {
    const selectedProviderData = service?.providers.find(p => p.id === selectedProvider)
    const hasScheduling = selectedProviderData?.serviceProvider.hasScheduling

    // Campos obrigatórios básicos
    const basicFields = [
      bookingData.description.trim(),
      bookingData.clientName.trim(),
      bookingData.clientPhone.trim(),
      bookingData.clientEmail.trim(),
      bookingData.address.trim(),
      bookingData.city.trim(),
      bookingData.state.trim(),
      bookingData.zipCode.trim(),
      selectedProvider
    ]

    // Se tem agendamento, data e hora são obrigatórios
    if (hasScheduling) {
      basicFields.push(bookingData.preferredDate, bookingData.preferredTime)
    }

    return basicFields.every(field => field && field.length > 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProvider) {
      alert('Por favor, selecione um profissional')
      return
    }

    if (!isFormValid()) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      })

      if (response.ok) {
        const data = await response.json()
        alert('Solicitação enviada com sucesso!')
        router.push(`/dashboard/cliente?booking=${data.booking.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao enviar solicitação')
      }
    } catch (error) {
      console.error('Error submitting booking:', error)
      alert('Erro ao enviar solicitação')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Serviço não encontrado</h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  // Verificar se o usuário está logado e é um cliente
  if (!session || session.user.userType !== 'CLIENT') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Solicitar: {service.name}
              </h1>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <div className="flex items-center text-sm text-gray-500">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                  {service.category.name}
                </span>
              </div>
            </div>
          </div>

          {/* Authentication Required Message */}
          <div className="max-w-md mx-auto">
            <Card className="p-8 text-center">
              <div className="mb-6">
                <LogIn className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Login Necessário
                </h2>
                <p className="text-gray-600">
                  Para solicitar este serviço, você precisa estar logado como cliente.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => router.push('/entrar')}
                  className="w-full"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Fazer Login
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => router.push('/cadastrar')}
                  className="w-full"
                >
                  <User className="mr-2 h-4 w-4" />
                  Criar Conta de Cliente
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Solicitar: {service.name}
            </h1>
            <p className="text-gray-600 mb-4">{service.description}</p>
            <div className="flex items-center text-sm text-gray-500">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                {service.category.name}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Dados da Solicitação</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descreva o que você precisa *
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva detalhadamente o serviço que você precisa..."
                    value={bookingData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                {/* Date and Time - Show only if provider has scheduling */}
                {selectedProvider && service?.providers.find(p => p.id === selectedProvider)?.serviceProvider.hasScheduling && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Data Preferencial *
                      </label>
                      <Input
                        type="date"
                        required
                        value={bookingData.preferredDate}
                        onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Horário Preferencial *
                      </label>
                      <Input
                        type="time"
                        required
                        value={bookingData.preferredTime}
                        onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Quote Request Message - Show only if provider has quoting */}
                {selectedProvider && service?.providers.find(p => p.id === selectedProvider)?.serviceProvider.hasQuoting && !service?.providers.find(p => p.id === selectedProvider)?.serviceProvider.hasScheduling && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Solicitação de Orçamento</h3>
                    <p className="text-sm text-blue-700">
                      Este profissional trabalha com orçamentos personalizados. Após enviar sua solicitação, você receberá um orçamento detalhado.
                    </p>
                  </div>
                )}

                {/* Client Information */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Seus Dados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="inline h-4 w-4 mr-1" />
                        Nome Completo *
                      </label>
                      <Input
                        required
                        value={bookingData.clientName}
                        onChange={(e) => handleInputChange('clientName', e.target.value)}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="inline h-4 w-4 mr-1" />
                        Telefone *
                      </label>
                      <Input
                        required
                        type="tel"
                        value={bookingData.clientPhone}
                        onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="inline h-4 w-4 mr-1" />
                        Email *
                      </label>
                      <Input
                        required
                        type="email"
                        value={bookingData.clientEmail}
                        onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                        placeholder="seu.email@exemplo.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">
                    <MapPin className="inline h-5 w-5 mr-2" />
                    Endereço do Serviço
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Endereço Completo *
                      </label>
                      <Input
                        required
                        value={bookingData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Rua, número, complemento"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cidade *
                        </label>
                        <Input
                          required
                          value={bookingData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="São Paulo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estado *
                        </label>
                        <Input
                          required
                          value={bookingData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="SP"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CEP *
                        </label>
                        <Input
                          required
                          value={bookingData.zipCode}
                          onChange={(e) => handleInputChange('zipCode', e.target.value)}
                          placeholder="00000-000"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-6 border-t">
                  {!isFormValid() && selectedProvider && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Atenção:</strong> Preencha todos os campos obrigatórios para continuar.
                        {!selectedProvider && " Selecione um profissional."}
                        {selectedProvider && service?.providers.find(p => p.id === selectedProvider)?.serviceProvider.hasScheduling && 
                         (!bookingData.preferredDate || !bookingData.preferredTime) && " Selecione data e horário."}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={submitting || !isFormValid()}
                      className="px-8 py-2"
                    >
                      {submitting 
                        ? 'Enviando...' 
                        : selectedProvider && service?.providers.find(p => p.id === selectedProvider)?.serviceProvider.hasScheduling
                          ? 'Agendar Serviço'
                          : 'Solicitar Orçamento'
                      }
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>

          {/* Providers List */}
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Escolha um Profissional</h2>
              
              {service.providers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum profissional disponível para este serviço
                </p>
              ) : (
                <div className="space-y-4">
                  {service.providers.map((provider) => (
                    <div
                      key={provider.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedProvider === provider.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleProviderSelect(provider.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {provider.serviceProvider.user.name}
                          </h3>
                          <div className="flex items-center mt-1">
                            <div className="flex text-yellow-400">
                              {'★'.repeat(4)}
                              {'☆'.repeat(1)}
                            </div>
                            <span className="ml-2 text-sm text-gray-500">
                              (4.8 - Avaliação padrão)
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            {provider.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-sm font-medium text-green-600">
                              A partir de R$ {provider.basePrice.toFixed(2)}
                            </p>
                            {provider.serviceProvider.hasScheduling && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                Agendamento
                              </span>
                            )}
                            {provider.serviceProvider.hasQuoting && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Orçamento
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          {provider.serviceProvider.user.profileImage ? (
                            <Image
                              src={provider.serviceProvider.user.profileImage}
                              alt={provider.serviceProvider.user.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
