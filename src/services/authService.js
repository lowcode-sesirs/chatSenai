import { apiFetch, ApiError } from './apiClient';
import { getToken, setToken } from './tokenStore';

const toBool = (value) => String(value).toLowerCase() === 'true';

export const DEV_LOGIN_ENABLED = toBool(import.meta.env.VITE_ENABLE_DEV_LOGIN || false);


const fetchAuthWithFallback = async (path, options) => {
  try {
    return await apiFetch(path, options);
  } catch (error) {
    if (error?.status === 404 && path.startsWith('/auth/')) {
      return apiFetch(`/api${path}`, options);
    }
    throw error;
  }
};


export const devLogin = async ({ email, devApiKey }) => {
  const trimmedEmail = (email || '').trim();
  const trimmedKey = (devApiKey || '').trim();

  if (!trimmedEmail) {
    throw new Error('Informe o e-mail.');
  }

  if (!trimmedKey) {
    throw new Error('Informe a dev_api_key.');
  }

  const response = await fetchAuthWithFallback('/auth/dev/login', {
    method: 'POST',
    skipAuth: true,
    headers: {
      'x-dev-api-key': trimmedKey,
    },
    body: JSON.stringify({ email: trimmedEmail }),
  });

  const data = await response.json();
  const accessToken = data?.access_token || data?.token || null;

  if (!accessToken) {
    throw new ApiError('Resposta de login sem access_token.', {
      status: response.status,
      body: data,
    });
  }

  setToken(accessToken);
  return data;
};


const pickAccessToken = (data) => data?.access_token || data?.token || null;

const clearMoodleTokenFromUrl = () => {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const hadMoodleToken = url.searchParams.has('moodle_token') || url.searchParams.has('token');

  if (!hadMoodleToken) return;

  url.searchParams.delete('moodle_token');
  url.searchParams.delete('token');

  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', next);
};

export const exchangeMoodleTokenFromUrl = async () => {
  if (typeof window === 'undefined') {
    return { exchanged: false, reason: 'no_window' };
  }

  const url = new URL(window.location.href);
  const moodleToken = url.searchParams.get('moodle_token') || url.searchParams.get('token');

  if (!moodleToken) {
    return { exchanged: false, reason: 'missing_moodle_token' };
  }

  let response;
  try {
    response = await apiFetch('/api/auth/moodle/Exchange', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ moodle_token: moodleToken }),
    });
  } catch (error) {
    throw error;
  }

  const data = await response.json();
  const accessToken = pickAccessToken(data);

  if (!accessToken) {
    throw new ApiError('Resposta de exchange sem access_token.', {
      status: response.status,
      body: data,
    });
  }

  setToken(accessToken);
  clearMoodleTokenFromUrl();

  return { exchanged: true };
};

export const getWhoAmI = async () => {
  const response = await fetchAuthWithFallback('/auth/whoami', { method: 'GET' });
  return response.json();
};

export const hasAccessToken = () => !!getToken();
