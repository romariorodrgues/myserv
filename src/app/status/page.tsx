/**
 * System status page for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Shows the current status of all system components and integrations
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface SystemStatus {
  component: string
  status: 'healthy' | 'warning' | 'error'
  message: string
  lastChecked: string
  details?: Record<string, unknown>
}

export default function StatusPage() {
  const { data: session, status } = useSession()
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const checkSystemStatus = async () => {
    setLoading(true)
    const checks: SystemStatus[] = []

    try {
      // Check authentication
      const authResponse = await fetch('/api/auth/test')
      const authData = await authResponse.json()
      checks.push({
        component: 'Authentication System',
        status: authData.success ? 'healthy' : 'error',
        message: authData.success ? 'NextAuth.js is working correctly' : 'Authentication system failed',
        lastChecked: new Date().toISOString(),
        details: authData
      })

      // Check database connection
      try {
        const dbResponse = await fetch('/api/services/search?q=test&limit=1')
        await dbResponse.json() // Consume response but don't store in unused variable
        checks.push({
          component: 'Database Connection',
          status: dbResponse.ok ? 'healthy' : 'error',
          message: dbResponse.ok ? 'Database is responding' : 'Database connection failed',
          lastChecked: new Date().toISOString(),
          details: { responseTime: `${Date.now()}ms` }
        })
      } catch (error) {
        checks.push({
          component: 'Database Connection',
          status: 'error',
          message: 'Database connection failed',
          lastChecked: new Date().toISOString(),
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        })
      }

      // Check integrations
      try {
        const integrationsResponse = await fetch('/api/integrations/test')
        if (integrationsResponse.ok) {
          const integrationsData = await integrationsResponse.json()
          
          // Add status for each integration
          Object.entries(integrationsData.results || {}).forEach(([key, result]: [string, Record<string, unknown>]) => {
            const integrationResult = result as { configured: boolean; status?: string; message?: string }
            checks.push({
              component: `Integration: ${key}`,
              status: integrationResult.configured ? (integrationResult.status === 'error' ? 'error' : 'healthy') : 'warning',
              message: integrationResult.configured ? 
                (integrationResult.status === 'error' ? integrationResult.message || 'Error occurred' : 'Integration is configured and working') :
                'Integration not configured',
              lastChecked: new Date().toISOString(),
              details: result
            })
          })
        }
      } catch (error) {
        checks.push({
          component: 'Integrations Test',
          status: 'warning',
          message: 'Could not check integrations status',
          lastChecked: new Date().toISOString(),
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        })
      }

      // Check core API endpoints
      const endpoints = [
        { name: 'Services API', url: '/api/services/search?q=test&limit=1' },
        { name: 'Bookings API', url: '/api/bookings' },
        { name: 'Notifications API', url: '/api/notifications' }
      ]

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint.url, { method: 'GET' })
          checks.push({
            component: endpoint.name,
            status: response.ok ? 'healthy' : 'error',
            message: response.ok ? 'Endpoint is responding' : `HTTP ${response.status}`,
            lastChecked: new Date().toISOString(),
            details: { status: response.status, url: endpoint.url }
          })
        } catch (error) {
          checks.push({
            component: endpoint.name,
            status: 'error',
            message: 'Endpoint failed to respond',
            lastChecked: new Date().toISOString(),
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          })
        }
      }

    } catch (error) {
      console.error('Status check failed:', error)
    }

    setSystemStatus(checks)
    setLastUpdate(new Date().toLocaleString('pt-BR'))
    setLoading(false)
  }

  useEffect(() => {
    checkSystemStatus()
  }, [])

  const getStatusIcon = (status: SystemStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200'
    }
  }

  const healthyCount = systemStatus.filter(s => s.status === 'healthy').length
  const warningCount = systemStatus.filter(s => s.status === 'warning').length
  const errorCount = systemStatus.filter(s => s.status === 'error').length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
          <p className="text-gray-600 mt-1">
            Current status of MyServ platform components
          </p>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {lastUpdate}
            </p>
          )}
        </div>
        <Button 
          onClick={checkSystemStatus}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Overall Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Healthy</p>
                <p className="text-2xl font-bold text-green-900">{healthyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-900">{warningCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-red-600">Errors</p>
                <p className="text-2xl font-bold text-red-900">{errorCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
          <CardDescription>Information about the current user session</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' ? (
            <p>Loading session...</p>
          ) : session ? (
            <div className="space-y-2">
              <p><strong>Email:</strong> {session.user?.email}</p>
              <p><strong>Name:</strong> {session.user?.name}</p>
              <p><strong>Type:</strong> {session.user?.userType}</p>
              <p><strong>Status:</strong> <span className="text-green-600">Authenticated</span></p>
            </div>
          ) : (
            <p className="text-yellow-600">Not authenticated</p>
          )}
        </CardContent>
      </Card>

      {/* Detailed Component Status */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Component Details</h2>
        {systemStatus.map((status, index) => (
          <Card key={index} className={`border ${getStatusColor(status.status)}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(status.status)}
                  <div>
                    <h3 className="font-semibold">{status.component}</h3>
                    <p className="text-sm mt-1">{status.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last checked: {new Date(status.lastChecked).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                {status.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-500">Details</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(status.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500 mt-2">Checking system status...</p>
        </div>
      )}
    </div>
  )
}
