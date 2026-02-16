import { getToken } from './tokenStore';

const normalizeBaseUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/\/$/, '');
};

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || '');

export class ApiError extends Error {
  constructor(message, { status = null, body = null, isUnauthorized = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.isUnauthorized = isUnauthorized;
  }
}

const buildUrl = (path) => {
  if (!path) throw new Error('apiFetch requires a path');
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith('/')) {
    throw new Error(`apiFetch path must start with "/". Received: ${path}`);
  }
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured');
  }
  return `${API_BASE_URL}${path}`;
};

export const apiFetch = async (path, options = {}) => {
  const {
    headers: customHeaders,
    skipAuth = false,
    ...rest
  } = options;

  const token = getToken();
  const headers = new Headers(customHeaders || {});

  if (!headers.has('Content-Type') && rest.body && !(rest.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...rest,
    headers,
  });

  if (response.ok) {
    return response;
  }

  const responseText = await response.text().catch(() => '');
  let parsedBody = null;
  if (responseText) {
    try {
      parsedBody = JSON.parse(responseText);
    } catch {
      parsedBody = responseText;
    }
  }

  throw new ApiError(`API request failed (${response.status})`, {
    status: response.status,
    body: parsedBody,
    isUnauthorized: response.status === 401,
  });
};
