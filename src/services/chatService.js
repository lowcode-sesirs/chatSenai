import { getToken } from './tokenStore';
import { getMoodleTokenFromURL, validateMoodleSession } from './moodleAuthService';

// Configuração dos endpoints da API
const RUNTIME_API_BASE_URL =
  window.__SENAI_API_BASE_URL__ ||
  window.__API_BASE_URL__ ||
  null;

const API_BASE_URL =
  RUNTIME_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api';
const DEFAULT_KNOWLEDGE_CONTEXT_CODE =
  import.meta.env.VITE_DEFAULT_KNOWLEDGE_CONTEXT_CODE ||
  null;

const X_DEV_USER = import.meta.env.VITE_X_DEV_USER || '{{x-dev-user}}';

export class ChatApiError extends Error {
  constructor(message, { status = null, statusText = '', body = null } = {}) {
    super(message);
    this.name = 'ChatApiError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

const readErrorBody = async (response) => {
  const errorText = await response.text().catch(() => '');
  if (!errorText) return null;
  try {
    return JSON.parse(errorText);
  } catch {
    return errorText;
  }
};

const buildApiError = async (response, fallbackMessage) => {
  const body = await readErrorBody(response);
  const detail =
    body?.detail ||
    body?.message ||
    body?.error ||
    (typeof body === 'string' ? body : '') ||
    response.statusText;

  return new ChatApiError(`${fallbackMessage} (${response.status}): ${detail}`, {
    status: response.status,
    statusText: response.statusText,
    body,
  });
};

const normalizeMessageForRequest = (value) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n+/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

console.log('🔧 Configuração da API:', {
  DEV: import.meta.env.DEV,
  API_BASE_URL,
  X_DEV_USER,
  RUNTIME_API_BASE_URL
});

console.log('🔧 Configuração da API:', {
  DEV: import.meta.env.DEV,
  API_BASE_URL,
  X_DEV_USER
});

// Função para obter o user_id do Moodle (se disponível)
export const getMoodleUserId = () => {
  try {
    if (typeof window !== 'undefined') {
      const runtimeUser = window.__MOODLE_USER__;
      const runtimeEmail = runtimeUser?.userEmail || runtimeUser?.email;
      if (runtimeEmail) return runtimeEmail;
      const runtimeId = runtimeUser?.userId || runtimeUser?.userid || runtimeUser?.user_id || runtimeUser?.id;
      if (runtimeId && runtimeId !== 'guest') {
        return runtimeId;
      }
    }

    const moodleUser = sessionStorage.getItem('moodle_user');
    if (moodleUser) {
      const userData = JSON.parse(moodleUser);
      if (userData?.userEmail) {
        return userData.userEmail;
      }
      if (userData?.userId && userData.userId !== 'guest') {
        return userData.userId;
      }
    }

    const moodleUserFromLocal = localStorage.getItem('moodle_user');
    if (moodleUserFromLocal) {
      sessionStorage.setItem('moodle_user', moodleUserFromLocal);
      const userData = JSON.parse(moodleUserFromLocal);
      if (userData?.userEmail) {
        return userData.userEmail;
      }
      if (userData?.userId && userData.userId !== 'guest') {
        return userData.userId;
      }
    }
  } catch (e) {
    console.warn('Erro ao obter user_id do Moodle:', e);
  }
  return X_DEV_USER;
};

// Header padr?o - usa user_id do Moodle se dispon?vel
const getAuthToken = () => {
  const accessToken = getToken();
  if (accessToken) return accessToken;
  return null;
};

const requestFreshMoodleTokenFromParent = async (timeoutMs = 3000) => {
  if (typeof window === 'undefined' || !window.parent || window.parent === window) {
    return null;
  }

  const extractToken = (data) => {
    if (!data) return null;
    if (data.moodle_token) return data.moodle_token;
    if (data.token) return data.token;
    if (data.payload?.moodle_token) return data.payload.moodle_token;
    if (data.payload?.token) return data.payload.token;
    return null;
  };

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      resolve(value);
    };

    const onMessage = (event) => {
      const data = event?.data;
      const token = extractToken(data);
      if (!token) return;
      try {
        sessionStorage.setItem('moodle_token', token);
        localStorage.setItem('moodle_token', token);
      } catch (_error) {
        // noop
      }
      finish(token);
    };

    const timer = setTimeout(() => finish(null), timeoutMs);
    window.addEventListener('message', onMessage);

    try {
      window.parent.postMessage({ type: 'senai_request_moodle_token' }, '*');
      window.parent.postMessage({ type: 'senai_request_moodle_user' }, '*');
      window.parent.postMessage({ type: 'SENAI_REQUEST_MOODLE_TOKEN' }, '*');
      window.parent.postMessage({ type: 'SENAI_REQUEST_MOODLE_USER' }, '*');
    } catch (_error) {
      finish(null);
    }
  });
};

