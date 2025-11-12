/**
 * Página de Planos (pública)
 */

import { Check } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { unstable_noStore as noStore } from 'next/cache'

async function getPlanSettings() {
  noStore()
  try {
    const rows = await prisma.systemSettings.findMany({ where: { key: { in: ['PLAN_UNLOCK_PRICE','PLAN_MONTHLY_PRICE'] } } })
    const map = Object.fromEntries(rows.map(r => [r.key, r.value])) as Record<string, string>
    return {
      unlock: map.PLAN_UNLOCK_PRICE || '2.99',
      monthly: map.PLAN_MONTHLY_PRICE || '15.99',
    }
  } catch {
    return { unlock: '2.99', monthly: '15.99' }
  }
}

export default async function PlanosPage() {
  const prices = await getPlanSettings()
  const premiumFeatures = [
    'Contatos desbloqueados automaticamente',
    'Aceite solicitações ilimitadas durante todo o mês',
    'Suporte por chat dedicado',
    'Plano obrigatório para pessoa jurídica',
  ]

  return (
    <div className="py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Planos e taxas</h1>
          <p className="text-gray-600">A MyServ não cobra taxas do cliente. Profissionais podem desbloquear por solicitação ou assinar o plano mensal profissional.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plano Free / por solicitação */}
          <div className="rounded-lg shadow p-6 bg-white border">
            <h2 className="text-xl font-bold mb-2">Grátis • Por Solicitação</h2>
            <div className="text-2xl font-bold text-gray-900 mb-2">R$ 0/mês</div>
            <p className="text-gray-600 mb-4">Plano ideal para pessoa física: pague apenas quando aceitar a oportunidade.</p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-gray-800"><Check className="w-5 h-5 text-green-600" />Cadastro gratuito (pessoa física)</li>
              <li className="flex items-center gap-2 text-gray-800"><Check className="w-5 h-5 text-green-600" />Desbloqueie cada solicitação por R$ {prices.unlock}</li>
              <li className="flex items-center gap-2 text-gray-800"><Check className="w-5 h-5 text-green-600" />Pagamento somente se aceitar o serviço</li>
              <li className="flex items-center gap-2 text-gray-800"><Check className="w-5 h-5 text-green-600" />Sem mensalidade</li>
              <li className="flex items-center gap-2 text-gray-800"><Check className="w-5 h-5 text-green-600" />Suporte por chat</li>
            </ul>
            <Link href="/seja-profissional" className="block text-center border rounded-md py-2 hover:bg-gray-50">Criar conta grátis</Link>
          </div>

          {/* Plano Mensal Profissional */}
          <div className="rounded-lg shadow p-6 border-2 border-green-500 bg-green-50">
            <h2 className="text-xl font-bold mb-2">Mensal • Profissional</h2>
            <div className="text-2xl font-bold text-green-600 mb-2">R$ {prices.monthly}/mês</div>
            <p className="text-gray-700 mb-4">Plano mensal para quem quer trabalhar o mês inteiro sem limites.</p>
            <ul className="space-y-2 mb-6">
              {premiumFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-800">
                  <Check className="w-5 h-5 text-green-600" />{f}
                </li>
              ))}
            </ul>
            <Link href="/dashboard/profissional?tab=settings" className="block text-center bg-green-600 text-white rounded-md py-2 hover:bg-green-700">Assinar agora</Link>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Prestadores pessoa jurídica utilizam exclusivamente o plano mensal profissional.
        </p>
      </div>
    </div>
  )
}
