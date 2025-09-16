'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function ProviderRegistrationThankYou() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')

  const headline = status === 'failure'
    ? 'Não foi possível confirmar o pagamento'
    : status === 'pending'
      ? 'Pagamento em análise'
      : 'Pagamento confirmado!'

  const description = status === 'failure'
    ? 'Ocorreu um erro durante o processo de pagamento. Você pode tentar novamente pelo link enviado ao seu e-mail ou selecionar outro plano.'
    : status === 'pending'
      ? 'Recebemos a solicitação e o Mercado Pago ainda está processando o pagamento. Assim que for aprovado você receberá um e-mail com a confirmação do cadastro.'
      : 'Cadastro recebido! Seu plano será ativado após a confirmação do Mercado Pago. Você receberá um e-mail com os próximos passos.'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-10 space-y-6 text-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{headline}</h1>
          <p className="mt-4 text-gray-600">{description}</p>
        </div>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/entrar">Ir para o login</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/cadastrar">Voltar ao cadastro</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