const getHeaders = ({ json = true } = {}) => {
  let userId = getMoodleUserId();
  if (userId === 'SEU_VALOR_AQUI' || userId === '{{x-dev-user}}' || userId === 'undefined') {
    const runtimeUser = typeof window !== 'undefined' ? window.__MOODLE_USER__ : null;
    const runtimeId = runtimeUser?.userId || runtimeUser?.userid || runtimeUser?.user_id || runtimeUser?.id;
    if (runtimeId) {
      userId = runtimeId;
    }
  }

  const headers = {
    'x-dev-user': userId,
    moodle_user_id: userId,
  };

  if (json) {
    headers['Content-Type'] = 'application/json';
  }

  const authToken = getAuthToken();
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const logSafeHeaders = { ...headers };
  if (logSafeHeaders.Authorization) {
    logSafeHeaders.Authorization = 'Bearer ***';
  }
  console.log('?? Headers sendo enviados:', logSafeHeaders);

  return headers;
};

const refreshAccessTokenFromMoodle = async () => {
  try {
    const { token, origin, page } = getMoodleTokenFromURL();
    const fallbackToken = token || sessionStorage.getItem('moodle_token') || localStorage.getItem('moodle_token');
    if (!fallbackToken) return false;

    let result = await validateMoodleSession(fallbackToken, origin || 'moodle', page || 'chat');
    if (result?.ok && getToken()) return true;

    if (result?.error === 'invalid_session') {
      const refreshedToken = await requestFreshMoodleTokenFromParent(3500);
      if (!refreshedToken) return false;
      result = await validateMoodleSession(refreshedToken, origin || 'moodle', page || 'chat');
      return !!(result?.ok && getToken());
    }

    return false;
  } catch (_error) {
    return false;
  }
};

const fetchWithAuthRetry = async (buildRequest) => {
  // Evita primeira chamada sem Authorization quando ainda existe moodle_token para exchange.
  if (!getToken()) {
    await refreshAccessTokenFromMoodle();
  }

  let { url, options } = buildRequest();
  let response = await fetch(url, options);

  if (response.status !== 401) return response;

  console.warn('401 detectado, renovando token via Moodle exchange...');
  const refreshed = await refreshAccessTokenFromMoodle();
  if (!refreshed) return response;

  ({ url, options } = buildRequest());
  return fetch(url, options);
};

