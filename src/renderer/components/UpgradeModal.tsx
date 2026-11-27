import { FormEvent, useState } from 'react';
import { useAuth } from '../AuthContext';
import services from '../../services/services';
import { IconCheck, IconEye, IconEyeOff, IconInfinity, IconKey } from './icons';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function UpgradeModal({ isOpen, onClose, onSuccess }: UpgradeModalProps) {
  const { user, updateUser } = useAuth();
  const [keyInput, setKeyInput] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSaveKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;
    const key = keyInput.trim();
    if (!key) {
      setError('Please enter your OpenRouter API key.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const saved = await services.saveSettings({ openrouterKey: key });
      updateUser({
        has_own_key: true,
        plan: 'byok',
        paid_requests_count: saved.paid_requests_count,
        remaining_paid_requests: saved.remaining_paid_requests,
      });
      setSaving(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
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
              <IconKey className="h-4 w-4" />
            </span>
            <h2 className="font-display text-lg font-bold text-ink">
              Switch to BYOK Plan
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
          You have reached the free quota for paid models on the Free Plan.
          Switch to the <strong>BYOK (Bring Your Own Key) Plan</strong> to
          continue using paid models without ChattyDesk limits.
        </p>

        {error && (
          <div className="mt-3 border-2 border-ember bg-ember-soft p-2.5 text-xs text-ember font-mono">
            {error}
          </div>
        )}

        <ul className="mt-4 space-y-2 border-t border-b border-hairline py-3 text-xs">
          <li className="flex items-start gap-2 text-ink">
            <IconInfinity className="h-4 w-4 text-pine flex-shrink-0 mt-0.5" />
            <span>
              <strong>Free OpenRouter models</strong> (:free) remain 100% free
              &amp; unlimited anytime on the Free Plan.
            </span>
          </li>
          <li className="flex items-start gap-2 text-ink">
            <IconCheck className="h-4 w-4 text-pine flex-shrink-0 mt-0.5" />
            <span>
              <strong>BYOK Plan:</strong> Unlimited requests for all 400+ paid
              models at exact OpenRouter token rates with zero markup.
            </span>
          </li>
        </ul>

        <form onSubmit={handleSaveKey} className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="byok-api-key"
              className="block text-[11px] font-mono font-semibold uppercase text-ink-faint mb-1"
            >
              Your OpenRouter API Key
            </label>
            <div className="relative">
              <input
                id="byok-api-key"
                type={revealed ? 'text' : 'password'}
                required
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-or-v1-…"
                className="w-full border-2 border-hairline-strong bg-paper p-2 text-xs font-mono text-ink placeholder:text-ink-faint focus:outline-none focus:border-rust pr-9"
              />
              <button
                type="button"
                onClick={() => setRevealed(!revealed)}
                className="absolute right-2.5 top-2.5 text-ink-faint hover:text-ink"
                title={revealed ? 'Hide' : 'Show'}
              >
                {revealed ? (
                  <IconEyeOff className="h-3.5 w-3.5" />
                ) : (
                  <IconEye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono">
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="text-rust hover:underline"
            >
              Get OpenRouter key →
            </a>
            <span className="text-ink-faint">Stored client-side encrypted</span>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 border-2 border-hairline-strong bg-paper hover:bg-paper-sunken text-xs font-medium text-ink transition-colors"
            >
              Maybe later
            </button>
            <button
              type="submit"
              disabled={saving || !keyInput.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-ink hover:bg-rust text-paper text-xs font-semibold px-5 py-2 transition-colors shadow-[3px_3px_0_0_#C6BEA8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust disabled:opacity-50"
            >
              {saving ? 'Verifying…' : 'Save & Activate BYOK'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpgradeModal;
