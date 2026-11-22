import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { apiBaseURL } from '../constant';
import {
  ACCESS_KEY,
  REFRESH_KEY,
  clearSession,
  readStored,
  saveSession,
  writeStored,
} from '../renderer/storage';
import {
  AIModelItem,
  AnalyticsOverview,
  AuthUser,
  BenchmarkDataset,
  BenchmarkExecutionItem,
  BenchmarkExperimentDetail,
  BenchmarkExperimentItem,
  BenchmarkProgress,
  ChatResult,
  ComparisonSessionItem,
  CompareResponse,
  ConversationMemory,
  CostProjectionItem,
  Credentials,
  Envelope,
  HistoryPage,
  HistoryQuery,
  LeaderboardEntry,
  ListModelsOptions,
  ModelCatalogue,
  ModelMetadataSnapshotItem,
  PaymentConfig,
  PaymentStatus,
  MemoryPatch,
  SendMessageOptions,
  Session,
  SettingsPatch,
  SignUpDetails,
  UserSettings,
} from '../interface';

const openRouterURL = `${apiBaseURL}/openrouter`;
const authURL = `${apiBaseURL}/auth`;
const paymentsURL = `${apiBaseURL}/payments`;
const benchmarksURL = `${apiBaseURL}/benchmarks`;
const datasetsURL = `${apiBaseURL}/datasets`;
const leaderboardsURL = `${apiBaseURL}/leaderboards`;
const analyticsURL = `${apiBaseURL}/analytics`;
const comparisonsURL = `${apiBaseURL}/comparisons`;
const evaluationsURL = `${apiBaseURL}/evaluations`;
const modelsURL = `${apiBaseURL}/models`;

/**
 * The backend passes OpenRouter's status codes through and puts the reason in
 * `message`, so a 402 ("out of credit") or 429 ("rate limited") is worth
 * showing verbatim rather than replacing with a generic failure string.
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const toApiError = (error: unknown): ApiError => {
  const axiosError = error as AxiosError<Partial<Envelope<unknown>>>;
  const status = axiosError.response?.status ?? 0;
  const message =
    axiosError.response?.data?.message ||
    axiosError.message ||
    'Request failed';
  return new ApiError(message, status);
};

// ---------------------------------------------------------------- transport ---

/**
 * One client for the whole app, so the bearer token and the token refresh are
 * arranged once rather than at every call site.
 *
 * No baseURL: `apiBaseURL` is itself relative when a proxy fronts the backend
 * (`/api/v1`), and axios would then prepend it twice.
 */
const api = axios.create();

/** Endpoints that must work while signed out — or while holding a dead token. */
const PUBLIC_PATHS = ['/auth/login/', '/auth/register/', '/auth/refresh/'];
const isPublic = (url = ''): boolean =>
  PUBLIC_PATHS.some((path) => url.endsWith(path));

api.interceptors.request.use((config) => {
  const access = readStored(ACCESS_KEY);
  if (access && !isPublic(config.url)) {
    config.headers.set('Authorization', `Bearer ${access}`);
  }
  return config;
});

/**
 * A dead refresh token is the end of the session, and only the UI can act on
 * that. Registered by the auth provider; nothing else should set it.
 */
let sessionExpiredHandler: (() => void) | null = null;

export const onSessionExpired = (handler: (() => void) | null): void => {
  sessionExpiredHandler = handler;
};

/**
 * Several requests can be in flight when the access token expires, and they all
 * come back 401 at once. They share a single refresh instead of racing.
 */
let refreshInFlight: Promise<string> | null = null;

const requestNewAccessToken = async (): Promise<string> => {
  const refresh = readStored(REFRESH_KEY);
  if (!refresh) throw new ApiError('Not signed in.', 401);

  // Bare axios on purpose: routing this through `api` would let a 401 on the
  // refresh call trigger another refresh, forever.
  const { data } = await axios.post<Envelope<{ access: string }>>(
    `${authURL}/refresh/`,
    { refresh },
    { headers: { 'Content-Type': 'application/json' } },
  );

  writeStored(ACCESS_KEY, data.data.access);
  return data.data.access;
};

