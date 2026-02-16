const TOKEN_KEY = "senai_access_token";

let accessToken = null;

const canUseSessionStorage = () => typeof window !== "undefined" && !!window.sessionStorage;

export const getToken = () => {
  if (accessToken) return accessToken;

  if (!canUseSessionStorage()) return null;

  const storedToken = sessionStorage.getItem(TOKEN_KEY);
  if (storedToken) {
    accessToken = storedToken;
  }

  return accessToken;
};

export const setToken = (token) => {
  accessToken = token || null;

  if (!canUseSessionStorage()) return;

  if (accessToken) {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    return;
  }

  sessionStorage.removeItem(TOKEN_KEY);
};

export const clearToken = () => {
  accessToken = null;

  if (!canUseSessionStorage()) return;

  sessionStorage.removeItem(TOKEN_KEY);
};
