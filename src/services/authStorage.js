/**
 * Auth storage helpers.
 *
 * One place decides where the session lives:
 *   remember me  -> localStorage    (survives closing the browser)
 *   no remember  -> sessionStorage  (cleared when the tab closes)
 *
 * Tokens and the cached user always live in the SAME storage, so logging out
 * can never leave a stray access token behind.
 */

const SESSION_KEY = 'ironforge_session';
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

function getStorages() {
  // Guard for non-browser environments (tests, SSR).
  if (typeof window === 'undefined') return [];

  return [window.localStorage, window.sessionStorage];
}

function safeGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode / quota). Nothing else to do.
  }
}

function safeRemove(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore.
  }
}

function findStorageWithKey(key) {
  for (const storage of getStorages()) {
    if (safeGet(storage, key)) return storage;
  }
  return null;
}

/** Read a value from whichever storage currently holds it. */
function readFromAnyStorage(key) {
  for (const storage of getStorages()) {
    const value = safeGet(storage, key);
    if (value) return value;
  }
  return null;
}

export function getAccessToken() {
  return readFromAnyStorage(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return readFromAnyStorage(REFRESH_TOKEN_KEY);
}

/** Cached user object, or null when there is no readable session. */
export function getStoredUser() {
  const raw = readFromAnyStorage(SESSION_KEY);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** True when at least one token exists (used before validating with /auth/me). */
export function hasAuthTokens() {
  return Boolean(getAccessToken() || getRefreshToken());
}

/**
 * Store the user + both tokens together.
 * @param {{ user: object, accessToken: string, refreshToken: string }} session
 * @param {boolean} remember
 */
export function saveAuthSession({ user, accessToken, refreshToken }, remember = true) {
  clearAuthSession();

  const storage = remember
    ? (typeof window !== 'undefined' ? window.localStorage : null)
    : (typeof window !== 'undefined' ? window.sessionStorage : null);

  if (!storage) return;

  if (user) safeSet(storage, SESSION_KEY, JSON.stringify(user));
  if (accessToken) safeSet(storage, ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) safeSet(storage, REFRESH_TOKEN_KEY, refreshToken);
}

/** Replace only the access token after a silent refresh. */
export function updateAccessToken(accessToken) {
  const storage =
    findStorageWithKey(REFRESH_TOKEN_KEY) ||
    findStorageWithKey(ACCESS_TOKEN_KEY) ||
    (typeof window !== 'undefined' ? window.localStorage : null);

  if (storage && accessToken) safeSet(storage, ACCESS_TOKEN_KEY, accessToken);
}

/** Remove every auth key from both storages. */
export function clearAuthSession() {
  for (const storage of getStorages()) {
    safeRemove(storage, SESSION_KEY);
    safeRemove(storage, ACCESS_TOKEN_KEY);
    safeRemove(storage, REFRESH_TOKEN_KEY);
  }
}

export { SESSION_KEY, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY };
