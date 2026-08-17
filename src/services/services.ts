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
  AuthUser,
  ChatResult,
  Credentials,
  Envelope,
  HistoryPage,
  HistoryQuery,
  ListModelsOptions,
  ModelCatalogue,
  SendMessageOptions,
  Session,
  SettingsPatch,
  SignUpDetails,
  UserSettings,
} from '../interface';

const openRouterURL = `${apiBaseURL}/openrouter`;
const authURL = `${apiBaseURL}/auth`;

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

  if (!canRetry) throw error;

  config.retried = true;

  try {
    if (!refreshInFlight) {
      refreshInFlight = requestNewAccessToken().finally(() => {
        refreshInFlight = null;
      });
    }
    const access = await refreshInFlight;
    config.headers.set('Authorization', `Bearer ${access}`);
    return await api(config);
  } catch {
    // The refresh token is expired or revoked: this session is over.
    clearSession();
    sessionExpiredHandler?.();
    throw error;
  }
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
        ...(options.useHistory === false ? { use_history: false } : {}),
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

export default {
  listModels,
  sendMessage,
  getHistory,
  signIn,
  signUp,
  signOut,
  me,
  getSettings,
  saveSettings,
};
