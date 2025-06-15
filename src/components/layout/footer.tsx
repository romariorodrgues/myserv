/**
 * Footer component for MyServ platform
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 * 
 * Main footer with links and company information
 */

import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">MS</span>
              </div>
              <span className="ml-2 text-xl font-bold">MyServ</span>
            </div>
            <p className="text-gray-300 text-sm">
              Conectamos você aos melhores profissionais da sua região. 
              Encontre o serviço que precisa de forma rápida e segura.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-300 hover:text-blue-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-300 hover:text-blue-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-300 hover:text-blue-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* For Clients */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Para Clientes</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/como-funciona" className="text-gray-300 hover:text-white transition-colors">
                  Como funciona
                </Link>
              </li>
              <li>
                <Link href="/categorias" className="text-gray-300 hover:text-white transition-colors">
                  Categorias de serviços
                </Link>
              </li>
              <li>
                <Link href="/dicas" className="text-gray-300 hover:text-white transition-colors">
                  Dicas e tutoriais
                </Link>
              </li>
              <li>
                <Link href="/seguranca" className="text-gray-300 hover:text-white transition-colors">
                  Segurança
                </Link>
              </li>
            </ul>
          </div>

          {/* For Professionals */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Para Profissionais</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/seja-profissional" className="text-gray-300 hover:text-white transition-colors">
                  Seja um profissional
                </Link>
              </li>
              <li>
                <Link href="/planos" className="text-gray-300 hover:text-white transition-colors">
                  Planos e preços
                </Link>
              </li>
              <li>
                <Link href="/central-ajuda" className="text-gray-300 hover:text-white transition-colors">
                  Central de ajuda
                </Link>
              </li>
              <li>
                <Link href="/sucesso" className="text-gray-300 hover:text-white transition-colors">
                  Histórias de sucesso
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contato</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <a href="mailto:contato@myserv.com.br" className="text-gray-300 hover:text-white transition-colors">
                  contato@myserv.com.br
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-blue-400" />
                <a href="tel:+5511999999999" className="text-gray-300 hover:text-white transition-colors">
                  (11) 99999-9999
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">
                  São Paulo, SP - Brasil
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-300">
              © 2025 MyServ. Todos os direitos reservados.
            </div>
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm">
              <Link href="/termos" className="text-gray-300 hover:text-white transition-colors">
                Termos de uso
              </Link>
              <Link href="/privacidade" className="text-gray-300 hover:text-white transition-colors">
                Política de privacidade
              </Link>
              <Link href="/cookies" className="text-gray-300 hover:text-white transition-colors">
                Política de cookies
              </Link>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-400 text-center">
            Desenvolvido por Romário Rodrigues - romariorodrigues.dev@gmail.com
          </div>
        </div>
      </div>
    </footer>
  )
}
