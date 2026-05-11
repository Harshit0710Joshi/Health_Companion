/**
 * Backend origin only (no `/api`). Used for REST (`/api/...`) and Socket.IO.
 *
 * - Local dev: defaults to port 10000 on localhost.
 * - Vercel/production: requires `VITE_API_URL` at build time (set in Vercel env, then redeploy).
 */
export function getApiOrigin(): string {
  const raw = import.meta.env.VITE_API_URL;
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  const fromEnv = trimmed.replace(/\/api\/?$/, '');
  if (fromEnv) {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && fromEnv.startsWith('http:')) {
      console.warn(
        '[Health Companion] Frontend is HTTPS but VITE_API_URL is HTTP — browsers may block requests (mixed content). Use https:// on your backend URL.'
      );
    }
    return fromEnv;
  }

  const { protocol, hostname } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocal) {
    return `${protocol}//${hostname}:10000`;
  }

  throw new Error(
    'Missing VITE_API_URL. In Vercel: Settings → Environment Variables → add VITE_API_URL = https://YOUR-BACKEND.onrender.com (no /api), apply to Production + Preview, then Redeploy.'
  );
}

function getApiBaseUrl(): string {
  return `${getApiOrigin()}/api`;
}

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token: string) => localStorage.setItem('token', token);
export const getAuthRole = () => localStorage.getItem('role');
export const setAuthSession = (token: string, role: 'patient' | 'doctor') => {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
};
export const removeAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
};

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

interface FetchOptions extends RequestInit {
  data?: unknown;
}

export async function apiFetch<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { data, headers: customHeaders, ...customOptions } = options;
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  const config: RequestInit = {
    ...customOptions,
    headers,
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  let url: string;
  try {
    url = `${getApiBaseUrl()}${endpoint}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'API URL is not configured.';
    throw new Error(msg);
  }

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    if (err instanceof TypeError && String(err.message).includes('fetch')) {
      throw new Error(
        `Cannot reach the API (${url}). Set VITE_API_URL on Vercel to your HTTPS backend, redeploy, and ensure Render has FRONTEND_URLS including your Vercel URL for CORS.`
      );
    }
    throw err;
  }

  if (response.status === 401) {
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/register';
    if (!isLoginPage && getAuthToken()) {
      console.warn("Session expired or unauthorized. Logging out...");
      removeAuthToken();
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const result = await response.json() as T;

  if (!response.ok) {
    const errorResult = result as { error?: string };
    console.error(`API Error [${response.status}] ${endpoint}:`, errorResult.error);
    throw new Error(errorResult.error || 'API request failed');
  }

  return result;
}
