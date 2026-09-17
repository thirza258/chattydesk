import services from '../services/services';
import { AuthUser, PaymentConfig, PaymentStatus } from '../interface';

declare global {
  interface Window {
    Paddle?: {
      Environment: {
        set: (env: string) => void;
      };
      Initialize: (options: {
        token: string;
        eventCallback?: (event: { name: string; data?: any }) => void;
      }) => void;
      Checkout: {
        open: (options: {
          items?: Array<{ priceId: string; quantity: number }>;
          customer?: { email?: string };
          customData?: Record<string, any>;
          settings?: Record<string, any>;
        }) => void;
        close?: () => void;
      };
    };
  }
}

let paddleLoadedPromise: Promise<boolean> | null = null;
let paddleInitialized = false;

export const loadPaddleScript = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Paddle) return Promise.resolve(true);
  if (paddleLoadedPromise) return paddleLoadedPromise;

  paddleLoadedPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      // eslint-disable-next-line no-console
      console.warn('Could not load Paddle.js CDN');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return paddleLoadedPromise;
};

export interface CheckoutOptions {
  user: AuthUser;
  config?: PaymentConfig | null;
  onSuccess?: (status: PaymentStatus) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

/**
 * Initializes Paddle.js and opens the checkout for $0.99 Lifetime Unlimited.
 * Verifies the transaction with the backend upon completion.
 */
export const openPaddleCheckout = async ({
  user,
  config,
  onSuccess,
  onError,
  onClose,
}: CheckoutOptions): Promise<void> => {
  try {
    const paymentConfig = config || (await services.getPaymentConfig());
    const isLoaded = await loadPaddleScript();

    if (
      isLoaded &&
      window.Paddle &&
      paymentConfig.client_token &&
      paymentConfig.price_id
    ) {
      if (!paddleInitialized) {
        if (paymentConfig.environment === 'sandbox') {
          window.Paddle.Environment.set('sandbox');
        }
        window.Paddle.Initialize({
          token: paymentConfig.client_token,
          eventCallback: async (event) => {
            if (
              event.name === 'checkout.completed' ||
              event.name === 'checkout.payment.completed'
            ) {
              const txnId =
                event.data?.id ||
                event.data?.transaction_id ||
                event.data?.transactionId ||
                `txn_${Date.now()}`;
              try {
                const verified = await services.verifyPayment(txnId);
                onSuccess?.(verified);
              } catch (err) {
                onError?.((err as Error).message);
              }
            } else if (event.name === 'checkout.closed') {
              onClose?.();
            }
          },
        });
        paddleInitialized = true;
      }

      window.Paddle.Checkout.open({
        items: [{ priceId: paymentConfig.price_id, quantity: 1 }],
        customer: user.email ? { email: user.email } : undefined,
        customData: {
          user_id: user.id,
          userId: user.id,
          username: user.username,
        },
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'en',
          successUrl: window.location.href,
        },
      });
      return;
    }

    // Dev/Sandbox fallback or when client token is not yet configured
    const simulatedTxnId = `txn_sim_${Date.now()}`;
    const res = await services.verifyPayment(simulatedTxnId);
    onSuccess?.(res);
  } catch (error) {
    onError?.((error as Error).message);
  }
};
