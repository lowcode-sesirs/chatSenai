# 🎓 SEN.AI - Aluno App

Aplicação web de chat com inteligência artificial para auxiliar alunos do SENAI/SESI em seus estudos.

---

## 🌐 **URLs de Acesso**

### **Produção**

#### **Ambiente Principal**
- **Chat Geral:** https://senai-chat-dev.web.app/
- **Gestão de Exames:** https://senai-chat-dev.web.app/chat/gestao-exames
- **Curso Genérico:** https://senai-chat-dev.web.app/chat/{slug-do-curso}

#### **Ambiente EJA**
- **Chat EJA:** https://sesi-eja-assistente-ai.web.app/
- **Gestão de Exames (EJA):** https://sesi-eja-assistente-ai.web.app/chat/gestao-exames

### **Backend API**
- **Base URL:** https://backend-testes-auth-rghctf6jea-rj.a.run.app/api
- **Health Check:** https://backend-testes-auth-rghctf6jea-rj.a.run.app/api/health

---

## 🚀 **Início Rápido**

### **Pré-requisitos**
- Node.js 18+
- npm ou yarn
- Firebase CLI (para deploy)

### **Instalação**
```bash
# Clonar repositório
git clone https://github.com/guilhermenovak/FrontSuport.IA.git
cd FrontSuport.IA

# Instalar dependências
npm install
```

### **Configuração**

#### **1. Criar arquivo .env**
```bash
cp .env.example .env
```

#### **2. Configurar variáveis de ambiente**
```env
VITE_API_BASE_URL=https://backend-testes-auth-rghctf6jea-rj.a.run.app/api
VITE_DEV_API_KEY=)hJJ--RBqYslkm5l_&AB=L5FIg&W3T+h
VITE_X_DEV_USER=dev1
VITE_DEFAULT_KNOWLEDGE_CONTEXT_CODE=default
VITE_ENABLE_DEV_LOGIN=true
VITE_MOODLE_ORIGIN=https://pocsesi-rs.asdnet.com.br
VITE_USE_INTERNAL_PDF_VIEWER=false
```

⚠️ **IMPORTANTE:** Não commitar o arquivo `.env` com credenciais reais!

### **Desenvolvimento**
```bash
npm run dev
```
Acesse: http://localhost:5173

### **Build**
```bash
npm run build
```

### **Deploy**

#### **Ambiente Principal**
```bash
npm run deploy
```
Deploy para: https://senai-chat-dev.web.app

#### **Ambiente EJA**
```bash
npm run deploy:eja
```
Deploy para: https://sesi-eja-assistente-ai.web.app

---

## 📁 **Estrutura do Projeto**

```
.
├── src/
│   ├── components/          # Componentes React
│   │   ├── AIMessageContent.jsx
│   │   ├── ChatInput.jsx
│   │   ├── ChatMessage.jsx
│   │   ├── HistorySidebar.jsx
│   │   └── MoodleAuthWrapper.jsx
│   ├── pages/              # Páginas
│   │   ├── Welcome.jsx      # Chat principal
│   │   ├── DevLogin.jsx     # Login dev
│   │   └── PdfViewerPage.jsx
│   ├── services/           # Serviços API
│   │   ├── chatService.js
│   │   ├── authService.js
│   │   ├── moodleAuthService.js
│   │   └── tokenStore.js
│   ├── hooks/              # Custom hooks
│   │   └── useMoodleBridge.js
│   └── assets/             # Imagens e ícones
├── public/                 # Arquivos estáticos
├── .env                    # Configurações (NÃO COMMITAR)
├── .env.example           # Template de configuração
├── firebase.json          # Config Firebase
├── firebase.eja.json      # Config Firebase EJA
└── package.json           # Dependências
```

---

## ✨ **Funcionalidades**

### **Chat Inteligente**
- ✅ Conversa em tempo real com streaming SSE
- ✅ Suporte a múltiplos contextos de conhecimento
- ✅ Respostas em português
- ✅ Exibição de referências bibliográficas
- ✅ Suporte a vídeos e imagens
- ✅ Sistema de feedback (like/dislike)

### **Histórico**
- ✅ Carregamento automático
- ✅ Títulos editáveis
- ✅ Sincronização com backend
- ✅ Tempos relativos

### **Integração Moodle**
- ✅ Autenticação via token JWT
- ✅ Contexto de curso sincronizado
- ✅ Modo widget e expandido
- ✅ Comunicação bidirecional

### **Extras**
- ✅ Visualizador de PDF
- ✅ Dev login para testes
- ✅ Interface responsiva
- ✅ Suporte a múltiplos ambientes

---

## 🔧 **Tecnologias**

- **React 19** - Framework
- **Vite 7** - Build tool
- **Tailwind CSS** - Styling
- **React Router DOM** - Navegação
- **Google Generative AI** - IA
- **PDF.js** - Visualização de PDF
- **Lucide React** - Ícones
- **Firebase Hosting** - Deploy

---

## 🔐 **Autenticação**

### **Dev Login (Desenvolvimento)**
1. Acesse a aplicação
2. Use email + DEV_API_KEY
3. Sistema gera token JWT
4. Usuário autenticado

