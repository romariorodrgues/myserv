/**
 * Test file to demonstrate import resolution
 * Author: Romário Rodrigues <romariorodrigues.dev@gmail.com>
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClientHistory } from '@/components/dashboard/client-history'
import { ClientFavorites } from '@/components/dashboard/client-favorites'
import { ClientProfileSettings } from '@/components/dashboard/client-profile-settings'
import { BookingWhatsAppContact } from '@/components/whatsapp/booking-whatsapp-contact'

export default function TestPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Teste de Imports - Resolvido</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Componentes Importados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button>Botão funcionando</Button>
            <Badge>Badge funcionando</Badge>
            <p>✅ Todos os imports foram resolvidos com sucesso!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
