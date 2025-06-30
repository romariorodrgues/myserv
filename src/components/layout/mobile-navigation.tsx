/**
 * Mobile Navigation Component for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * App-like bottom navigation for mobile devices
 */

'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Home, 
  Search, 
  Calendar, 
  User,
  Heart,
  Briefcase
} from 'lucide-react'
import { cn } from '@/utils'

type NavItem = {
  href: string
  icon: React.ElementType
  label: string
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Início' },
  { href: '/servicos', icon: Briefcase, label: 'Serviços' },
  { href: '/pesquisa', icon: Search, label: 'Pesquisar' },
  { href: '/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/perfil', icon: User, label: 'Perfil' }
]

export function MobileNavigation() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  
  // Hide navigation on scroll down, show on scroll up
  // useEffect(() => {
  //   const handleScroll = () => {
  //     const currentScrollY = window.scrollY
      
  //     if (currentScrollY > lastScrollY && currentScrollY > 100) {
  //       setVisible(false)
  //     } else {
  //       setVisible(true)
  //     }
      
  //     setLastScrollY(currentScrollY)
  //   }
    
  //   window.addEventListener('scroll', handleScroll, { passive: true })
  //   return () => window.removeEventListener('scroll', handleScroll)
  // }, [lastScrollY])

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/auth')) {
    return null // Don't show mobile navigation on admin or auth pages
  }

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl md:hidden z-40"
      initial={{ y: 0 }}
      // animate={{ y: visible ? 0 : 100 }}
      animate={{ y: 0 }} // Always show for now, can be toggled later
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
                         (item.href !== '/' && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-lg transition-all duration-200',
                isActive ? 'text-brand-cyan font-semibold scale-110 bg-brand-cyan/10 shadow-md' : 'text-gray-500 hover:text-brand-navy hover:bg-brand-cyan/5'
              )}
            >
              <Icon className="h-6 w-6 mb-0.5" />
              <span className="text-xs leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}
