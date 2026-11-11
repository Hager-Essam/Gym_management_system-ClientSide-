/**
 * Authentication service with real API backend integration
 */

import apiClient from './apiClient.js';

const SESSION_KEY = 'ironforge_session';

// Helper function to safely read JSON from storage
function readJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export async function registerUser({ fullName, email, password, planId, role = 'member' }) {
  try {
    const response = await apiClient.post('/api/auth/register', {
      fullName,
      email,
      password,
      planId,
      role,
    });

    if (response.success && response.data) {
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return response.data.user;
    }
    
    throw new Error(response.message || 'Registration failed');
  } catch (error) {
    const message = error.response?.data?.error || error.message || 'Registration failed';
    throw new Error(message);
  }
}

export async function loginUser({ email, password }) {
  try {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password,
    });

    if (response.success && response.data) {
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return response.data.user;
    }
    
    throw new Error(response.message || 'Login failed');
  } catch (error) {
    const message = error.response?.data?.error || error.message || 'Invalid email or password';
    throw new Error(message);
  }
}

// "Remember me" ticked  -> localStorage   (survives closing the browser)
// "Remember me" cleared -> sessionStorage (gone when the tab closes)
export function saveSession(user, remember = true) {
  clearSession();
  (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession() {
  return readJson(localStorage, SESSION_KEY, null) ?? readJson(sessionStorage, SESSION_KEY, null);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
