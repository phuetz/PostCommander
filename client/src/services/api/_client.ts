import axios, { AxiosError } from 'axios';

/**
 * Shared axios instance for every API call in the app. All `api/*.ts` domain
 * files import this singleton so cookies + interceptors apply uniformly.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Routes the user can already be on when a 401 fires that should NOT trigger
 * a redirect (otherwise we get a refresh loop on the login page itself).
 */
const PUBLIC_PATH_PREFIXES = ['/login', '/signup', '/reset-password', '/forgot-password'];
const AUTH_PROBE_ENDPOINTS = ['/auth/me'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

function isAuthProbe(url: string | undefined): boolean {
  if (!url) return false;
  return AUTH_PROBE_ENDPOINTS.some((p) => url.endsWith(p));
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const onPublic = isPublicPath(window.location.pathname);
      const isProbe = isAuthProbe(error.config?.url);
      if (!onPublic && !isProbe) {
        const from = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.assign(`/login?from=${from}`);
      }
    }
    return Promise.reject(error);
  },
);
