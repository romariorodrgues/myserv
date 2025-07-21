# 🔌 Integrações Externas MyServ

Este documento descreve todas as integrações externas implementadas na plataforma MyServ.

## 📋 **Resumo das Integrações**

### ✅ **Implementadas**
- 💳 **Pagamentos**: MercadoPago e Pagar.me
- 📱 **WhatsApp**: ChatPro API
- 📧 **Email**: SMTP (Gmail, Outlook, etc.)
- 🗺️ **Mapas**: Google Maps API
- 🔔 **Notificações**: Sistema interno com WhatsApp + Email

### 🎯 **APIs Criadas**
- `/api/payments` - Processamento de pagamentos
- `/api/payments/webhook` - Webhook para status de pagamentos
- `/api/notifications` - Sistema de notificações
- `/api/integrations/test` - Teste das integrações

---

## 💳 **Sistema de Pagamentos**

### **MercadoPago**
```typescript
// Criar preferência de pagamento
const paymentData = {
  amount: 100.00,
  description: "Limpeza Residencial",
  payerEmail: "cliente@email.com",
  payerName: "João Silva",
  externalReference: "booking_123"
}

const result = await PaymentService.createMercadoPagoPreference(paymentData)
```

### **Variáveis de Ambiente Necessárias**
```bash
MERCADOPAGO_ACCESS_TOKEN=TEST-your-access-token
MERCADOPAGO_PUBLIC_KEY=TEST-your-public-key
MERCADOPAGO_WEBHOOK_SECRET=your-webhook-secret
PAGARME_API_KEY=ak_test_your-api-key
PAGARME_ENCRYPTION_KEY=ek_test_your-encryption-key
```

### **Funcionalidades**
- ✅ Criação de preferências de pagamento
- ✅ Processamento direto com cartão
- ✅ Webhook para status updates
- ✅ Cálculo automático de taxas e comissões
- ✅ Suporte a PIX, cartão, boleto
- ✅ Parcelamento até 12x

---

## 📱 **WhatsApp Notifications**

### **ChatPro API**
```typescript
// Enviar notificação de nova reserva
await WhatsAppService.notifyBookingRequest({
  userPhone: "11999999999",
  userName: "Maria Santos",
  serviceName: "Limpeza Residencial",
  clientName: "João Silva",
  scheduledDate: "15/06/2025"
})
```

### **Variáveis de Ambiente**
```bash
CHATPRO_API_URL=https://api.chatpro.com.br
CHATPRO_API_KEY=your-chatpro-api-key
CHATPRO_PHONE_NUMBER=5511999999999
```

### **Tipos de Notificação**
- 🎉 **Boas-vindas**: Novo usuário cadastrado
- 🔔 **Nova Solicitação**: Para profissionais
- ✅ **Reserva Aceita**: Para clientes
- ❌ **Reserva Recusada**: Para clientes
- 🎉 **Serviço Concluído**: Para clientes
- 💳 **Lembrete de Pagamento**: Para clientes

---

## 📧 **Sistema de Email**

### **SMTP Configuration**
```typescript
// Enviar email de confirmação
await EmailService.sendBookingConfirmationEmail({
  userEmail: "cliente@email.com",
  userName: "João Silva",
  serviceName: "Limpeza Residencial",
  providerName: "Maria Santos",
  scheduledDate: "15/06/2025",
  amount: 150.00
})
```

### **Variáveis de Ambiente**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### **Templates Disponíveis**
- 🎉 Email de boas-vindas
- ✅ Confirmação de reserva
- ❌ Rejeição de reserva
- 🎉 Serviço concluído
- 💳 Lembrete de pagamento
- 🔔 Nova solicitação (profissional)

---

## 🗺️ **Google Maps Integration**

### **Funcionalidades**
```typescript
// Geocodificar endereço
const location = await GoogleMapsService.geocodeAddress(
  "Rua das Flores, 123, São Paulo, SP"
)

// Calcular distância
const distance = await GoogleMapsService.calculateDistance(
  { lat: -23.5505, lng: -46.6333 },
  { lat: -23.5629, lng: -46.6544 }
)

// Buscar endereços
const suggestions = await GoogleMapsService.searchPlaces(
  "Rua das Flores", 
  { lat: -23.5505, lng: -46.6333 }
)
```

