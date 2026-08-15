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
 * Older builds minted a conversation id client-side and the server ignored it.
 * The server now owns those ids, so a leftover value would point at a thread
 * the backend has never heard of — drop it once.
 */
export const clearLegacyConversationId = (): void => {
  removeStored('conversationId');
};
