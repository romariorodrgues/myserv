# 💬 Sistema de Chat de Suporte - MyServ

**Autor:** Romário Rodrigues  
**Data:** 6 de agosto de 2025  
**Versão:** 1.0

---

## 🎯 **Objetivo**

Implementar sistema de chat em tempo real para suporte entre usuários (clientes/prestadores) e operadores administrativos da plataforma MyServ.

## 📋 **Requisitos Funcionais**

### **Para Usuários (Cliente/Prestador):**
- ✅ Botão "Suporte" sempre visível na dashboard
- ✅ Chat em tempo real com operadores
- ✅ Widget flutuante que não interfere na navegação
- ✅ Histórico completo de conversas
- ✅ Indicador de status online/offline dos operadores
- ✅ Possibilidade de fechar/minimizar chat

### **Para Admins/Operadores:**
- ✅ Dashboard centralizado de suporte
- ✅ Múltiplas conversas simultâneas
- ✅ Sistema de assignment/atribuição de chats
- ✅ Sistema de prioridades (LOW, MEDIUM, HIGH, URGENT)
- ✅ Métricas de atendimento em tempo real
- ✅ Status online/offline configurável
- ✅ Notificações de novos chats

## 🏗️ **Arquitetura Técnica**

### **Stack Tecnológico:**
- **Backend:** Next.js API Routes + Socket.io
- **Frontend:** React + TypeScript
- **Banco:** SQLite (Prisma)
- **Tempo Real:** Socket.io WebSockets
- **Estado:** Zustand + React Query
- **UI:** Tailwind CSS + Shadcn/ui

### **Estrutura de Dados:**

```sql
-- Chat de Suporte
model SupportChat {
  id          String     @id @default(cuid())
  userId      String     // Cliente ou Prestador
  status      ChatStatus @default(OPEN) // OPEN, IN_PROGRESS, CLOSED
  priority    Priority   @default(MEDIUM) // LOW, MEDIUM, HIGH, URGENT
  subject     String?    // Assunto do suporte
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  closedAt    DateTime?
  closedBy    String?    // Admin que fechou
  
  user        User       @relation(fields: [userId], references: [id])
  messages    SupportMessage[]
  assignments SupportAssignment[]
  
  @@map("support_chats")
}

model SupportMessage {
  id          String   @id @default(cuid())
  chatId      String
  senderId    String   // Quem enviou (user ou admin)
  content     String
  type        MessageType @default(TEXT) // TEXT, IMAGE, FILE
  isFromAdmin Boolean  @default(false)
  readAt      DateTime?
  createdAt   DateTime @default(now())
  
  chat        SupportChat @relation(fields: [chatId], references: [id], onDelete: Cascade)
  sender      User        @relation(fields: [senderId], references: [id])
  
  @@map("support_messages")
}

model SupportAssignment {
  id         String   @id @default(cuid())
  chatId     String
  adminId    String
  assignedAt DateTime @default(now())
  isActive   Boolean  @default(true)
  
  chat       SupportChat @relation(fields: [chatId], references: [id], onDelete: Cascade)
  admin      User        @relation(fields: [adminId], references: [id])
  
  @@map("support_assignments")
}

-- Enums
enum ChatStatus {
  OPEN
  IN_PROGRESS
  CLOSED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum MessageType {
  TEXT
  IMAGE
  FILE
}
```

## 📁 **Estrutura de Arquivos**

