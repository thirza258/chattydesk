import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { openPaddleCheckout } from '../paddle';
import { IconCheck, IconCreditCard, IconInfinity, IconSparkles } from './icons';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function UpgradeModal({ isOpen, onClose, onSuccess }: UpgradeModalProps) {
  const { user, updateUser } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!user || upgrading) return;
    setUpgrading(true);
    setError('');

    try {
      await openPaddleCheckout({
        user,
        onSuccess: (status) => {
          updateUser({
            is_unlimited: status.is_unlimited,
            paid_requests_count: status.paid_requests_count,
            remaining_paid_requests: status.remaining_paid_requests,
          });
          setUpgrading(false);
          onSuccess?.();
          onClose();
        },
        onError: (err) => {
          setError(err);
          setUpgrading(false);
        },
        onClose: () => {
          setUpgrading(false);
        },
      });
    } catch (err) {
      setError((err as Error).message);
      setUpgrading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-xs animate-fadeIn"
    >
      <div className="relative w-full max-w-md border-2 border-ink bg-paper p-6 shadow-[8px_8px_0_0_#1E293B] text-ink select-none">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center border border-ink bg-rust text-paper">
              <IconSparkles className="h-4 w-4" />
            </span>
            <h2 className="font-display text-lg font-bold text-ink">
              Unlock Unlimited Access
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-ink-faint hover:text-ink font-mono text-sm px-1.5 py-0.5 border border-transparent hover:border-hairline-strong transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="mt-3 text-xs sm:text-sm text-ink-soft leading-relaxed">
          Upgrade to <strong>Lifetime Unlimited Access</strong> for a one-time
          payment of <strong>$0.99</strong> via Paddle.
        </p>

        {error && (
          <div className="mt-3 border-2 border-ember bg-ember-soft p-2.5 text-xs text-ember font-mono">
            {error}
          </div>
        )}

        <ul className="mt-4 space-y-2.5 border-t border-b border-hairline py-3 text-xs">
          <li className="flex items-start gap-2 text-ink">
            <IconCheck className="h-4 w-4 text-pine flex-shrink-0 mt-0.5" />
            <span>
              <strong>Unlimited requests</strong> to all 400+ paid models
              (Claude 3.5 Sonnet, GPT-4o, etc.).
            </span>
          </li>
          <li className="flex items-start gap-2 text-ink">
            <IconInfinity className="h-4 w-4 text-pine flex-shrink-0 mt-0.5" />
            <span>
              <strong>Free OpenRouter models</strong> (:free) are always 100%
              free &amp; unlimited.
            </span>
          </li>
          <li className="flex items-start gap-2 text-ink">
            <IconCreditCard className="h-4 w-4 text-rust flex-shrink-0 mt-0.5" />
            <span>
              <strong>$0.99 one-time payment</strong> via Paddle — lifetime
              access, no subscription.
            </span>
          </li>
        </ul>

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border-2 border-hairline-strong bg-paper hover:bg-paper-sunken text-xs font-medium text-ink transition-colors"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={upgrading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ink hover:bg-rust text-paper text-xs font-semibold px-5 py-2 transition-colors shadow-[3px_3px_0_0_#C6BEA8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust disabled:opacity-50"
          >
            <IconCreditCard className="h-3.5 w-3.5" />
            <span>
              {upgrading ? 'Opening Checkout…' : 'Pay $0.99 with Paddle'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;
