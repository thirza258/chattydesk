/**
 * Token refresh, exercised through a real axios.
 *
 * The transport is stubbed with an axios adapter rather than the module being
 * mocked wholesale: the interceptors under test are axios interceptors, so they
 * have to run inside axios to prove anything.
 */
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

interface StubbedRequest {
  url: string;
  authorization?: string;
}

const requests: StubbedRequest[] = [];

/** Set per test: decides what the fake server does with each request. */
let respond: (request: StubbedRequest) => {
  status: number;
  data: unknown;
};

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');

  const adapter = (config: AxiosRequestConfig): Promise<AxiosResponse> => {
    const headers = config.headers as Record<string, string> | undefined;
    const request: StubbedRequest = {
      url: config.url ?? '',
      authorization: headers?.Authorization,
    };
    requests.push(request);

    const { status, data } = respond(request);
    const response = {
      status,
      statusText: '',
      data,
      headers: {},
      config,
    } as AxiosResponse;

    if (status >= 400) {
      const error = new actual.AxiosError(
        `Request failed with status code ${status}`,
        String(status),
        config,
        null,
        response,
      );
      return Promise.reject(error);
    }
    return Promise.resolve(response);
  };

  // services.ts uses `axios.create()` for its client and bare `axios.post` for
  // the refresh call; both have to land on this adapter.
  const instance = actual.create({ adapter });
  instance.create = () => instance;
  return { __esModule: true, default: instance, AxiosError: actual.AxiosError };
});

/* eslint-disable import/first */
import services, { onSessionExpired } from '../services/services';
import { ACCESS_KEY, REFRESH_KEY } from '../renderer/storage';
/* eslint-enable import/first */

const historyPage = {
  status: 200,
  message: 'Success',
  data: { count: 0, limit: 100, offset: 0, results: [] },
};

const refreshCount = () =>
  requests.filter((request) => request.url.endsWith('/auth/refresh/')).length;

describe('an expired access token', () => {
  beforeEach(() => {
    requests.length = 0;
    window.localStorage.clear();
    window.localStorage.setItem(ACCESS_KEY, 'stale');
    window.localStorage.setItem(REFRESH_KEY, 'refresh-token');
    onSessionExpired(null);
  });

  it('is refreshed and the request retried, once, for several callers at a time', async () => {
    respond = (request) => {
      if (request.url.endsWith('/auth/refresh/')) {
        return {
          status: 200,
          data: { status: 200, message: 'ok', data: { access: 'fresh' } },
        };
      }
      if (request.authorization === 'Bearer stale') {
        return { status: 401, data: { status: 401, message: 'expired' } };
      }
      return { status: 200, data: historyPage };
    };

    // Two requests in flight when the token dies must share one refresh.
    const [first, second] = await Promise.all([
      services.getHistory(),
      services.getHistory(),
    ]);

    expect(first.count).toBe(0);
    expect(second.count).toBe(0);
    expect(refreshCount()).toBe(1);
    expect(window.localStorage.getItem(ACCESS_KEY)).toBe('fresh');

    const retried = requests.filter(
      (request) =>
        request.url.endsWith('/history/') &&
        request.authorization === 'Bearer fresh',
    );
    expect(retried).toHaveLength(2);
  });

  it('ends the session when the refresh token is dead too', async () => {
    const expired = jest.fn();
    onSessionExpired(expired);

    respond = () => ({ status: 401, data: { status: 401, message: 'nope' } });

    await expect(services.getHistory()).rejects.toThrow();

    // One attempt, one refresh, and no attempt to refresh the refresh.
    expect(refreshCount()).toBe(1);
    expect(expired).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(window.localStorage.getItem(REFRESH_KEY)).toBeNull();
  });

  it.each([402, 429, 502, 504])(
    'preserves the session and inference error when a refreshed chat fails with %s',
    async (status) => {
      const expired = jest.fn();
      onSessionExpired(expired);
      respond = (request) => {
        if (request.url.endsWith('/auth/refresh/')) {
          return {
            status: 200,
            data: { status: 200, data: { access: 'fresh' } },
          };
        }
        if (request.authorization === 'Bearer stale') {
          return { status: 401, data: { message: 'Access token expired' } };
        }
        return {
          status,
          data: { message: 'OpenRouter error: model unavailable' },
        };
      };

      await expect(
        services.sendMessage({ message: 'Hello' }),
      ).rejects.toMatchObject({
        status,
        message: 'OpenRouter error: model unavailable',
      });

      expect(refreshCount()).toBe(1);
      expect(expired).not.toHaveBeenCalled();
      expect(window.localStorage.getItem(ACCESS_KEY)).toBe('fresh');
      expect(window.localStorage.getItem(REFRESH_KEY)).toBe('refresh-token');
    },
  );

  it('keeps the session when token refresh fails temporarily', async () => {
    const expired = jest.fn();
    onSessionExpired(expired);
    respond = (request) =>
      request.url.endsWith('/auth/refresh/')
        ? { status: 503, data: { message: 'Service temporarily unavailable' } }
        : { status: 401, data: { message: 'Access token expired' } };

    await expect(
      services.sendMessage({ message: 'Hello' }),
    ).rejects.toMatchObject({
      status: 503,
      message: 'Service temporarily unavailable',
    });

    expect(refreshCount()).toBe(1);
    expect(expired).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(ACCESS_KEY)).toBe('stale');
    expect(window.localStorage.getItem(REFRESH_KEY)).toBe('refresh-token');
  });

  it('ends the session if the refreshed token is also rejected', async () => {
    const expired = jest.fn();
    onSessionExpired(expired);
    respond = (request) =>
      request.url.endsWith('/auth/refresh/')
        ? { status: 200, data: { data: { access: 'fresh' } } }
        : { status: 401, data: { message: 'Account no longer available' } };

    await expect(
      services.sendMessage({ message: 'Hello' }),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Account no longer available',
    });

    expect(refreshCount()).toBe(1);
    expect(expired).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(ACCESS_KEY)).toBeNull();
    expect(window.localStorage.getItem(REFRESH_KEY)).toBeNull();
  });

  it('does not try to refresh a rejected sign-in', async () => {
    respond = () => ({
      status: 401,
      data: { status: 401, message: 'Invalid username or password.' },
    });

    await expect(
      services.signIn({ username: 'ada', password: 'wrong' }),
    ).rejects.toThrow('Invalid username or password.');

    expect(refreshCount()).toBe(0);
  });
});

