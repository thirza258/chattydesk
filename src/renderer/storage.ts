/**
 * localStorage with the edges knocked off: it is unavailable in some browser
 * privacy modes and can throw when the quota is exhausted. A preference that
 * cannot be persisted should never take the app down with it.
 */
const memory = new Map<string, string>();

export const readStored = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
};

export const writeStored = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
};

export const removeStored = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    memory.delete(key);
  }
};

export const MODEL_KEY = 'chattydesk.model';
export const CONVERSATION_KEY = 'chattydesk.conversationId';

/**
 * JWTs live here so a reload does not mean signing in again.
 *
 * localStorage is readable by any script running on the page, which is the
 * accepted trade for an API that has no session cookie: the access token is
 * short-lived, and signing out drops both tokens.
 */
export const ACCESS_KEY = 'chattydesk.accessToken';
export const REFRESH_KEY = 'chattydesk.refreshToken';

export const saveSession = (access: string, refresh: string): void => {
  writeStored(ACCESS_KEY, access);
  writeStored(REFRESH_KEY, refresh);
};

/**
 * Forget who was signed in. The conversation id goes too: it points at a thread
 * belonging to the account that just left, and the next one cannot open it.
 */
export const clearSession = (): void => {
  removeStored(ACCESS_KEY);
  removeStored(REFRESH_KEY);
  removeStored(CONVERSATION_KEY);
};

/**
 * Older builds minted a conversation id client-side and the server ignored it.
 * The server now owns those ids, so a leftover value would point at a thread
 * the backend has never heard of — drop it once.
 */
export const clearLegacyConversationId = (): void => {
  removeStored('conversationId');
};
