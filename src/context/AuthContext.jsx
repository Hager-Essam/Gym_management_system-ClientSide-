import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  clearSession,
  getCurrentUser,
  getSession,
  loginUser,
  logoutUser,
  registerUser,
  saveSession,
} from '../services/authService.js';
import { getAccessToken, hasAuthTokens } from '../services/authStorage.js';

/**
 * AuthContext owns the single source of truth for "who is signed in".
 *
 * On a full page reload we trust the cached user for the first paint, then
 * validate it against GET /api/auth/me. That keeps the UI instant while still
 * catching deleted/suspended accounts and expired tokens.
 */

const AuthContext = createContext(null);

function readInitialUser() {
  const cached = getSession();

  // A cached user without any token is a broken/stale session.
  if (cached && !hasAuthTokens()) {
    clearSession();
    return null;
  }

  return cached;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readInitialUser);
  const [initializing, setInitializing] = useState(() => hasAuthTokens());
  const [authError, setAuthError] = useState('');

  const mountedRef = useRef(true);
  const bootstrapStartedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  /** Re-read the real user from the backend. Returns the user or null. */
  const refreshUser = useCallback(async ({ silent = false } = {}) => {
    if (!hasAuthTokens()) {
      setUser(null);
      return null;
    }

    try {
      const { user: freshUser } = await getCurrentUser();

      if (!mountedRef.current) return freshUser;

      if (freshUser?.status && freshUser.status !== 'active') {
        clearSession();
        setUser(null);
        setAuthError(
          'Your account is not active. Please contact the gym front desk.'
        );
        return null;
      }

      setUser(freshUser);
      setAuthError('');
      return freshUser;
    } catch (error) {
      if (!mountedRef.current) return null;

      // 401/403 means the session is genuinely invalid; the API interceptor
      // has already cleared the tokens and announced the expiry.
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        clearSession();
        setUser(null);
      } else if (!silent) {
        setAuthError(
          error?.message || 'We could not verify your session. Please try again.'
        );
      }

      return null;
    }
  }, []);

  // Validate a restored session once, after the first render.
  useEffect(() => {
    if (bootstrapStartedRef.current) return;
    bootstrapStartedRef.current = true;

    if (!hasAuthTokens()) {
      setInitializing(false);
      return;
    }

    refreshUser({ silent: true }).finally(() => {
      if (mountedRef.current) setInitializing(false);
    });
  }, [refreshUser]);

  // The Axios interceptor fires this when refresh fails for good.
  useEffect(() => {
    function handleSessionExpired(event) {
      clearSession();
      setUser(null);
      setInitializing(false);
      setAuthError(
        event?.detail?.message ||
          'Your session has expired. Please sign in again.'
      );
    }

    window.addEventListener('ironforge:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener(
        'ironforge:session-expired',
        handleSessionExpired
      );
    };
  }, []);

  async function login({ email, password, remember = true }) {
    const session = await loginUser({ email, password });

    saveSession(session, remember);
    setUser(session.user);
    setAuthError('');

    return session.user;
  }

  // Registering also logs the new member in.
  async function register(data) {
    const session = await registerUser(data);

    saveSession(session, true);
    setUser(session.user);
    setAuthError('');

    return session.user;
  }

  function logout() {
    const accessToken = getAccessToken();

    // Clear local state immediately; never wait for the network to log out.
    clearSession();
    setUser(null);
    setAuthError('');
    setInitializing(false);

    // The backend is stateless, but call the endpoint best-effort.
    logoutUser(accessToken).catch(() => {});
  }

  const value = {
    user,
    initializing,
    authError,
    login,
    register,
    logout,
    refreshUser,
    setAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
