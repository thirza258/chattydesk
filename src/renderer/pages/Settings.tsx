import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import services from '../../services/services';
import { KeyCheck, UserSettings } from '../../interface';
import { useAuth } from '../AuthContext';
import { usePageMeta } from '../pageMeta';
import {
  IconArrowRight,
  IconCheck,
  IconExternal,
  IconEye,
  IconEyeOff,
  IconLogo,
} from '../components/icons';

const fieldClasses =
  'w-full border-2 border-hairline-strong bg-paper px-3.5 py-2.5 font-mono text-xs text-ink placeholder:text-ink-faint transition-colors focus:border-rust focus:outline-none disabled:opacity-60';

const primaryButton =
  'inline-flex items-center justify-center gap-2 bg-ink px-4 py-2 text-xs font-semibold text-paper transition-colors hover:bg-rust shadow-[3px_3px_0_0_#C6BEA8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust disabled:cursor-not-allowed disabled:bg-hairline-strong disabled:text-ink-faint';

const quietButton =
  'inline-flex items-center justify-center gap-2 border-2 border-ink bg-paper px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

const dangerButton =
  'inline-flex items-center justify-center gap-2 border-2 border-ember bg-ember-soft px-4 py-2 text-xs font-medium text-ember transition-colors hover:bg-ember hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

const linkClasses =
  'font-medium text-rust transition-colors hover:text-rust-deep hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

/** OpenRouter reports spend in dollars, often in fractions of a cent. */
const money = (value: number | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  if (value > 0 && value < 0.01) return '<$0.01';
  return `$${value.toFixed(2)}`;
};

function KeyCheckSummary({ check }: { check: KeyCheck }) {
  const spent = money(check.usage);
  const limit = money(check.limit);

  let allowance = '';
  if (limit) allowance = ` of a ${limit} limit.`;
  else if (spent) allowance = ', no limit set.';

  return (
    <div className="mt-3 border-2 border-pine bg-pine-soft px-3.5 py-2.5 text-xs text-pine flex items-center gap-2 font-mono">
      <IconCheck className="h-4 w-4 text-pine flex-shrink-0" />
      <p>
        OpenRouter verified key
        {check.label ? ` (${check.label})` : ''}.
        {spent ? ` ${spent} spent` : ''}
        {allowance}
      </p>
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="border-2 border-ink bg-paper-raised p-6 shadow-[4px_4px_0_0_#C6BEA8]">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-ink-soft">
        {description}
      </p>
      {children}
    </section>
  );
}

/**
 * Account page, and the one place a user can hand over their own OpenRouter
 * key.
 *
 * The key is write-only: the server never sends it back, so the form shows the
 * last four characters of what is saved and an empty input for replacing it.
 */
