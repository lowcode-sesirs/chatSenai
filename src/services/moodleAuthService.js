import { clearToken, setToken } from './tokenStore';
// Serviço de autenticação Moodle
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  '/api';

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
  if (parts.length < 2) return null;
  const payload = decodeBase64Url(parts[1]);
  if (!payload) return null;
  try {
    const data = JSON.parse(payload);
    return {
      userId: data.userid || data.user_id || data.id || data.sub,
      userName: data.fullname || data.user_name || data.username || data.name,
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
  const tokenFromUrl = urlParams.get('moodle_token') || urlParams.get('token');
  const tokenFromSession = sessionStorage.getItem('moodle_token');
  let tokenFromLocal = null;
  try {
    tokenFromLocal = localStorage.getItem('moodle_token');
  } catch (error) {
    console.warn('Erro ao ler moodle_token do localStorage:', error);
  }
  const resolvedToken = tokenFromUrl || tokenFromSession || tokenFromLocal;

  if (tokenFromUrl) {
    sessionStorage.setItem('moodle_token', tokenFromUrl);
    try {
      localStorage.setItem('moodle_token', tokenFromUrl);
    } catch (error) {
      console.warn('Erro ao salvar moodle_token no localStorage:', error);
    }
  }

  return {
    token: resolvedToken,
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
    if (typeof window !== 'undefined' && moodleToken) {
      sessionStorage.setItem('moodle_token', moodleToken);
    }

    const apiRoot = API_BASE_URL.replace(/\/+$/, '');
    const baseNoApi = apiRoot.replace(/\/api$/, '');
    const exchangeUrls = [
      `${apiRoot}/auth/moodle/Exchange`,
      `${apiRoot}/auth/moodle/exchange`,
      `${baseNoApi}/api/auth/moodle/Exchange`,
      `${baseNoApi}/api/auth/moodle/exchange`,
    ];

    let data = null;
    let lastError = null;

    for (const url of exchangeUrls) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            moodle_token: moodleToken,
            origin: origin,
            page: page
          }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            clearToken();
            return { ok: false, error: 'invalid_session' };
          }
          lastError = new Error(`Erro ${response.status}: ${response.statusText}`);
          continue;
        }

        data = await response.json();
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!data) {
      clearToken();
      throw lastError || new Error('Falha no exchange Moodle');
    }

    const accessToken = data?.access_token || data?.token || null;
    if (accessToken) {
      setToken(accessToken);
    } else {
      clearToken();
      return { ok: false, error: 'missing_access_token' };
    }

    const user = data?.user || data?.profile || data || {};
    return {
      ok: true,
      userId: user.userId || user.user_id || user.id || user.sub || null,
      userName: user.userName || user.user_name || user.fullname || user.name || null,
      userEmail: user.userEmail || user.user_email || user.email || null,
      isAdmin: !!(user.isAdmin || user.is_admin || user.admin),
      fromMoodle: true
    };
  } catch (error) {
    console.error('Erro ao validar sessao Moodle:', error);
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
  try {
    localStorage.setItem('moodle_user', JSON.stringify(normalizedUser));
  } catch (error) {
    console.warn('Nao foi possivel salvar moodle_user no localStorage:', error);
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
        localStorage.setItem('moodle_user', serialized);
      } catch (error) {
        console.warn('Nao foi possivel sincronizar moodle_user do runtime:', error);
      }
      return normalizedUser;
    }
    return null;
  };

  const canAccessWindowObject = (targetWindow) => {
    try {
      if (!targetWindow || targetWindow === window) return false;
      // Accessing href/origin throws on cross-origin frames.
      void targetWindow.location.href;
      return true;
    } catch (_error) {
      return false;
    }
  };

  if (typeof window !== 'undefined') {
    const runtimeFromWindow = normalizeRuntimeUser(window.__MOODLE_USER__);
    if (runtimeFromWindow) return runtimeFromWindow;

    if (canAccessWindowObject(window.parent)) {
      const runtimeFromParent = normalizeRuntimeUser(window.parent.__MOODLE_USER__);
      if (runtimeFromParent) return runtimeFromParent;
    }

    if (canAccessWindowObject(window.top)) {
      const runtimeFromTop = normalizeRuntimeUser(window.top.__MOODLE_USER__);
      if (runtimeFromTop) return runtimeFromTop;
    }
  }

  const sessionData = sessionStorage.getItem('moodle_user');
  if (sessionData) {
    try {
      localStorage.setItem('moodle_user', sessionData);
    } catch (error) {
      console.warn('Nao foi possivel sincronizar moodle_user no localStorage:', error);
    }
    return JSON.parse(sessionData);
  }

  try {
    const localData = localStorage.getItem('moodle_user');
    if (localData) {
      sessionStorage.setItem('moodle_user', localData);
      return JSON.parse(localData);
    }
  } catch (error) {
    console.warn('Nao foi possivel ler moodle_user do localStorage:', error);
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
