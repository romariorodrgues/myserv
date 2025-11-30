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
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  Menu, User, LogOut, 
  Settings, Bell, Heart, ChevronDown,
  Home, Search as SearchIcon, HelpCircle,
  Briefcase, UserPlus, LayoutDashboard
} from 'lucide-react'
import { NotificationDropdown } from '@/components/notifications/real-time-notifications'
import { usePathname } from 'next/navigation'

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
import { cdnImageUrl } from '@/lib/cdn'

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

type UserType = 'ADMIN' | 'SERVICE_PROVIDER' | 'CLIENT' | undefined

const getDashboardUrl = (t: UserType) => {
  switch (t) {
    case 'ADMIN':             return '/admin/dashboard'
    case 'SERVICE_PROVIDER':  return '/dashboard/profissional'
    case 'CLIENT':            return '/dashboard/cliente'
    default:                  return '/entrar'
  }
}

const getSettingsUrl = (t: UserType) => {
  switch (t) {
    case 'ADMIN':             return '/admin/settings'   // <- corrigido
    case 'SERVICE_PROVIDER':  return '/dashboard/profissional?tab=settings'
    case 'CLIENT':            return '/dashboard/cliente?tab=settings'
    default:                  return '/entrar'
  }
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
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const rawProfileImage = (session?.user as any)?.profileImage || (session?.user as any)?.image || null
  const profileImage = rawProfileImage ? cdnImageUrl(rawProfileImage) : null
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    const { fullSignOut } = await import('@/lib/full-sign-out')
    await fullSignOut()
  }

  // Determine dashboard URL based on user type
  const userType = (session?.user as any)?.userType as UserType
const dashboardUrl = getDashboardUrl(userType)
const settingsUrl = getSettingsUrl(userType)

  const desktopNavItems = [
    { href: '/', label: 'Início' },
    { href: '/pesquisa', label: 'Pesquisar' },
    { href: '/como-funciona', label: 'Como Funciona' },
    { href: '/seja-profissional', label: 'Seja um Profissional' },
    ...(isAuthenticated ? [{ href: dashboardUrl, label: 'Dashboard' }] : [])
  ]

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
      <div className="relative h-20 w-full grid grid-cols-3 items-center px-2 md:px-6">
        {/* Mobile Navigation */}
        <div className="col-start-1 flex lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" aria-label="Menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="top" className="w-full pt-10 bg-gradient-to-b from-brand-bg via-white to-brand-teal/30 bg-[length:100%_300%] transition-colors duration-700 ease-in-out shadow-none border-none rounded-none">
            <nav className="flex flex-col gap-2">
              <div className="mb-10 px-4 ">
                <Link href="/" className="flex items-center gap-2">
                  {/* <div className="relative h-8 w-8">
                    <Image
                      src="/brand/icone.png"
                      alt="MyServ Icon"
                      fill
                      className="object-contain"
                    />
                  </div> */}
                  <div className="absolute left-1/2 -translate-x-1/2 h-40 w-40">
                    <Image
                      src="/brand/logotipo.png"
                      alt="MyServ"
                      fill
                      className="object-contain"
                    />
                  </div>
                </Link>
              </div>
              <MobileNavItem href="/" icon={Home} onClick={() => setMobileOpen(false)}>Início</MobileNavItem>
              <MobileNavItem href="/pesquisa" icon={SearchIcon} onClick={() => setMobileOpen(false)}>Pesquisar</MobileNavItem>
              <MobileNavItem href="/como-funciona" icon={HelpCircle} onClick={() => setMobileOpen(false)}>Como Funciona</MobileNavItem>
              <MobileNavItem href="/seja-profissional" icon={Briefcase} onClick={() => setMobileOpen(false)}>Seja um Profissional</MobileNavItem>
              {isAuthenticated && (
                <MobileNavItem href={dashboardUrl} icon={LayoutDashboard} onClick={() => setMobileOpen(false)}>Dashboard</MobileNavItem>
              )}
              <div className="border-t border-gray-200 my-2"></div>
              {isAuthenticated ? (
                <>
                  <MobileNavItem href={'/perfil'} icon={User} onClick={() => setMobileOpen(false)}>Meu Perfil</MobileNavItem>
                  <MobileNavItem href="/favoritos" icon={Heart} onClick={() => setMobileOpen(false)}>Favoritos</MobileNavItem>
                  <MobileNavItem href="/notifications" icon={Bell} onClick={() => setMobileOpen(false)}>Notificações</MobileNavItem>
                  <MobileNavItem href={settingsUrl} icon={Settings} onClick={() => setMobileOpen(false)}>Configurações</MobileNavItem>

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
                  <MobileNavItem href="/entrar" icon={User} onClick={() => setMobileOpen(false)}>Entrar</MobileNavItem>
                  <MobileNavItem href="/cadastrar" icon={UserPlus} onClick={() => setMobileOpen(false)}>Cadastrar</MobileNavItem>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        </div>
        {/* Logo */}
        <div className="relative flex justify-center lg:justify-start overflow-hidden">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-40 w-52">
              <Image
                src="/brand/logotipo.png"
                alt="MyServ"
                fill
                sizes="(max-width: 768px) 110px, 140px"
                className="object-contain object-center opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                priority
              />
            </div>
          </Link>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-2">
          {desktopNavItems.map((item) => (
            <DesktopNavItem
              key={item.href}
              href={item.href}
              active={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
            >
              {item.label}
            </DesktopNavItem>
          ))}
        </nav>
        {/* User Actions */}
        <div className="col-start-3 flex justify-end gap-2">
          {isLoading ? (
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-md"></div>
          ) : isAuthenticated ? (
            <>
              {/* Notifications (reais) */}
              <NotificationDropdown />
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 hidden md:flex hover:bg-brand-cyan/10 transition-colors duration-200">
                    <Avatar className="h-8 w-8 shadow-md">
                      {profileImage ? (
                        <AvatarImage
                          src={profileImage}
                          alt={session.user.name || 'Usuário'}
                          className="object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/80 text-xs text-white">
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
                    <Link href={'/perfil'}>
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
                    <Link href="/notifications">
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Notificações</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={settingsUrl}>
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
