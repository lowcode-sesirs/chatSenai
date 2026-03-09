const TOKEN_KEY = 'senai_access_token';

let accessToken = null;

const canUseSessionStorage = () => typeof window !== 'undefined' && !!window.sessionStorage;
const canUseLocalStorage = () => typeof window !== 'undefined' && !!window.localStorage;
const isEmbeddedIframe = () =>
  typeof window !== 'undefined' && window.parent && window.parent !== window;

export const getToken = () => {
  if (accessToken) return accessToken;

  if (canUseSessionStorage()) {
    const storedSession = sessionStorage.getItem(TOKEN_KEY);
    if (storedSession) {
      accessToken = storedSession;
      return accessToken;
    }
  }

  // Em iframe do Moodle, evita reaproveitar token de outro contexto/conta via localStorage.
  if (!isEmbeddedIframe() && canUseLocalStorage()) {
    const storedLocal = localStorage.getItem(TOKEN_KEY);
    if (storedLocal) {
      accessToken = storedLocal;
      if (canUseSessionStorage()) {
        sessionStorage.setItem(TOKEN_KEY, storedLocal);
      }
    }
  }

  return accessToken;
};

export const setToken = (token) => {
  accessToken = token || null;

  if (canUseSessionStorage()) {
    if (accessToken) {
      sessionStorage.setItem(TOKEN_KEY, accessToken);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }

  // Em iframe, persiste somente em sessionStorage para reduzir vazamento entre contas.
  if (!isEmbeddedIframe() && canUseLocalStorage()) {
    if (accessToken) {
      localStorage.setItem(TOKEN_KEY, accessToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
};

export const clearToken = () => {
  accessToken = null;
  if (canUseSessionStorage()) {
    sessionStorage.removeItem(TOKEN_KEY);
  }
  if (canUseLocalStorage()) {
    localStorage.removeItem(TOKEN_KEY);
  }
};
