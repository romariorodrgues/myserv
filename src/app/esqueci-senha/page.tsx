'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

type RequestState = 'idle' | 'loading' | 'success' | 'error'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<RequestState>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim()) {
      setMessage('Informe o e-mail cadastrado.')
      setState('error')
      return
    }

    try {
      setState('loading')
      setMessage('')
      const response = await fetch('/api/auth/password/reset-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Não foi possível enviar o e-mail.')
      }
      setState('success')
      setMessage(
        data?.message ||
          'Se existir uma conta com este e-mail, enviaremos as instruções em instantes.'
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
            Informe o e-mail cadastrado. Enviaremos um link para você criar uma nova senha.
          </p>
        </div>

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
              required
            />
          </div>

          {message && (
            <p
              className={`text-sm ${
                state === 'success' ? 'text-green-600' : state === 'error' ? 'text-red-600' : 'text-gray-600'
              }`}
            >
              {message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={state === 'loading'}>
            {state === 'loading' ? 'Enviando...' : 'Enviar link de recuperação'}
          </Button>
        </form>

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
