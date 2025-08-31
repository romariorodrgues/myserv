# 💬 Sistema de Chat de Suporte - MyServ

## 📋 Visão Geral

O sistema de chat de suporte do MyServ é uma solução completa de comunicação em tempo real entre clientes/prestadores e administradores. Implementa funcionalidades modernas como tempo real (via polling), múltiplos chats por usuário, organização por status e prioridade, e interface responsiva.

## 🏗️ Arquitetura do Sistema

### **Componentes Principais**

```
📁 Sistema de Chat
├── 🎯 Frontend
│   ├── SupportChatWidget.tsx      # Widget flutuante para clientes/prestadores
│   ├── AdminChatDashboard.tsx     # Dashboard completo para admins
│   └── use-support-chat.ts        # Hook para gerenciamento de estado
├── 🔧 Backend  
│   ├── /api/chat                  # CRUD de chats (clientes)
│   ├── /api/chat/admin/list       # Lista todos os chats (admin)
│   ├── /api/chat/[chatId]         # Operações específicas do chat
│   ├── /api/chat/[chatId]/messages # Gerenciamento de mensagens
│   └── /api/socket                # Socket.io para tempo real
├── 🗃️ Dados
│   ├── SupportChat               # Modelo principal do chat
│   ├── SupportMessage           # Mensagens do chat
│   └── SupportAssignment        # Atribuições admin-chat
└── 🔄 Estado
    └── chat-store.ts            # Gerenciamento global de estado (Zustand)
```

## 🎭 Tipos de Usuário

### **👤 Cliente/Prestador**
- ✅ Pode criar múltiplos chats de suporte
- ✅ Envia mensagens e recebe respostas dos admins
- ✅ Visualiza status do atendimento (Aberto, Em Atendimento, Fechado)
- ✅ Interface via widget flutuante no canto inferior direito

### **👨‍💼 Administrador**
- ✅ Visualiza todos os chats da plataforma
- ✅ Pode responder mensagens de qualquer chat
- ✅ Altera status (Aberto → Em Atendimento → Fechado)
- ✅ Filtra chats por status e busca por cliente
- ✅ Interface via dashboard dedicado `/admin/chat`

## 📊 Status e Fluxo de Atendimento

### **Status Disponíveis**
```typescript
type ChatStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED'
```

| Status | Descrição | Quem Pode Alterar |
|--------|-----------|-------------------|
| `OPEN` | Chat criado, aguardando atendimento | Sistema (auto) |
| `IN_PROGRESS` | Admin respondeu, atendimento ativo | Admin |
| `CLOSED` | Atendimento finalizado | Admin |

### **Prioridades**
```typescript
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
```

## 🛠️ Funcionalidades Técnicas

### **⚡ Tempo Real**
- **Implementação**: Sistema híbrido Socket.io + Polling
- **Polling Cliente**: 2 segundos para mensagens, 3 segundos para status
- **Polling Admin**: 1.5 segundos para mensagens, 5 segundos para lista
- **Fallback**: Quando Socket.io falha, polling garante sincronização

### **💾 Persistência**
```sql
-- Modelo SupportChat
model SupportChat {
  id          String     @id @default(cuid())
  userId      String     -- Cliente ou Prestador
  subject     String?    -- Título/Assunto
  status      ChatStatus @default(OPEN)
  priority    Priority   @default(MEDIUM)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  closedAt    DateTime?
  closedBy    String?    -- Admin que fechou
}

-- Modelo SupportMessage
model SupportMessage {
  id          String      @id @default(cuid())
  chatId      String
  senderId    String      -- User ID ou 'system'
  content     String
  type        MessageType @default(TEXT)
  isFromAdmin Boolean     @default(false)
  createdAt   DateTime    @default(now())
}
```

## 🎨 Interface do Usuário

### **🎯 SupportChatWidget (Cliente)**

#### **Estados do Widget**
1. **Fechado**: Botão flutuante com badge de notificação
2. **Minimizado**: Barra de título com controles
3. **Aberto**: Interface completa com lista de chats e mensagens

#### **Funcionalidades**
- 📝 Criar novo chat (título + descrição)
- 💬 Enviar/receber mensagens em tempo real
- 📋 Lista histórico de chats do usuário
- 🔔 Notificações visuais (badge, animações)
- 🚫 Bloqueio automático quando chat é fechado

```typescript
// Exemplo de uso
<SupportChatWidget initialMessage="Preciso de ajuda com..." />
```

### **🎛️ AdminChatDashboard (Admin)**

#### **Layout**
- **Sidebar Esquerda**: Lista de todos os chats com filtros
- **Área Central**: Mensagens do chat selecionado
- **Controles**: Botões para alterar status e prioridade

#### **Funcionalidades**
- 🔍 Busca por nome do cliente
- 🏷️ Filtro por status (Todos, Aberto, Em Atendimento, Fechado)
- 📊 Estatísticas rápidas (contadores por status)
- ⚡ Atualização automática via polling
- 🎯 Resposta direta aos clientes

## 🔄 Fluxo de Uso Completo

### **📝 Criação de Chat (Cliente)**
1. Cliente clica no widget flutuante
2. Seleciona "Novo Chat de Suporte"
3. Preenche título e descrição detalhada
4. Sistema cria chat com status `OPEN`
5. Descrição vira primeira mensagem do chat

### **💼 Atendimento (Admin)**
1. Admin acessa `/admin/chat`
2. Visualiza lista de chats ordenada por prioridade
3. Seleciona chat para atender
4. Responde mensagem (status muda para `IN_PROGRESS`)
5. Continua conversação até resolução
6. Clica "Resolver" (status muda para `CLOSED`)

