'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { CURRENT_TERMS_VERSION } from '@/constants/legal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from 'sonner'

export function TermsConsentPrompt() {
  const { data: session, update } = useSession()
  const [open, setOpen] = useState(false)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return
    const currentVersion = session.user.termsVersion || null
    if (!currentVersion || currentVersion !== CURRENT_TERMS_VERSION) {
      setOpen(true)
    }
  }, [session?.user?.termsVersion, session?.user?.id])

  const handleAccept = async () => {
    try {
      setAccepting(true)
      const response = await fetch('/api/users/accept-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: CURRENT_TERMS_VERSION })
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.success) {
        throw new Error(result?.error || 'Não foi possível registrar o aceite')
      }
      await update?.({
        user: {
          ...session?.user,
          termsVersion: CURRENT_TERMS_VERSION,
          termsAcceptedAt: new Date().toISOString(),
        },
      })
      setOpen(false)
      toast.success('Obrigado por aceitar os termos de uso!')
    } catch (error) {
      console.error('[TermsConsentPrompt] accept error', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar aceite')
    } finally {
      setAccepting(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Precisamos do seu aceite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Atualizamos os Termos de Uso da MyServ. Leia o documento e confirme seu aceite para continuar usando a plataforma.
          </p>
          <div className="flex items-center gap-2">
            <Link href="/termos" className="text-sm text-brand-navy hover:underline" target="_blank" rel="noreferrer">
              Abrir Termos de Uso
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/privacidade" className="text-sm text-brand-navy hover:underline" target="_blank" rel="noreferrer">
              Política de Privacidade
            </Link>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => toast.info('É necessário aceitar os termos para continuar usando a plataforma.')}>Cancelar</Button>
            <Button onClick={handleAccept} disabled={accepting}>
              {accepting ? 'Registrando...' : 'Aceito os termos'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
