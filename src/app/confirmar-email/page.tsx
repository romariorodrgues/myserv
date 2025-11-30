'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type VerificationState = 'idle' | 'loading' | 'success' | 'error' | 'expired' | 'missing'

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [state, setState] = useState<VerificationState>('idle')
  const [message, setMessage] = useState<string>('Validando seu e-mail...')

  useEffect(() => {
    if (!token) {
      setState('missing')
      setMessage('Link inválido. Solicite um novo e-mail de confirmação.')
      return
    }

    let isMounted = true
    setState('loading')
    setMessage('Validando seu e-mail...')

    const verify = async () => {
      try {
        const response = await fetch('/api/auth/email/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await response.json().catch(() => ({}))
        if (!isMounted) return

        if (response.ok && data?.success) {
          setState('success')
          setMessage('E-mail confirmado com sucesso! Você já pode acessar sua conta.')
          return
        }

        if (response.status === 410) {
          setState('expired')
          setMessage(data?.error || 'Link expirado. Faça seu cadastro novamente.')
          return
        }

        setState('error')
        setMessage(data?.error || 'Não foi possível confirmar o e-mail. Tente novamente.')
      } catch (err) {
        console.error('[confirm email] error', err)
        if (!isMounted) return
        setState('error')
        setMessage('Não foi possível confirmar o e-mail. Tente novamente.')
      }
    }

    void verify()

    return () => {
      isMounted = false
    }
  }, [token])

  const renderActions = () => {
    if (state === 'success') {
      return (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link href="/entrar">Ir para o login</Link>
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => router.push('/dashboard/profissional?tab=settings')}>
            Abrir dashboard
          </Button>
        </div>
      )
    }

    if (state === 'missing' || state === 'expired') {
      return (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <Link href="/cadastrar">Fazer cadastro</Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/entrar">Já tenho conta</Link>
          </Button>
        </div>
      )
    }

    if (state === 'error') {
      return (
        <Button onClick={() => router.refresh()}>
          Tentar novamente
        </Button>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-10 space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            {state === 'success'
              ? 'Tudo certo!'
              : state === 'expired'
                ? 'Link expirado'
                : state === 'error'
                  ? 'Algo deu errado'
                  : state === 'missing'
                    ? 'Link inválido'
                    : 'Confirmando e-mail'}
          </h1>
          <p className="text-gray-600">{message}</p>
        </div>

        {(state === 'idle' || state === 'loading') && (
          <div className="flex items-center justify-center">
            <div className="h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {renderActions()}
      </div>
    </div>
  )
}
