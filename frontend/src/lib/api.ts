export const API_ORIGIN =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
  `${window.location.protocol}//${window.location.hostname}:5001`;

const API_URL = `${API_ORIGIN}/api`;

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

  const response = await fetch(`${API_URL}${endpoint}`, config);

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