### **✅ Encerramento Automático**
1. Admin marca chat como resolvido
2. Sistema adiciona mensagem automática
3. Cliente recebe notificação via polling (3s)
4. Interface do cliente mostra "Atendimento finalizado"
5. Campo de mensagem é substituído por botão "Novo Atendimento"

## 🚀 APIs Disponíveis

### **Cliente/Prestador**
```typescript
// Listar chats do usuário
GET /api/chat?status=OPEN

// Criar novo chat  
POST /api/chat
Body: { title: string, description: string, priority?: Priority }

// Enviar mensagem
POST /api/chat/[chatId]/messages
Body: { content: string, type: 'TEXT' | 'IMAGE' | 'FILE' }

// Obter mensagens
GET /api/chat/[chatId]/messages?page=1&limit=50
```

### **Administrador**
```typescript
// Listar todos os chats
GET /api/chat/admin/list?status=OPEN&search=cliente

// Atualizar status do chat
PATCH /api/chat/[chatId]
Body: { status: ChatStatus, priority?: Priority }

// Atribuir chat a admin
POST /api/chat/[chatId]/assign
Body: { adminId: string }
```

## 🎯 Recursos Avançados

### **🔔 Sistema de Notificações**
- Badge com contador de chats não resolvidos
- Animações (pulse, bounce) para chamar atenção
- Cores da marca MyServ (brand-navy, brand-cyan, brand-teal)

### **💬 Mensagens do Sistema**
- Mensagens automáticas para eventos importantes
- Estilo visual diferenciado (fundo laranja, ícone 🔔)
- Não contam como mensagens regulares

### **📱 Responsividade**
- Widget adaptável a diferentes tamanhos de tela
- Interface admin otimizada para desktop
- Suporte a toque em dispositivos móveis

## 🔧 Configuração e Customização

### **🎨 Cores e Branding**
```css
/* Cores principais do sistema */
--brand-navy: #001e5c
--brand-cyan: #00a9d4  
--brand-teal: #33d8b6
```

### **⏱️ Intervalos de Polling**
```typescript
// Configurável em use-support-chat.ts
const POLL_MESSAGES_INTERVAL = 2000    // 2 segundos
const POLL_STATUS_INTERVAL = 3000      // 3 segundos
const POLL_ADMIN_INTERVAL = 1500       // 1.5 segundos
```

### **📊 Limites e Paginação**
```typescript
const DEFAULT_MESSAGE_LIMIT = 50       // Mensagens por página
const MAX_MESSAGE_LENGTH = 2000        // Caracteres por mensagem
const MAX_TITLE_LENGTH = 200           // Caracteres no título
```

## 🐛 Debugging e Logs

### **Console Logs Disponíveis**
```javascript
// Cliente
"SupportChatWidget - Socket status: connected"
"Starting polling for chat: cme0xxx"
"Polling found new messages, updating..."
"Chat status changed from OPEN to CLOSED"

// Admin  
"Admin: Starting polling for chat: cme0xxx"
"Admin closed chat, adding system message"
"Admin: Polling found new messages, updating..."
```

### **Network Tab (DevTools)**
```
GET /api/chat? 200                      // Lista de chats
GET /api/chat/[id]/messages 200         // Mensagens
GET /api/chat/admin/list? 200           // Lista admin
PATCH /api/chat/[id] 200                // Atualização status
```

## 🔒 Segurança e Permissões

### **Autenticação**
- Todas as rotas requerem sessão NextAuth válida
- Verificação de userType para rotas administrativas
- Isolamento de dados por usuário

### **Autorização**
```typescript
// Apenas donos ou admins atribuídos podem acessar chat
const hasAccess = chat.userId === session.user.id || 
                  chat.assignments.some(a => a.adminId === session.user.id)
```

## 📈 Métricas e Analytics

### **Estatísticas Disponíveis**
- Total de chats por status
- Tempo médio de resposta
- Chats atribuídos por admin
- Volume de mensagens por período

### **Relatórios**
- Acessíveis via dashboard admin
- Exportação de dados históricos
- Análise de performance do atendimento

## 🚦 Status do Sistema

### **✅ Funcionalidades Implementadas**
- [x] Criação e gerenciamento de chats
- [x] Troca de mensagens em tempo real
- [x] Interface administrativa completa
- [x] Sistema de status e prioridades
- [x] Múltiplos chats por usuário
- [x] Encerramento automático
- [x] Polling como fallback
- [x] Mensagens do sistema
- [x] Responsividade

### **🔮 Próximas Funcionalidades**
- [ ] Upload de arquivos/imagens
- [ ] Sistema de avaliação pós-atendimento
- [ ] Notificações push
- [ ] Chatbot com IA para respostas automáticas
- [ ] Integração com WhatsApp Business
- [ ] Analytics avançados
- [ ] Templates de resposta para admins

## 🏁 Conclusão

O sistema de chat de suporte do MyServ oferece uma solução robusta e escalável para atendimento ao cliente. Com tempo real via polling, interface intuitiva e funcionalidades administrativas completas, proporciona uma experiência de comunicação eficiente tanto para usuários quanto para a equipe de suporte.

---

**Desenvolvido para MyServ Platform**  
*Sistema de marketplace de serviços com chat de suporte integrado*

**Autor**: Romário Rodrigues  
**Data**: Agosto 2025  
**Versão**: 1.0.0
