/**
 * Payment management page for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Payment {
  id: string
  amount: number
  baseAmount: number
  commission: number
  schedulingFee: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  gateway: string
  paymentMethod: string
  createdAt: string
  booking: {
    id: string
    service: string
    client: string
    provider: string
  }
}

interface PaymentForm {
  bookingId: string
  amount: number
  gateway: 'mercadopago' | 'pagarme'
  paymentMethod: 'credit_card' | 'debit_card' | 'pix' | 'boleto'
  installments?: number
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    bookingId: '',
    amount: 0,
    gateway: 'mercadopago',
    paymentMethod: 'pix'
  })

  useEffect(() => {
    // Fetch payments would go here
    // For now, using mock data
    const mockPayments: Payment[] = [
      {
        id: '1',
        amount: 165.00,
        baseAmount: 150.00,
        commission: 15.00,
        schedulingFee: 0,
        status: 'COMPLETED',
        gateway: 'mercadopago',
        paymentMethod: 'pix',
        createdAt: new Date().toISOString(),
        booking: {
          id: 'booking1',
          service: 'Limpeza Residencial',
          client: 'João Silva',
          provider: 'Maria Santos'
        }
      },
      {
        id: '2',
        amount: 85.00,
        baseAmount: 80.00,
        commission: 8.00,
        schedulingFee: 5.00,
        status: 'PENDING',
        gateway: 'mercadopago',
        paymentMethod: 'credit_card',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        booking: {
          id: 'booking2',
          service: 'Manicure e Pedicure',
          client: 'Ana Costa',
          provider: 'Clara Oliveira'
        }
      }
    ]
    
    setPayments(mockPayments)
    setLoading(false)
  }, [])

  const createPayment = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentForm),
      })

      const result = await response.json()
      
      if (result.success) {
        // Redirect to payment gateway or update UI
        if (result.checkout?.initPoint) {
          window.open(result.checkout.initPoint, '_blank')
        }
        
        setShowCreateForm(false)
        // Refresh payments list
      } else {
        alert('Erro ao criar pagamento: ' + result.error)
      }
      
    } catch (error) {
      console.error('Erro ao criar pagamento:', error)
      alert('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'text-yellow-600 bg-yellow-100',
      COMPLETED: 'text-green-600 bg-green-100',
      FAILED: 'text-red-600 bg-red-100',
      REFUNDED: 'text-gray-600 bg-gray-100'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  const getStatusText = (status: string) => {
    const texts = {
      PENDING: 'Pendente',
      COMPLETED: 'Concluído',
      FAILED: 'Falhou',
      REFUNDED: 'Reembolsado'
    }
    return texts[status as keyof typeof texts] || status
  }

  if (loading && payments.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Carregando pagamentos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pagamentos</h1>
          <p className="text-gray-600">Gerencie os pagamentos da plataforma</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Criar Pagamento
        </Button>
      </div>

      {/* Create Payment Form */}
      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Criar Novo Pagamento</CardTitle>
            <CardDescription>
              Configure os dados para processar um novo pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">ID da Reserva</label>
                <Input
                  type="text"
                  placeholder="booking_12345"
                  value={paymentForm.bookingId}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, bookingId: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Valor (R$)</label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Gateway</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={paymentForm.gateway}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, gateway: e.target.value as 'mercadopago' | 'pagarme' }))}
                >
                  <option value="mercadopago">MercadoPago</option>
                  <option value="pagarme">Pagar.me</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Método de Pagamento</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value as 'pix' | 'credit_card' | 'debit_card' | 'boleto' }))}
                >
                  <option value="pix">PIX</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="debit_card">Cartão de Débito</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>

              {paymentForm.paymentMethod === 'credit_card' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Parcelas</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={paymentForm.installments || 1}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, installments: Number(e.target.value) }))}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}x</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={createPayment}
                disabled={loading || !paymentForm.bookingId || !paymentForm.amount}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Processando...' : 'Criar Pagamento'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments List */}
      <div className="space-y-4">
        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Nenhum pagamento encontrado
            </CardContent>
          </Card>
        ) : (
          payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{payment.booking.service}</h3>
                    <p className="text-gray-600 text-sm">
                      Cliente: {payment.booking.client} • Profissional: {payment.booking.provider}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      ID: {payment.id} • Reserva: {payment.booking.id}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Valor Base:</span>
                    <p className="font-medium">R$ {payment.baseAmount.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Comissão:</span>
                    <p className="font-medium">R$ {payment.commission.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Taxa:</span>
                    <p className="font-medium">R$ {payment.schedulingFee.toFixed(2)}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <p className="font-bold text-lg">R$ {payment.amount.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    <span className="capitalize">{payment.gateway}</span> • 
                    <span className="capitalize ml-1">{payment.paymentMethod.replace('_', ' ')}</span> • 
                    <span className="ml-1">{new Date(payment.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Ver Detalhes
                    </Button>
                    {payment.status === 'PENDING' && (
                      <Button size="sm" variant="outline">
                        Verificar Status
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
