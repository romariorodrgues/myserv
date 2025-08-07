# 💬 Como Usar o Chat de Suporte - MyServ

## 🎯 Credenciais de Teste para Chat

### 👤 **CLIENTE** (para testar solicitações de suporte):
```
📧 Email: cliente.teste@myserv.dev
🔐 Senha: senha123
🏷️ Tipo: CLIENT
```

### 👨‍💼 **ADMIN** (para testar atendimento):
```
📧 Email: admin@myserv.dev
🔐 Senha: admin123
🏷️ Tipo: ADMIN
```

---

## 🚀 Como Acessar o Chat de Suporte

### Para CLIENTES e PRESTADORES:

#### **Método 1: Widget Flutuante (Recomendado)**
1. **Faça login** com qualquer credencial (cliente ou prestador)
2. **Acesse qualquer página** do sistema após o login
3. **Procure pelo botão flutuante** no **canto inferior direito** da tela
4. **Clique no ícone de chat** 💬
5. O widget abrirá com suas opções

#### **Método 2: Páginas Diretas**
- **Dashboard Cliente**: `/dashboard/cliente` 
- **Dashboard Prestador**: `/dashboard/profissional`
- **Página de Teste**: `/chat/test`

### Para ADMINISTRADORES:

#### **Dashboard Administrativo**
1. **Faça login** como admin: `admin@myserv.dev`
2. **Acesse**: `/admin/chat`
3. **Visualize todos os chats** pendentes e em andamento
4. **Gerencie atendimentos** em tempo real

---

## 📱 Como Usar o Widget de Chat (Clientes/Prestadores)

### **1. Criar Novo Chat de Suporte**
1. Clique no widget flutuante 💬
2. Clique em **"Novo Chat"**
3. Preencha:
   - **Título**: Assunto do seu problema
   - **Descrição**: Detalhe o que precisa
   - **Prioridade**: Escolha entre Baixa, Média, Alta ou Urgente
4. Clique **"Criar Chat"**

### **2. Continuar Chat Existente**
1. Clique no widget flutuante 💬
2. **Visualize seus chats** na lista
3. **Clique no chat** desejado
4. **Continue a conversa** em tempo real

### **3. Recursos Disponíveis**
- ✅ **Mensagens em tempo real**
- ✅ **Indicadores de digitação**
- ✅ **Status do chat** (Aberto, Em Andamento, Resolvido, Fechado)
- ✅ **Histórico completo** de conversas
- ✅ **Notificações visuais**

---

## 👨‍💼 Dashboard Administrativo (Admins)

### **Acesso**: `/admin/chat`

### **Funcionalidades**:

#### **📋 Lista de Chats**
- **Filtrar por status**: Todos, Aberto, Em Andamento, Resolvido, Fechado
- **Buscar por título**: Digite palavras-chave
- **Visualizar prioridade**: Cores indicativas
- **Ver informações do cliente**

#### **💬 Atendimento em Tempo Real**
1. **Clique em um chat** na lista lateral
2. **Visualize histórico** completo da conversa
3. **Responda em tempo real**
4. **Gerencie o status** do atendimento

#### **⚙️ Ações Administrativas**
- **🤝 Atribuir a Mim**: Assumir responsabilidade pelo chat
- **⏳ Em Andamento**: Marcar como sendo atendido
- **✅ Resolver**: Marcar problema como resolvido
- **🚫 Fechar**: Encerrar definitivamente o chat

---

## 🧪 Teste Completo do Sistema

### **Cenário 1: Cliente Solicita Suporte**
1. **Login como cliente**: `cliente.teste@myserv.dev` / `senha123`
2. **Acesse**: Qualquer página (ex: `/dashboard/cliente`)
3. **Clique no widget** flutuante 💬
4. **Crie um novo chat** com título "Problema com agendamento"
5. **Descreva o problema** e envie
6. **Aguarde** (ou simule resposta do admin)

### **Cenário 2: Admin Atende Suporte**
1. **Abra nova aba** (ou novo navegador)
2. **Login como admin**: `admin@myserv.dev` / `admin123`
3. **Acesse**: `/admin/chat`
4. **Visualize o novo chat** na lista
5. **Clique no chat** do cliente
6. **Atribua a si mesmo**
7. **Mude status** para "Em Andamento"
8. **Responda ao cliente** em tempo real
9. **Resolva** quando apropriado

### **Cenário 3: Teste em Tempo Real**
1. **Mantenha ambas as abas abertas**
2. **Digite mensagens** em qualquer uma
3. **Observe mensagens** aparecendo instantaneamente
4. **Teste indicadores** de digitação
5. **Teste mudanças** de status

---

## 📍 Localizações do Chat

### **Widget Flutuante Aparece Em:**
- ✅ Dashboard do Cliente (`/dashboard/cliente`)
- ✅ Dashboard do Prestador (`/dashboard/profissional`)
- ✅ Todas as páginas após login (global)

### **Páginas Específicas:**
- 🧪 **Teste**: `/chat/test` (demonstração)
- 👨‍💼 **Admin**: `/admin/chat` (dashboard completo)

---

## 🎨 Status e Cores

### **Status dos Chats:**
- 🟦 **ABERTO** - Aguardando atendimento
- 🟨 **EM_ANDAMENTO** - Sendo atendido
- 🟩 **RESOLVIDO** - Problema solucionado  
- ⬜ **FECHADO** - Chat encerrado

### **Prioridades:**
- ⬜ **BAIXA** - Cinza
- 🟦 **MÉDIA** - Azul  
- 🟧 **ALTA** - Laranja
- 🟥 **URGENTE** - Vermelho

---

## ⚡ Sistema Totalmente Funcional!

O chat de suporte está **100% operacional** com:
- ✅ Comunicação em tempo real via WebSocket
- ✅ Interface responsiva e moderna
- ✅ Gestão completa de estados
- ✅ Dashboard administrativo profissional
- ✅ Widget flutuante integrado
- ✅ Banco de dados persistente

**🚀 Pronto para uso em produção!**
