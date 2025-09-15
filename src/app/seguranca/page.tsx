/**
 * Página de Segurança (pública)
 */

import { Shield, Star, MessageCircle } from 'lucide-react'

export default function SegurancaPage() {
  return (
    <div className="py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Segurança na MyServ</h1>
          <p className="text-gray-600">Entenda como promovemos uma experiência mais segura para clientes e profissionais.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Verificação básica</h2>
            </div>
            <p className="text-gray-700">Profissionais passam por verificação básica antes da aprovação. Incentivamos a análise do perfil e das avaliações pela comunidade.</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Avaliações e reputação</h2>
            </div>
            <p className="text-gray-700">Após cada serviço, clientes podem avaliar o profissional. Essas avaliações ajudam todos a tomar decisões melhores.</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Negociação direta</h2>
            </div>
            <p className="text-gray-700">O pagamento é combinado diretamente entre cliente e profissional. A MyServ não intermedia valores dos serviços.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

