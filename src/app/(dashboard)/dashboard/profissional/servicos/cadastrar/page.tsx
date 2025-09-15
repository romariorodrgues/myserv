'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  category: {
    name: string
    icon: string
  }
}

export default function ServiceRegisterPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [providerDescription, setProviderDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services/search')
        const data = await res.json()
        if (data.success) {
          setServices(data.data.services || [])
        } else {
          toast.error('Erro ao carregar serviços.')
        }
      } catch (err) {
        console.error(err)
        toast.error('Erro ao buscar serviços disponíveis.')
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedServiceId || !basePrice) {
      toast.warning('Preencha todos os campos obrigatórios.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/services/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          basePrice: parseFloat(basePrice),
          providerDescription,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('Serviço cadastrado com sucesso!')
        router.push('/dashboard/profissional')
      } else {
        toast.error(data.message || 'Erro ao cadastrar serviço.')
      }
    } catch (err) {
        console.error(err)
      toast.error('Erro ao processar a requisição.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Cadastrar Serviço</h1>

      {loading ? (
        <p className="text-gray-500">Carregando serviços disponíveis...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="service">Serviço</Label>
            <select
              id="service"
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
              required
            >
              <option value="">Selecione um serviço</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.category.icon} {service.name} — {service.category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="basePrice">Preço base (R$)</Label>
            <Input
              id="basePrice"
              type="number"
              placeholder="Ex: 100.00"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição personalizada (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Detalhe como você realiza esse serviço"
              value={providerDescription}
              onChange={(e) => setProviderDescription(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Cadastrar Serviço
          </Button>
        </form>
      )}
    </div>
  )
}
