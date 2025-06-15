/**
 * Temporary Client Dashboard page for testing imports
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

export default function ClientDashboardTempPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard do Cliente - Teste</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Teste de Componentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button>Botão de Teste</Button>
            <Badge>Badge de Teste</Badge>
            <p>Todos os componentes estão sendo importados corretamente!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
