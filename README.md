# SEN.AI - Assistente Inteligente do SENAI

Aplicação web de chat com inteligência artificial para auxiliar alunos do SENAI em seus estudos.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- **Node.js** (versão 16 ou superior) - [Download](https://nodejs.org/)
- **npm** (geralmente vem com o Node.js)
- **Firebase CLI** (para deploy) - Instale com: `npm install -g firebase-tools`

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd aluno-app
```

### 2. Instale as dependências

```bash
npm install
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_BASE_URL=https://backend-311313028224.southamerica-east1.run.app/api
VITE_X_DEV_USER=dev1
```

Ou copie o arquivo de exemplo:
```bash
cp .env.example .env
```

## 💻 Executando a Aplicação

### Modo Desenvolvimento

Para rodar a aplicação localmente:

```bash
npm run dev
```

A aplicação estará disponível em: `http://localhost:5173`

### Build para Produção

Para criar uma versão otimizada para produção:

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

### Preview da Build

Para visualizar a versão de produção localmente:

```bash
npm run preview
```

## 🌐 Deploy no Firebase

### 1. Login no Firebase

```bash
firebase login
```

### 2. Inicializar Firebase (se ainda não foi feito)

```bash
firebase init
```

Selecione:
- **Hosting**
- Escolha seu projeto
- Public directory: `dist`
- Configure as single-page app: `Yes`
- Overwrite index.html: `No`

### 3. Deploy

```bash
npm run deploy
```

Ou manualmente:

```bash
npm run build
firebase deploy
```

## 📁 Estrutura do Projeto

```
aluno-app/
├── public/              # Arquivos estáticos
├── src/
│   ├── assets/         # Imagens e ícones
│   ├── components/     # Componentes React
│   │   ├── AIMessageContent.jsx
│   │   └── ChatInput.jsx
│   ├── pages/          # Páginas da aplicação
│   │   └── Welcome.jsx
│   ├── services/       # Serviços e APIs
│   │   └── chatService.js
│   ├── App.jsx         # Componente principal
│   ├── main.jsx        # Entry point
│   └── index.css       # Estilos globais
├── firebase.json       # Configuração do Firebase
├── package.json        # Dependências e scripts
└── vite.config.js      # Configuração do Vite
```

## 🛠️ Tecnologias Utilizadas

- **React** - Biblioteca JavaScript para interfaces
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Biblioteca de ícones
- **Firebase Hosting** - Hospedagem web
- **Fetch API** - Comunicação com backend

## 📡 Endpoints da API

A aplicação se comunica com os seguintes endpoints:

- **POST** `/api/chat` - Iniciar nova conversa
- **POST** `/api/chat/{session_id}/message` - Enviar mensagem
- **GET** `/api/chat/stream/{session_id}` - Streaming de resposta
- **GET** `/api/chat/history` - Buscar histórico de conversas
- **GET** `/api/chat/history/{session_id}` - Carregar conversa específica
- **PATCH** `/api/chat/{session_id}/title` - Renomear conversa
- **POST** `/api/chat/feedback` - Enviar feedback (like/dislike)

Base URL: `https://backend-311313028224.southamerica-east1.run.app/api`

> **Headers obrigatórios:**
> - `Content-Type: application/json`
> - `x-dev-user: dev1` (configurável via VITE_X_DEV_USER)

## ✨ Funcionalidades

- ✅ Chat em tempo real com streaming de respostas
- ✅ Suporte a vídeos e imagens da base de conhecimento
- ✅ Sistema de feedback (like/dislike)
- ✅ Histórico de conversas com lazy loading
- ✅ Salvar conversas automaticamente no histórico
- ✅ Carregar conversas anteriores do histórico
- ✅ Iniciar nova conversa (salva a atual automaticamente)
- ✅ Copiar mensagens para área de transferência
- ✅ Interface responsiva (mobile e desktop)
- ✅ Scroll automático durante conversas
- ✅ Indicador visual de digitação
- ✅ Botão de refresh no histórico

## 📝 Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Cria build de produção
npm run preview  # Visualiza build localmente
npm run lint     # Executa linter
npm run deploy   # Build + Deploy no Firebase
```

## 🐛 Solução de Problemas

### Erro ao instalar dependências

```bash
# Limpe o cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

### Porta 5173 já está em uso

```bash
# Use outra porta
npm run dev -- --port 3000
```

### Erro no Firebase Deploy

```bash
# Verifique se está logado
firebase login

# Verifique o projeto
firebase projects:list

# Use o projeto correto
firebase use <nome-do-projeto>
```

## 📄 Licença

Este projeto é propriedade do SENAI.

## 👥 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
