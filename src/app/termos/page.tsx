/**
 * Termos de Uso (geral)
 */

const updatedAt = '23 de setembro de 2025'

export default function TermosPage() {
  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-800">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Termos de Uso da MyServ</h1>
          <p className="text-sm text-gray-500">Última atualização: {updatedAt}</p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Aceitação dos Termos</h2>
            <p className="leading-relaxed">
              Ao criar uma conta na MyServ ou utilizar qualquer recurso da plataforma, você confirma que leu, compreendeu e concorda com estes Termos de Uso. Caso não concorde com alguma das condições descritas abaixo, recomendamos que não prossiga com o cadastro ou uso dos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Descrição da Plataforma</h2>
            <p className="leading-relaxed">
              A MyServ é uma plataforma digital que conecta clientes a profissionais prestadores de serviços. A MyServ não é parte do contrato firmado entre clientes e prestadores, não executa serviços e não garante resultados. O objetivo da plataforma é facilitar a divulgação de serviços, o recebimento de solicitações e a troca de mensagens entre as partes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-gray-900">3. Cadastro de Usuários</h2>
            <p className="leading-relaxed">
              Para utilizar a MyServ, é necessário realizar um cadastro com dados verdadeiros e atualizados. O usuário é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as ações executadas com sua conta.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-gray-700">
              <li><strong>Clientes</strong>: podem criar contas gratuitas para solicitar serviços.</li>
              <li><strong>Prestadores pessoa física</strong>: podem usar o plano gratuito (desbloqueio avulso) ou assinar o plano profissional mensal.</li>
              <li><strong>Prestadores pessoa jurídica</strong>: devem aderir ao plano profissional mensal para ter acesso aos contatos de clientes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Planos e Pagamentos</h2>
            <p className="leading-relaxed">
              Os planos e valores exibidos na plataforma descrevem unicamente o uso da MyServ. A contratação e o pagamento pelo serviço prestado continuam sendo negociados diretamente entre cliente e profissional. Em caso de assinatura do plano profissional, o débito é processado por meio do Mercado Pago e o recibo fica disponível para o prestador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Conduta dos Usuários</h2>
            <p className="leading-relaxed">
              Ao utilizar a MyServ, você se compromete a agir com respeito e boa-fé. São vedadas práticas como divulgar informações falsas, realizar contatos abusivos, tentar obter vantagens indevidas ou compartilhar dados pessoais de terceiros sem consentimento. A MyServ pode suspender ou encerrar contas que violem estes termos ou a legislação vigente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Avaliações e Feedbacks</h2>
            <p className="leading-relaxed">
              As avaliações permitem que clientes e prestadores compartilhem suas experiências. Os comentários devem ser objetivos, respeitosos e baseados em fatos. A MyServ pode remover avaliações ofensivas, discriminatórias ou que infringirem direitos de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Limitação de Responsabilidade</h2>
            <p className="leading-relaxed">
              A MyServ não garante a qualidade dos serviços executados pelos prestadores, bem como não se responsabiliza por prejuízos decorrentes da relação entre cliente e profissional. Qualquer reclamação ou disputa deve ser tratada diretamente entre as partes envolvidas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Privacidade e Proteção de Dados</h2>
            <p className="leading-relaxed">
              As informações fornecidas no cadastro são tratadas conforme nossa Política de Privacidade. Dados pessoais são utilizados apenas para viabilizar o funcionamento da plataforma e não são compartilhados com terceiros sem consentimento, salvo obrigações legais.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Atualizações dos Termos</h2>
            <p className="leading-relaxed">
              Podemos atualizar estes Termos de Uso a qualquer momento para refletir melhorias na plataforma ou mudanças legais. Sempre que houver alteração relevante, informaremos os usuários e solicitaremos um novo aceite antes da continuidade do uso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Contato</h2>
            <p className="leading-relaxed">
              Em caso de dúvidas sobre estes termos ou sobre a plataforma, entre em contato pelo e-mail <a href="mailto:contato@myserv.com.br" className="text-brand-navy hover:underline">contato@myserv.com.br</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
