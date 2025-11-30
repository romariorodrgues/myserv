'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type ResetState = 'idle' | 'loading' | 'success' | 'error' | 'missing'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [state, setState] = useState<ResetState>(token ? 'idle' : 'missing')
  const [message, setMessage] = useState(
    token ? '' : 'Link inválido. Solicite um novo e-mail de recuperação.'
  )

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!token) {
      setMessage('Link inválido.')
      setState('missing')
      return
    }

    if (password.length < 8) {
      setState('error')
      setMessage('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setState('error')
      setMessage('As senhas não coincidem.')
      return
    }

    try {
      setState('loading')
      setMessage('')
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password, confirmPassword }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.success) {
        const error =
          data?.error ||
          (response.status === 410 ? 'Token expirado. Solicite um novo e-mail.' : 'Não foi possível redefinir a senha.')
        setState(response.status === 410 ? 'missing' : 'error')
        setMessage(error)
        return
      }
      setState('success')
      setMessage('Senha redefinida com sucesso! Você já pode fazer login.')
    } catch (error) {
      console.error('[reset password] error', error)
      setState('error')
      setMessage('Erro inesperado. Tente novamente.')
    }
  }

  const renderActions = () => {
    if (state === 'success') {
      return (
        <Button asChild className="w-full">
          <Link href="/entrar">Ir para o login</Link>
        </Button>
      )
    }

    if (state === 'missing') {
      return (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link href="/esqueci-senha">Solicitar novo link</Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/entrar">Voltar ao login</Link>
          </Button>
        </div>
      )
    }

    return (
      <Button type="submit" className="w-full" disabled={state === 'loading'}>
        {state === 'loading' ? 'Salvando...' : 'Salvar nova senha'}
      </Button>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-sky-100 px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {state === 'success' ? 'Senha atualizada' : 'Definir nova senha'}
          </h1>
          <p className="text-gray-600">
            {state === 'success'
              ? 'Sua senha foi atualizada com sucesso.'
              : 'Crie uma nova senha para continuar usando o MyServ.'}
          </p>
        </div>

        {state !== 'success' && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="password">
                Nova senha
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                minLength={8}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700" htmlFor="confirmPassword">
                Confirmar senha
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="********"
                minLength={8}
                required
              />
            </div>

            {message && (
              <p
                className={`text-sm ${
                  state === 'success' ? 'text-green-600' : state === 'error' || state === 'missing' ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                {message}
              </p>
            )}

            {renderActions()}
          </form>
        )}

        {state === 'success' && (
          <div className="space-y-4">
            <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg p-3">
              {message}
            </p>
            {renderActions()}
          </div>
        )}
      </div>
    </div>
  )
}
