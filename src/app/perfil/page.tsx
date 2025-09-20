/**
 * Profile Page - Página de Perfil
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { User, Settings, Heart, History, HelpCircle, LogOut, Edit, Camera, LayoutDashboard, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export default function PerfilPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ completed: 0, totalSpent: 0, favorites: 0 })
  const [providerAvg, setProviderAvg] = useState<number | null>(null)
  const [providerCount, setProviderCount] = useState<number>(0)

  useEffect(() => {
    const load = async () => {
      if (!session?.user?.id) { setLoading(false); return }
      try {
        const [meRes, favRes, histRes] = await Promise.all([
          fetch('/api/users/me'),
          fetch('/api/favorites'),
          fetch(`/api/requests/history?clientId=${session.user.id}&status=COMPLETED`),
        ])
        const me = await meRes.json()
        const fav = favRes.ok ? await favRes.json() : []
        const hist = histRes.ok ? await histRes.json() : []
        setProfile(me.user)
        const totalSpent = hist.reduce((sum: number, r: any) => sum + (r.price || 0), 0)
        setStats({ completed: hist.length, totalSpent, favorites: fav.length })

        // Se for prestador, buscar média de avaliações
        if (session.user.userType === 'SERVICE_PROVIDER') {
          const r = await fetch(`/api/reviews?serviceProviderId=${session.user.id}&limit=1`)
          if (r.ok) {
            const j = await r.json()
            setProviderAvg(j?.data?.statistics?.averageRating ?? 0)
            setProviderCount(j?.data?.statistics?.totalReviews ?? 0)
          }
        }
      } catch (e) {
        console.error('Load profile error', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session?.user?.id])

  const memberSince = useMemo(() => {
    if (!profile?.id) return ''
    // We don't have createdAt in /api/users/me payload; fallback to year from session token
    return new Date().getFullYear().toString()
  }, [profile?.id])

  const dashboardUrl = useMemo(() => {
    if (!session?.user) return '/entrar'
    if (session.user.userType === 'ADMIN') return '/admin/dashboard'
    if (session.user.userType === 'SERVICE_PROVIDER') return '/dashboard/profissional'
    return '/dashboard/cliente'
  }, [session?.user])

  const menuItems = useMemo(() => {
    const isProvider = session?.user?.userType === 'SERVICE_PROVIDER'
    if (session?.user?.userType === 'ADMIN') {
      return [
        { icon: LayoutDashboard, title: 'Painel Administrativo', description: 'Visão geral da plataforma', href: '/admin/dashboard' },
        { icon: Users, title: 'Gerenciar Prestadores', description: 'Aprovar e administrar cadastros', href: '/admin/providers' },
        { icon: Settings, title: 'Configurações da Plataforma', description: 'Planos, integrações e parâmetros', href: '/admin/settings' },
        { icon: HelpCircle, title: 'Central de Ajuda', description: 'Documentação e suporte', href: '/ajuda' },
      ]
    }

    if (isProvider) {
      return [
        { icon: Edit, title: 'Editar Perfil', description: 'Dados e foto do prestador', href: '/dashboard/profissional?tab=settings' },
        { icon: History, title: 'Histórico de Serviços', description: 'Serviços realizados e status', href: '/dashboard/profissional?tab=history' },
        { icon: Settings, title: 'Agenda e Serviços', description: 'Defina horários e gerencie serviços', href: '/dashboard/profissional?tab=schedule' },
        { icon: Heart, title: 'Favoritos', description: 'Clientes e profissionais salvos', href: '/favoritos' },
        { icon: HelpCircle, title: 'Ajuda e Suporte', description: 'Central de ajuda e contato', href: '/ajuda' },
      ]
    }
    return [
      { icon: Edit, title: 'Editar Perfil', description: 'Altere suas informações pessoais', href: '/dashboard/cliente?tab=settings' },
      { icon: History, title: 'Histórico de Serviços', description: 'Veja todos os serviços contratados', href: '/agenda' },
      { icon: Heart, title: 'Favoritos', description: 'Profissionais salvos', href: '/favoritos' },
      { icon: Settings, title: 'Configurações', description: 'Preferências e notificações', href: '/dashboard/cliente?tab=settings' },
      { icon: HelpCircle, title: 'Ajuda e Suporte', description: 'Central de ajuda e contato', href: '/ajuda' },
    ]
  }, [session?.user?.userType])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-white to-brand-teal/5">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
<Card className="mb-8">
  <CardContent className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-6 px-6 py-8">
    {/* Avatar */}
    <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-6">
      <div className="relative">
        <Avatar className="w-28 h-28 lg:w-32 lg:h-32 shadow-lg">
          <AvatarImage
            src={profile?.profileImage || ''}
            alt={profile?.name || ''}
            size={200}
            priority
          />
          <AvatarFallback className="text-2xl bg-[#ecf4f6] text-[#00a9d4]">
            {(profile?.name || 'US').split(' ').map((n: string) => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <Button
          size="sm"
          className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full p-0 border border-gray-200 bg-white shadow-md hover:bg-brand-cyan/10 z-20"
          onClick={() => {
            if (session?.user?.userType === 'SERVICE_PROVIDER') {
              window.location.href = '/dashboard/profissional?tab=settings'
            } else if (session?.user?.userType === 'ADMIN') {
              window.location.href = '/admin/settings'
            } else {
              window.location.href = '/dashboard/cliente?tab=settings'
            }
          }}
          title="Alterar foto"
          aria-label="Alterar foto de perfil"
        >
          <Camera className="w-4 h-4 text-brand-navy" />
        </Button>
      </div>

      {/* User Info */}
      <div className="text-center md:text-left">
        <h1 className="text-xl font-bold text-brand-navy">{profile?.name || 'Usuário'}</h1>
        <p className="text-sm text-gray-600">{profile?.email}</p>
        <div className="flex items-center justify-center md:justify-start gap-3 mt-2 flex-wrap">
          <span className="bg-[#ecf4f6] text-[#00a9d4] text-xs px-3 py-1 rounded-md font-medium">
            Membro desde {memberSince}
          </span>
          {session?.user?.userType === 'SERVICE_PROVIDER' && (
            <span className="flex items-center gap-1 text-sm text-yellow-600">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = providerAvg ? i < Math.round(providerAvg) : false
                return (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" className={`w-4 h-4 ${filled ? 'text-yellow-500' : 'text-gray-300'}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.172c.969 0 1.371 1.24.588 1.81l-3.378 2.455a1 1 0 00-.364 1.118l1.286 3.966c.3.922-.755 1.688-1.54 1.118l-3.378-2.454a1 1 0 00-1.175 0l-3.378 2.454c-.784.57-1.838-.196-1.539-1.118l1.285-3.966a1 1 0 00-.364-1.118L2.955 9.394c-.783-.57-.38-1.81.588-1.81h4.172a1 1 0 00.95-.69l1.286-3.967z" />
                  </svg>
                )
              })}
              {providerAvg !== null && (
                <span className="ml-1">{providerAvg.toFixed(1)} ({providerCount})</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>

    {/* Edit Button */}
    <div className="mt-4 md:mt-0 md:ml-auto">
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href={dashboardUrl}>
            Ir para Dashboard
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={session?.user?.userType === 'SERVICE_PROVIDER' ? '/dashboard/profissional?tab=settings' : session?.user?.userType === 'ADMIN' ? '/admin/settings' : '/dashboard/cliente?tab=settings'}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Link>
        </Button>
      </div>
    </div>
  </CardContent>
</Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-brand-navy mb-2">
                {stats.completed}
              </div>
              <div className="text-sm text-gray-600">
                Serviços Contratados
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-brand-navy mb-2">
                {session?.user?.userType === 'SERVICE_PROVIDER' && providerAvg !== null ? providerAvg.toFixed(1) : '—'}
              </div>
              <div className="text-sm text-gray-600">
                Avaliação Média
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-brand-navy mb-2">
                R$ {stats.totalSpent.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                Total Gasto
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-brand-navy mb-2">
                {stats.favorites}
              </div>
              <div className="text-sm text-gray-600">
                Favoritos
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Link key={index} href={item.href} className="block">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-cyan/10 rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-brand-navy" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-brand-navy mb-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-navy">Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-brand-navy">Informações Pessoais</h4>
                  <p className="text-sm text-gray-600">
                    Nome, email, telefone e endereço
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={session?.user?.userType === 'SERVICE_PROVIDER' ? '/dashboard/profissional?tab=settings' : '/dashboard/cliente?tab=settings'}>
                    Gerenciar
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-brand-navy">Privacidade e Segurança</h4>
                  <p className="text-sm text-gray-600">
                    Senha, autenticação e privacidade
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={session?.user?.userType === 'SERVICE_PROVIDER' ? '/dashboard/profissional?tab=settings' : '/dashboard/cliente?tab=settings'}>
                    Configurar
                  </Link>
                </Button>
              </div>

              <div className="border-t pt-4">
                <Button variant="ghost" onClick={() => signOut()} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da Conta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
