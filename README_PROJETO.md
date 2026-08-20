# 🎓 SEN.AI - Assistente Educacional

## 📋 **Configuração e Execução**

### **Pré-requisitos:**
- Node.js 18+
- npm ou yarn

### **Instalação:**
```bash
cd aluno-app
npm install
```

### **Configuração (.env):**
```env
VITE_X_DEV_USER={{x-dev-user}}
```

### **Executar:**
```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🔧 **Configurações Principais**

### **Backend API:**
- **Desenvolvimento**: Proxy `/api` → Cloud Run
- **Produção**: `https://backend-311313028224.southamerica-east1.run.app/api`
- **Headers**: `x-dev-user: {{x-dev-user}}`
- **Idioma**: `language: pt-BR` (forçar português)

### **Endpoints Utilizados:**
```javascript
POST /api/chat                    // Iniciar conversa
POST /api/chat/{id}/message       // Enviar mensagem
GET  /api/chat/stream/{id}         // Streaming resposta
GET  /api/chat/history             // Carregar histórico
GET  /api/chat/history/{id}        // Carregar conversa específica
PATCH /api/chat/{id}/title         // Renomear conversa
POST /api/chat/history                // Salvar conversa
POST /api/chat/feedback            // Enviar feedback
```

## ✅ **Funcionalidades Implementadas**

### **1. Sistema de Chat:**
- Interface de conversa em tempo real
- Streaming de respostas da IA
- Mensagens com timestamp
- Feedback (like/dislike)
- Cópia de mensagens

### **2. Validação de Escopo:**
- IA responde apenas sobre conteúdo do curso
- Rejeita perguntas fora do escopo
- Sempre exibe referências obrigatórias
- Formato de resposta estruturado

### **3. Histórico de Conversas:**
- Carregamento automático na inicialização
- Títulos no formato "Chat DD/MM/AAAA"
- Edição de títulos com sincronização
- Salvamento automático das conversas
- Sidebar com lista organizada por data

### **4. Tratamento de Erros:**
- Erro 500: Mensagem educativa para o usuário
- CORS: Resolvido via proxy Vite
- Timeout: 10 segundos para requisições
- Logs detalhados para debug

### **5. Configurações de Idioma:**
- Respostas forçadas em português (`language: pt-BR`)
- Interface completamente em português

## 🏗️ **Estrutura do Projeto**

```
aluno-app/
├── src/
│   ├── components/
│   │   ├── AIMessageContent.jsx      # Exibição de mensagens da IA
│   │   ├── HistorySidebar.jsx        # Sidebar do histórico
│   │   └── HealthCheckButton.jsx     # Botão de verificação
│   ├── pages/
│   │   └── Welcome.jsx               # Página principal do chat
│   ├── services/
│   │   └── chatService.js            # Integração com API
│   └── utils/
│       └── scopeValidator.js         # Validação de escopo
├── .env                              # Variáveis de ambiente
├── vite.config.js                    # Configuração do Vite (proxy)
└── package.json                      # Dependências
```

## 🔄 **Proxy de Desenvolvimento (vite.config.js):**
```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://backend-311313028224.southamerica-east1.run.app',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
```

## 🧪 **Como Testar**

### **1. Chat Básico:**
- Abra a aplicação
- Digite uma pergunta sobre o curso
- Verifique resposta em português com referências

### **2. Validação de Escopo:**
- Pergunte algo fora do curso (ex: "melhores carros 2024")
- Deve recusar e pedir pergunta relacionada ao curso

### **3. Histórico:**
- Faça algumas conversas
- Abra o histórico (botão no canto superior direito)
- Verifique títulos no formato "Chat DD/MM/AAAA"
- Edite um título e veja se sincroniza

### **4. Feedback:**
- Clique em like/dislike nas respostas
- Verifique logs no console

## 🚨 **Troubleshooting**

### **Erro CORS:**
- Verifique se o proxy está configurado no `vite.config.js`
- Em produção, usar URL direta do Cloud Run

### **Erro 500:**
- Sistema mostra mensagem educativa ao usuário
- Verificar logs do backend
- Aguardar alguns minutos e tentar novamente

### **Histórico não carrega:**
- Verificar se `x-dev-user` está configurado
- Verificar logs no console (F12)
- Endpoint: `GET /api/chat/history`

### **IA responde em inglês:**
- Verificar se `language: pt-BR` está nos payloads
- Verificar logs das requisições

## 📱 **Responsividade**
- Interface adaptada para desktop e mobile
- Sidebar responsiva
- Títulos editáveis em ambas as versões

## 🔐 **Segurança**
- Headers obrigatórios (`x-dev-user`)
- Validação de entrada
- Sanitização de dados
- Timeout em requisições

---

**🎉 Projeto configurado e funcionando com todas as funcionalidades implementadas!**