/**
 * Profile Page - Página de Perfil
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import React from 'react'
import { User, Settings, Heart, History, HelpCircle, LogOut, Edit, Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export default function PerfilPage() {
  const [user] = React.useState({
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 99999-9999',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    memberSince: '2024',
    completedServices: 15,
    rating: 4.8,
    avatar: null
  })

  const menuItems = [
    {
      icon: Edit,
      title: 'Editar Perfil',
      description: 'Altere suas informações pessoais',
      href: '/perfil/editar'
    },
    {
      icon: History,
      title: 'Histórico de Serviços',
      description: 'Veja todos os serviços contratados',
      href: '/agenda'
    },
    {
      icon: Heart,
      title: 'Favoritos',
      description: 'Profissionais salvos',
      href: '/favoritos'
    },
    {
      icon: Settings,
      title: 'Configurações',
      description: 'Preferências e notificações',
      href: '/configuracoes'
    },
    {
      icon: HelpCircle,
      title: 'Ajuda e Suporte',
      description: 'Central de ajuda e contato',
      href: '/ajuda'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-bg via-white to-brand-teal/5">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
<Card className="mb-8">
  <CardContent className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-6 px-6 py-8">
    {/* Avatar */}
    <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-6">
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage src={user.avatar || ''} alt={user.name} />
          <AvatarFallback className="text-2xl bg-[#ecf4f6] text-[#00a9d4]">
            {user.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <Button
          size="sm"
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full p-0 border border-gray-300 bg-white shadow-sm"
        >
          <Camera className="w-4 h-4 text-brand-navy" />
        </Button>
      </div>

      {/* User Info */}
      <div className="text-center md:text-left">
        <h1 className="text-xl font-bold text-brand-navy">{user.name}</h1>
        <p className="text-sm text-gray-600">{user.email}</p>
        <div className="flex items-center justify-center md:justify-start gap-3 mt-2 flex-wrap">
          <span className="bg-[#ecf4f6] text-[#00a9d4] text-xs px-3 py-1 rounded-md font-medium">
            Membro desde {user.memberSince}
          </span>
          <span className="text-sm font-medium text-yellow-600">{user.rating}★</span>
        </div>
      </div>
    </div>

    {/* Edit Button */}
    <div className="mt-4 md:mt-0 md:ml-auto">
      <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
    </div>
  </CardContent>
</Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-brand-navy mb-2">
                {user.completedServices}
              </div>
              <div className="text-sm text-gray-600">
                Serviços Contratados
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-brand-navy mb-2">
                {user.rating}
              </div>
              <div className="text-sm text-gray-600">
                Avaliação Média
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-brand-navy mb-2">
                R$ 2.450
              </div>
              <div className="text-sm text-gray-600">
                Total Gasto
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-brand-navy mb-2">
                5
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
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
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
                <Button variant="ghost" size="sm">
                  Gerenciar
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-brand-navy">Privacidade e Segurança</h4>
                  <p className="text-sm text-gray-600">
                    Senha, autenticação e privacidade
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Configurar
                </Button>
              </div>

              <div className="border-t pt-4">
                <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
