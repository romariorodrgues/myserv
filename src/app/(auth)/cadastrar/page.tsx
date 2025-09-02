/**
 * Registration page for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * User registration form with client/service provider selection
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Mail, Lock, User, Phone, FileText } from 'lucide-react'
import { UserTypeValues } from '@/types'
import { useRouter } from 'next/navigation'

type RegisterFormData = {
  name: string
  email: string
  phone: string
  cpfCnpj: string
  userType: keyof typeof UserTypeValues
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    phone: '',
    cpfCnpj: '',
    userType: 'CLIENT',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)

  const passwordInput = document.getElementById('password') as HTMLInputElement
const confirmInput = document.getElementById('confirmPassword') as HTMLInputElement

if (passwordInput.value !== confirmInput.value) {
  confirmInput.setCustomValidity('As senhas não coincidem')
  confirmInput.reportValidity()
  setIsLoading(false)
  return
} else {
  confirmInput.setCustomValidity('') // limpa o erro se estiver tudo certo
}


  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro ao registrar:', data)
      alert(data.error || 'Erro ao registrar')
    } else {
      console.log('Registro concluído:', data)
      alert(data.message)
      // Redirecionar ou limpar formulário
       router.push('/entrar')
    }
  } catch (err) {
    console.error('Erro de rede:', err)
    alert('Erro de rede ao registrar')
  } finally {
    setIsLoading(false)
  }
}


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          {/* <Link href="/" className="inline-flex items-center">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">MS</span>
            </div>
            <span className="ml-3 text-2xl font-bold text-gray-900">MyServ</span>
          </Link> */}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Crie sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ou{' '}
            <Link href="/entrar" className="font-medium text-blue-600 hover:text-blue-500">
              entre na sua conta existente
            </Link>
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de conta
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  formData.userType === UserTypeValues.CLIENT 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="userType"
                    value={UserTypeValues.CLIENT}
                    checked={formData.userType === UserTypeValues.CLIENT}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <User className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="font-medium">Cliente</div>
                    <div className="text-sm text-gray-600">Contratar serviços</div>
                  </div>
                </label>
                
                <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  formData.userType === UserTypeValues.SERVICE_PROVIDER 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="userType"
                    value={UserTypeValues.SERVICE_PROVIDER}
                    checked={formData.userType === UserTypeValues.SERVICE_PROVIDER}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="font-medium">Prestador</div>
                    <div className="text-sm text-gray-600">Oferecer serviços</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome completo *
                </label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="pl-10"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="pl-10"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  WhatsApp *
                </label>
                <div className="mt-1 relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="pl-10"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cpfCnpj" className="block text-sm font-medium text-gray-700">
                  CPF/CNPJ *
                </label>
                <div className="mt-1 relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="cpfCnpj"
                    name="cpfCnpj"
                    type="text"
                    required
                    className="pl-10"
                    placeholder="000.000.000-00"
                    value={formData.cpfCnpj}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha *
                </label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="pl-10 pr-10"
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar senha *
                </label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="pl-10 pr-10"
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onInvalid={(e) =>
                      e.currentTarget.setCustomValidity(
                        formData.confirmPassword !== formData.password
                          ? 'As senhas não coincidem'
                          : ''
                      )
                    }
                    onInput={(e) => e.currentTarget.setCustomValidity('')}
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                Aceito os{' '}
                <Link href="/termos" className="text-blue-600 hover:text-blue-500">
                  Termos de Uso
                </Link>{' '}
                e a{' '}
                <Link href="/privacidade" className="text-blue-600 hover:text-blue-500">
                  Política de Privacidade
                </Link>
              </label>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !formData.acceptTerms}
              >
                {isLoading ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
