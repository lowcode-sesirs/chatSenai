const TOKEN_KEY = "senai_access_token";

let accessToken = null;

const canUseSessionStorage = () => typeof window !== "undefined" && !!window.sessionStorage;
const canUseLocalStorage = () => typeof window !== "undefined" && !!window.localStorage;

export const getToken = () => {
  if (accessToken) return accessToken;

  if (canUseSessionStorage()) {
    const storedToken = sessionStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      accessToken = storedToken;
      return accessToken;
    }
  }

  if (canUseLocalStorage()) {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      accessToken = storedToken;
      if (canUseSessionStorage()) {
        sessionStorage.setItem(TOKEN_KEY, storedToken);
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

  if (canUseLocalStorage()) {
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
