import axios, { AxiosError } from 'axios';
import { apiBaseURL } from '../constant';
import {
  ChatResult,
  Envelope,
  HistoryPage,
  HistoryQuery,
  ListModelsOptions,
  ModelCatalogue,
  SendMessageOptions,
} from '../interface';

const openRouterURL = `${apiBaseURL}/openrouter`;

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

/**
 * Model catalogue for the picker. Cached server-side for an hour; pass
 * `refresh` to bypass that.
 */
const listModels = async (
  options: ListModelsOptions = {},
): Promise<ModelCatalogue> => {
  try {
    const { data } = await axios.get<Envelope<ModelCatalogue>>(
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
 * Send one chat turn.
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
    const { data } = await axios.post<Envelope<ChatResult>>(
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

/** Newest first. Filter by `conversationId` to rebuild a single thread. */
const getHistory = async (query: HistoryQuery = {}): Promise<HistoryPage> => {
  try {
    const { data } = await axios.get<Envelope<HistoryPage>>(
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

export default {
  listModels,
  sendMessage,
  getHistory,
};
