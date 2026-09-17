/**
 * Types for the OpenRouter-backed API (see handover.md).
 *
 * Every endpoint replies with the same envelope; `data` is absent on errors.
 */
export interface Envelope<T> {
  status: number;
  message: string;
  data: T;
}

/** One entry of the model catalogue — GET /openrouter/models/ */
export interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
  context_length: number | null;
  max_completion_tokens?: number | null;
  input_modalities?: string[];
  output_modalities?: string[];
  supported_parameters?: string[];
  pricing: {
    prompt: string | null;
    completion: string | null;
  };
  is_free: boolean;
}

export interface ModelCatalogue {
  count: number;
  default_model: string;
  models: Model[];
}

export interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface ConversationMemory {
  enabled: boolean;
  history_turns: number;
  available_turns: number;
  reset_at?: string | null;
  used_turns?: number;
  trimmed?: boolean;
}

export interface MemoryPatch {
  enabled?: boolean;
  history_turns?: number;
  reset?: boolean;
}

/** POST /openrouter/chat/ */
export interface ChatResult {
  /** Markdown. */
  response: string;
  /** The model that actually served the request. */
  model: string;
  /** Send this back on the next turn to keep the thread's memory. */
  conversation_id: string;
  usage?: Usage;
  /** True when the answer was paid for with the account's own OpenRouter key. */
  used_own_key?: boolean;
  memory?: ConversationMemory | null;
}

export interface CompareResult {
  model: string;
  response?: string;
  usage?: Usage;
  used_own_key?: boolean;
  duration_ms?: number;
  error?: string;
}

export interface CompareResponse {
  prompt: string;
  results: CompareResult[];
}

export interface HistoryEntry {
  id: number;
  prompt: string;
  response: string;
  conversation_id: string;
  /** A label, not a key: rows predating the migration hold display names. */
  model_name: string;
  created_at: string;
}

export interface HistoryPage {
  /** Total matching rows, not the size of this page. */
  count: number;
  limit: number;
  offset: number;
  results: HistoryEntry[];
}

export interface ChatMessage {
  text: string;
  user: 'me' | 'bot';
  model?: string;
  usage?: Usage;
  error?: boolean;
  usedOwnKey?: boolean;
}

export type Role = 'system' | 'user' | 'assistant';

export interface ChatTurn {
  role: Role;
  content: string;
}

export interface SendMessageOptions {
  message: string;
  model?: string;
  conversationId?: string | null;
  systemPrompt?: string;
  useHistory?: boolean;
  historyTurns?: number;
  temperature?: number;
  maxTokens?: number;
  /** Takes over context entirely when provided. */
  messages?: ChatTurn[];
}

export interface ListModelsOptions {
  search?: string;
  free?: boolean;
  textOnly?: boolean;
  refresh?: boolean;
}

export interface HistoryQuery {
  conversationId?: string;
  model?: string;
  limit?: number;
  offset?: number;
}

/** GET /auth/me/, and the `user` of a sign-in or sign-up reply. */
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  date_joined: string;
}

/**
 * POST /auth/login/ and POST /auth/register/.
 *
 * `access` goes on every subsequent request and expires within the hour;
 * `refresh` buys a new one without asking for the password again.
 */
export interface Session {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface Credentials {
  username: string;
  password: string;
}

export interface SignUpDetails extends Credentials {
  email?: string;
}

/** What OpenRouter says about a key, returned when one is saved. */
export interface KeyCheck {
  label: string;
  /** USD spent on this key so far. */
  usage: number | null;
  /** USD ceiling, or null for "no limit". */
  limit: number | null;
  limit_remaining: number | null;
  is_free_tier: boolean | null;
}

/**
 * GET/PATCH /auth/settings/
 *
 * The key itself is write-only — the server reports whether one is saved and
 * its last four characters, never the key.
 */
export interface UserSettings {
  has_own_key: boolean;
  key_hint: string;
  /** False: the server's key pays until it runs out. True: always use theirs. */
  prefer_own_key: boolean;
  updated_at: string;
  key_check?: KeyCheck;
}

export interface SettingsPatch {
  /** An empty string removes the saved key. */
  openrouterKey?: string;
  preferOwnKey?: boolean;
}
