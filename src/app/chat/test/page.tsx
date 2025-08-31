import { SupportChatWidgetWrapper } from '@/components/chat/SupportChatWidgetWrapper'

export default function ChatTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Teste do Chat de Suporte</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Como usar o chat</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Clique no botão flutuante no canto inferior direito</li>
              <li>• Crie um novo chat descrevendo seu problema</li>
              <li>• Aguarde o atendimento de nossa equipe</li>
              <li>• Receba notificações em tempo real</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Status do Sistema</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Chat em tempo real ativo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Suporte disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Notificações ativas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Demonstração</h2>
          <p className="text-gray-600 mb-4">
            Esta página demonstra o funcionamento do chat de suporte. 
            O widget aparecerá no canto inferior direito da tela quando você estiver logado.
          </p>
          <p className="text-sm text-gray-500">
            Para acessar o dashboard administrativo, vá para /admin/chat
          </p>
        </div>
      </div>

      {/* Widget de chat */}
      <SupportChatWidgetWrapper />
    </div>
  )
}