function Settings() {
  const { user, signOut } = useAuth();
  usePageMeta({
    title: 'Settings · ChattyDesk',
    path: '/settings',
    noindex: true,
  });

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const [keyInput, setKeyInput] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [notice, setNotice] = useState('');
  const [keyCheck, setKeyCheck] = useState<KeyCheck | null>(null);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  const [savingPreference, setSavingPreference] = useState(false);
  const [preferenceError, setPreferenceError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const loaded = await services.getSettings();
        if (cancelled) return;
        setSettings(loaded);
        setLoadError('');
      } catch (error) {
        if (!cancelled) setLoadError((error as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const applyResult = (saved: UserSettings) => {
    setSettings(saved);
    setKeyCheck(saved.key_check ?? null);
  };

  const saveKey = async (event: FormEvent) => {
    event.preventDefault();
    const key = keyInput.trim();
    if (!key || savingKey) return;

    setSavingKey(true);
    setKeyError('');
    setNotice('');
    setKeyCheck(null);
    try {
      applyResult(await services.saveSettings({ openrouterKey: key }));
      setKeyInput('');
      setRevealed(false);
      setNotice('Your key is saved. New chats can use it.');
    } catch (error) {
      setKeyError((error as Error).message);
    } finally {
      setSavingKey(false);
    }
  };

  const removeKey = async () => {
    setSavingKey(true);
    setKeyError('');
    setNotice('');
    setKeyCheck(null);
    try {
      // Clearing the key also drops "always use mine", which would otherwise
      // point at nothing.
      applyResult(
        await services.saveSettings({
          openrouterKey: '',
          preferOwnKey: false,
        }),
      );
      setConfirmingRemoval(false);
      setNotice('Key removed. Chats go back to the server’s key.');
    } catch (error) {
      setKeyError((error as Error).message);
    } finally {
      setSavingKey(false);
    }
  };

  const choosePreference = async (preferOwnKey: boolean) => {
    if (savingPreference || settings?.prefer_own_key === preferOwnKey) return;

    setSavingPreference(true);
    setPreferenceError('');
    try {
      applyResult(await services.saveSettings({ preferOwnKey }));
    } catch (error) {
      setPreferenceError((error as Error).message);
    } finally {
      setSavingPreference(false);
    }
  };

  const hasKey = Boolean(settings?.has_own_key);

  return (
    <div className="min-h-dvh bg-paper text-ink selection:bg-rust-soft selection:text-rust-deep">
      <header className="sticky top-0 z-20 border-b-2 border-ink bg-paper/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-display text-base font-semibold tracking-tight text-ink hover:text-rust-deep"
          >
            <IconLogo className="h-6 w-6" />
            <span>ChattyDesk</span>
          </Link>
          <Link
            to="/chat"
            className="inline-flex items-center gap-1.5 border-2 border-ink bg-paper px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
          >
            <span>Back to chat</span>
            <IconArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-5 py-10 sm:px-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Settings
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Your account, and which OpenRouter key pays for your chats.
          </p>
        </div>

        {loadError && (
          <p
            role="alert"
            className="border-2 border-ember bg-ember-soft p-3 text-xs text-ember font-mono"
          >
            Could not load your settings: {loadError}
          </p>
        )}

        <Card
          title="Account"
          description="Signed in on this device. The same account works in the desktop app and in the browser."
        >
          <dl className="mt-4 divide-y divide-hairline text-sm">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-soft">Username</dt>
              <dd className="font-medium text-ink">{user?.username ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-soft">Email</dt>
              <dd className="truncate font-medium text-ink">
                {user?.email || 'Not set'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-ink-soft">Member since</dt>
              <dd className="font-medium text-ink font-mono text-xs">
                {user?.date_joined
                  ? new Date(user.date_joined).toLocaleDateString()
                  : '—'}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={signOut}
            className={`mt-5 ${dangerButton}`}
          >
            Sign out
          </button>
        </Card>

        <Card
          title="Your OpenRouter key"
          description="Chats are charged to the server's key by default. Save your own and it takes over when that one is out of credit — or on every request, if you would rather."
        >
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-ink-soft">Currently:</span>
            {loading ? (
              <span className="text-ink-faint">checking…</span>
            ) : (
              <span className="font-medium text-ink">
                {hasKey ? (
                  <>
                    your key
                    <span className="ml-1.5 border border-hairline-strong bg-paper-sunken px-1.5 py-0.5 font-mono text-xs text-ink">
                      sk-or-…{settings?.key_hint}
                    </span>
                  </>
                ) : (
                  "the server's key"
                )}
              </span>
            )}
          </div>

          {notice && (
            <p
              role="status"
              className="mt-3 border-2 border-hairline-strong bg-paper-sunken p-3 text-xs text-ink font-mono"
            >
              {notice}
            </p>
          )}

          {keyError && (
            <p
              role="alert"
              className="mt-3 border-2 border-ember bg-ember-soft p-3 text-xs text-ember font-mono"
            >
              {keyError}
            </p>
          )}

          {keyCheck && <KeyCheckSummary check={keyCheck} />}

          <form onSubmit={saveKey} className="mt-4">
            {/* The reveal button sits outside the label: a control nested in a
                label steals the click that should focus the input. */}
            <div className="relative">
              <label htmlFor="openrouter-key" className="block">
                <span className="block text-xs font-mono font-semibold uppercase tracking-wider text-ink-faint">
                  {hasKey ? 'Replace your key' : 'OpenRouter API key'}
                </span>
                <input
                  id="openrouter-key"
                  name="openrouter-key"
                  type={revealed ? 'text' : 'password'}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="sk-or-v1-…"
                  disabled={savingKey}
                  value={keyInput}
                  onChange={(event) => setKeyInput(event.target.value)}
                  aria-describedby="openrouter-key-hint"
                  className={`mt-1.5 ${fieldClasses} pr-12`}
                />
              </label>
              <button
                type="button"
                onClick={() => setRevealed((shown) => !shown)}
                aria-label={revealed ? 'Hide the key' : 'Show the key'}
                className="absolute bottom-[2px] right-1 flex h-11 w-11 items-center justify-center text-ink-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
              >
                {revealed ? (
                  <IconEyeOff className="h-4 w-4" />
                ) : (
                  <IconEye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p id="openrouter-key-hint" className="mt-2 text-xs text-ink-faint">
              Stored encrypted and never shown again — only the last four
              characters come back.{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer noopener"
                className={linkClasses}
              >
                Create a key
                <IconExternal className="ml-0.5 inline h-3.5 w-3.5 align-[-2px]" />
              </a>
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={savingKey || !keyInput.trim()}
                className={primaryButton}
              >
                {savingKey && (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-paper/40 border-t-transparent motion-safe:animate-spin" />
                )}
                {savingKey ? 'Checking with OpenRouter…' : 'Save key'}
              </button>

              {hasKey && !confirmingRemoval && (
                <button
                  type="button"
                  onClick={() => setConfirmingRemoval(true)}
                  disabled={savingKey}
                  className={quietButton}
                >
                  Remove saved key
                </button>
              )}

              {hasKey && confirmingRemoval && (
                <>
                  <button
                    type="button"
                    onClick={removeKey}
                    disabled={savingKey}
                    className={dangerButton}
                  >
                    Yes, remove it
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingRemoval(false)}
                    className={quietButton}
                  >
                    Keep it
                  </button>
                </>
              )}
            </div>
          </form>
        </Card>

        <Card
          title="When to use your key"
          description="Only applies once a key of your own is saved."
        >
          {preferenceError && (
            <p
              role="alert"
              className="mt-3 border-2 border-ember bg-ember-soft p-3 text-xs text-ember font-mono"
            >
              {preferenceError}
            </p>
          )}

          <fieldset
            disabled={!hasKey || savingPreference}
            className="mt-4 space-y-3 disabled:opacity-50"
          >
            <legend className="sr-only">When to use your OpenRouter key</legend>

            {[
              {
                value: false,
                title: 'Only as a fallback',
                blurb:
                  "The server's key pays. Yours steps in when it is out of credit or rate limited.",
              },
              {
                value: true,
                title: 'Always use my key',
                blurb:
                  'Every request is charged to your key, with the server’s as the backup.',
              },
            ].map((option) => (
              <label
                key={String(option.value)}
                htmlFor={`preference-${option.value}`}
                className="flex cursor-pointer gap-3 border-2 border-hairline p-3.5 transition-colors hover:border-rust"
              >
                <input
                  id={`preference-${option.value}`}
                  type="radio"
                  name="prefer-own-key"
                  className="mt-1 h-4 w-4 accent-rust"
                  checked={Boolean(settings?.prefer_own_key) === option.value}
                  onChange={() => choosePreference(option.value)}
                />
                <div>
                  <span className="block text-sm font-semibold text-ink">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-soft">
                    {option.blurb}
                  </span>
                </div>
              </label>
            ))}
          </fieldset>

          {!hasKey && (
            <p className="mt-3 text-xs text-ink-faint font-mono">
              Save a key above to choose.
            </p>
          )}
        </Card>
      </main>
    </div>
  );
}

export default Settings;
