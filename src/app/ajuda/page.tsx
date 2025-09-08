/**
 * Central de Ajuda
 */

import Link from 'next/link'

const faqs = [
  {
    q: 'A MyServ cobra alguma taxa do cliente?',
    a: 'Não. Clientes não pagam taxas para usar a plataforma. O pagamento do serviço é combinado diretamente com o profissional.'
  },
  {
    q: 'Como os profissionais recebem solicitações?',
    a: 'Os clientes descrevem o serviço e enviam a solicitação. Profissionais com plano ativo podem ver os contatos do cliente para negociar.'
  },
  {
    q: 'Existe política de reembolso?',
    a: 'Não realizamos reembolsos a clientes, pois não processamos pagamentos entre cliente e profissional. Assinaturas de profissionais seguem regras próprias.'
  },
]

export default function AjudaPage() {
  return (
    <div className="py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Central de ajuda</h1>
          <p className="text-gray-600">Algumas respostas rápidas. Precisa de algo mais? Fale conosco.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <details key={i} className="bg-white rounded-lg shadow">
              <summary className="p-4 cursor-pointer font-medium text-gray-900">{f.q}</summary>
              <div className="px-4 pb-4 text-gray-700">{f.a}</div>
            </details>
          ))}
        </div>

        <div className="text-center text-sm text-gray-600 mt-8">
          Precisa de suporte? Envie um e-mail para{' '}
          <a href="mailto:contato@myserv.com.br" className="text-blue-600">contato@myserv.com.br</a>
          {' '}ou acesse{' '}
          <Link href="/seja-profissional" className="text-blue-600">Seja um profissional</Link>.
        </div>
      </div>
    </div>
  )
}