### **Moodle (Produção)**
1. Plugin Moodle gera token
2. Abre chat com token na URL
3. Frontend valida via backend
4. Usuário autenticado

---

## 🛠️ **Scripts Disponíveis**

```bash
npm run dev           # Inicia servidor de desenvolvimento
npm run build         # Build para produção (principal)
npm run build:eja     # Build para produção (EJA)
npm run preview       # Preview do build localmente
npm run lint          # Executa linter
npm run deploy        # Build + Deploy (principal)
npm run deploy:eja    # Build + Deploy (EJA)
```

---

## 📡 **Endpoints da API**

### **Autenticação**
- `POST /api/auth/dev/login` - Login desenvolvimento
- `POST /api/auth/moodle/exchange` - Exchange token Moodle

### **Chat**
- `POST /api/chat` - Iniciar conversa
- `POST /api/chat/{id}/message` - Enviar mensagem
- `GET /api/chat/stream/{id}` - Streaming resposta
- `GET /api/chat/history` - Listar conversas
- `GET /api/chat/history/{id}` - Carregar conversa
- `PATCH /api/chat/{id}/title` - Renomear conversa
- `DELETE /api/chat/{id}` - Deletar conversa
- `POST /api/chat/feedback` - Enviar feedback

### **Conhecimento**
- `GET /api/knowledge-contexts` - Listar contextos

---

## 🎯 **Rotas Disponíveis**

| Rota | URL | Descrição |
|------|-----|-----------|
| Home | `/` | Chat geral |
| Curso Específico | `/chat/:courseSlug` | Chat de curso |
| PDF Viewer | `/pdf/:id` | Visualizar PDF |

### **Cursos Pré-configurados**
- `gestao-exames` - Gestão de Exames
- `curso-local` - Curso Local (teste)

### **Rotas Dinâmicas**
Qualquer slug é aceito automaticamente:
- `/chat/mecanica-automotiva`
- `/chat/eletronica-industrial`
- `/chat/programacao-web`

---

## 🐛 **Troubleshooting**

### **Erro 401 - Unauthorized**
- Verificar DEV_API_KEY no .env
- Verificar se token não expirou
- Verificar header Authorization

### **Erro CORS**
- Verificar proxy no vite.config.js
- Backend deve permitir origin

### **Streaming não funciona**
- Verificar suporte SSE no navegador
- Verificar logs do backend

### **Deploy falha**
```bash
# Login no Firebase
firebase login

# Usar projeto correto
firebase use senai-chat-dev

# Limpar e rebuildar
rm -rf node_modules dist
npm install
npm run build
firebase deploy
```

---

## 📚 **Documentação**

- [README do Projeto](./README.md)
- [Integração Moodle](./INTEGRACAO_MOODLE.md)
- [Configuração Cloud](./CONFIGURACAO_CLOUD.md)
- [Setup Gemini](./GEMINI_SETUP.md)

---

## 🔒 **Segurança**

### **Variáveis Sensíveis**
⚠️ **NUNCA commitar:**
- `.env` com credenciais reais
- `VITE_DEV_API_KEY`
- Tokens JWT
- Credenciais Firebase

### **Boas Práticas**
- ✅ Usar `.env.example` como template
- ✅ Adicionar `.env` no `.gitignore`
- ✅ Rotacionar DEV_API_KEY periodicamente
- ✅ Usar HTTPS apenas
- ✅ Validar inputs do usuário

---

## 📊 **Ambientes**

| Ambiente | URL | Firebase Project | Config |
|----------|-----|------------------|--------|
| **Principal** | senai-chat-dev.web.app | senai-chat-dev | firebase.json |
| **EJA** | sesi-eja-assistente-ai.web.app | senai-chat-dev | firebase.eja.json |
| **Local** | localhost:5173 | - | .env |

---

## 🤝 **Contribuindo**

### **Processo de Desenvolvimento**

1. **Clone o repositório**
```bash
git clone https://github.com/guilhermenovak/FrontSuport.IA.git
cd FrontSuport.IA
```

2. **Crie uma branch**
```bash
git checkout -b feature/nova-funcionalidade
```

3. **Faça suas alterações**
```bash
# Desenvolva e teste
npm run dev
```

4. **Commit e Push**
```bash
git add .
git commit -m "feat: adicionar nova funcionalidade"
git push origin feature/nova-funcionalidade
```

5. **Abra um Pull Request**
- Descreva as mudanças
- Adicione prints se necessário
- Aguarde review

---

## 📄 **Licença**

Este projeto é propriedade do SENAI/SESI.

---

## 👥 **Equipe**

Desenvolvido pela equipe de desenvolvimento do SENAI/SESI.

---

## 📞 **Suporte**

Para dúvidas ou problemas:
- Verificar documentação
- Consultar logs do Firebase
- Verificar status do backend
- Contatar equipe de desenvolvimento

---

## 🔗 **Links Úteis**

- **GitHub:** https://github.com/guilhermenovak/FrontSuport.IA.git
- **Firebase Console:** https://console.firebase.google.com/project/senai-chat-dev
- **Cloud Run Console:** https://console.cloud.google.com/run
- **API Backend:** https://backend-testes-auth-rghctf6jea-rj.a.run.app/api

---

**Última atualização:** 2026-08-20
