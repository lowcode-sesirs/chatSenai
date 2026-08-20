# Configuração da API do Google Gemini

## Passo 1: Obter a Chave da API

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Get API Key" ou "Create API Key"
4. Copie a chave gerada

## Passo 2: Configurar a Chave no Projeto

1. Crie um arquivo `.env` na raiz da pasta `aluno-app`:
   ```bash
   cp .env.example .env
   ```

2. Abra o arquivo `.env` e adicione sua chave:
   ```
   VITE_GEMINI_API_KEY=sua_chave_api_aqui
   ```

## Passo 3: Executar o Projeto

```bash
npm run dev
```

## Funcionalidades Implementadas

- ✅ Integração com Google Gemini AI
- ✅ Histórico de conversação mantido
- ✅ Contexto personalizado para o SENAI
- ✅ Indicador de carregamento durante respostas
- ✅ Tratamento de erros
- ✅ Botão "Nova conversa" para limpar histórico

## Estrutura de Arquivos

- `src/services/geminiService.js` - Serviço de integração com Gemini
- `src/pages/Welcome.jsx` - Componente principal do chat
- `.env` - Variáveis de ambiente (não commitado)
- `.env.example` - Exemplo de configuração

## Notas Importantes

- A chave da API é carregada através de variáveis de ambiente
- O histórico da conversa é mantido em memória
- O modelo usado é o `gemini-pro`
- A temperatura está configurada em 0.9 para respostas mais criativas

## Troubleshooting

### Erro: "API key not valid"
- Verifique se a chave foi copiada corretamente no arquivo `.env`
- Certifique-se de que o arquivo `.env` está na raiz da pasta `aluno-app`
- Reinicie o servidor de desenvolvimento após criar/modificar o `.env`

### Erro: "Failed to fetch"
- Verifique sua conexão com a internet
- Confirme se a API do Gemini está ativa em sua conta Google
