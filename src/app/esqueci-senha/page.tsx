'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

type RequestState = 'idle' | 'loading' | 'success' | 'error'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState<RequestState>('idle')
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<'email' | 'phone'>('email')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const targetValue = mode === 'email' ? email.trim() : phone.trim()

    if (!targetValue) {
      setMessage(mode === 'email' ? 'Informe o e-mail cadastrado.' : 'Informe o telefone com DDD.')
      setState('error')
      return
    }

    try {
      setState('loading')
      setMessage('')

      const endpoint =
        mode === 'email' ? '/api/auth/password/reset-request' : '/api/auth/password/reset-request-phone'
      const payload = mode === 'email' ? { email: targetValue } : { phone: targetValue }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível iniciar a recuperação.')
      }
      setState('success')
      setMessage(
        data?.message ||
          (mode === 'email'
            ? 'Se existir uma conta com este e-mail, enviaremos as instruções em instantes.'
            : 'Se existir uma conta com este telefone verificado, enviaremos o link pelo WhatsApp.')
      )
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Erro inesperado.'
      setState('error')
      setMessage(description)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Recuperar senha</h1>
          <p className="text-gray-600">
            Use o e-mail cadastrado ou um telefone verificado para receber o link de redefinição.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === 'email' ? 'default' : 'outline'}
            className="w-full"
            onClick={() => {
              setMode('email')
              setMessage('')
              setState('idle')
            }}
          >
            E-mail
          </Button>
          <Button
            type="button"
            variant={mode === 'phone' ? 'default' : 'outline'}
            className="w-full"
            onClick={() => {
              setMode('phone')
              setMessage('')
              setState('idle')
            }}
          >
            Telefone
          </Button>
        </div>

        {mode === 'email' && (
          <div className="mt-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="email">
                  E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu@email.com"
                  required={mode === 'email'}
                />
              </div>

              {message && mode === 'email' && (
                <p
                  className={`text-sm ${
                    state === 'success'
                      ? 'text-green-600'
                      : state === 'error'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {message}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={state === 'loading'}>
                {state === 'loading' ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
            </form>
          </div>
        )}

        {mode === 'phone' && (
          <div className="mt-4">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="phone">
                  Telefone com DDD (WhatsApp verificado)
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="11999999999"
                  required={mode === 'phone'}
                />
              </div>

              {message && mode === 'phone' && (
                <p
                  className={`text-sm ${
                    state === 'success'
                      ? 'text-green-600'
                      : state === 'error'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {message}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={state === 'loading'}>
                {state === 'loading' ? 'Enviando...' : 'Enviar link por WhatsApp'}
              </Button>
            </form>
          </div>
        )}

        <div className="text-center text-sm text-gray-600 space-y-1">
          <p>
            Lembrou a senha?{' '}
            <Link href="/entrar" className="text-blue-600 font-medium hover:underline">
              Voltar ao login
            </Link>
          </p>
          <p>
            Ainda não tem conta?{' '}
            <Link href="/cadastrar" className="text-blue-600 font-medium hover:underline">
              Criar cadastro
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
