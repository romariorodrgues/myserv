'use client'

import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useState } from "react";
import axios from "axios";
import { TSubscribeResponde } from "@/app/api/payments/subscribe/route";
import { useMutation, useQuery } from "@tanstack/react-query";
import { StringDecoder } from "string_decoder";

export default function PlansSettings() {
  const [plan, setPlan] = useState<'Start' | 'Enterprise'>('Start')

  const { data } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await axios.get('/api/users/me');
      setPlan(data.user.plan);
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  const createPreferenceMutation = useMutation({
    mutationFn: async (userId: StringDecoder) => {
      console.log(userId)
      const { data, status } = await axios.post<TSubscribeResponde>('/api/payments/subscribe', {
        payerId: userId,
      });

      if (status !== 200) {
        throw new Error('Erro ao criar preferência de pagamento');
      }

      return data
    },
    onSuccess: (data: TSubscribeResponde) => {
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

          {/* Card de plano start */}
          <div className='p-4 border-border rounded-sm bg-gradient-to-br from-brand-bg to-brand-teal relative hover:scale-105 transition-all min-w-0 md:min-w-96'>
            {plan === 'Start' && <Badge className='absolute top-5 right-5'>Atual</Badge>}
            <h2 className='text-2xl font-bold mb-4 text-brand-navy'>Start</h2>
            <ul>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-navy opacity-40' />
                <span className='font-semibold text-brand-navy text-base'>Propostas ilimitadas</span>
              </li>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-navy opacity-40' />
                <span className='font-semibold text-brand-navy text-base'>Relatorios completos</span>
              </li>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-navy opacity-40' />
                <span className='font-semibold text-brand-navy text-base'>Agenda personalizada</span>
              </li>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-navy opacity-40' />
                <span className='font-semibold text-brand-navy text-base'>Controle de precificação de serviço</span>
              </li>
            </ul>
            <Button disabled={true} variant='outline' className='w-full mt-4 rounded-sm'>
              Assinar
            </Button>
          </div>

          {/* Card de plano enterprise */}
          <div className='p-4 border-border rounded-sm bg-gradient-to-br from-brand-cyan to-brand-navy relative hover:scale-105 transition-all min-w-0 md:min-w-96'>
            {plan === 'Enterprise' && <Badge className='absolute top-5 right-5'>Atual</Badge>}

            <h2 className='text-2xl font-bold mb-4 text-brand-bg'>Enterprise</h2>
            <ul>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-teal' />
                <span className='font-semibold text-brand-bg text-base'>Tudo do plano start</span>
              </li>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-teal' />
                <span className='font-semibold text-brand-bg text-base'>Chat ilimitado</span>
              </li>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-teal' />
                <span className='font-semibold text-brand-bg text-base'>Recomendação de perfil</span>
              </li>
              <li className='flex items-center gap-2'>
                <Check size={14} className='text-brand-teal' />
                <span className='font-semibold text-brand-bg text-base'>Aumento do score</span>
              </li>
            </ul>
            <Button disabled={plan === 'Enterprise' || createPreferenceMutation.isPending} variant='outline' className='w-full mt-4 rounded-sm' onClick={() => createPreferenceMutation.mutateAsync(data.user.id)}>
              {createPreferenceMutation.isPending ? 'Carregando...' : 'Assinar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}