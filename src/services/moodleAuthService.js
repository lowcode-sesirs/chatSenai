import { clearToken, setToken } from './tokenStore';

// Serviço de autenticação Moodle
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? '/api' : 'https://backend-311313028224.southamerica-east1.run.app/api');

const isEmbeddedIframe = () =>
  typeof window !== 'undefined' && window.parent && window.parent !== window;

const decodeBase64Url = (value) => {
  if (!value) return null;
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  try {
    const decoded = atob(normalized + padding);
    return decoded;
  } catch (error) {
    console.warn('Erro ao decodificar base64url:', error);
    return null;
  }
};

export const decodeMoodleToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 1) return null;
  const payload = decodeBase64Url(parts[0]);
  if (!payload) return null;
  try {
    const data = JSON.parse(payload);
    return {
      userId: data.userid || data.user_id || data.id,
      userName: data.fullname || data.user_name || data.username,
      userEmail: data.email,
      isAdmin: data.is_admin || data.isAdmin || data.admin || false,
      fromMoodle: true,
      tokenDecoded: true
    };
  } catch (error) {
    console.warn('Erro ao parsear payload do token Moodle:', error);
    return null;
  }
};

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
    console.log('Validando sessao Moodle...');

    if (!moodleToken) {
      return { ok: false, error: 'missing_moodle_token' };
    }

    try {
      sessionStorage.setItem('moodle_token', moodleToken);
    } catch (_error) {
      // noop
    }

    const apiRoot = API_BASE_URL.replace(/\/+$/, '');
    const baseNoApi = apiRoot.replace(/\/api$/, '');
    const exchangeUrls = [
      `${apiRoot}/auth/moodle/exchange`,
      `${baseNoApi}/api/auth/moodle/exchange`,
    ];

    let response = null;
    let lastError = null;

    for (const url of exchangeUrls) {
      try {
        const candidate = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            moodle_token: moodleToken,
            origin,
            page,
          }),
        });

        if (candidate.status === 404) {
          lastError = new Error(`Endpoint nao encontrado: ${url}`);
          continue;
        }

        response = candidate;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!response) {
      throw lastError || new Error('Falha no exchange Moodle');
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      if (response.status === 401) {
        clearToken();
        console.warn('Exchange Moodle retornou 401:', errorText || response.statusText);
        return { ok: false, error: 'invalid_session' };
      }
      throw new Error(`Erro ${response.status}: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const accessToken = data?.access_token || data?.token || null;
    if (!accessToken) {
      clearToken();
      return { ok: false, error: 'missing_access_token' };
    }

    setToken(accessToken);

    const user = data?.user || data?.profile || data || {};
    console.log('Sessao Moodle validada com exchange');

    return {
      ok: true,
      userId: user.userId || user.user_id || user.id || user.sub || null,
      userName: user.userName || user.user_name || user.fullname || user.name || null,
      userEmail: user.userEmail || user.user_email || user.email || null,
      isAdmin: !!(user.is_admin || user.isAdmin || user.admin),
      fromMoodle: true
    };
  } catch (error) {
    console.error('Erro ao validar sessao Moodle:', error);
    return { ok: false, error: error.message };
  }
};
export const isFromMoodle = () => {
  const { token, origin } = getMoodleTokenFromURL();
  return !!(token && origin === 'moodle');
};

/**
 * Armazena os dados do usuário Moodle no sessionStorage
 */
export const storeMoodleUser = (userData) => {
  if (!userData || typeof userData !== 'object') {
    return;
  }

  const normalizedUser = {
    userId: userData.userId || userData.userid || userData.user_id || userData.id || null,
    userName: userData.userName || userData.fullname || userData.user_name || userData.username || userData.name || null,
    userEmail: userData.userEmail || userData.email || null,
    isAdmin: !!(userData.isAdmin || userData.is_admin || userData.admin),
    fromMoodle: userData.fromMoodle !== undefined ? userData.fromMoodle : true
  };

  const hasIdentity = normalizedUser.userId || normalizedUser.userName || normalizedUser.userEmail;
  if (!hasIdentity) {
    return;
  }

  sessionStorage.setItem('moodle_user', JSON.stringify(normalizedUser));
  if (!isEmbeddedIframe()) {
    try {
      localStorage.setItem('moodle_user', JSON.stringify(normalizedUser));
    } catch (error) {
      console.warn('Nao foi possivel salvar moodle_user no localStorage:', error);
    }
  }
  try {
    if (typeof window !== 'undefined') {
      window.__MOODLE_USER__ = normalizedUser;
      window.dispatchEvent(new CustomEvent('moodle_user_updated', { detail: normalizedUser }));
    }
  } catch (error) {
    console.warn('Nao foi possivel notificar moodle_user atualizado:', error);
  }
};

/**
 * Recupera os dados do usuário Moodle do sessionStorage
 */
export const getMoodleUser = () => {
  const normalizeRuntimeUser = (runtimeUser) => {
    if (!runtimeUser || typeof runtimeUser !== 'object') return null;
    const normalizedUser = {
      userId: runtimeUser.userId || runtimeUser.userid || runtimeUser.user_id || runtimeUser.id || null,
      userName: runtimeUser.userName || runtimeUser.fullname || runtimeUser.user_name || runtimeUser.username || runtimeUser.name || null,
      userEmail: runtimeUser.userEmail || runtimeUser.email || null,
      isAdmin: !!(runtimeUser.isAdmin || runtimeUser.is_admin || runtimeUser.admin),
      fromMoodle: runtimeUser.fromMoodle !== undefined ? runtimeUser.fromMoodle : true
    };
    if (normalizedUser.userId || normalizedUser.userName || normalizedUser.userEmail) {
      try {
        const serialized = JSON.stringify(normalizedUser);
        sessionStorage.setItem('moodle_user', serialized);
        if (!isEmbeddedIframe()) {
          localStorage.setItem('moodle_user', serialized);
        }
      } catch (error) {
        console.warn('Nao foi possivel sincronizar moodle_user do runtime:', error);
      }
      return normalizedUser;
    }
    return null;
  };

  if (typeof window !== 'undefined') {
    const runtimeFromWindow = normalizeRuntimeUser(window.__MOODLE_USER__);
    if (runtimeFromWindow) return runtimeFromWindow;

    try {
      if (window.parent && window.parent !== window) {
        const runtimeFromParent = normalizeRuntimeUser(window.parent.__MOODLE_USER__);
        if (runtimeFromParent) return runtimeFromParent;
      }
    } catch (error) {
      console.warn('Nao foi possivel acessar moodle_user do parent:', error);
    }

    try {
      if (window.top && window.top !== window) {
        const runtimeFromTop = normalizeRuntimeUser(window.top.__MOODLE_USER__);
        if (runtimeFromTop) return runtimeFromTop;
      }
    } catch (error) {
      console.warn('Nao foi possivel acessar moodle_user do top:', error);
    }
  }

  const sessionData = sessionStorage.getItem('moodle_user');
  if (sessionData) {
    if (!isEmbeddedIframe()) {
      try {
        localStorage.setItem('moodle_user', sessionData);
      } catch (error) {
        console.warn('Nao foi possivel sincronizar moodle_user no localStorage:', error);
      }
    }
    return JSON.parse(sessionData);
  }

  if (!isEmbeddedIframe()) {
    try {
      const localData = localStorage.getItem('moodle_user');
      if (localData) {
        sessionStorage.setItem('moodle_user', localData);
        return JSON.parse(localData);
      }
    } catch (error) {
      console.warn('Nao foi possivel ler moodle_user do localStorage:', error);
    }
  }

  return null;
};

/**
 * Limpa os dados do usuário Moodle
 */
export const clearMoodleUser = () => {
  sessionStorage.removeItem('moodle_user');
  try {
    localStorage.removeItem('moodle_user');
  } catch (error) {
    console.warn('Nao foi possivel limpar moodle_user do localStorage:', error);
  }
};