// GET - Listar contextos de conhecimento ativos e seus cursos
export const getKnowledgeContexts = async () => {
  try {
    const url = `${API_BASE_URL}/knowledge-contexts`;
    const response = await fetchWithAuthRetry(() => ({
      url,
      options: {
        method: 'GET',
        headers: getHeaders({ json: false }),
      },
    }));

    if (!response.ok) {
      throw await buildApiError(response, 'Erro ao carregar contextos de conhecimento');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erro ao carregar contextos de conhecimento:', error);
    throw error;
  }
};

// POST - Iniciar nova conversa
export const startChat = async (
  message,
  {
    knowledgeContextCode = DEFAULT_KNOWLEDGE_CONTEXT_CODE,
    courseExternalIds = [],
  } = {}
) => {
  try {
    const normalizedMessage = normalizeMessageForRequest(message);
    const normalizedContextCode =
      typeof knowledgeContextCode === 'string' ? knowledgeContextCode.trim() : '';
    const normalizedCourseExternalIds = Array.isArray(courseExternalIds)
      ? courseExternalIds
          .map((value) => (typeof value === 'string' ? value.trim() : String(value || '').trim()))
          .filter(Boolean)
      : [];

    if (!normalizedContextCode) {
      throw new ChatApiError('Selecione um contexto de conhecimento antes de iniciar o chat.', {
        status: 400,
      });
    }

    const url = `${API_BASE_URL}/chat`;
    const payload = {
      message: normalizedMessage,
      knowledge_context_code: normalizedContextCode,
      language: 'pt-BR', // ✅ Força respostas em português
    };
    
    if (normalizedCourseExternalIds.length > 0) {
      payload.course_external_ids = normalizedCourseExternalIds;
    }

    const headers = getHeaders();

    console.log('🚀 Iniciando chat:', {
      url,
      payload,
      headers
    });
    
    const response = await fetchWithAuthRetry(() => ({
      url,
      options: {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      },
    }));

    if (!response.ok) {
      console.error(`❌ Erro ${response.status} na API:`, {
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString(),
        url: `${API_BASE_URL}/chat`
      });
      
      if (response.status === 500) {
        throw new ChatApiError('Erro 500: Servidor com problema interno. Tente novamente em alguns minutos.', {
          status: 500,
          statusText: response.statusText,
          body: await readErrorBody(response),
        });
      }
      
      throw await buildApiError(response, 'Erro ao iniciar conversa');
    }

    const data = await response.json();

    console.log('✅ Resposta do startChat:', data);
    console.log('📋 Estrutura da resposta:', Object.keys(data));
    return data;
  } catch (error) {
    console.error('Erro ao iniciar conversa:', error);
    throw error;
  }
};

// POST - Enviar mensagem em conversa existente
export const sendChatMessage = async (sessionId, message) => {
  try {
    const normalizedMessage = normalizeMessageForRequest(message);
    const url = `${API_BASE_URL}/chat/${sessionId}/message`;
    const response = await fetchWithAuthRetry(() => ({
      url,
      options: {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          message: normalizedMessage,
          language: 'pt-BR',
        }),
      },
    }));

    if (!response.ok) {
      throw new Error('Erro ao enviar mensagem');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
};

// GET - Streaming de resposta (com fallback para polling)
export const getChatStream = async (sessionId, onChunk, onComplete, onError, streamUrl = null) => {
  try {
    // Usa o stream_url fornecido ou constrói o padrão
    const url = streamUrl
      ? (
          streamUrl.startsWith('http')
            ? streamUrl
            : streamUrl.startsWith('/api/')
              ? `${API_BASE_URL.replace(/\/api\/?$/, '')}${streamUrl}`
              : `${API_BASE_URL}${streamUrl}`
        )
      : `${API_BASE_URL}/chat/stream/${sessionId}`;
    
    console.log('🌊 Iniciando streaming para sessão:', sessionId);
    console.log('🔗 URL do stream:', url);
    
    const response = await fetchWithAuthRetry(() => ({
      url,
      options: {
        method: 'GET',
        headers: getHeaders({ json: false }),
      },
    }));

    console.log('📡 Resposta do stream:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      // Se o streaming não existe, tenta buscar a resposta diretamente
      if (response.status === 404) {
        console.log('⚠️ Endpoint de streaming não existe, tentando buscar resposta direta...');
        
        // Tenta buscar a conversa completa
        try {
          const chatData = await loadChat(sessionId);
          console.log('📦 Dados da conversa:', chatData);
          
          // Extrai a última mensagem da IA
          let lastAiMessage = '';
          if (chatData.messages && Array.isArray(chatData.messages)) {
            const aiMessages = chatData.messages.filter(msg => 
              msg.type === 'ai' || msg.type === 'assistant' || msg.sender === 'ai'
            );
            if (aiMessages.length > 0) {
              const lastMsg = aiMessages[aiMessages.length - 1];
              lastAiMessage = lastMsg.text || lastMsg.content || lastMsg.message || '';
            }
          }
          
          if (lastAiMessage) {
            console.log('✅ Resposta encontrada via loadChat');
            onComplete(lastAiMessage);
            return lastAiMessage;
          }
        } catch (loadError) {
          console.warn('⚠️ Erro ao carregar conversa:', loadError.message);
        }
      }
      
      throw new Error(`Erro ao obter stream: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    let streamError = null;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        if (streamError) {
          throw streamError;
        }
        onComplete(fullText);
        break;
      }

      // Decodifica o chunk
      buffer += decoder.decode(value, { stream: true });
      
      // Processa linhas completas (separadas por \n)
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Guarda a última linha incompleta no buffer
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        // Verifica se é uma linha de dados SSE
        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6).trim();
          
          // Verifica se é o marcador de fim
          if (dataStr === '[DONE]') {
            if (streamError) {
              throw streamError;
            }
            continue;
          }
          
          try {
            const data = JSON.parse(dataStr);

            const errorMessage =
              data.error ||
              data.detail ||
              data.message ||
              (data.event === 'error' ? data.text || data.content : null);
            if (errorMessage) {
              streamError = new ChatApiError(String(errorMessage), {
                status: response.status,
                statusText: response.statusText,
                body: data,
              });
              throw streamError;
            }

            if (data.event === 'sources' && Array.isArray(data.documents)) {
              onChunk('', fullText, { sources: data.documents });
              continue;
            }

            if (data.event === 'media') {
              const media = [];
              if (Array.isArray(data.videos)) {
                data.videos.forEach((video) => {
                  media.push({
                    type: 'video',
                    title: video.name || video.title,
                    url: video.Link || video.link || video.url
                  });
                });
              }
              if (Array.isArray(data.images)) {
                data.images.forEach((image) => {
                  media.push({
                    type: 'image',
                    url: image.Link || image.link || image.url,
                    alt: image.name || image.title
                  });
                });
              }
              onChunk('', fullText, { media });
              continue;
            }
            
            // Extrai o delta (pedaço de texto)
            if (data.delta) {
              fullText += data.delta;
              onChunk(data.delta, fullText);
            } else if (data.content) {
              fullText += data.content;
              onChunk(data.content, fullText);
            } else if (data.text) {
              fullText += data.text;
              onChunk(data.text, fullText);
            }
          } catch (e) {
            console.debug('Linha ignorada:', line);
          }
        }
      }
    }

    return fullText;
  } catch (error) {
    console.error('Erro no stream:', error);
    onError(error);
    throw error;
  }
};

// GET - Buscar histórico de conversas
export const getChatHistory = async () => {
  try {
    // Timeout de 15 segundos (aumentado para dar mais tempo)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const url = `${API_BASE_URL}/chat/history`;
    const headers = getHeaders({ json: false });
    console.log('📡 Buscando histórico de conversas...');
    
    const response = await fetchWithAuthRetry(() => ({
      url,
      options: {
        method: 'GET',
        headers: getHeaders({ json: false }),
        signal: controller.signal,
      },
    }));

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`❌ Erro ${response.status} ao buscar histórico:`, response.statusText);
      
      // Se for 404, o endpoint pode não existir
      if (response.status === 404) {
        console.log('⚠️ Endpoint de histórico não encontrado, retornando array vazio');
        return [];
      }
      
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Histórico carregado com sucesso:', data?.length || 0, 'conversas');
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('⏰ Timeout ao buscar histórico (15s)');
      // Retorna array vazio em caso de timeout para não quebrar a interface
      return [];
    }
    
    console.error('❌ Erro ao buscar histórico:', error.message);
    
    // Para outros erros de rede, também retorna array vazio
    if (error.message.includes('fetch') || error.message.includes('network')) {
      console.log('🌐 Problema de rede detectado, retornando histórico vazio');
      return [];
    }
    
    // Re-throw apenas para erros críticos
    throw error;
  }
};

// GET - Carregar conversa específica
export const loadChat = async (sessionId) => {
  try {
    const url = `${API_BASE_URL}/chat/history/${sessionId}`;
    const headers = getHeaders({ json: false });
    console.log('📡 Carregando conversa...', { url, method: 'GET', headers });
    
    const response = await fetchWithAuthRetry(() => ({
      url,
      options: {
        method: 'GET',
        headers: getHeaders({ json: false }),
      },
    }));

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('⚠️ Conversa não encontrada (404):', sessionId);
        return null;
      }
      throw new Error('Erro ao carregar conversa');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao carregar conversa:', error);
    throw error;
  }
};

// PATCH - Renomear conversa
export const renameChat = async (sessionId, title) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/${sessionId}/title`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        title,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao renomear conversa');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao renomear conversa:', error);
    throw error;
  }
};

// POST - Salvar conversa no histórico
export const saveChat = async (chatData) => {
  try {
    console.log('?? Tentando salvar conversa:', chatData.session_id);

    const params = new URLSearchParams();
    if (chatData?.session_id) params.set('session_id', chatData.session_id);
    if (chatData?.title) params.set('title', chatData.title);
    const query = params.toString();
    const url = `${API_BASE_URL}/chat/history${query ? `?${query}` : ''}`;

    const response = await fetchWithAuthRetry(() => ({
      url,
      options: {
        method: 'GET',
        headers: getHeaders({ json: false }),
      },
    }));

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      console.warn(`?? Erro ${response.status} ao salvar conversa:`, errorText);

      // Se o endpoint n?o existe (404), n?o ? cr?tico
      if (response.status === 404) {
        console.log('?? Endpoint /chat/save n?o implementado no backend');
        return { ok: false, message: 'Endpoint n?o implementado' };
      }

      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('? Conversa salva com sucesso!');
    return data;
  } catch (error) {
    console.error('? Erro ao salvar conversa:', error.message);

    // N?o propaga o erro para n?o quebrar a aplica??o
    // O salvamento ? opcional
    return { ok: false, error: error.message };
  }
};

// POST - Enviar feedback (like/dislike)
export const sendFeedback = async (sessionId, messageId, rating, comment = '') => {
  try {
    const payload = {
      session_id: sessionId,
      message_id: messageId,
      rating: rating, // 'positive' para like, 'negative' para dislike
      comment: comment,
    };
    
    console.log('📤 Enviando feedback:', payload);
    
    const response = await fetch(`${API_BASE_URL}/chat/feedback`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Tenta pegar detalhes do erro do backend
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData);
        console.error('❌ Detalhes do erro do backend:', errorData);
      } catch (e) {
        errorDetails = await response.text();
        console.error('❌ Resposta do backend:', errorDetails);
      }
      throw new Error(`Erro ao enviar feedback (${response.status}): ${errorDetails}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao enviar feedback:', error);
    throw error;
  }
};

// DELETE - Deletar conversa do histórico
export const deleteChat = async (sessionId) => {
  // Lista de possíveis endpoints para tentar
  const deleteEndpoints = [
    `${API_BASE_URL}/chat/${sessionId}`,
    `${API_BASE_URL}/chat/history/${sessionId}`,
    `${API_BASE_URL}/chat/${sessionId}/delete`
  ];
  
  let lastError = null;
  
  for (const endpoint of deleteEndpoints) {
    try {
      console.log('🗑️ Tentando deletar conversa em:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: getHeaders({ json: false }),
      });

      if (response.ok) {
        console.log('✅ Conversa deletada com sucesso no backend!');
        return true;
      } else {
        console.log(`⚠️ Endpoint ${endpoint} retornou ${response.status}`);
        lastError = new Error(`Erro ao deletar conversa (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ Erro no endpoint ${endpoint}:`, error.message);
      lastError = error;
    }
  }
  
  // Se chegou aqui, nenhum endpoint funcionou
  console.log('⚠️ Nenhum endpoint de delete funcionou, provavelmente não implementado no backend');
  throw lastError || new Error('Nenhum endpoint de delete disponível');
};


