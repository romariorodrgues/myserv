/**
 * Registration page for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * User registration form with client/service provider selection
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Mail, Lock, User, Phone, FileText, IdCard } from 'lucide-react'
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
  // extra (prestador)
  personType?: 'PF' | 'PJ'
  gender?: string
  maritalStatus?: string
  dateOfBirth?: string
  hasDriverLicense?: boolean
  driverLicenseNumber?: string
  driverLicenseCategory?: string
  driverLicenseExpiresAt?: string
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
    acceptTerms: false,
    personType: 'PF',
    gender: '',
    maritalStatus: '',
    dateOfBirth: '',
    hasDriverLicense: false,
    driverLicenseNumber: '',
    driverLicenseCategory: '',
    driverLicenseExpiresAt: '',
  })

  const router = useRouter()

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PREMIUM' | 'ENTERPRISE' | null>(null)
  const [planPrices, setPlanPrices] = useState({ unlock: '4.90', monthly: '39.90', enterprise: '' })
  const planFeatures: Record<'FREE' | 'PREMIUM' | 'ENTERPRISE', string[]> = {
    FREE: [
      'Propostas ilimitadas',
      'Relatórios completos',
      'Agenda personalizada',
      'Controle de precificação de serviço',
    ],
    PREMIUM: [
      'Tudo do plano grátis',
      'Contatos desbloqueados automaticamente',
      'Destaque na busca',
      'Relatórios básicos',
    ],
    ENTERPRISE: [
      'Equipe multiusuário',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/system-settings')
        if (!res.ok) return
        const data = await res.json()
        const s = data.settings || {}
        setPlanPrices({
          unlock: s.PLAN_UNLOCK_PRICE || '4.90',
          monthly: s.PLAN_MONTHLY_PRICE || '39.90',
          enterprise: s.PLAN_ENTERPRISE_PRICE || '',
        })
      } catch (error) {
        console.warn('Falha ao carregar valores dos planos', error)
      }
    })()
  }, [])

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
    // Se for prestador, aplicamos o wizard de planos
    if (formData.userType === 'SERVICE_PROVIDER') {
      if (step === 1) {
        // Regras CPF/CNPJ conforme tipo de pessoa
        if (formData.personType === 'PF' && formData.cpfCnpj.replace(/\D/g,'').length < 11) {
          alert('CPF obrigatório para pessoa física')
          setIsLoading(false)
          return
        }
        if (formData.personType === 'PJ' && formData.cpfCnpj.replace(/\D/g,'').length < 14) {
          alert('CNPJ obrigatório para pessoa jurídica')
          setIsLoading(false)
          return
        }
        setStep(2)
        setSelectedPlan(formData.personType === 'PJ' ? 'ENTERPRISE' : 'FREE')
        setIsLoading(false)
        return
      }
    }

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...formData, selectedPlan }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro ao registrar:', data)
      alert(data.error || 'Erro ao registrar')
    } else {
      console.log('Registro concluído:', data)
      alert(data.message)
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

  const completeProviderRegistration = async () => {
    if (!selectedPlan) {
      alert('Escolha um plano para continuar')
      return
    }
    if (formData.personType === 'PJ' && selectedPlan !== 'ENTERPRISE') {
      alert('Pessoa jurídica deve escolher o plano Enterprise')
      return
    }
    if (formData.personType === 'PF' && selectedPlan === 'ENTERPRISE') {
      alert('Pessoa física não pode escolher o plano Enterprise')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, selectedPlan }),
      })
      const data = await response.json()

      if (!response.ok) {
        console.error('Erro ao registrar:', data)
        alert(data.error || 'Erro ao registrar')
        return
      }

      if (data.requiresPayment) {
        alert('Redirecionando para o pagamento seguro do Mercado Pago...')
        window.location.href = data.initPoint
        return
      }

      alert(data.message)
      router.push('/entrar')
    } catch (err) {
      console.error('Erro de rede:', err)
      alert('Erro de rede ao registrar')
    } finally {
      setIsLoading(false)
    }
  }

  const isProviderPlanStep = formData.userType === UserTypeValues.SERVICE_PROVIDER && step === 2
  const planOptions = formData.personType === 'PF'
    ? (['FREE', 'PREMIUM'] as const)
    : (['ENTERPRISE'] as const)
  const planGridClass = formData.personType === 'PJ' ? 'md:grid-cols-1' : 'md:grid-cols-2'

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
            {isProviderPlanStep ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">Escolha o plano ideal para começar no MyServ</h3>
                  <p className="text-gray-600">Você só concluirá seu cadastro após confirmar o plano. Pagamentos são processados com segurança pelo Mercado Pago.</p>
                </div>
                <div className={`grid grid-cols-1 ${planGridClass} gap-4`}>
                  {planOptions.map((plan) => {
                    const isActive = selectedPlan === plan
                    const baseClasses = plan === 'ENTERPRISE'
                      ? 'from-brand-cyan to-brand-navy text-white'
                      : plan === 'PREMIUM'
                        ? 'from-emerald-50 to-green-100 text-brand-navy'
                        : 'from-brand-bg to-brand-teal text-brand-navy'

                    return (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => setSelectedPlan(plan)}
                        className={`flex flex-col text-left rounded-2xl p-6 bg-gradient-to-br shadow-md transition-transform ${isActive ? 'ring-2 ring-[#00a9d4] scale-[1.02]' : 'hover:scale-[1.01]'} ${baseClasses}`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-semibold">
                            {plan === 'FREE' ? 'Grátis • Por Solicitação' : plan === 'PREMIUM' ? 'Mensal • Profissional' : 'Empresarial'}
                          </h4>
                          {isActive && <span className="rounded-full bg-white/30 px-3 py-1 text-sm font-semibold">Selecionado</span>}
                        </div>
                        <p className="mt-2 text-sm opacity-80">
                          {plan === 'FREE'
                            ? `Desbloqueie por R$ ${planPrices.unlock} por solicitação`
                            : plan === 'PREMIUM'
                              ? `R$ ${planPrices.monthly}/mês`
                              : planPrices.enterprise
                                ? `R$ ${planPrices.enterprise}/mês`
                                : 'Sob consulta' }
                        </p>
                        <ul className="mt-4 space-y-2 text-sm font-medium">
                          {planFeatures[plan].map((feature) => (
                            <li key={feature}>{feature}</li>
                          ))}
                        </ul>
                      </button>
                    )
                  })}
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isLoading}>
                    Voltar
                  </Button>
                  <Button type="button" onClick={completeProviderRegistration} disabled={isLoading}>
                    {isLoading ? 'Processando...' : selectedPlan === 'FREE' ? 'Concluir cadastro gratuito' : 'Ir para pagamento' }
                  </Button>
                </div>
              </div>
            ) : (
              <>
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
                  {formData.userType === UserTypeValues.SERVICE_PROVIDER && formData.personType === 'PJ' ? 'CNPJ *' : 'CPF *'}
                </label>
                <div className="mt-1 relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="cpfCnpj"
                    name="cpfCnpj"
                    type="text"
                    required
                    className="pl-10"
                    placeholder={formData.userType === UserTypeValues.SERVICE_PROVIDER && formData.personType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                    value={formData.cpfCnpj}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Informações adicionais para Prestador */}
            {formData.userType === UserTypeValues.SERVICE_PROVIDER && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de pessoa</label>
                    <select name="personType" value={formData.personType} onChange={handleInputChange} className="mt-1 w-full border rounded-md px-3 py-2">
                      <option value="PF">Pessoa Física</option>
                      <option value="PJ">Pessoa Jurídica</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gênero</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="mt-1 w-full border rounded-md px-3 py-2">
                      <option value="">Selecione</option>
                      <option value="MALE">Masculino</option>
                      <option value="FEMALE">Feminino</option>
                      <option value="OTHER">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado civil</label>
                    <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} className="mt-1 w-full border rounded-md px-3 py-2">
                      <option value="">Selecione</option>
                      <option value="SINGLE">Solteiro(a)</option>
                      <option value="MARRIED">Casado(a)</option>
                      <option value="DIVORCED">Divorciado(a)</option>
                      <option value="WIDOWED">Viúvo(a)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de nascimento</label>
                    <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="mt-1 w-full border rounded-md px-3 py-2" />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <IdCard className="w-5 h-5 text-blue-600" />
                    <div className="font-medium">CNH</div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <input type="checkbox" id="hasDriverLicense" name="hasDriverLicense" checked={!!formData.hasDriverLicense} onChange={handleInputChange} />
                    <label htmlFor="hasDriverLicense" className="text-sm">Possuo carteira de motorista (CNH)</label>
                  </div>
                  {formData.hasDriverLicense && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Número da CNH</label>
                        <Input name="driverLicenseNumber" value={formData.driverLicenseNumber} onChange={handleInputChange} placeholder="00000000000" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Categoria</label>
                        <select name="driverLicenseCategory" value={formData.driverLicenseCategory} onChange={handleInputChange} className="mt-1 w-full border rounded-md px-3 py-2">
                          <option value="">Selecione</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Vencimento</label>
                        <input type="date" name="driverLicenseExpiresAt" value={formData.driverLicenseExpiresAt} onChange={handleInputChange} className="mt-1 w-full border rounded-md px-3 py-2" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                <Button type="submit" className="w-full" disabled={isLoading || !formData.acceptTerms}>
                  {isLoading ? 'Processando...' : (formData.userType === UserTypeValues.SERVICE_PROVIDER ? 'Próximo' : 'Criar conta')}
                </Button>
              </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
