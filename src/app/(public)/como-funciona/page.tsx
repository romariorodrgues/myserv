/**
 * How it works page for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Detailed explanation of the platform's functionality
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, UserCheck, CreditCard, Star, Shield, Clock, MapPin, MessageCircle } from 'lucide-react'

export default function ComoFuncionaPage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Como funciona a MyServ?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Entenda como nossa plataforma conecta você aos melhores profissionais 
            da sua região de forma segura e prática.
          </p>
        </div>
      </section>

      {/* For Clients Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Para Clientes
            </h2>
            <p className="text-xl text-gray-600">
              Encontre e contrate profissionais qualificados em poucos cliques
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {clientSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="w-8 h-8 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
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

      {/* For Professionals Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Para Profissionais
            </h2>
            <p className="text-xl text-gray-600">
              Receba solicitações qualificadas e faça sua agenda decolar
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {professionalSteps.map((step, index) => (
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

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que escolher a MyServ?
            </h2>
            <p className="text-xl text-gray-600">
              Oferecemos uma experiência segura e eficiente para todos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-gray-600">
              Tire suas dúvidas sobre a plataforma
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <details key={index} className="bg-white rounded-lg shadow-md">
                <summary className="p-6 cursor-pointer font-semibold text-gray-900 hover:text-blue-600">
                  {faq.question}
                </summary>
                <div className="px-6 pb-6 text-gray-600">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Cadastre-se gratuitamente para buscar ou oferecer serviços.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/cadastrar">Criar conta grátis</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/seja-profissional">Seja um profissional</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

const clientSteps = [
  {
    icon: Search,
    title: 'Busque o serviço',
    description: 'Digite o que precisa e sua localização para encontrar profissionais próximos'
  },
  {
    icon: UserCheck,
    title: 'Escolha o profissional',
    description: 'Compare perfis, avaliações e preços para escolher o melhor para você'
  },
  {
    icon: CreditCard,
    title: 'Faça o agendamento',
    description: 'Solicite um orçamento ou agende um serviço com data e horário conforme disponibilidade do profissional. Pague somente após o serviço/orçamento concluído.'
  },
  {
    icon: Star,
    title: 'Avalie o serviço',
    description: 'Após o serviço realizado, avalie o profissional e compartilhe sua experiência'
  }
]

const professionalSteps = [
  {
    icon: UserCheck,
    title: 'Cadastre-se',
    description: 'Crie seu perfil profissional com informações e portfólio dos seus serviços'
  },
  {
    icon: MessageCircle,
    title: 'Receba solicitações',
    description: 'Clientes interessados enviam solicitações diretamente para você'
  },
  {
    icon: Clock,
    title: 'Aceite propostas',
    description: 'Analise as propostas e aceite aquelas que fazem sentido para você'
  },
  {
    icon: Star,
    title: 'Realize o serviço',
    description: 'Execute o trabalho com qualidade e construa sua reputação na plataforma'
  }
]

const features = [
  {
    icon: Shield,
    title: 'Segurança garantida',
    description: 'Todos os profissionais e clientes passam por verificação, possuímos termos rigorosos podendo qualquer cadastrado ser bloqueado do sistema em caso de não cumprimento das regras'
  },
  {
    icon: MapPin,
    title: 'Busca por localização',
    description: 'Encontre profissionais próximos a você usando geolocalização ou busca por endereço'
  },
  {
    icon: Star,
    title: 'Sistema de avaliações',
    description: 'Veja avaliações reais de outros clientes para tomar a melhor decisão'
  },
  {
    icon: Clock,
    title: 'Agendamento online',
    description: 'Agende serviços de forma prática direto pela plataforma, sem complicações'
  },
  {
    icon: MessageCircle,
    title: 'Comunicação direta',
    description: 'Converse diretamente com o profissional via chat ou whatsapp após a contratação'
  },
  {
    icon: CreditCard,
    title: 'Pagamento seguro',
    description: 'Aceite pagar direto ao profissional somente após a conclusão do serviço/orçamento contratado'
  }
]

const faqs = [
  {
    question: 'Como funciona o pagamento?',
    answer: 'O pagamento é combinado e realizado diretamente entre cliente e profissional. A MyServ não intermedia pagamentos dos serviços.'
  },
  {
    question: 'E se eu não gostar do serviço?',
    answer: 'Você pode avaliar o profissional e relatar problemas. A plataforma oferece ferramentas de avaliação e denúncia, mas não realiza reembolsos pois não processa pagamentos entre as partes.'
  },
  {
    question: 'Os profissionais são verificados?',
    answer: 'Sim! Todos os profissionais passam por um processo básico de verificação antes de serem aprovados.'
  },
  {
    question: 'Posso cancelar um agendamento?',
    answer: 'Sim. Não há cobrança de taxas pela plataforma para clientes. Combine diretamente com o profissional caso já tenha um horário ajustado.'
  },
  {
    question: 'Como funciona para profissionais?',
    answer: 'Profissionais assinam um plano mensal para ter acesso aos contatos dos clientes que enviaram solicitações e, assim, negociar diretamente.'
  }
]