type RetriableConfig = InternalAxiosRequestConfig & { retried?: boolean };

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetriableConfig | undefined;

  const canRetry =
    error.response?.status === 401 &&
    config &&
    !config.retried &&
    !isPublic(config.url) &&
    readStored(REFRESH_KEY);

  if (!canRetry) {
    if (
      error.response?.status === 401 &&
      config?.retried &&
      !isPublic(config.url)
    ) {
      clearSession();
      sessionExpiredHandler?.();
    }
    throw error;
  }

  config.retried = true;

  try {
    if (!refreshInFlight) {
      refreshInFlight = requestNewAccessToken().finally(() => {
        refreshInFlight = null;
      });
    }
    const access = await refreshInFlight;
    config.headers.set('Authorization', `Bearer ${access}`);
  } catch (refreshError) {
    const status = (refreshError as AxiosError).response?.status;
    // A temporary outage does not mean the refresh token was rejected.
    if (status === 401 || status === 403) {
      clearSession();
      sessionExpiredHandler?.();
    }
    throw refreshError;
  }

  // Inference can fail even with a valid session. Keep that error separate
  // from token refresh so it reaches the chat without signing the user out.
  return api(config);
});

// ------------------------------------------------------------------- models ---

/**
 * Model catalogue for the picker. Cached server-side for an hour; pass
 * `refresh` to bypass that. Public — no token required.
 */