describe('payment services', () => {
  beforeEach(() => {
    requests.length = 0;
    window.localStorage.clear();
    window.localStorage.setItem(ACCESS_KEY, 'valid-token');
  });

  it('fetches payment config publicly', async () => {
    respond = (request) => {
      if (request.url.endsWith('/payments/config/')) {
        return {
          status: 200,
          data: {
            status: 200,
            message: 'ok',
            data: {
              environment: 'sandbox',
              price_amount: '0.99',
              currency: 'USD',
              max_free_requests: 50,
            },
          },
        };
      }
      return { status: 404, data: null };
    };

    const config = await services.getPaymentConfig();
    expect(config.price_amount).toBe('0.99');
    expect(config.max_free_requests).toBe(50);
  });

  it('fetches payment status', async () => {
    respond = (request) => {
      if (request.url.endsWith('/payments/status/')) {
        return {
          status: 200,
          data: {
            status: 200,
            message: 'ok',
            data: {
              is_unlimited: false,
              paid_requests_count: 12,
              max_free_requests: 50,
              remaining_paid_requests: 38,
              plan: 'free',
            },
          },
        };
      }
      return { status: 404, data: null };
    };

    const status = await services.getPaymentStatus();
    expect(status.is_unlimited).toBe(false);
    expect(status.paid_requests_count).toBe(12);
    expect(status.remaining_paid_requests).toBe(38);
  });

  it('verifies payment transaction to unlock unlimited', async () => {
    respond = (request) => {
      if (request.url.endsWith('/payments/verify/')) {
        return {
          status: 200,
          data: {
            status: 200,
            message: 'ok',
            data: {
              is_unlimited: true,
              paid_requests_count: 12,
              max_free_requests: 50,
              remaining_paid_requests: null,
              plan: 'unlimited',
              paddle_transaction_id: 'txn_123',
            },
          },
        };
      }
      return { status: 404, data: null };
    };

    const verified = await services.verifyPayment('txn_123');
    expect(verified.is_unlimited).toBe(true);
    expect(verified.plan).toBe('unlimited');
    expect(verified.remaining_paid_requests).toBeNull();
  });
});
