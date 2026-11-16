/**
 * Authentication API service.
 *
 * Talks to the real backend:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 *
 * The Axios response interceptor already unwraps the HTTP body, so every
 * function below receives `{ success, message?, data }`.
 *
 * Never add `role` to a registration/login payload. The backend assigns it.
 */

import axios from 'axios';

import apiClient from './apiClient.js';
import {
  clearAuthSession,
  getStoredUser,
  saveAuthSession,
} from './authStorage.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function apiError(error, fallback) {
  const body = error?.response?.data;

  // Backend error handler uses { success:false, error, message? }.
  const message =
    body?.error ||
    body?.message ||
    error?.message ||
    fallback;

  return new Error(message);
}

/** Pull `{ user, accessToken, refreshToken }` out of the API envelope. */
function readAuthPayload(response, fallbackMessage) {
  const payload = response?.data ?? response;

  if (!payload?.user || !payload?.accessToken || !payload?.refreshToken) {
    throw new Error(fallbackMessage);
  }

  return {
    user: payload.user,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  };
}

export async function registerUser({ fullName, email, password, phone }) {
  try {
    const response = await apiClient.post('/api/auth/register', {
      fullName,
      email,
      password,
      // The selected plan is intentionally NOT sent here. Registration creates
      // a *pending* subscription on the backend; the member then confirms the
      // plan on the checkout page, which creates the real subscription once.
      ...(phone ? { phone } : {}),
    });

    return readAuthPayload(response, 'Registration failed');
  } catch (error) {
    throw apiError(error, 'Registration failed');
  }
}

export async function loginUser({ email, password }) {
  try {
    const response = await apiClient.post('/api/auth/login', { email, password });
    return readAuthPayload(response, 'Login failed');
  } catch (error) {
    throw apiError(error, 'Invalid email or password');
  }
}

/** Current user + their active subscription (null when none). */
export async function getCurrentUser() {
  try {
    const response = await apiClient.get('/api/auth/me');
    const payload = response?.data ?? response;

    if (!payload?.user) {
      throw new Error('Unexpected response while loading your account.');
    }

    return {
      user: payload.user,
      subscription: payload.subscription ?? null,
    };
  } catch (error) {
    throw apiError(error, 'Unable to load your account');
  }
}

/** Stateless on the backend, but call it so the contract stays honest. */
export async function logoutUser(accessToken) {
  if (!accessToken) return;

  try {
    await axios.post(
      `${API_BASE_URL}/api/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  } catch {
    // Logging out locally must always succeed, even if the API is down.
  }
}

// ---------------------------------------------------------------------------
// Session helpers (kept as thin wrappers so existing imports keep working)
// ---------------------------------------------------------------------------

export function saveSession(session, remember = true) {
  saveAuthSession(session, remember);
}

export function getSession() {
  return getStoredUser();
}

export function clearSession() {
  clearAuthSession();
}
