/**
 * Modern Footer Component for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Responsive footer with mobile-first approach and modern design
 */

import Link from 'next/link'
import Image from 'next/image'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Instagram, 
  ArrowRight,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'

interface FooterSectionProps {
  title: string
  children: React.ReactNode
}

const FooterSection = ({ title, children }: FooterSectionProps) => (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-primary-foreground font-display">{title}</h3>
    {children}
  </div>
)

interface FooterLinkProps {
  href: string
  children: React.ReactNode
}

const FooterLink = ({ href, children }: FooterLinkProps) => (
  <li>
    <Link 
      href={href} 
      className="text-gray-200 hover:text-secondary transition-colors flex items-center gap-1 group"
    >
      <span>{children}</span>
      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
    </Link>
  </li>
)

interface SocialLinkProps {
  href: string
  icon: React.ElementType
  label: string
}

const SocialLink = ({ href, icon: Icon, label }: SocialLinkProps) => (
  <Link 
    href={href} 
    className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/40 hover:bg-secondary transition-colors" 
    aria-label={label}
  >
    <Icon className="w-4 h-4" />
  </Link>
)

async function getSettings() {
  try {
    const items = await prisma.systemSettings.findMany({
      where: { key: { in: [
        'CONTACT_EMAIL',
        'CONTACT_PHONE',
        'CONTACT_ADDRESS',
        'SOCIAL_FACEBOOK_URL',
        'SOCIAL_INSTAGRAM_URL',
      ] } }
    })
    const map = Object.fromEntries(items.map(i => [i.key, i.value])) as Record<string, string>
    return {
      email: map.CONTACT_EMAIL || 'contato@myserv.com.br',
      phone: map.CONTACT_PHONE || '(11) 99999-9999',
      address: map.CONTACT_ADDRESS || 'São Paulo - SP, Brasil',
      facebook: map.SOCIAL_FACEBOOK_URL || 'https://facebook.com/myserv',
      instagram: map.SOCIAL_INSTAGRAM_URL || 'https://instagram.com/myserv',
    }
  } catch {
    return {
      email: 'contato@myserv.com.br',
      phone: '(11) 99999-9999',
      address: 'São Paulo - SP, Brasil',
      facebook: 'https://facebook.com/myserv',
      instagram: 'https://instagram.com/myserv',
    }
  }
}

export async function FooterModern() {
  const settings = await getSettings()
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-gradient-to-br from-brand-navy via-brand-cyan/80 to-brand-teal/80 text-white shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="h-10 w-auto relative drop-shadow-lg">
                <div className="absolute top-[-65px] left-[-16px] w-[12rem]">
                <Image 
                  src="/LOGOS/Prancheta 18.png" 
                  alt="MyServ Logo"
                  width={140}
                  height={40}
                  className="h-auto"
                />
                </div>
              </div>
            </div>
            <p className="text-gray-50 text-sm">
              Conectamos você aos melhores profissionais da sua região. 
              Encontre o serviço que precisa de forma rápida e segura.
            </p>
            {/* Somente Instagram e Facebook neste momento */}
            <div className="flex space-x-3">
              <SocialLink href={settings.facebook} icon={Facebook} label="Facebook" />
              <SocialLink href={settings.instagram} icon={Instagram} label="Instagram" />
            </div>
          </div>

          {/* For Clients */}
          <FooterSection title="Para Clientes">
            <ul className="space-y-2 text-sm">
              <FooterLink href="/como-funciona">Como funciona</FooterLink>
              <FooterLink href="/categorias">Categorias de serviços</FooterLink>
              <FooterLink href="/seguranca">Segurança</FooterLink>
              <FooterLink href="/ajuda">Central de ajuda</FooterLink>
            </ul>
          </FooterSection>

          {/* For Professionals */}
          <FooterSection title="Para Profissionais">
            <ul className="space-y-2 text-sm">
              <FooterLink href="/seja-profissional">Seja um profissional</FooterLink>
              <FooterLink href="/planos">Planos e taxas</FooterLink>
              <FooterLink href="/termos">Termos de uso</FooterLink>
              <FooterLink href="/privacidade">Política de privacidade</FooterLink>
              <FooterLink href="/central-ajuda">Central de ajuda</FooterLink>
            </ul>
          </FooterSection>

          {/* Contact and Newsletter */}
          <FooterSection title="Contato">
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5  !text-brand-teal text-secondary" />
                <a href={`mailto:${settings.email}`} className="text-gray-50 hover:text-white transition-colors">
                  {settings.email}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 !text-brand-teal text-secondary" />
                <a href={`tel:${settings.phone.replace(/[^\d+]/g,'')}`} className="text-gray-50 hover:text-white transition-colors">
                  {settings.phone}
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-secondary !text-brand-teal flex-shrink-0 mt-1" />
                <span className="text-gray-50">{settings.address}</span>
              </div>
            </div>
            
            {/* Newsletter */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-base font-medium mb-2">Receba novidades</h3>
              <div className="flex gap-2">
                <div className="flex-1 rounded-md overflow-hidden bg-white/10">
                  <input 
                    type="email" 
                    placeholder="Seu e-mail" 
                    className="w-full bg-transparent border-none text-white px-3 py-2 text-sm focus:outline-none focus:ring-0 placeholder:text-gray-100"
                  />
                </div>
                <Button size="sm" variant="secondary" className="flex-shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </FooterSection>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 bg-gradient-to-t from-brand-navy/80 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-300">
          <span>© {currentYear} MyServ. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <Link href="/termos" className="hover:text-white transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/cookies" className="hover:text-white transition-colors">
              Política de Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
