/**
 * Header component for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Main navigation header with responsive design and notifications
 */

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Menu, X, Search, User, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NotificationDropdown } from '@/components/notifications/real-time-notifications'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { data: session } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const getDashboardUrl = () => {
    if (!session) return '/entrar'
    
    // TODO: Implement proper routing based on user type
    return '/dashboard/cliente'
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">MS</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">MyServ</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/como-funciona"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Como funciona?
            </Link>
            <Link
              href="/seja-profissional"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Seja um profissional
            </Link>
            <Link
              href="/servicos"
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              Serviços
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Que serviço você precisa?"
                className="pl-10 pr-4"
              />
            </div>
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-2">
                {/* Notifications Dropdown */}
                <NotificationDropdown />
                
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                  >
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'Usuário'}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    <span className="font-medium">{session.user?.name || 'Usuário'}</span>
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        href={getDashboardUrl()}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 inline mr-2" />
                        Dashboard
                      </Link>
                      <Link
                        href="/notifications"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 inline mr-2" />
                        Notificações
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 inline mr-2" />
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/entrar">
                    <User className="w-4 h-4 mr-2" />
                    Entrar
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/cadastrar">Cadastrar</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Que serviço você precisa?"
              className="pl-10 pr-4"
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-1">
            <Link
              href="/como-funciona"
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Como funciona?
            </Link>
            <Link
              href="/seja-profissional"
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Seja um profissional
            </Link>
            <Link
              href="/servicos"
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Serviços
            </Link>
            
            {session ? (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <Link
                  href={getDashboardUrl()}
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/notifications"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Notificações
                </Link>
                <button
                  onClick={() => {
                    handleSignOut()
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <Link
                  href="/entrar"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastrar"
                  className="block px-3 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
