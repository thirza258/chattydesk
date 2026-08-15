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

/** POST /openrouter/chat/ */
export interface ChatResult {
  /** Markdown. */
  response: string;
  /** The model that actually served the request. */
  model: string;
  /** Send this back on the next turn to keep the thread's memory. */
  conversation_id: string;
  usage?: Usage;
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
