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

export interface QuotaInfo {
  is_unlimited?: boolean;
  paid_requests_count: number;
  max_free_requests: number;
  remaining_paid_requests: number | null;
  model_is_free?: boolean;
  has_own_key?: boolean;
  plan?: 'free' | 'byok';
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
  quota?: QuotaInfo | null;
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
  session_id?: string | null;
  quota?: QuotaInfo | null;
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
  has_own_key?: boolean;
  plan?: 'free' | 'byok';
  is_unlimited?: boolean;
  paid_requests_count?: number;
  max_free_requests?: number;
  remaining_paid_requests?: number | null;
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
  plan?: 'free' | 'byok';
  is_unlimited?: boolean;
  paid_requests_count?: number;
  max_free_requests?: number;
  remaining_paid_requests?: number | null;
  unlocked_at?: string | null;
  paddle_transaction_id?: string;
  updated_at: string;
  key_check?: KeyCheck;
}

export interface SettingsPatch {
  /** An empty string removes the saved key. */
  openrouterKey?: string;
  preferOwnKey?: boolean;
}

export interface PaymentConfig {
  environment: 'sandbox' | 'production';
  client_token: string;
  price_id: string;
  vendor_id: string;
  price_amount: string;
  currency: string;
  plan_name: string;
  max_free_requests: number;
}

export interface PaymentStatus {
  is_unlimited: boolean;
  paid_requests_count: number;
  max_free_requests: number;
  remaining_paid_requests: number | null;
  plan: 'free' | 'byok' | 'unlimited';
  unlocked_at: string | null;
  paddle_transaction_id: string;
}

// ---------------------------------------------------------------------------
// Benchmarking Platform Types
// ---------------------------------------------------------------------------

export type BenchmarkCategory =
  | 'general_qa'
  | 'reasoning'
  | 'math'
  | 'coding'
  | 'instruction_following'
  | 'summarization'
  | 'structured_output'
  | 'classification'
  | 'custom'
  | 'overall';

export interface BenchmarkTestCase {
  id: string;
  external_case_id: string;
  prompt?: string;
  expected_answer?: string;
  evaluation_method?: string;
  metadata?: any;
  input_json: {
    prompt: string;
    system_prompt?: string;
  };
  expected_output_json: {
    answer?: string;
    label?: string;
    schema?: Record<string, any>;
    keys?: string[];
  };
  evaluation_config_json: {
    method?: string;
    tolerance?: number;
    threshold?: number;
    case_sensitive?: boolean;
  };
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  order_index?: number;
}

export interface BenchmarkDatasetVersion {
  id: string;
  version: number;
  schema_version: string;
  checksum: string;
  test_case_count: number;
  test_cases?: BenchmarkTestCase[];
  metadata_json?: Record<string, any>;
  created_at: string;
}

export interface BenchmarkDataset {
  id: string;
  name: string;
  description: string;
  category: BenchmarkCategory;
  visibility: 'public' | 'private' | 'workspace';
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
  latest_version?: BenchmarkDatasetVersion | null;
  version_count?: number;
  test_cases?: BenchmarkTestCase[];
}

export interface EvaluationResultItem {
  id: string;
  metric_name: string;
  score: number;
  maximum_score: number;
  passed: boolean;
  explanation: string;
  raw_result_json?: Record<string, any>;
}

export interface BenchmarkExecutionItem {
  id: string;
  test_case_id: string;
  model_identifier: string;
  provider_id: string;
  repetition_index: number;
  status: 'pending' | 'running' | 'success' | 'error' | 'timeout' | 'cancelled';
  duration_ms?: number | null;
  ttft_ms?: number | null;
  tokens_per_second?: number | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
  estimated_cost?: string | number | null;
  actual_cost?: string | number | null;
  error_code?: string;
  error_message?: string;
  prompt?: string;
  expected_answer?: string;
  response_text?: string;
  evaluations?: EvaluationResultItem[];
  started_at?: string | null;
  completed_at?: string | null;
}

