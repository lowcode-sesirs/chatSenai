// Serviço de autenticação Moodle
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? '/api' : 'https://backend-311313028224.southamerica-east1.run.app/api');

/**
 * Extrai o token de sessão do Moodle da URL
 * O Moodle abrirá o chat com: https://senai-chat-dev.web.app?moodle_token=XXX&origin=moodle
 */
export const getMoodleTokenFromURL = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    token: urlParams.get('moodle_token') || urlParams.get('token'),
    origin: urlParams.get('origin') || 'moodle',
    courseId: urlParams.get('course_id'),
    page: urlParams.get('page') || 'chat'
  };
};

/**
 * Valida o token de sessão do Moodle com o backend Python
 * O backend Python irá validar com o Moodle se o token é válido
 */
export const validateMoodleSession = async (moodleToken, origin = 'moodle', page = 'chat') => {
  try {
    console.log('🔐 Validando sessão Moodle...');
    
    const response = await fetch(`${API_BASE_URL}/moodle/session/handshake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        moodle_session_token: moodleToken,
        origin: origin,
        page: page
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ Sessão Moodle inválida ou expirada');
        return { ok: false, error: 'invalid_session' };
      }
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Sessão Moodle validada:', data);
    
    return {
      ok: data.ok || data.valid,
      userId: data.user_id,
      userName: data.user_name,
      userEmail: data.user_email
    };
  } catch (error) {
    console.error('❌ Erro ao validar sessão Moodle:', error);
    return { ok: false, error: error.message };
  }
};

/**
 * Verifica se o usuário veio do Moodle
 */
export const isFromMoodle = () => {
  const { token, origin } = getMoodleTokenFromURL();
  return !!(token && origin === 'moodle');
};

/**
 * Armazena os dados do usuário Moodle no sessionStorage
 */
export const storeMoodleUser = (userData) => {
  sessionStorage.setItem('moodle_user', JSON.stringify(userData));
};

/**
 * Recupera os dados do usuário Moodle do sessionStorage
 */
export const getMoodleUser = () => {
  const data = sessionStorage.getItem('moodle_user');
  return data ? JSON.parse(data) : null;
};

/**
 * Limpa os dados do usuário Moodle
 */
export const clearMoodleUser = () => {
  sessionStorage.removeItem('moodle_user');
};
