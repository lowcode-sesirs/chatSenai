# Integração Chat SENAI ↔ Moodle

## Visão Geral

Este documento descreve como integrar o Chat SENAI com o Moodle usando autenticação via token de sessão.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                    MOODLE                                        │
│  ┌──────────────────┐    ┌─────────────────────┐                                │
│  │  Plugin PHP      │    │  validate.php       │                                │
│  │  (local/seuplugin)│    │  (endpoint interno) │                                │
│  └────────┬─────────┘    └──────────▲──────────┘                                │
│           │                         │                                            │
│           │ (1) Abre nova aba       │ (3) Valida token                          │
│           │ com token na URL        │                                            │
└───────────┼─────────────────────────┼────────────────────────────────────────────┘
            │                         │
            ▼                         │
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           CHAT REACT (senai-chat-dev)                             │
│  1. Recebe token via URL params                                                   │
│  2. Envia token para Backend Python (handshake)                                   │
│  3. Se válido → carrega chat com user_id                                          │
│  4. Se inválido → mostra erro de autenticação                                     │
└───────────────────────────────────────────────────────────────────────────────────┘
            │
            │ (2) POST /api/moodle/session/handshake
            ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND PYTHON (Cloud Run)                                 │
│  - Recebe token do frontend                                                       │
│  - Chama Moodle /validate.php para verificar                                      │
│  - Se válido → retorna ok + user_id                                               │
│  - Se inválido → retorna 401                                                      │
└───────────────────────────────────────────────────────────────────────────────────┘
```

## Fluxo de Autenticação

### 1. Plugin Moodle (PHP)

O plugin deve:
1. Gerar um token/ticket para o usuário logado
2. Abrir o chat em nova aba passando o token na URL

```php
<?php
// Exemplo: local/seuplugin/open_chat.php

require_once('../../config.php');
require_login();

// Gera token único para a sessão
$token = generate_session_token($USER->id);

// URL do chat com token
$chat_url = "https://senai-chat-dev.web.app";
$params = http_build_query([
    'moodle_token' => $token,
    'origin' => 'moodle',
    'course_id' => optional_param('course_id', '', PARAM_INT),
    'user_name' => $USER->firstname . ' ' . $USER->lastname
]);

// Redireciona para o chat
redirect($chat_url . '?' . $params);
```

### 2. JavaScript no Moodle

```javascript
// Exemplo: local/seuplugin/amd/src/chat_launcher.js

define(['jquery'], function($) {
    return {
        init: function(token, chatUrl) {
            // Botão flutuante para abrir o chat
            var $button = $('<button>')
                .addClass('senai-chat-button')
                .html('💬 Chat SENAI')
                .on('click', function() {
                    var url = chatUrl + '?moodle_token=' + token + '&origin=moodle';
                    window.open(url, '_blank', 'width=800,height=600');
                });
            
            $('body').append($button);
        }
    };
});
```

### 3. Endpoint de Validação (validate.php)

```php
<?php
// local/seuplugin/validate.php

define('AJAX_SCRIPT', true);
require_once('../../config.php');

// Verifica segredo de integração
$secret = $_SERVER['HTTP_X_INTEGRATION_SECRET'] ?? '';
$expected_secret = get_config('local_seuplugin', 'integration_secret');

if ($secret !== $expected_secret) {
    http_response_code(403);
    echo json_encode(['valid' => false, 'error' => 'forbidden']);
    exit;
}

// Recebe o token
$input = json_decode(file_get_contents('php://input'), true);
$token = $input['moodle_session_token'] ?? '';

// Valida o token
$user_id = validate_session_token($token);

if ($user_id) {
    echo json_encode([
        'valid' => true,
        'user_id' => $user_id
    ]);
} else {
    http_response_code(401);
    echo json_encode([
        'valid' => false
    ]);
}
```

## Configuração do Chat React

### Arquivos Criados

1. **`src/services/moodleAuthService.js`**
   - Extrai token da URL
   - Valida sessão com backend
   - Gerencia dados do usuário

2. **`src/components/MoodleAuthWrapper.jsx`**
   - Wrapper que valida autenticação antes de renderizar o chat
   - Mostra loading durante validação
   - Mostra erro se não autenticado

### Como Usar

```jsx
// App.jsx
import MoodleAuthWrapper from './components/MoodleAuthWrapper';
import Welcome from './pages/Welcome';

function App() {
  return (
    <MoodleAuthWrapper>
      <Welcome />
    </MoodleAuthWrapper>
  );
}
```

### Variáveis de Ambiente

```env
# .env
VITE_API_BASE_URL=https://backend-311313028224.southamerica-east1.run.app/api
VITE_MOODLE_URL=https://seu-moodle.com
```

## Contratos de API

### 1. Chat React → Backend Python

**POST** `/api/moodle/session/handshake`

Request:
```json
{
  "moodle_session_token": "TOKEN_DA_SESSAO",
  "origin": "moodle",
  "page": "chat"
}
```

Response (válido):
```json
{
  "ok": true,
  "user_id": 12345,
  "user_name": "João Silva",
  "user_email": "joao@email.com"
}
```

Response (inválido):
```json
{
  "ok": false,
  "error": "invalid_session"
}
```

### 2. Backend Python → Moodle

**POST** `https://moodle.seudominio/local/seuplugin/validate.php`

Headers:
```
X-Integration-Secret: <segredo>
Content-Type: application/json
```

Request:
```json
{
  "moodle_session_token": "TOKEN_DA_SESSAO"
}
```

Response (válido):
```json
{
  "valid": true,
  "user_id": 12345
}
```

Response (inválido):
```json
{
  "valid": false
}
```

## URL de Abertura do Chat

O Moodle deve abrir o chat com a seguinte URL:

```
https://senai-chat-dev.web.app?moodle_token=XXX&origin=moodle&course_id=123&user_name=João
```

Parâmetros:
- `moodle_token` (obrigatório): Token de sessão gerado pelo plugin
- `origin` (obrigatório): Deve ser "moodle"
- `course_id` (opcional): ID do curso atual
- `user_name` (opcional): Nome do usuário para exibição

## Segurança

1. **Token de sessão**: Gerado pelo Moodle, válido por tempo limitado
2. **Segredo de integração**: Header X-Integration-Secret para proteger endpoint
3. **Validação dupla**: Backend Python sempre valida com Moodle
4. **HTTPS**: Todas as comunicações devem usar HTTPS
5. **Token removido da URL**: Após validação, token é removido da URL do navegador

## Modo Desenvolvimento

Em modo desenvolvimento (`npm run dev`), a autenticação Moodle é ignorada para facilitar testes.

Para testar a integração completa:
1. Configure as variáveis de ambiente
2. Execute `npm run build && npm run preview`
3. Acesse com token na URL

## Checklist de Implementação

### Plugin Moodle
- [ ] Criar estrutura do plugin local
- [ ] Implementar geração de token
- [ ] Criar endpoint validate.php
- [ ] Injetar JavaScript nas páginas
- [ ] Configurar segredo de integração

### Backend Python
- [ ] Criar endpoint /api/moodle/session/handshake
- [ ] Implementar chamada ao Moodle para validação
- [ ] Configurar segredo de integração
- [ ] Tratar erros e timeouts

### Chat React
- [x] Criar moodleAuthService.js
- [x] Criar MoodleAuthWrapper.jsx
- [ ] Integrar wrapper no App.jsx
- [ ] Testar fluxo completo
- [ ] Deploy com novas alterações
