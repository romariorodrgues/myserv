/**
 * Registration page for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * User registration form with client/service provider selection
 */

'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Mail, Lock, User, Phone, FileText, IdCard } from 'lucide-react'
import { UserTypeValues } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatCPF, formatCNPJ, formatPhone } from '@/utils/index'
import { toast } from 'sonner'

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

function RegisterPageContent() {
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
  const searchParams = useSearchParams()

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PREMIUM' | null>(null)
  const [planPrices, setPlanPrices] = useState({ unlock: '2.99', monthly: '15.99' })
  const [formError, setFormError] = useState<string | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [profileImageDataUrl, setProfileImageDataUrl] = useState<string | null>(null)
  const [profileImageError, setProfileImageError] = useState<string | null>(null)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const planFeatures: Record<'FREE' | 'PREMIUM', string[]> = {
    FREE: [
      'Cadastro gratuito (pessoa física)',
      `Desbloqueie cada solicitação por R$ ${planPrices.unlock}`,
      'Pagamento somente se aceitar o serviço',
      'Sem mensalidade',
      'Suporte por chat',
    ],
    PREMIUM: [
      'Contatos desbloqueados automaticamente',
      'Aceite solicitações ilimitadas durante todo o mês',
      'Suporte por chat',
      'Plano obrigatório para pessoa jurídica',
    ],
  }

  const MIN_PROFILE_IMAGE_SIZE_PX = 400
  const MAX_PROFILE_IMAGE_SIZE_PX = 4000
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  type FieldKey = 'name' | 'email' | 'phone' | 'cpfCnpj' | 'password' | 'confirmPassword' | 'acceptTerms'
  type FieldErrors = Partial<Record<FieldKey, string>>

  const trackedFields: FieldKey[] = ['name', 'email', 'phone', 'cpfCnpj', 'password', 'confirmPassword', 'acceptTerms']
  const isFieldKey = (value: string): value is FieldKey => trackedFields.includes(value as FieldKey)

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({} as Record<FieldKey, boolean>)

  const markFieldTouched = (field: FieldKey) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const validateFormFields = (state: RegisterFormData, options: { includeTerms?: boolean } = {}) => {
    const errors: FieldErrors = {}

    if (!state.name.trim()) {
      errors.name = 'Informe seu nome completo.'
    }

    if (!emailRegex.test(state.email.trim())) {
      errors.email = 'Informe um e-mail válido.'
    }

    const phoneDigits = state.phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      errors.phone = 'Informe um número de WhatsApp válido com DDD.'
    }

    const documentDigits = state.cpfCnpj.replace(/\D/g, '')
    const requiresCnpj = state.userType === UserTypeValues.SERVICE_PROVIDER && state.personType === 'PJ'
    const expectedDocLength = requiresCnpj ? 14 : 11
    if (documentDigits.length !== expectedDocLength) {
      errors.cpfCnpj = requiresCnpj ? 'Informe um CNPJ válido.' : 'Informe um CPF válido.'
    }

    if (state.password.length < 8) {
      errors.password = 'A senha deve ter pelo menos 8 caracteres.'
    }

    if (state.password !== state.confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem.'
    }

    if (options.includeTerms && !state.acceptTerms) {
      errors.acceptTerms = 'É necessário aceitar os termos para continuar.'
    }

    return errors
  }

  const showFieldError = (field: FieldKey) => Boolean(fieldErrors[field] && (submitAttempted || touched[field]))
  const getFirstErrorMessage = (errors: FieldErrors) => Object.values(errors).find(Boolean) || null

  const handleProfileImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setProfileImageError('Use uma imagem JPG, PNG ou WebP')
      setProfileImagePreview(null)
      setProfileImageDataUrl(null)
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setProfileImageError('Imagem muito grande. Até 5MB')
      setProfileImagePreview(null)
      setProfileImageDataUrl(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const image = new window.Image()
      image.onload = () => {
        if (image.width < MIN_PROFILE_IMAGE_SIZE_PX || image.height < MIN_PROFILE_IMAGE_SIZE_PX) {
          setProfileImageError(`Use uma imagem com no mínimo ${MIN_PROFILE_IMAGE_SIZE_PX}x${MIN_PROFILE_IMAGE_SIZE_PX} pixels`)
          setProfileImagePreview(null)
          setProfileImageDataUrl(null)
          return
        }

        if (image.width > MAX_PROFILE_IMAGE_SIZE_PX || image.height > MAX_PROFILE_IMAGE_SIZE_PX) {
          setProfileImageError(`Use uma imagem com no máximo ${MAX_PROFILE_IMAGE_SIZE_PX}x${MAX_PROFILE_IMAGE_SIZE_PX} pixels`)
          setProfileImagePreview(null)
          setProfileImageDataUrl(null)
          return
        }

        setProfileImagePreview(result)
        setProfileImageDataUrl(result)
        setProfileImageError(null)
        setFormError((prev) => (prev === profileImageError ? null : prev))
      }
      image.onerror = () => {
        setProfileImageError('Não foi possível ler a imagem selecionada. Tente outro arquivo.')
        setProfileImagePreview(null)
        setProfileImageDataUrl(null)
      }
      image.src = result
    }
    reader.readAsDataURL(file)
  }

  const triggerProfileImageSelect = () => {
    fileInputRef.current?.click()
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/system-settings')
        if (!res.ok) return
        const data = await res.json()
        const s = data.settings || {}
        setPlanPrices({
          unlock: s.PLAN_UNLOCK_PRICE || '2.99',
          monthly: s.PLAN_MONTHLY_PRICE || '15.99',
        })
      } catch (error) {
        console.warn('Falha ao carregar valores dos planos', error)
      }
    })()
  }, [])

  useEffect(() => {
    const qsUserType = searchParams.get('userType')
    const qsPlan = searchParams.get('plan')?.toUpperCase() as ('FREE' | 'PREMIUM' | undefined)

    if (qsUserType === UserTypeValues.SERVICE_PROVIDER && step === 1) {
      setFormData((prev) => ({
        ...prev,
        userType: UserTypeValues.SERVICE_PROVIDER,
        personType: prev.personType,
      }))
      if (qsPlan) {
        setSelectedPlan(qsPlan)
        setStep(2)
      }
    }
  }, [searchParams, step])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitAttempted(true)
    const touchedAll = trackedFields.reduce((acc, field) => ({ ...acc, [field]: true }), {} as Record<FieldKey, boolean>)
    setTouched((prev) => ({ ...touchedAll, ...prev }))

    const errors = validateFormFields(formData, { includeTerms: true })
    setFieldErrors(errors)
    const firstError = getFirstErrorMessage(errors)

    if (firstError) {
      setFormError(firstError)
      toast.error(firstError)
      return
    }

    if (formData.userType === 'SERVICE_PROVIDER' && step === 1) {
      setStep(2)
      setSelectedPlan(formData.personType === 'PJ' ? 'PREMIUM' : 'FREE')
      return
    }

    if (profileImageError) {
      setFormError(profileImageError)
      toast.error(profileImageError)
      return
    }

    if (!profileImageDataUrl) {
      const message = 'Envie uma foto de perfil para continuar.'
      setProfileImageError(message)
      setFormError(message)
      toast.error(message)
      return
    }

    setIsLoading(true)

    try {
      const payload: Record<string, unknown> = {
        ...formData,
        phone: formData.phone.replace(/\D/g, ''),
        cpfCnpj: formData.cpfCnpj.replace(/\D/g, ''),
        selectedPlan,
        profileImage: profileImageDataUrl,
      }

      if (payload.selectedPlan == null) {
        delete payload.selectedPlan
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        const message = data.error || 'Erro ao registrar'
        setFormError(message)
        toast.error(message)
      } else {
        toast.success(data.message || 'Conta criada com sucesso!')
        router.push('/entrar')
      }
    } catch (err) {
      console.error('Erro de rede:', err)
      setFormError('Erro de rede ao registrar. Tente novamente.')
      toast.error('Erro de rede ao registrar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = type === 'checkbox'

    if (isFieldKey(name)) {
      markFieldTouched(name)
    }

    let updatedState: RegisterFormData | null = null
    setFormData((prev) => {
      let nextValue: any = isCheckbox ? (e.target as HTMLInputElement).checked : value
      const nextState = { ...prev }

      if (name === 'phone' && !isCheckbox) {
        const digits = value.replace(/\D/g, '').slice(0, 11)
        nextValue = formatPhone(digits)
      }

      if (name === 'cpfCnpj' && !isCheckbox) {
        const digits = value.replace(/\D/g, '').slice(0, prev.userType === UserTypeValues.SERVICE_PROVIDER && prev.personType === 'PJ' ? 14 : 11)
        const isPJ = prev.userType === UserTypeValues.SERVICE_PROVIDER && prev.personType === 'PJ'
        nextValue = isPJ ? formatCNPJ(digits) : formatCPF(digits)
      }

      nextState[name as keyof RegisterFormData] = nextValue

      if (name === 'userType') {
        if (nextValue === UserTypeValues.CLIENT) {
          nextState.personType = 'PF'
          setStep(1)
          setSelectedPlan(null)
          nextState.cpfCnpj = formatCPF((nextState.cpfCnpj || '').replace(/\D/g, '').slice(0, 11))
        } else {
          setSelectedPlan((current) => current ?? 'FREE')
        }
      }

      if (name === 'personType') {
        if (nextValue === 'PJ') {
          setSelectedPlan('PREMIUM')
          nextState.cpfCnpj = formatCNPJ((nextState.cpfCnpj || '').replace(/\D/g, '').slice(0, 14))
        } else {
          setSelectedPlan((current) => (current === 'PREMIUM' ? 'FREE' : current ?? 'FREE'))
          nextState.cpfCnpj = formatCPF((nextState.cpfCnpj || '').replace(/\D/g, '').slice(0, 11))
        }
      }

      updatedState = nextState
      return nextState
    })

    if (updatedState) {
      const includeTerms = submitAttempted || updatedState.acceptTerms
      setFieldErrors(validateFormFields(updatedState, { includeTerms }))
    }

    if (formError) {
      setFormError(null)
    }
  }

  const completeProviderRegistration = async () => {
    setSubmitAttempted(true)
    const touchedAll = trackedFields.reduce((acc, field) => ({ ...acc, [field]: true }), {} as Record<FieldKey, boolean>)
    setTouched((prev) => ({ ...touchedAll, ...prev }))

    const errors = validateFormFields(formData, { includeTerms: true })
    setFieldErrors(errors)
    const firstError = getFirstErrorMessage(errors)
    if (firstError) {
      setFormError(firstError)
      toast.error(firstError)
      return
    }

    if (!selectedPlan) {
      const message = 'Escolha um plano para continuar.'
      setFormError(message)
      toast.error(message)
      return
    }

    if (formData.personType === 'PJ' && selectedPlan !== 'PREMIUM') {
      const message = 'Pessoa jurídica deve escolher o plano profissional.'
      setFormError(message)
      toast.error(message)
      return
    }

    if (profileImageError) {
      setFormError(profileImageError)
      toast.error(profileImageError)
      return
    }

    if (!profileImageDataUrl) {
      const message = 'Envie uma foto de perfil para continuar.'
      setProfileImageError(message)
      setFormError(message)
      toast.error(message)
      return
    }

    setIsLoading(true)
    setFormError(null)
    try {
      const payload: any = {
        ...formData,
        phone: formData.phone.replace(/\D/g, ''),
        cpfCnpj: formData.cpfCnpj.replace(/\D/g, ''),
        selectedPlan,
        profileImage: profileImageDataUrl,
      }

      if (payload.selectedPlan == null) {
        delete payload.selectedPlan
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (!response.ok) {
        const message = data.error || 'Erro ao registrar'
        setFormError(message)
        toast.error(message)
        return
      }

      if (data.requiresPayment) {
        if (!data.initPoint) {
          console.error('Resposta de pagamento sem initPoint', data)
          setFormError('Não foi possível gerar o link de pagamento. Tente novamente em instantes.')
          toast.error('Não foi possível gerar o link de pagamento. Tente novamente em instantes.')
          return
        }

        toast.message('Redirecionando para o pagamento seguro do Mercado Pago...')
        try {
          window.location.href = data.initPoint as string
        } catch (locationError) {
          console.error('Falha ao redirecionar para o pagamento', locationError)
          window.open(data.initPoint as string, '_blank', 'noopener,noreferrer')
        }
        return
      }

      toast.success(data.message || 'Cadastro concluído com sucesso!')
      router.push('/entrar')
    } catch (err) {
      console.error('Erro de rede:', err)
      setFormError('Erro de rede ao registrar. Tente novamente.')
      toast.error('Erro de rede ao registrar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const isProviderPlanStep = formData.userType === UserTypeValues.SERVICE_PROVIDER && step === 2
  const planOptions = formData.personType === 'PF'
    ? (['FREE', 'PREMIUM'] as const)
    : (['PREMIUM'] as const)
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
                  <p className="text-gray-600">
                    {formData.personType === 'PJ'
                      ? 'Contas de pessoa jurídica precisam ativar o plano profissional para começar.'
                      : 'Você só concluirá seu cadastro após confirmar o plano. Pagamentos são processados com segurança pelo Mercado Pago.'}
                  </p>
                </div>
                <div className={`grid grid-cols-1 ${planGridClass} gap-4`}>
                  {planOptions.map((plan) => {
                    const isActive = selectedPlan === plan
                    const baseClasses = plan === 'PREMIUM'
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
                            {plan === 'FREE' ? 'Grátis • Por Solicitação' : 'Mensal • Profissional'}
                          </h4>
                          {isActive && <span className="rounded-full bg-white/30 px-3 py-1 text-sm font-semibold">Selecionado</span>}
                        </div>
                        <p className="mt-2 text-sm opacity-80">
                          {plan === 'FREE'
                            ? `Desbloqueie por R$ ${planPrices.unlock} por solicitação`
                            : `R$ ${planPrices.monthly}/mês`}
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

            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Foto de perfil *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileImageSelect}
              />
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-blue-100 bg-gray-100">
                  {profileImagePreview ? (
                    <Image
                      src={profileImagePreview}
                      alt="Pré-visualização da foto de perfil"
                      fill
                      sizes="96px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-200">
                      <User className="w-10 h-10 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-sm text-gray-600 text-center sm:text-left">
                  <p>Envie uma foto nítida do seu rosto. Formatos aceitos: JPG, PNG ou WebP (até 5&nbsp;MB). Utilize imagens quadradas entre {MIN_PROFILE_IMAGE_SIZE_PX}x{MIN_PROFILE_IMAGE_SIZE_PX} px e {MAX_PROFILE_IMAGE_SIZE_PX}x{MAX_PROFILE_IMAGE_SIZE_PX} px — nós ajustaremos automaticamente para 400x400 px.</p>
                  {profileImageError && (
                    <p className="text-xs text-red-600 mt-2">{profileImageError}</p>
                  )}
                </div>
                <Button type="button" variant="outline" onClick={triggerProfileImageSelect}>
                  {profileImagePreview ? 'Trocar foto' : 'Enviar foto'}
                </Button>
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
                    className={`pl-10 ${showFieldError('name') ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : ''}`}
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={() => markFieldTouched('name')}
                  />
                </div>
                {showFieldError('name') && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
                )}
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
                    className={`pl-10 ${showFieldError('email') ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : ''}`}
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={() => markFieldTouched('email')}
                  />
                </div>
                {showFieldError('email') && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                )}
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
                    className={`pl-10 ${showFieldError('phone') ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : ''}`}
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    maxLength={15}
                    onChange={handleInputChange}
                    onBlur={() => markFieldTouched('phone')}
                  />
                </div>
                {showFieldError('phone') && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
                )}
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
                    className={`pl-10 ${showFieldError('cpfCnpj') ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : ''}`}
                    placeholder={formData.userType === UserTypeValues.SERVICE_PROVIDER && formData.personType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                    value={formData.cpfCnpj}
                    maxLength={formData.userType === UserTypeValues.SERVICE_PROVIDER && formData.personType === 'PJ' ? 18 : 14}
                    onChange={handleInputChange}
                    onBlur={() => markFieldTouched('cpfCnpj')}
                  />
                </div>
                {showFieldError('cpfCnpj') && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.cpfCnpj}</p>
                )}
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
                    className={`pl-10 pr-10 ${showFieldError('password') ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : ''}`}
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={() => markFieldTouched('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {showFieldError('password') && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                )}
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
                    className={`pl-10 pr-10 ${showFieldError('confirmPassword') ? 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500' : ''}`}
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onBlur={() => markFieldTouched('confirmPassword')}
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {showFieldError('confirmPassword') && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                )}
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
                onBlur={() => markFieldTouched('acceptTerms')}
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
            {showFieldError('acceptTerms') && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.acceptTerms}</p>
            )}

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}

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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <RegisterPageContent />
    </Suspense>
  )
}