```
src/
├── components/
│   └── chat/
│       ├── support-chat-widget.tsx          // Widget flutuante (usuários)
│       ├── support-chat-interface.tsx       // Interface completa do chat
│       ├── admin-chat-dashboard.tsx         // Dashboard admin
│       ├── chat-message.tsx                 // Componente de mensagem
│       ├── chat-list.tsx                    // Lista de chats ativos
│       ├── chat-assignment.tsx              // Componente de atribuição
│       └── chat-metrics.tsx                 // Métricas de atendimento
├── hooks/
│   ├── use-support-chat.ts                  // Hook principal do chat
│   ├── use-socket.ts                        // Conexão WebSocket
│   ├── use-chat-messages.ts                 // Gerenciamento de mensagens
│   └── use-admin-chats.ts                   // Hook para dashboard admin
├── lib/
│   ├── socket.ts                            // Cliente Socket.io
│   ├── chat-utils.ts                        // Utilitários do chat
│   └── chat-store.ts                        // Store Zustand
├── app/api/
│   ├── chat/
│   │   ├── route.ts                         // CRUD de chats
│   │   ├── [chatId]/
│   │   │   ├── route.ts                     // Operações específicas do chat
│   │   │   ├── messages/route.ts            // CRUD de mensagens
│   │   │   ├── assign/route.ts              // Atribuir chat a admin
│   │   │   └── close/route.ts               // Fechar chat
│   │   └── admin/
│   │       ├── active/route.ts              // Chats ativos para admin
│   │       └── metrics/route.ts             // Métricas de atendimento
│   └── socket/
│       └── route.ts                         // Handler WebSocket
└── app/
    ├── admin/
    │   └── suporte/
    │       └── page.tsx                     // Página de suporte admin
    └── (dashboard)/
        └── suporte/
            └── page.tsx                     // Página de suporte usuário (opcional)
```

## 🔄 **Fluxos de Uso**

### **Fluxo do Usuário (Cliente/Prestador):**

1. **Iniciar Chat:**
   - Clica em botão "Suporte" na dashboard
   - Widget de chat abre no canto inferior direito
   - Se não tem chat ativo, cria novo automaticamente

2. **Conversar:**
   - Digita mensagem no campo de texto
   - Pressiona Enter ou clica "Enviar"
   - Mensagem enviada instantaneamente via WebSocket
   - Vê indicador "digitando..." quando admin responde

3. **Finalizar:**
   - Pode minimizar widget (chat continua ativo)
   - Admin pode fechar chat quando resolvido
   - Usuário recebe notificação de chat fechado

### **Fluxo do Admin/Operador:**

1. **Dashboard de Suporte:**
   - Acessa `/admin/suporte`
   - Vê lista de chats ativos organizados por prioridade
   - Métricas em tempo real (chats abertos, tempo médio, etc.)

2. **Atender Chat:**
   - Clica em chat da lista ou recebe notificação
   - Chat se abre em interface dedicada
   - Pode fazer assignment para si mesmo
   - Responde em tempo real

3. **Gerenciar:**
   - Pode alterar prioridade do chat
   - Fazer anotações internas
   - Transferir para outro operador
   - Fechar quando resolvido

## 💻 **Componentes Principais**

### **1. SupportChatWidget (Usuários)**

```tsx
interface SupportChatWidgetProps {
  userId: string
  userType: 'CLIENT' | 'SERVICE_PROVIDER'
}

// Funcionalidades:
// - Widget flutuante responsivo
// - Auto-conecta WebSocket
// - Cria chat automaticamente se necessário
// - Interface minimalista e amigável
// - Botão minimizar/expandir
```

### **2. AdminChatDashboard (Admins)**

```tsx
interface AdminChatDashboardProps {
  adminId: string
}

// Funcionalidades:
// - Lista de chats ativos
// - Filtros por status/prioridade
// - Métricas em tempo real
// - Interface multi-chat
// - Sistema de notificações
```

### **3. ChatMessage (Compartilhado)**

```tsx
interface ChatMessageProps {
  message: SupportMessage
  isFromCurrentUser: boolean
  showAvatar?: boolean
}

// Funcionalidades:
// - Exibição de mensagens
// - Indicadores de leitura
// - Timestamp formatado
// - Suporte a diferentes tipos (texto/imagem/arquivo)
```

## 🔌 **APIs Necessárias**

### **REST Endpoints:**

```typescript
// GET /api/chat - Listar chats do usuário
// POST /api/chat - Criar novo chat
// GET /api/chat/[chatId] - Obter chat específico
// PATCH /api/chat/[chatId] - Atualizar chat (status, prioridade)
// DELETE /api/chat/[chatId] - Fechar chat

// GET /api/chat/[chatId]/messages - Listar mensagens
// POST /api/chat/[chatId]/messages - Enviar mensagem
// PATCH /api/chat/[chatId]/messages/[messageId]/read - Marcar como lida

// POST /api/chat/[chatId]/assign - Atribuir chat a admin
// POST /api/chat/[chatId]/close - Fechar chat

// GET /api/chat/admin/active - Chats ativos (para admins)
// GET /api/chat/admin/metrics - Métricas de atendimento
```

