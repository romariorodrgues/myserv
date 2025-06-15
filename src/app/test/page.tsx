/**
 * Test page for MyServ features
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Page to test all implemented features
 */

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Check, 
  X, 
  Upload, 
  Star, 
  Search, 
  Bell, 
  BarChart3,
  PlayCircle,
  Loader
} from 'lucide-react'

export default function TestPage() {
  const { data: session } = useSession()
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({})
  const [isRunning, setIsRunning] = useState(false)

  const runTest = async (testName: string, testFn: () => Promise<boolean>) => {
    setTestResults(prev => ({ ...prev, [testName]: null }))
    try {
      const result = await testFn()
      setTestResults(prev => ({ ...prev, [testName]: result }))
      return result
    } catch (error) {
      console.error(`Test ${testName} failed:`, error)
      setTestResults(prev => ({ ...prev, [testName]: false }))
      return false
    }
  }

  const tests = [
    {
      name: 'API de Reviews',
      key: 'reviews',
      test: async () => {
        const response = await fetch('/api/reviews?limit=5')
        return response.ok
      }
    },
    {
      name: 'API de Notificações',
      key: 'notifications',
      test: async () => {
        const response = await fetch('/api/notifications')
        return response.ok
      }
    },
    {
      name: 'Contagem de Notificações',
      key: 'notificationCount',
      test: async () => {
        const response = await fetch('/api/notifications/count')
        return response.ok
      }
    },
    {
      name: 'API de Busca Avançada',
      key: 'search',
      test: async () => {
        const response = await fetch('/api/services/search?q=test&limit=5')
        return response.ok
      }
    },
    {
      name: 'API Admin Stats',
      key: 'adminStats',
      test: async () => {
        const response = await fetch('/api/admin/stats')
        // Pode retornar 401/403 se não for admin, mas a API deve responder
        return response.status !== 500
      }
    },
    {
      name: 'API Upload Profile',
      key: 'upload',
      test: async () => {
        // Test if the upload endpoint exists
        const formData = new FormData()
        const blob = new Blob(['test'], { type: 'text/plain' })
        formData.append('file', blob, 'test.txt')
        
        const response = await fetch('/api/upload/profile-image', {
          method: 'POST',
          body: formData
        })
        // Should return 400 for invalid file type, not 404
        return response.status !== 404 && response.status !== 500
      }
    }
  ]

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults({})
    
    for (const test of tests) {
      await runTest(test.key, test.test)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsRunning(false)
  }

  const getTestIcon = (result: boolean | null) => {
    if (result === null) return <Loader className="w-4 h-4 animate-spin text-gray-400" />
    if (result === true) return <Check className="w-4 h-4 text-green-500" />
    return <X className="w-4 h-4 text-red-500" />
  }

  const getTestColor = (result: boolean | null) => {
    if (result === null) return 'border-gray-200'
    if (result === true) return 'border-green-200 bg-green-50'
    return 'border-red-200 bg-red-50'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            MyServ - Test Center
          </h1>
          <p className="text-gray-600">
            Teste todas as funcionalidades implementadas na plataforma
          </p>
          {session && (
            <p className="text-sm text-blue-600 mt-2">
              Logado como: {session.user.name} ({session.user.userType})
            </p>
          )}
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Sistema de Reviews</h3>
            <p className="text-sm text-gray-600">
              Avaliações com estrelas e estatísticas
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Bell className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Notificações Tempo Real</h3>
            <p className="text-sm text-gray-600">
              Sistema completo de notificações
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Search className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Busca Avançada</h3>
            <p className="text-sm text-gray-600">
              Filtros e geolocalização
            </p>
          </Card>

          <Card className="p-6 text-center">
            <Upload className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Upload de Imagens</h3>
            <p className="text-sm text-gray-600">
              Processamento automático
            </p>
          </Card>

          <Card className="p-6 text-center">
            <BarChart3 className="w-8 h-8 text-orange-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Dashboard Admin</h3>
            <p className="text-sm text-gray-600">
              Estatísticas completas
            </p>
          </Card>

          <Card className="p-6 text-center">
            <PlayCircle className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">APIs REST</h3>
            <p className="text-sm text-gray-600">
              Endpoints otimizados
            </p>
          </Card>
        </div>

        {/* Test Runner */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Executar Testes de API</h2>
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center space-x-2"
            >
              {isRunning ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <PlayCircle className="w-4 h-4" />
              )}
              <span>{isRunning ? 'Executando...' : 'Executar Todos'}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tests.map(test => (
              <div 
                key={test.key}
                className={`p-4 border rounded-lg ${getTestColor(testResults[test.key])}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{test.name}</h3>
                    <p className="text-sm text-gray-600">
                      Endpoint: {test.key}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getTestIcon(testResults[test.key])}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runTest(test.key, test.test)}
                      disabled={isRunning}
                    >
                      Testar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Links */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Links Rápidos para Teste</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start text-left"
              onClick={() => window.open('/admin/dashboard', '_blank')}
            >
              <BarChart3 className="w-5 h-5 mb-2 text-blue-600" />
              <span className="font-medium">Dashboard Admin</span>
              <span className="text-sm text-gray-500">Requer login como ADMIN</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start text-left"
              onClick={() => window.open('/servicos', '_blank')}
            >
              <Search className="w-5 h-5 mb-2 text-green-600" />
              <span className="font-medium">Busca de Serviços</span>
              <span className="text-sm text-gray-500">Teste filtros avançados</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start text-left"
              onClick={() => window.open('/prestador/1/avaliacoes', '_blank')}
            >
              <Star className="w-5 h-5 mb-2 text-yellow-600" />
              <span className="font-medium">Sistema Reviews</span>
              <span className="text-sm text-gray-500">Avaliações do prestador</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start text-left"
              onClick={() => window.open('/notifications', '_blank')}
            >
              <Bell className="w-5 h-5 mb-2 text-purple-600" />
              <span className="font-medium">Notificações</span>
              <span className="text-sm text-gray-500">Requer login</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start text-left"
              onClick={() => window.open('/entrar', '_blank')}
            >
              <span className="font-medium">Login</span>
              <span className="text-sm text-gray-500">Testar autenticação</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-start text-left"
              onClick={() => window.open('/cadastrar', '_blank')}
            >
              <span className="font-medium">Cadastro</span>
              <span className="text-sm text-gray-500">Criar nova conta</span>
            </Button>
          </div>
        </Card>

        {/* Documentation */}
        <Card className="p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Documentação</h2>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              Para mais informações sobre as funcionalidades implementadas, 
              consulte os arquivos de documentação:
            </p>
            <ul className="space-y-2">
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">FUNCIONALIDADES.md</code>
                - Status completo das funcionalidades
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">README.md</code>
                - Instruções de setup e configuração
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1 rounded">INTEGRATIONS.md</code>
                - Integrações e APIs externas
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