### **Variáveis de Ambiente**
```bash
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### **Recursos**
- 🔍 Busca de endereços com autocomplete
- 📍 Geocodificação e reverse geocoding
- 📏 Cálculo de distâncias
- 🎯 Detecção de localização atual
- 🌍 Validação de área de atendimento (Brasil)

---

## 🔔 **Sistema de Notificações**

### **API Endpoints**

#### **Enviar Notificação**
```bash
POST /api/notifications
{
  "type": "booking_confirmed",
  "userId": "user_123",
  "bookingId": "booking_456",
  "channels": ["whatsapp", "email"]
}
```

#### **Buscar Notificações**
```bash
GET /api/notifications?userId=user_123&unreadOnly=true
```

#### **Marcar como Lida**
```bash
PATCH /api/notifications
{
  "notificationIds": ["notif_1", "notif_2"],
  "markAsRead": true
}
```

### **Componente React**
```tsx
import { NotificationsComponent } from '@/components/notifications/notifications'

<NotificationsComponent 
  userId="current-user"
  showHeader={true}
  maxItems={10}
/>
```

---

## 🧪 **Testando as Integrações**

### **1. Acesse a Página de Teste**
```
http://localhost:3002/admin/integrations
```

### **2. Configure os Dados de Teste**
- **Telefone**: 11999999999
- **Email**: seu-email@gmail.com
- **Endereço**: Rua das Flores, 123, São Paulo
- **Valor**: R$ 50,00

### **3. Teste Cada Integração**
- Clique em "Testar Integração" para cada serviço
- Verifique os resultados na seção "Resultados dos Testes"

### **4. API de Teste Direta**
```bash
# Testar WhatsApp
curl -X POST http://localhost:3002/api/integrations/test \
  -H "Content-Type: application/json" \
  -d '{
    "service": "whatsapp",
    "testData": {
      "phone": "11999999999"
    }
  }'

# Testar Email
curl -X POST http://localhost:3002/api/integrations/test \
  -H "Content-Type: application/json" \
  -d '{
    "service": "email",
    "testData": {
      "email": "teste@gmail.com"
    }
  }'
```

---

## ⚙️ **Configuração de Produção**

### **1. Variáveis de Ambiente**
```bash
# Copie o arquivo de exemplo
cp .env.local.example .env.local

# Configure as variáveis reais
nano .env.local
```

### **2. MercadoPago (Produção)**
```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-your-production-token
MERCADOPAGO_PUBLIC_KEY=APP_USR-your-production-public-key
```

### **3. ChatPro (Produção)**
```bash
CHATPRO_API_URL=https://api.chatpro.com.br
CHATPRO_API_KEY=your-production-api-key
CHATPRO_PHONE_NUMBER=5511999999999
```

### **4. Google Maps**
```bash
GOOGLE_MAPS_API_KEY=your-production-api-key
```

### **5. SMTP (Gmail)**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@myserv.com.br
SMTP_PASSWORD=your-app-password
```

---

## 📊 **Monitoramento**

### **Logs de Integração**
- Todos os erros são logados no console
- Webhooks são logados para debug
- Status de envio é trackado

### **Métricas Importantes**
- Taxa de sucesso de notificações
- Tempo de resposta dos webhooks
- Falhas de pagamento
- Erros de geocodificação

### **Alertas Recomendados**
- Falha em webhook de pagamento
- Taxa de erro > 5% em notificações
- API de mapas com muitos erros 429
- SMTP com falhas de autenticação

---

## 🚀 **Próximos Passos**

### **Melhorias Planejadas**
- [ ] Cache para geocodificação
- [ ] Retry automático para notificações
- [ ] Dashboard de métricas em tempo real
- [ ] Múltiplos provedores de SMS
- [ ] Integração com Stripe
- [ ] Push notifications mobile

### **Integração com Apps Mobile**
- [ ] Deep links para apps
- [ ] Push notifications nativas
- [ ] Compartilhamento de localização
- [ ] Pagamentos in-app

---

## 📞 **Suporte**

Para dúvidas sobre as integrações:

**Autor**: Romário Rodrigues  
**Email**: romariorodrigues.dev@gmail.com  
**GitHub**: [MyServ Platform](https://github.com/romariorodrigues)

**Documentação Adicional**:
- [MercadoPago Docs](https://www.mercadopago.com.br/developers)
- [Google Maps API](https://developers.google.com/maps)
- [ChatPro API](https://chatpro.com.br/api-docs)

---

*Última atualização: 10 de junho de 2025*
