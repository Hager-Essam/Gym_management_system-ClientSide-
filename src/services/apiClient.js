import axios from 'axios';

import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
} from './authStorage.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Request interceptor - Add auth token from whichever storage holds the session
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// One refresh at a time, even if several requests fail with 401 together.
let refreshPromise = null;

function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return Promise.reject(new Error('No refresh token available'));
  }

  refreshPromise = axios
    .post(
      `${API_BASE_URL}/api/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    )
    .then((response) => {
      const accessToken = response.data?.data?.accessToken;

      if (!accessToken) {
        throw new Error('The server did not return a new access token');
      }

      updateAccessToken(accessToken);
      return accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

/**
 * Tell the app (not the whole browser) that the session is gone.
 * AuthContext listens for this, clears `user`, and ProtectedRoute redirects
 * to /login without a hard reload or a redirect loop.
 */
function announceSessionExpired(message) {
  clearAuthSession();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ironforge:session-expired', {
        detail: {
          message:
            message || 'Your session has expired. Please sign in again.',
        },
      })
    );
  }
}

// Response interceptor - unwrap body, refresh expired access tokens once
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config || {};
    const url = originalRequest.url || '';
    const isAuthRoute = /\/api\/auth\/(login|register|refresh)/.test(url);

    const shouldTryRefresh =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute;

    if (!shouldTryRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await refreshAccessToken();

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      // A network outage is not proof that the session is invalid. Keep the
      // cached user and let the caller show an error/retry instead of logging
      // the member out.
      const stillHasRefreshToken = Boolean(getRefreshToken());

      if (!refreshError.response && stillHasRefreshToken) {
        const networkError = new Error(
          'We could not reach the server to refresh your session. Please check your connection.'
        );
        networkError.cause = refreshError;
        return Promise.reject(networkError);
      }

      const message =
        refreshError.response?.data?.error ||
        'Your session has expired. Please sign in again.';

      announceSessionExpired(message);
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;
