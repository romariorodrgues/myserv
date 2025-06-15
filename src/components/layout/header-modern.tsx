/**
 * Modern Header Component for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Responsive header with mobile-first approach and modern design
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  Menu, User, LogOut, 
  Settings, Bell, Heart, ChevronDown,
  Home, ListChecks, MessageSquare, HelpCircle,
  Briefcase, UserPlus
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface MobileNavItemProps {
  href: string
  children: React.ReactNode
  onClick?: () => void
  icon?: React.ElementType
}

const MobileNavItem = ({ href, children, onClick, icon: Icon }: MobileNavItemProps) => (
  <Link 
    href={href} 
    onClick={onClick}
    className="flex items-center gap-3 px-4 py-3 text-primary hover:bg-brand-bg rounded-lg transition-colors"
  >
    {Icon && <Icon className="h-5 w-5" />}
    <span className="font-medium">{children}</span>
  </Link>
)

interface DesktopNavItemProps {
  href: string
  children: React.ReactNode
  active?: boolean
}

const DesktopNavItem = ({ href, children, active = false }: DesktopNavItemProps) => (
  <Link 
    href={href} 
    className={`relative px-3 py-2 text-sm font-medium transition-colors hover:text-secondary ${
      active ? 'text-secondary' : 'text-primary'
    }`}
  >
    {children}
    {active && (
      <motion.div 
        layoutId="activeTab"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary" 
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      />
    )}
  </Link>
)

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeTab, setActiveTab] = useState('/')
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle active tab based on current URL
  useEffect(() => {
    setActiveTab(window.location.pathname)
  }, [])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // Determine dashboard URL based on user type
  const getDashboardUrl = () => {
    if (!session?.user) return '/entrar'
    
    // Add routing logic based on user type (admin, provider, client)
    if (session.user.userType === 'ADMIN') {
      return '/admin/dashboard'
    } else if (session.user.userType === 'SERVICE_PROVIDER') {
      return '/prestador/dashboard' 
    } else {
      return '/dashboard'
    }
  }

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return 'MS'
    
    const nameParts = session.user.name.split(' ')
    if (nameParts.length === 1) return nameParts[0].substring(0, 2).toUpperCase()
    
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
  }

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 shadow-lg bg-gradient-to-br from-brand-bg via-white to-brand-teal/10 ${
      isScrolled ? 'backdrop-blur-md' : ''
    }`}> 
      <div className="container flex h-20 items-center justify-between px-2 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-10 w-10 drop-shadow-lg">
              <Image
                src="/brand/icone.png"
                alt="MyServ Logo"
                fill
                sizes="(max-width: 768px) 32px, 40px"
                className="object-contain scale-100 group-hover:scale-110 transition-transform duration-300"
                priority
              />
            </div>
            <div className="relative h-8 w-32 hidden sm:block">
              <Image
                src="/brand/logotipo.png"
                alt="MyServ"
                fill
                sizes="(max-width: 768px) 100px, 128px"
                className="object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                priority
              />
            </div>
          </Link>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          <DesktopNavItem href="/" active={activeTab === '/'}>
            Início
          </DesktopNavItem>
          <DesktopNavItem href="/servicos" active={activeTab.startsWith('/servicos')}>
            Serviços
          </DesktopNavItem>
          <DesktopNavItem href="/como-funciona" active={activeTab === '/como-funciona'}>
            Como Funciona
          </DesktopNavItem>
          <DesktopNavItem href="/seja-profissional" active={activeTab === '/seja-profissional'}>
            Seja um Profissional
          </DesktopNavItem>
        </nav>
        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 pt-10 bg-gradient-to-br from-brand-bg via-white to-brand-teal/10">
            <nav className="flex flex-col gap-2">
              <div className="mb-4 px-4">
                <Link href="/" className="flex items-center gap-2">
                  <div className="relative h-8 w-8">
                    <Image
                      src="/brand/icone.png"
                      alt="MyServ Icon"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="relative h-6 w-24">
                    <Image
                      src="/brand/logotipo.png"
                      alt="MyServ"
                      fill
                      className="object-contain"
                    />
                  </div>
                </Link>
              </div>
              <MobileNavItem href="/" icon={Home}>Início</MobileNavItem>
              <MobileNavItem href="/servicos" icon={ListChecks}>Serviços</MobileNavItem>
              <MobileNavItem href="/como-funciona" icon={HelpCircle}>Como Funciona</MobileNavItem>
              <MobileNavItem href="/seja-profissional" icon={Briefcase}>Seja um Profissional</MobileNavItem>
              <div className="border-t border-gray-200 my-2"></div>
              {isAuthenticated ? (
                <>
                  <MobileNavItem href={getDashboardUrl()} icon={User}>Minha Conta</MobileNavItem>
                  <MobileNavItem href="/favoritos" icon={Heart}>Favoritos</MobileNavItem>
                  <MobileNavItem href="/mensagens" icon={MessageSquare}>Mensagens</MobileNavItem>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-3 px-4 py-3 justify-start text-destructive hover:bg-destructive/10 transition-colors duration-200" 
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sair</span>
                  </Button>
                </>
              ) : (
                <>
                  <MobileNavItem href="/entrar" icon={User}>Entrar</MobileNavItem>
                  <MobileNavItem href="/cadastrar" icon={UserPlus}>Cadastrar</MobileNavItem>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        {/* User Actions */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-md"></div>
          ) : isAuthenticated ? (
            <>
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative hover:bg-brand-cyan/10 transition-colors duration-200">
                    <Bell className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-brand-teal text-white text-[10px] animate-bounce">
                      2
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto">
                    <div className="p-2 hover:bg-gray-50 cursor-pointer rounded transition-colors duration-200">
                      <p className="text-sm font-medium">Agendamento confirmado</p>
                      <p className="text-xs text-muted-foreground">Seu serviço de limpeza foi confirmado</p>
                      <p className="text-xs text-muted-foreground">Há 5 minutos</p>
                    </div>
                    <div className="p-2 hover:bg-gray-50 cursor-pointer rounded transition-colors duration-200">
                      <p className="text-sm font-medium">Nova mensagem</p>
                      <p className="text-xs text-muted-foreground">Maria enviou uma mensagem sobre seu orçamento</p>
                      <p className="text-xs text-muted-foreground">Há 1 hora</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/notifications" className="block p-2 text-center text-sm text-secondary hover:underline">
                    Ver todas
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 hidden md:flex hover:bg-brand-cyan/10 transition-colors duration-200">
                    <Avatar className="h-8 w-8 shadow-md">
                      <AvatarImage src={session.user.image || undefined} alt={session.user.name || 'User'} />
                      <AvatarFallback className="bg-primary text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate max-w-[100px]">
                      {session.user.name?.split(' ')[0] || 'Usuário'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardUrl()}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Meu Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/favoritos">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Favoritos</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/mensagens">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>Mensagens</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/configuracoes">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                asChild 
                className="hidden md:flex hover:bg-brand-cyan/10 transition-colors duration-200"
              >
                <Link href="/entrar">Entrar</Link>
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                asChild
                className="shadow-md hover:scale-105 transition-transform duration-200"
              >
                <Link href="/cadastrar">Cadastrar</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
