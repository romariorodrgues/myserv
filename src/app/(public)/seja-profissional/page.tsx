/**
 * Be a professional page for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Landing page for service providers with benefits and registration CTA
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users, DollarSign, Calendar, TrendingUp, Star, Shield, Clock } from 'lucide-react'
import { prisma } from '@/lib/prisma'

async function getPlanSettings() {
  try {
    const rows = await prisma.systemSettings.findMany({ where: { key: { in: ['PLAN_UNLOCK_PRICE','PLAN_MONTHLY_PRICE'] } } })
    const map = Object.fromEntries(rows.map(r => [r.key, r.value])) as Record<string, string>
    return {
      unlock: map.PLAN_UNLOCK_PRICE || '4.90',
      monthly: map.PLAN_MONTHLY_PRICE || '39.90',
    }
  } catch { return { unlock: '4.90', monthly: '39.90' } }
}

export default async function SejaProfissionalPage() {
  const prices = await getPlanSettings()
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Transforme seu talento em
                <span className="text-green-600"> renda extra</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                É profissional autônomo ou tem empresa de serviços? Cadastre-se gratuitamente e receba solicitações de clientes da sua região.
              </p>
              <p className="text-xl text-gray-600 mb-8">
                Para visualizar os contatos de quem te procurou e negociar diretamente, assine o plano mensal para profissionais.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/cadastrar?userType=SERVICE_PROVIDER">Cadastrar-se</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/como-funciona">Ver como funciona</Link>
                </Button>
              </div>
              {/* Métricas promocionais removidas até termos dados reais */}
            </div>
            <div className="lg:text-right">
              <div className="inline-block bg-white rounded-2xl shadow-xl p-8 text-left lg:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Como funciona para profissionais
                </h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Cadastre seu perfil e serviços gratuitamente</li>
                  <li>Receba solicitações de clientes da sua região</li>
                  <li>Assine o plano mensal para ver contatos e negociar</li>
                  <li>Pagamento do serviço é feito diretamente com o cliente</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que trabalhar conosco?
            </h2>
            <p className="text-xl text-gray-600">
              Receba solicitações qualificadas e negocie diretamente com o cliente
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <benefit.icon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works for Professionals */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Como funciona para profissionais
            </h2>
            <p className="text-xl text-gray-600">
              Em poucos passos você estará recebendo solicitações
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-green-600" />
                </div>
                <div className="w-8 h-8 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Planos transparentes
            </h2>
            <p className="text-xl text-gray-600">Escolha entre desbloqueio por solicitação ou o plano mensal profissional</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <div className="rounded-lg shadow p-6 bg-white border">
              <h3 className="text-xl font-bold mb-1">Grátis • Por solicitação</h3>
              <p className="text-gray-600 mb-4">Desbloqueie cada solicitação por R$ {prices.unlock}</p>
              <ul className="space-y-2 mb-6">
                <li>Receba solicitações</li>
                <li>Desbloqueio unitário</li>
                <li>Sem mensalidade</li>
              </ul>
              <Button className="w-full" variant="outline" asChild>
                <Link href="/cadastrar?userType=SERVICE_PROVIDER&plan=FREE">Começar grátis</Link>
              </Button>
            </div>
            <div className="rounded-lg shadow p-6 border-2 border-green-500 bg-green-50">
              <h3 className="text-xl font-bold mb-1">Mensal • Profissional</h3>
              <p className="text-gray-700 mb-4">R$ {prices.monthly}/mês</p>
              <ul className="space-y-2 mb-6">
                <li>Contatos desbloqueados automaticamente</li>
                <li>Perfil completo e avaliações</li>
                <li>Suporte por e-mail</li>
              </ul>
              <Button className="w-full" asChild>
                <Link href="/cadastrar?userType=SERVICE_PROVIDER&plan=PREMIUM">Assinar plano mensal</Link>
              </Button>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Prestadores pessoa jurídica precisam ativar o plano mensal profissional para acessar os contatos dos clientes.
          </p>
        </div>
      </section>

      {/* Histórias de sucesso: deixar para o futuro quando houver dados reais */}

      {/* CTA Section */}
      <section className="bg-green-600 py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comece hoje mesmo!
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Cadastre-se e comece a receber solicitações.
          </p>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Aprovação com até 24 horas – suporte dedicado.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/cadastrar">Criar conta de profissional</Link>
          </Button>
          <div className="mt-6 text-sm opacity-75">
            Cadastro gratuito • Aprovação em até 24h • Suporte dedicado
          </div>
        </div>
      </section>
    </div>
  )
}

const benefits = [
  {
    icon: DollarSign,
    title: 'Ganhe mais',
    description: 'Receba propostas qualificadas e aumente sua renda mensal trabalhando com o que você gosta'
  },
  {
    icon: Clock,
    title: 'Flexibilidade total',
    description: 'Defina seus horários, preços e região de atendimento. Você tem controle total da sua agenda'
  },
  {
    icon: Shield,
    title: 'Segurança e transparência',
    description: 'Avaliações e denúncias ajudam a manter a qualidade. A negociação de valores é direta entre você e o cliente.'
  },
  {
    icon: Users,
    title: 'Clientes qualificados',
    description: 'Conecte-se com clientes reais que estão procurando exatamente o seu serviço'
  },
  {
    icon: TrendingUp,
    title: 'Cresça seu negócio',
    description: 'Use nossa plataforma para expandir sua base de clientes e construir sua reputação'
  },
  {
    icon: Star,
    title: 'Destaque-se',
    description: 'Sistema de avaliações que recompensa a qualidade e ajuda você a se destacar'
  }
]

const steps = [
  {
    icon: Users,
    title: 'Cadastre-se',
    description: 'Crie seu perfil profissional gratuito com suas informações e serviços'
  },
  {
    icon: Shield,
    title: 'Seja aprovado',
    description: 'Nossa equipe analisa e aprova seu perfil em até 24 horas'
  },
  {
    icon: Calendar,
    title: 'Receba propostas',
    description: 'Clientes enviam solicitações diretamente para você'
  },
  {
    icon: DollarSign,
    title: 'Fature mais',
    description: 'Aceite as propostas e comece a faturar mais'
  }
]

// Planos e depoimentos removidos/ajustados até que haja dados e regras finais
