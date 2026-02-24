import { getToken } from './tokenStore';

// Configuração dos endpoints da API
const RUNTIME_API_BASE_URL =
  window.__SENAI_API_BASE_URL__ ||
  window.__API_BASE_URL__ ||
  null;

const API_BASE_URL =
  RUNTIME_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'https://backend-311313028224.southamerica-east1.run.app/api');

const X_DEV_USER = import.meta.env.VITE_X_DEV_USER || '';

const isPlaceholderUserValue = (value) =>
  !value ||
  value === 'SEU_VALOR_AQUI' ||
  value === '{{x-dev-user}}' ||
  value === 'undefined' ||
  value === 'null';

const isEmbeddedIframe = () =>
  typeof window !== 'undefined' && window.parent && window.parent !== window;

const maskAuthorizationHeader = (headers = {}) => {
  const safeHeaders = { ...headers };
  if (safeHeaders.Authorization) {
    safeHeaders.Authorization = 'Bearer ***';
  }
  return safeHeaders;
};

const logHandshakeSnapshot = (context, url, headers, extra = {}) => {
  try {
    const moodleTokenFromUrl = new URLSearchParams(window.location.search).get('moodle_token');
    const moodleTokenFromSession = sessionStorage.getItem('moodle_token');
    const moodleUserRaw = sessionStorage.getItem('moodle_user');
    let moodleUser = null;
    try {
      moodleUser = moodleUserRaw ? JSON.parse(moodleUserRaw) : null;
    } catch (_error) {
      moodleUser = moodleUserRaw;
    }

    console.log(`🤝 Handshake (${context})`, {
      url,
      headers: maskAuthorizationHeader(headers || {}),
      moodleTokenInUrl: !!moodleTokenFromUrl,
      moodleTokenInSession: !!moodleTokenFromSession,
      moodleUser,
      runtimeMoodleUser: typeof window !== 'undefined' ? window.__MOODLE_USER__ || null : null,
      ...extra,
    });
  } catch (error) {
    console.warn(`Falha ao registrar handshake (${context}):`, error);
  }
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

    if (!isEmbeddedIframe()) {
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
    }
  } catch (e) {
    console.warn('Erro ao obter user_id do Moodle:', e);
  }
  return isPlaceholderUserValue(X_DEV_USER) ? '' : X_DEV_USER;
};

// Header padrão - usa user_id do Moodle se disponível
const getHeaders = ({ includeJsonContentType = true } = {}) => {
  let userId = getMoodleUserId();
  if (isPlaceholderUserValue(userId)) {
    const runtimeUser = typeof window !== 'undefined' ? window.__MOODLE_USER__ : null;
    const runtimeId = runtimeUser?.userId || runtimeUser?.userid || runtimeUser?.user_id || runtimeUser?.id;
    if (runtimeId) {
      userId = runtimeId;
    }
  }
  if (isPlaceholderUserValue(userId) && !isPlaceholderUserValue(X_DEV_USER)) {
    userId = X_DEV_USER;
  }
  const headers = {};
  if (!isPlaceholderUserValue(userId)) {
    headers['x-dev-user'] = userId;
    headers['moodle_user_id'] = userId;
  }
  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }
  const accessToken = getToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  console.log('?? Headers sendo enviados:', maskAuthorizationHeader(headers));
  return headers;
};

// POST - Iniciar nova conversa
export const startChat = async (message, courseExternalId = 'CursoPiloto') => {
  try {
    const url = `${API_BASE_URL}/chat`;
    const payload = {
      message,
      course_external_id: courseExternalId,
      language: 'pt-BR', // ✅ Força respostas em português
    };
    
    const headers = getHeaders({ includeJsonContentType: true });

    console.log('🚀 Iniciando chat:', {
      url,
      payload,
      headers: maskAuthorizationHeader(headers)
    });
    logHandshakeSnapshot('before /chat', url, headers, { payload });
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      console.error(`❌ Erro ${response.status} na API:`, {
        status: response.status,
        statusText: response.statusText,
        errorText,
        timestamp: new Date().toISOString(),
        url: `${API_BASE_URL}/chat`
      });
      
      if (response.status === 500) {
        throw new Error(`Erro 500: Servidor com problema interno. Tente novamente em alguns minutos.`);
      }
      
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
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
    const response = await fetch(`${API_BASE_URL}/chat/${sessionId}/message`, {
      method: 'POST',
      headers: getHeaders({ includeJsonContentType: true }),
      body: JSON.stringify({
        message,
        language: 'pt-BR', // ✅ Força respostas em português
      }),
    });

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
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders({ includeJsonContentType: false }),
    });

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

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
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
            continue;
          }
          
          try {
            const data = JSON.parse(dataStr);

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
    const headers = getHeaders({ includeJsonContentType: false });
    console.log('📡 Buscando histórico de conversas...');
    logHandshakeSnapshot('before /chat/history', url, headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

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
    const headers = getHeaders({ includeJsonContentType: false });
    console.log('Carregando conversa (request)...', {
      url,
      method: 'GET',
      headers: maskAuthorizationHeader(headers)
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

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
      headers: getHeaders({ includeJsonContentType: true }),
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
      headers: getHeaders({ includeJsonContentType: true }),
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
        headers: getHeaders({ includeJsonContentType: false }),
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