### **WebSocket Events:**

```typescript
// Client -> Server
'join-chat' // Entrar em sala de chat específico
'send-message' // Enviar mensagem
'typing-start' // Começou a digitar
'typing-stop' // Parou de digitar
'mark-read' // Marcar mensagem como lida

// Server -> Client
'message-received' // Nova mensagem recebida
'message-sent' // Confirmação de envio
'user-typing' // Outro usuário digitando
'chat-assigned' // Chat foi atribuído
'chat-closed' // Chat foi fechado
'user-joined' // Usuário entrou no chat
'user-left' // Usuário saiu do chat
```

## 📊 **Métricas e Analytics**

### **Métricas para Dashboard Admin:**

- **📈 Tempo Real:**
  - Chats ativos agora
  - Operadores online
  - Tempo médio de primeira resposta
  - Tempo médio de resolução

- **📊 Estatísticas Diárias:**
  - Total de chats criados
  - Chats resolvidos
  - Satisfação média (se implementado)
  - Picos de demanda

- **👥 Performance por Operador:**
  - Chats atendidos
  - Tempo médio de resposta
  - Taxa de resolução

## 🎨 **Design e UX**

### **Widget do Usuário:**
- **Posição:** Canto inferior direito (fixo)
- **Tamanho:** 350px width x 500px height (expandido)
- **Cores:** Tema consistent com MyServ
- **Responsivo:** Adapta para mobile
- **Animações:** Suaves para abrir/fechar

### **Dashboard Admin:**
- **Layout:** Sidebar com chats + área principal de conversa
- **Cores:** Indicadores visuais por prioridade
- **Organização:** Chats ordenados por urgência/tempo
- **Multi-tasking:** Abas para múltiplos chats

## ⚡ **Funcionalidades Avançadas (Futuras)**

### **Fase 2 (Opcional):**
- 📎 Upload de arquivos/imagens
- 🤖 Respostas automáticas/chatbot
- 📋 Templates de respostas
- 📊 Sistema de avaliação do atendimento
- 🔔 Notificações push
- 📱 PWA para operadores

### **Fase 3 (Opcional):**
- 🌐 Suporte multi-idioma
- 📈 Analytics avançados
- 🔗 Integração com CRM
- 🎵 Notificações sonoras
- 📱 App mobile nativo

## 🚀 **Cronograma de Desenvolvimento**

### **Semana 1: Fundação**
- ✅ Schema do banco de dados
- ✅ APIs REST básicas
- ✅ Configuração Socket.io
- ✅ Hooks básicos

### **Semana 2: Interface Usuário**
- ✅ SupportChatWidget
- ✅ ChatMessage component
- ✅ Integração WebSocket client-side
- ✅ Testes básicos

### **Semana 3: Dashboard Admin**
- ✅ AdminChatDashboard
- ✅ Sistema de assignment
- ✅ Métricas básicas
- ✅ Interface multi-chat

### **Semana 4: Refinamento**
- ✅ Testes integração
- ✅ Otimizações performance
- ✅ Documentação final
- ✅ Deploy e monitoramento

**Total Estimado: 4 semanas**

## 🔒 **Considerações de Segurança**

- **Autenticação:** Todos os endpoints protegidos por sessão
- **Autorização:** Admins só veem chats atribuídos ou disponíveis
- **Validação:** Input sanitization em todas as mensagens
- **Rate Limiting:** Prevenir spam de mensagens
- **Logs:** Auditoria completa de todas as ações

## 📝 **Notas de Implementação**

- **Compatibilidade:** Sistema funciona sem WebSocket (fallback para polling)
- **Performance:** Mensagens paginadas para chats longos
- **Escalabilidade:** Preparado para Redis como message broker
- **Monitoramento:** Logs detalhados para debugging
- **Backup:** Mensagens preservadas mesmo após fechamento do chat

---

**Status:** 📋 **DOCUMENTAÇÃO COMPLETA - PRONTO PARA DESENVOLVIMENTO**

**Próximo Passo:** Iniciar implementação com criação do schema do banco de dados e APIs básicas.

---

*Desenvolvido para MyServ Platform - Sistema de Chat de Suporte v1.0*