export interface ModelSummaryMetrics {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  timeout_runs: number;
  success_rate: number;
  error_rate: number;
  timeout_rate: number;
  latency_ms: {
    count: number;
    mean?: number;
    median?: number;
    min?: number;
    max?: number;
    std_dev?: number;
    p50?: number;
    p90?: number;
    p95?: number;
    p99?: number;
  };
  tokens_per_second: {
    count: number;
    mean?: number;
    median?: number;
    min?: number;
    max?: number;
    p50?: number;
  };
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cost_usd: number;
  avg_cost_per_request_usd: number;
  cost_per_1m_tokens_usd: number;
  overall_quality_score: number;
  quality_metrics: Record<
    string,
    {
      count: number;
      mean_score: number;
      max_score: number;
      pass_rate: number;
    }
  >;
}

export interface ExperimentSummaryItem {
  model_identifier: string;
  metrics: ModelSummaryMetrics;
  sample_count: number;
}

export interface BenchmarkExperimentItem {
  id: string;
  name: string;
  description: string;
  status:
    | 'queued'
    | 'validating'
    | 'running'
    | 'evaluating'
    | 'aggregating'
    | 'completed'
    | 'partially_completed'
    | 'failed'
    | 'cancelled';
  dataset_name?: string;
  dataset_category?: string;
  dataset_version_num?: number;
  total_cases: number;
  completed_cases: number;
  failed_cases: number;
  models: string[];
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface BenchmarkExperimentDetail extends BenchmarkExperimentItem {
  configuration_json: {
    repetitions?: number;
    concurrency?: number;
    temperature?: number;
    max_tokens?: number;
    system_prompt?: string;
    timeout?: number;
  };
  error_message?: string;
  dataset: {
    id: string;
    name: string;
    category: string;
    version: number;
    checksum: string;
    test_case_count: number;
  };
  summaries: ExperimentSummaryItem[];
}

export interface BenchmarkProgress {
  experiment_id: string;
  status: string;
  total_cases: number;
  completed_cases: number;
  failed_cases: number;
  progress_percentage: number;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface LeaderboardEntry {
  ranking: number;
  model_identifier: string;
  provider: string;
  category: string;
  composite_score: number;
  quality_score: number;
  speed_score: number;
  cost_per_1m: number;
  reliability_score: number;
  sample_count: number;
  updated_at: string;
  recommendation_reason?: string;
}

export interface CostProjectionItem {
  model_id: string;
  prompt_per_1m: number;
  completion_per_1m: number;
  cost_per_request: number;
  cost_per_1k_requests: number;
  cost_per_1m_tokens: number;
  daily_cost: number;
  monthly_cost: number;
  annual_cost: number;
}

export interface AnalyticsOverview {
  total_experiments: number;
  completed_experiments: number;
  total_benchmark_requests: number;
  successful_requests: number;
  avg_success_rate: number;
  models_evaluated_count: number;
}

export interface ComparisonSessionItem {
  id: string;
  prompt: string;
  models: string[];
  system_prompt?: string;
  temperature?: number | null;
  max_tokens?: number | null;
  mode?: string;
  created_at: string;
  results?: Array<{
    id: string;
    model_identifier: string;
    response: string;
    duration_ms: number;
    input_tokens?: number | null;
    output_tokens?: number | null;
    total_tokens?: number | null;
    estimated_cost?: string | number | null;
    used_own_key?: boolean;
    error?: string | null;
    slot_index: number;
  }>;
}

export interface AIModelItem {
  id: string;
  model_identifier: string;
  display_name: string;
  provider_id: string;
  model_family?: string;
  description?: string;
  context_length?: number | null;
  max_output_tokens?: number | null;
  capabilities?: string[];
  supported_parameters?: string[];
  input_price_per_token?: string | null;
  output_price_per_token?: string | null;
  is_free: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ModelMetadataSnapshotItem {
  id: string;
  model_identifier: string;
  snapshot_hash: string;
  metadata_json: Record<string, any>;
  observed_changes?: Record<string, any>;
  recorded_at: string;
}

