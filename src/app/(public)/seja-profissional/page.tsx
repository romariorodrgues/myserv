/**
 * Be a professional page for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Landing page for service providers with benefits and registration CTA
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Users, DollarSign, Calendar, TrendingUp, Star, Shield, Clock } from 'lucide-react'

export default function SejaProfissionalPage() {
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
                Voce é um prestador de serviço, tem uma empresa de prestação de serviço ou até mesmo faz serviço de free lancer?
              </p>
              <p className="text-xl text-gray-600 mb-8">
                Se você é uma pessoa física cadastre-se gratuitamente na Myserv e comece a receber solicitações de serviço na região em que atende. Pague somente quando fechar negocio.
              </p>
              <p className="text-xl text-gray-600 mb-8">
                Se você é uma pessoa jurídica cadastre-se com plano mensal e aceite serviços ILIMITADOS o mês inteiro.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/cadastrar">Cadastrar-se</Link>
                </Button>
                <Button size="lg" variant="outline">
                  Ver como funciona
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-600" />
                  <span>+5.000 profissionais ativos</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>Média R$ 2.500/mês</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-green-600" />
                  <span>4.8/5 satisfação</span>
                </div>
              </div>
            </div>
            <div className="lg:text-right">
              <div className="inline-block bg-white rounded-2xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Seus ganhos em números
                </h3>
                <div className="space-y-4">
                  {earnings.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600">{item.service}</span>
                      <span className="font-bold text-green-600">{item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Potencial mensal:</span>
                    <span className="text-green-600">R$ 3.200+</span>
                  </div>
                </div>
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
              Oferecemos as melhores condições para profissionais independentes
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
            <p className="text-xl text-gray-600">
              Escolha o modelo que melhor se adapta ao seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <div key={index} className={`rounded-lg shadow-lg p-8 ${plan.popular ? 'border-2 border-green-500 bg-green-50' : 'bg-white'}`}>
                {plan.popular && (
                  <div className="text-center mb-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Mais popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-green-600 mb-2">{plan.price}</div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Histórias de sucesso
            </h2>
            <p className="text-xl text-gray-600">
              Conheça profissionais que transformaram suas vidas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-green-600 font-bold">{testimonial.name[0]}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.service}</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="w-4 h-4 mr-1" />
                  <span>{testimonial.earnings} por mês</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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

const earnings = [
  { service: 'Limpeza residencial', price: 'R$ 80-120' },
  { service: 'Manutenção elétrica', price: 'R$ 150-300' },
  { service: 'Personal trainer', price: 'R$ 60-100' },
  { service: 'Aulas particulares', price: 'R$ 40-80' },
]

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
    title: 'Segurança garantida',
    description: 'Plataforma segura com sistema de avaliações e pagamentos protegidos'
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

const plans = [
  {
    name: 'Por Solicitação',
    price: 'R$ 4,90',
    description: 'Por solicitação aceita',
    popular: false,
    features: [
      'Perfil profissional completo',
      'Recebimento de propostas',
      'Sistema de avaliações',
      'Suporte por email',
      'Pagamento apenas quando aceitar'
    ],
    cta: 'Começar grátis'
  },
  {
    name: 'Plano Mensal',
    price: 'R$ 39,90',
    description: 'Por mês',
    popular: true,
    features: [
      'Tudo do plano anterior',
      'Propostas ilimitadas',
      'Sem taxa por solicitação',
      'Destaque na busca',
      'Suporte prioritário',
      'Analytics detalhado'
    ],
    cta: 'Assinar agora'
  }
]

const testimonials = [
  {
    name: 'Maria Silva',
    service: 'Limpeza residencial',
    quote: 'Triplicou minha renda! Agora tenho uma agenda cheia de clientes fixos.',
    earnings: 'R$ 3.200'
  },
  {
    name: 'João Santos',
    service: 'Eletricista',
    quote: 'Plataforma excelente, clientes sérios e pagamento garantido.',
    earnings: 'R$ 4.500'
  },
  {
    name: 'Ana Costa',
    service: 'Personal trainer',
    quote: 'Consegui construir minha base de alunos rapidamente.',
    earnings: 'R$ 2.800'
  }
]
