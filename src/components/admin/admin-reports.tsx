/**
 * Admin Reports and Analytics Dashboard
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Comprehensive reporting system with charts and metrics
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  ResponsiveContainer 
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  FileText,
  Download,
  Filter,
  Eye,
  Star,
  MapPin,
  Clock
} from 'lucide-react'

interface ReportMetrics {
  totalBookings: number
  totalRevenue: number
  totalUsers: number
  totalProviders: number
  averageRating: number
  completionRate: number
  cancellationRate: number
  monthlyGrowth: number
}

interface ChartData {
  bookingsByMonth: Array<{ month: string, bookings: number, revenue: number }>
  bookingsByService: Array<{ service: string, bookings: number, value: number }>
  userGrowth: Array<{ month: string, clients: number, providers: number }>
  topCities: Array<{ city: string, bookings: number, percentage: number }>
  ratingDistribution: Array<{ rating: string, count: number }>
}

export function AdminReports() {
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30days')
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)

  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      
      // Valores iniciais zerados até a API real estar disponível
      const mockMetrics: ReportMetrics = {
        totalBookings: 0,
        totalRevenue: 0,
        totalUsers: 0,
        totalProviders: 0,
        averageRating: 0,
        completionRate: 0,
        cancellationRate: 0,
        monthlyGrowth: 0,
      }

      const mockChartData: ChartData = {
        bookingsByMonth: [],
        bookingsByService: [],
        userGrowth: [],
        topCities: [],
        ratingDistribution: [],
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      setMetrics(mockMetrics)
      setChartData(mockChartData)
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = (format: 'pdf' | 'csv' | 'excel') => {
    // Implement export functionality
    console.log(`Exporting report as ${format}`)
    alert(`Relatório será exportado como ${format.toUpperCase()}`)
  }

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Relatórios e Analytics</h1>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Relatórios e Analytics</h1>
          <p className="text-gray-600">Dashboard completo de métricas e performance</p>
        </div>
        
        <div className="flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="90days">Últimos 3 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => exportReport('excel')}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Agendamentos</p>
                <p className="text-2xl font-bold">{metrics?.totalBookings.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {metrics?.monthlyGrowth ? `+${metrics.monthlyGrowth}% este mês` : 'Sem variação'}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold">R$ {metrics?.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +18.2% este mês
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold">{metrics?.totalUsers.toLocaleString()}</p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Users className="w-3 h-3 mr-1" />
                  {metrics?.totalProviders} prestadores
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avaliação Média</p>
                <p className="text-2xl font-bold">{metrics?.averageRating}</p>
                <p className="text-sm text-yellow-600 flex items-center mt-1">
                  <Star className="w-3 h-3 mr-1" />
                  {metrics?.completionRate}% conclusão
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by Month */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData?.bookingsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#22c55e" name="Agendamentos" />
                <Bar dataKey="revenue" fill="#3b82f6" name="Receita (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Services Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData?.bookingsByService}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ service, value }) => `${service} (${value}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData?.bookingsByService.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData?.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="clients" stroke="#22c55e" strokeWidth={2} name="Clientes" />
                <Line type="monotone" dataKey="providers" stroke="#3b82f6" strokeWidth={2} name="Prestadores" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card>
          <CardHeader>
            <CardTitle>Principais Cidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData?.topCities.map((city, index) => (
                <div key={city.city} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <span className="text-sm font-semibold text-green-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{city.city}</p>
                      <p className="text-sm text-gray-600">{city.bookings} agendamentos</p>
                    </div>
                  </div>
                  <Badge variant="outline">{city.percentage}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Taxa de Conclusão</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Serviços Concluídos</span>
                <span className="font-semibold text-green-600">{metrics?.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${metrics?.completionRate}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Taxa de Cancelamento</span>
                <span className="font-semibold text-red-600">{metrics?.cancellationRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full" 
                  style={{ width: `${metrics?.cancellationRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5" />
              <span>Distribuição de Avaliações</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData?.ratingDistribution.map((rating) => (
                <div key={rating.rating} className="flex items-center justify-between">
                  <span className="text-sm">{rating.rating}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${(rating.count / 1100) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{rating.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Ações Rápidas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Relatório Detalhado
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MapPin className="w-4 h-4 mr-2" />
                Análise Geográfica
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Gestão de Usuários
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="w-4 h-4 mr-2" />
                Relatório Financeiro
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminReports
