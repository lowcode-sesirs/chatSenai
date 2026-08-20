import { getToken } from './tokenStore';
import { validateMoodleSession } from './moodleAuthService';

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getApiBaseNoApi = () => RAW_API_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');

export const buildPdfContentUrl = (contentSourceId) =>
  `${getApiBaseNoApi()}/api/content/${contentSourceId}`;

const getMoodleTokenFallback = () => {
  if (typeof window === 'undefined') return null;

  const fromSession = sessionStorage.getItem('moodle_token');
  if (fromSession) return fromSession;

  try {
    const fromLocal = localStorage.getItem('moodle_token');
    if (fromLocal) return fromLocal;
  } catch (error) {
    console.warn('Erro ao ler moodle_token do localStorage:', error);
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('moodle_token') || params.get('token');
};

const ensureAccessToken = async () => {
  const currentAccessToken = getToken();
  if (currentAccessToken) return currentAccessToken;

  const moodleToken = getMoodleTokenFallback();
  if (!moodleToken) return null;

  const exchangeResult = await validateMoodleSession(moodleToken, 'moodle', 'pdf');
  if (!exchangeResult?.ok) return null;

  return getToken();
};

export const fetchViewToken = async (contentSourceId) => {
  const authToken = await ensureAccessToken();
  if (!authToken) {
    throw new Error('token de acesso não encontrado');
  }

  const baseNoApi = getApiBaseNoApi();
  const requestBody = JSON.stringify({ content_source_id: String(contentSourceId) });
  const endpoints = [
    `${baseNoApi}/api/auth/view-token`,
    `${baseNoApi}/auth/view-token`,
    `${baseNoApi}/api/view-token`,
  ];

  let response = null;
  let lastErrorText = '';

  for (const endpoint of endpoints) {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: requestBody,
    });

    if (response.ok) break;

    const errorText = await response.text().catch(() => '');
    lastErrorText = errorText;

    if (response.status !== 404) {
      throw new Error(`Erro ao obter view_token (${response.status}) ${errorText}`.trim());
    }
  }

  if (!response || !response.ok) {
    throw new Error(`Erro ao obter view_token (${response?.status || 0}) ${lastErrorText}`.trim());
  }

  const data = await response.json();
  const viewToken = data?.view_token || data?.token;
  if (!viewToken) {
    throw new Error('Resposta sem view_token');
  }

  return viewToken;
};
