'use client'

import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import axios from "axios";
import { CreatePreferenceResponse } from "@/app/api/payments/subscribe/route";
import { useMutation } from "@tanstack/react-query";
import useVerifyPlan from "@/hooks/use-verify-plan";
import { useEffect, useState } from "react";

export default function PlansSettings() {
  const { plan, subscription } = useVerifyPlan();
  const [prices, setPrices] = useState({ unlock: '2.99', monthly: '15.99' })

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/system-settings', { cache: 'no-store' })
        const data = await res.json()
        const s = data.settings || {}
        setPrices({
          unlock: s.PLAN_UNLOCK_PRICE || '2.99',
          monthly: s.PLAN_MONTHLY_PRICE || '15.99',
        })
      } catch {}
    })()
  }, [])

  const createPreferenceMutation = useMutation({
    mutationFn: async () => {
      const { data, status } = await axios.post<CreatePreferenceResponse>('/api/payments/subscribe', { planType: 'monthly' });

      if (status !== 200) {
        throw new Error('Erro ao criar preferência de pagamento');
      }

      return data
    },
    onSuccess: (data: CreatePreferenceResponse) => {
      window.open(data.initialPoint);
    },
    onError: (e) => {
      window.alert(e.message);
    }
  })

  return (
    <Card className="">
      <CardHeader>
        <CardTitle>Planos e Assinaturas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex max-sm:flex-col max-sm:items-stretch gap-4 justify-center'>

          {/* Card Grátis / por solicitação */}
          <div className='p-4 border-border rounded-sm bg-gradient-to-br from-brand-bg to-brand-teal relative hover:scale-105 transition-all min-w-0 md:min-w-96'>
            {plan === 'Start' && <Badge className='absolute top-5 right-5'>Atual</Badge>}
            <h2 className='text-2xl font-bold mb-1 text-brand-navy'>Grátis • Por Solicitação</h2>
            <p className='text-brand-navy mb-4'>Desbloqueie por R$ {prices.unlock} cada vez que aceitar uma solicitação</p>
            <ul>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-navy opacity-40' />
                <span className='font-semibold text-brand-navy text-base'>Cadastro gratuito (pessoa física)</span>
              </li>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-navy opacity-40' />
                <span className='font-semibold text-brand-navy text-base'>Desbloqueie cada solicitação por R$ {prices.unlock}</span>
              </li>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-navy opacity-40' />
                <span className='font-semibold text-brand-navy text-base'>Pagamento somente se aceitar o serviço</span>
              </li>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-navy opacity-40' />
                <span className='font-semibold text-brand-navy text-base'>Sem mensalidade</span>
              </li>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-navy opacity-40' />
                <span className='font-semibold text-brand-navy text-base'>Suporte por chat</span>
              </li>
            </ul>
            <Button disabled={true} variant='outline' className='w-full mt-4 rounded-sm'>Plano atual</Button>
          </div>

          {/* Card de plano mensal */}
          <div className='p-4 border-border rounded-sm bg-gradient-to-br from-emerald-50 to-green-100 relative hover:scale-105 transition-all min-w-0 md:min-w-96'>
            {plan === 'Premium' && <Badge className='absolute top-5 right-5'>Atual</Badge>}
            <h2 className='text-2xl font-bold mb-1 text-brand-navy'>Mensal • Profissional</h2>
            <p className='text-brand-navy mb-4'>R$ {prices.monthly}/mês</p>
            <ul>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-navy opacity-70' />
                <span className='font-semibold text-brand-navy text-base'>Contatos desbloqueados automaticamente</span>
              </li>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-navy opacity-70' />
                <span className='font-semibold text-brand-navy text-base'>Aceite solicitações ilimitadas durante todo o mês</span>
              </li>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-navy opacity-70' />
                <span className='font-semibold text-brand-navy text-base'>Suporte por chat</span>
              </li>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-navy opacity-70' />
                <span className='font-semibold text-brand-navy text-base'>Plano obrigatório para pessoa jurídica</span>
              </li>
            </ul>
            <Button disabled={createPreferenceMutation.isPending} variant='outline' className='w-full mt-4 rounded-sm' onClick={() => createPreferenceMutation.mutate()}>
              {createPreferenceMutation.isPending ? 'Carregando...' : 'Assinar mensal'}
            </Button>
          </div>
        </div>
        {
          subscription && (
            <div className="w-full p-4 mt-8 bg-blue-100 rounded-md">
              <p className="font-medium">O seu plano está em vigência até: { subscription.endDate ?  new Date(subscription.endDate || '').toLocaleString('pt-br', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
              }): 'Data invalida'}</p>
            </div>
          )
        }
      </CardContent>
    </Card>
  )
}
