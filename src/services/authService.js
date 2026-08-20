import { setToken } from './tokenStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getAuthEndpoints = () => {
  const apiRoot = API_BASE_URL.replace(/\/+$/, '');
  const baseNoApi = apiRoot.replace(/\/api$/, '');
  return [
    `${apiRoot}/auth/dev/login`,
    `${baseNoApi}/api/auth/dev/login`,
  ];
};

export const loginWithDevApiKey = async ({ email, devApiKey }) => {
  const endpoints = getAuthEndpoints();
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-api-key': devApiKey,
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => response.statusText);
        lastError = new Error(`Erro ${response.status}: ${detail || response.statusText}`);
        continue;
      }

      const data = await response.json();
      const accessToken = data?.access_token || data?.token || null;
      if (!accessToken) {
        throw new Error('Resposta sem access_token');
      }

      setToken(accessToken);
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Falha no login de desenvolvimento');
};
