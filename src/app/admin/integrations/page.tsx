/**
 * Admin integrations management page for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface IntegrationStatus {
  name: string
  configured: boolean
  requiredEnvVars: string[]
  status: Record<string, string>
}

interface TestResult {
  service: string
  success: boolean
  message: string
  data?: Record<string, unknown>
  timestamp: string
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Record<string, IntegrationStatus>>({})
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testData, setTestData] = useState({
    phone: '',
    email: '',
    address: '',
    amount: 50
  })

  useEffect(() => {
    fetchIntegrationStatus()
  }, [])

  const fetchIntegrationStatus = async () => {
    try {
      const response = await fetch('/api/integrations/test')
      const data = await response.json()
      
      if (data.success) {
        setIntegrations(data.integrations)
      }
    } catch (error) {
      console.error('Erro ao carregar status das integrações:', error)
    } finally {
      setLoading(false)
    }
  }

  const testIntegration = async (service: string) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service,
          testData
        }),
      })

      const result = await response.json()
      setTestResults(prev => [result, ...prev.slice(0, 9)]) // Keep last 10 results
      
    } catch (error) {
      console.error(`Erro ao testar ${service}:`, error)
      setTestResults(prev => [{
        service,
        success: false,
        message: 'Erro de conexão',
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 9)])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (configured: boolean) => {
    return configured ? 'text-green-600' : 'text-red-600'
  }

  const getStatusIcon = (configured: boolean) => {
    return configured ? '✅' : '❌'
  }

  if (loading && Object.keys(integrations).length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Carregando status das integrações...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integrações MyServ</h1>
        <p className="text-gray-600">Gerencie e teste as integrações externas da plataforma</p>
      </div>

      {/* Test Data Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Dados para Teste</CardTitle>
          <CardDescription>
            Configure os dados que serão usados nos testes das integrações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <Input
                type="tel"
                placeholder="11999999999"
                value={testData.phone}
                onChange={(e) => setTestData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                placeholder="teste@exemplo.com"
                value={testData.email}
                onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <Input
                type="text"
                placeholder="Rua das Flores, 123, São Paulo"
                value={testData.address}
                onChange={(e) => setTestData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor (R$)</label>
              <Input
                type="number"
                min="1"
                value={testData.amount}
                onChange={(e) => setTestData(prev => ({ ...prev, amount: Number(e.target.value) }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Integration Status */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Status das Integrações</h2>
          
          <div className="space-y-4">
            {Object.entries(integrations).map(([key, integration]) => (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {getStatusIcon(integration.configured)} {integration.name || key}
                    </CardTitle>
                    <span className={`text-sm font-medium ${getStatusColor(integration.configured)}`}>
                      {integration.configured ? 'Configurado' : 'Não Configurado'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(integration.status || {}).map(([envVar, status]) => (
                      <div key={envVar} className="flex justify-between text-sm">
                        <span className="text-gray-600">{envVar}:</span>
                        <span className={getStatusColor(status === 'Configurado')}>
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <Button
                      onClick={() => testIntegration(key)}
                      disabled={loading || !integration.configured}
                      size="sm"
                      className="w-full"
                    >
                      {loading ? 'Testando...' : 'Testar Integração'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Test Results */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Resultados dos Testes</h2>
          
          {testResults.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Nenhum teste executado ainda
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {testResults.map((result, index) => (
                <Card key={index} className={`border-l-4 ${result.success ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base capitalize">
                        {result.success ? '✅' : '❌'} {result.service}
                      </CardTitle>
                      <span className="text-xs text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result.message}
                    </p>
                    
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer">
                          Ver dados retornados
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Instruções de Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-600">WhatsApp (ChatPro API)</h4>
              <p>Configure as variáveis: CHATPRO_API_URL, CHATPRO_API_KEY, CHATPRO_PHONE_NUMBER</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-green-600">Email (SMTP)</h4>
              <p>Configure as variáveis: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-purple-600">Pagamentos</h4>
              <p>Configure as variáveis: MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_PUBLIC_KEY, PAGARME_API_KEY</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-red-600">Google Maps</h4>
              <p>Configure a variável: GOOGLE_MAPS_API_KEY</p>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-medium text-yellow-800">⚠️ Importante:</p>
              <p className="text-yellow-700">
                Todas as configurações devem ser feitas no arquivo .env.local na raiz do projeto.
                Após alterar as variáveis, reinicie o servidor de desenvolvimento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