const listModels = async (
  options: ListModelsOptions = {},
): Promise<ModelCatalogue> => {
  try {
    const { data } = await api.get<Envelope<ModelCatalogue>>(
      `${openRouterURL}/models/`,
      {
        params: {
          ...(options.search ? { search: options.search } : {}),
          ...(options.free ? { free: true } : {}),
          ...(options.textOnly === false ? { text_only: false } : {}),
          ...(options.refresh ? { refresh: true } : {}),
        },
      },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

/**
 * Send one chat turn. Requires a signed-in account.
 *
 * Omit `conversationId` on the first turn — the server mints one and returns
 * it. Sending it back on later turns is what gives the thread its memory.
 *
 * No client timeout is set on purpose: a large model can legitimately take
 * over a minute, and the server already gives up at 120s.
 */
const sendMessage = async (
  options: SendMessageOptions,
): Promise<ChatResult> => {
  try {
    const { data } = await api.post<Envelope<ChatResult>>(
      `${openRouterURL}/chat/`,
      {
        message: options.message,
        ...(options.model ? { model: options.model } : {}),
        ...(options.conversationId
          ? { conversation_id: options.conversationId }
          : {}),
        ...(options.systemPrompt
          ? { system_prompt: options.systemPrompt }
          : {}),
        ...(options.useHistory !== undefined
          ? { use_history: options.useHistory }
          : {}),
        ...(options.historyTurns !== undefined
          ? { history_turns: options.historyTurns }
          : {}),
        ...(options.temperature !== undefined
          ? { temperature: options.temperature }
          : {}),
        ...(options.maxTokens !== undefined
          ? { max_tokens: options.maxTokens }
          : {}),
        ...(options.messages ? { messages: options.messages } : {}),
      },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

/**
 * Compare one prompt across 2–5 models at once. Requires a signed-in account.
 *
 * Ephemeral: nothing is written to chat history.
 */
const compareModels = async (
  message: string,
  models: string[],
  options: {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    mode?: string;
    saveSession?: boolean;
    openrouterKey?: string;
  } = {},
): Promise<CompareResponse> => {
  try {
    const { data } = await api.post<Envelope<CompareResponse>>(
      `${openRouterURL}/compare/`,
      {
        message,
        models,
        system_prompt: options.systemPrompt,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        mode: options.mode,
        save_session: options.saveSession,
        openrouter_key: options.openrouterKey,
      },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

/**
 * The signed-in account's own history, newest first. Filter by
 * `conversationId` to rebuild a single thread.
 */
const getHistory = async (query: HistoryQuery = {}): Promise<HistoryPage> => {
  try {
    const { data } = await api.get<Envelope<HistoryPage>>(
      `${openRouterURL}/history/`,
      {
        params: {
          ...(query.conversationId
            ? { conversation_id: query.conversationId }
            : {}),
          ...(query.model ? { model: query.model } : {}),
          ...(query.limit !== undefined ? { limit: query.limit } : {}),
          ...(query.offset !== undefined ? { offset: query.offset } : {}),
        },
      },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

// --------------------------------------------------------------------- auth ---

/** Both tokens are stored before returning, so the caller is signed in. */
const startSession = (session: Session): Session => {
  saveSession(session.access, session.refresh);
  return session;
};

const signIn = async (credentials: Credentials): Promise<Session> => {
  try {
    const { data } = await api.post<Envelope<Session>>(
      `${authURL}/login/`,
      credentials,
      { headers: { 'Content-Type': 'application/json' } },
    );
    return startSession(data.data);
  } catch (error) {
    throw toApiError(error);
  }
};

const signUp = async (details: SignUpDetails): Promise<Session> => {
  try {
    const { data } = await api.post<Envelope<Session>>(
      `${authURL}/register/`,
      {
        username: details.username,
        password: details.password,
        ...(details.email ? { email: details.email } : {}),
      },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return startSession(data.data);
  } catch (error) {
    throw toApiError(error);
  }
};

/** Who the stored token belongs to — how a reload confirms it is still good. */
const me = async (): Promise<AuthUser> => {
  try {
    const { data } = await api.get<Envelope<AuthUser>>(`${authURL}/me/`);
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

/** Signing out is local: there is no server-side token store to tell. */
const signOut = (): void => clearSession();

// ----------------------------------------------------------------- settings ---

const getSettings = async (): Promise<UserSettings> => {
  try {
    const { data } = await api.get<Envelope<UserSettings>>(
      `${authURL}/settings/`,
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

/**
 * Change only what is passed. `openrouterKey: ''` removes a saved key; a new
 * one is checked against OpenRouter server-side before it is stored, so a
 * rejected key comes back as an error here rather than as a failed chat later.
 */
const saveSettings = async (patch: SettingsPatch): Promise<UserSettings> => {
  try {
    const { data } = await api.patch<Envelope<UserSettings>>(
      `${authURL}/settings/`,
      {
        ...(patch.openrouterKey !== undefined
          ? { openrouter_key: patch.openrouterKey }
          : {}),
        ...(patch.preferOwnKey !== undefined
          ? { prefer_own_key: patch.preferOwnKey }
          : {}),
      },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

// ----------------------------------------------------------------- memory ---

const getMemory = async (
  conversationId: string,
): Promise<ConversationMemory> => {
  try {
    const { data } = await api.get<Envelope<ConversationMemory>>(
      `${openRouterURL}/conversations/${encodeURIComponent(conversationId)}/memory/`,
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const updateMemory = async (
  conversationId: string,
  patch: MemoryPatch,
): Promise<ConversationMemory> => {
  try {
    const { data } = await api.patch<Envelope<ConversationMemory>>(
      `${openRouterURL}/conversations/${encodeURIComponent(conversationId)}/memory/`,
      patch,
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

// ----------------------------------------------------------------- payments ---

const getPaymentConfig = async (): Promise<PaymentConfig> => {
  try {
    const { data } = await api.get<Envelope<PaymentConfig>>(
      `${paymentsURL}/config/`,
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const getPaymentStatus = async (): Promise<PaymentStatus> => {
  try {
    const { data } = await api.get<Envelope<PaymentStatus>>(
      `${paymentsURL}/status/`,
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const verifyPayment = async (transactionId: string): Promise<PaymentStatus> => {
  try {
    const { data } = await api.post<Envelope<PaymentStatus>>(
      `${paymentsURL}/verify/`,
      { transaction_id: transactionId },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const testUnlockPayment = async (unlimited = true): Promise<PaymentStatus> => {
  try {
    const { data } = await api.post<Envelope<PaymentStatus>>(
      `${paymentsURL}/test-unlock/`,
      { unlimited },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

// ---------------------------------------------------------------------------
// Benchmarking & Performance Evaluation Services
// ---------------------------------------------------------------------------

const listDatasets = async (category?: string): Promise<BenchmarkDataset[]> => {
  try {
    const { data } = await api.get<Envelope<{ count: number; results: BenchmarkDataset[] }>>(
      `${datasetsURL}/`,
      { params: { ...(category ? { category } : {}) } },
    );
    return data.data.results;
  } catch (error) {
    throw toApiError(error);
  }
};

const getDataset = async (id: string): Promise<BenchmarkDataset> => {
  try {
    const { data } = await api.get<Envelope<BenchmarkDataset>>(`${datasetsURL}/${id}/`);
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const createDataset = async (payload: {
  name: string;
  description?: string;
  category?: string;
  test_cases?: any[];
}): Promise<BenchmarkDataset> => {
  try {
    const { data } = await api.post<Envelope<BenchmarkDataset>>(
      `${datasetsURL}/`,
      payload,
      { headers: { 'Content-Type': 'application/json' } },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const deleteDataset = async (id: string): Promise<void> => {
  try {
    await api.delete(`${datasetsURL}/${id}/`);
  } catch (error) {
    throw toApiError(error);
  }
};

const importDataset = async (payload: {
  name: string;
  description?: string;
  category?: string;
  content: string;
}): Promise<{ dataset: BenchmarkDataset }> => {
  try {
    const { data } = await api.post<Envelope<{ dataset: BenchmarkDataset }>>(
      `${datasetsURL}/import/`,
      payload,
      { headers: { 'Content-Type': 'application/json' } },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const listBenchmarks = async (statusParam?: string): Promise<BenchmarkExperimentItem[]> => {
  try {
    const { data } = await api.get<Envelope<{ count: number; results: BenchmarkExperimentItem[] }>>(
      `${benchmarksURL}/`,
      { params: { ...(statusParam ? { status: statusParam } : {}) } },
    );
    return data.data.results;
  } catch (error) {
    throw toApiError(error);
  }
};

const createBenchmark = async (payload: {
  name: string;
  dataset_id?: string;
  dataset_version_id?: string;
  models: string[];
  configuration?: Record<string, any>;
  auto_start?: boolean;
}): Promise<{ experiment_id: string; status: string; status_url: string }> => {
  try {
    const { data } = await api.post<Envelope<{ experiment_id: string; status: string; status_url: string }>>(
      `${benchmarksURL}/`,
      payload,
      { headers: { 'Content-Type': 'application/json' } },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const getBenchmark = async (id: string): Promise<BenchmarkExperimentDetail> => {
  try {
    const { data } = await api.get<Envelope<BenchmarkExperimentDetail>>(`${benchmarksURL}/${id}/`);
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const startBenchmark = async (id: string): Promise<{ experiment_id: string; status: string }> => {
  try {
    const { data } = await api.post<Envelope<{ experiment_id: string; status: string }>>(
      `${benchmarksURL}/${id}/start/`,
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const cancelBenchmark = async (id: string): Promise<void> => {
  try {
    await api.post(`${benchmarksURL}/${id}/cancel/`);
  } catch (error) {
    throw toApiError(error);
  }
};

const getBenchmarkProgress = async (id: string): Promise<BenchmarkProgress> => {
  try {
    const { data } = await api.get<Envelope<BenchmarkProgress>>(`${benchmarksURL}/${id}/progress/`);
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const getBenchmarkResults = async (
  id: string,
  filters: { model?: string; status?: string } = {},
): Promise<{ experiment: BenchmarkExperimentDetail; executions: BenchmarkExecutionItem[] }> => {
  try {
    const { data } = await api.get<Envelope<{ experiment: BenchmarkExperimentDetail; executions: BenchmarkExecutionItem[] }>>(
      `${benchmarksURL}/${id}/results/`,
      { params: filters },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const submitHumanFeedback = async (payload: {
  execution_id: string;
  rating: number;
  preferred_response?: boolean;
  notes?: string;
}): Promise<void> => {
  try {
    await api.post(`${evaluationsURL}/human-feedback/`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw toApiError(error);
  }
};

const getAnalyticsOverview = async (): Promise<AnalyticsOverview> => {
  try {
    const { data } = await api.get<Envelope<AnalyticsOverview>>(`${analyticsURL}/overview/`);
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const getPerformanceAnalytics = async (): Promise<any[]> => {
  try {
    const { data } = await api.get<Envelope<any[]>>(`${analyticsURL}/performance/`);
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const getCostAnalytics = async (params: {
  daily_requests?: number;
  avg_input_tokens?: number;
  avg_output_tokens?: number;
  models?: string;
} = {}): Promise<{ workload_params: any; projections: CostProjectionItem[] }> => {
  try {
    const { data } = await api.get<Envelope<{ workload_params: any; projections: CostProjectionItem[] }>>(
      `${analyticsURL}/cost/`,
      { params },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const getLeaderboard = async (
  category = 'overall',
  weights?: { quality?: number; speed?: number; cost?: number; reliability?: number },
): Promise<{ category: string; rankings: LeaderboardEntry[]; weights_used: any }> => {
  try {
    const params: Record<string, any> = { category };
    if (weights) {
      if (weights.quality !== undefined) params.w_quality = weights.quality;
      if (weights.speed !== undefined) params.w_speed = weights.speed;
      if (weights.cost !== undefined) params.w_cost = weights.cost;
      if (weights.reliability !== undefined) params.w_reliability = weights.reliability;
    }
    const { data } = await api.get<Envelope<{ category: string; rankings: LeaderboardEntry[]; weights_used: any }>>(
      `${leaderboardsURL}/`,
      { params },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const getRecommendations = async (params: {
  category?: string;
  max_latency_ms?: number;
  max_cost_per_1m?: number;
  min_quality?: number;
  free_only?: boolean;
} = {}): Promise<{ category: string; recommendations: LeaderboardEntry[] }> => {
  try {
    const { data } = await api.get<Envelope<{ category: string; recommendations: LeaderboardEntry[] }>>(
      `${leaderboardsURL}/recommend/`,
      { params },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const listComparisons = async (limit = 50, offset = 0): Promise<{ count: number; results: ComparisonSessionItem[] }> => {
  try {
    const { data } = await api.get<Envelope<{ count: number; results: ComparisonSessionItem[] }>>(
      `${comparisonsURL}/`,
      { params: { limit, offset } },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const getComparison = async (id: string): Promise<ComparisonSessionItem> => {
  try {
    const { data } = await api.get<Envelope<ComparisonSessionItem>>(`${comparisonsURL}/${id}/`);
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const deleteComparison = async (id: string): Promise<void> => {
  try {
    await api.delete(`${comparisonsURL}/${id}/`);
  } catch (error) {
    throw toApiError(error);
  }
};

const saveComparison = async (payload: {
  prompt: string;
  models: string[];
  results: any[];
  mode?: string;
}): Promise<ComparisonSessionItem> => {
  try {
    const { data } = await api.post<Envelope<ComparisonSessionItem>>(
      `${comparisonsURL}/`,
      payload,
      { headers: { 'Content-Type': 'application/json' } },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const listRegisteredModels = async (params: {
  search?: string;
  provider?: string;
  free?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<{ count: number; results: AIModelItem[] }> => {
  try {
    const { data } = await api.get<Envelope<{ count: number; results: AIModelItem[] }>>(
      `${modelsURL}/`,
      { params },
    );
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const getModelDetail = async (modelId: string): Promise<AIModelItem> => {
  try {
    const encoded = encodeURIComponent(modelId);
    const { data } = await api.get<Envelope<AIModelItem>>(`${modelsURL}/${encoded}/`);
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const getModelHistory = async (modelId: string): Promise<ModelMetadataSnapshotItem[]> => {
  try {
    const encoded = encodeURIComponent(modelId);
    const { data } = await api.get<Envelope<ModelMetadataSnapshotItem[]>>(`${modelsURL}/${encoded}/history/`);
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const refreshModels = async (): Promise<{ count: number; synced: number }> => {
  try {
    const { data } = await api.post<Envelope<{ count: number; synced: number }>>(`${modelsURL}/refresh/`);
    return data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

const downloadBenchmarkExport = async (
  experimentId: string,
  format: 'json' | 'csv' = 'json',
): Promise<void> => {
  try {
    const response = await api.get(`${benchmarksURL}/${experimentId}/export/`, {
      params: { export_format: format },
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: format === 'csv' ? 'text/csv' : 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `benchmark_${experimentId}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw toApiError(error);
  }
};

export default {
  listModels,
  sendMessage,
  compareModels,
  getHistory,
  getMemory,
  updateMemory,
  signIn,
  signUp,
  signOut,
  me,
  getSettings,
  saveSettings,
  getPaymentConfig,
  getPaymentStatus,
  verifyPayment,
  testUnlockPayment,
  listDatasets,
  getDataset,
  createDataset,
  deleteDataset,
  importDataset,
  listBenchmarks,
  createBenchmark,
  getBenchmark,
  startBenchmark,
  cancelBenchmark,
  getBenchmarkProgress,
  getBenchmarkResults,
  submitHumanFeedback,
  getAnalyticsOverview,
  getPerformanceAnalytics,
  getCostAnalytics,
  getLeaderboard,
  getRecommendations,
  listComparisons,
  getComparison,
  deleteComparison,
  saveComparison,
  listRegisteredModels,
  getModelDetail,
  getModelHistory,
  refreshModels,
  downloadBenchmarkExport,
};
