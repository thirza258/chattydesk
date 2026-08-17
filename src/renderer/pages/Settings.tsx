import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import services from '../../services/services';
import { KeyCheck, UserSettings } from '../../interface';
import { useAuth } from '../AuthContext';
import {
  IconArrowRight,
  IconExternal,
  IconEye,
  IconEyeOff,
} from '../components/icons';

const fieldClasses =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 transition-colors duration-200 focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:opacity-60';

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:bg-slate-700';

const quietButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors duration-200 hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900';

const dangerButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/50 px-4 py-2.5 text-sm font-medium text-red-300 transition-colors duration-200 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900';

const linkClasses =
  'rounded font-medium text-blue-400 transition-colors duration-200 hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

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
    <p className="mt-3 rounded-lg border border-green-500/30 bg-green-500/10 px-3.5 py-3 text-sm text-green-300">
      OpenRouter accepted this key
      {check.label ? ` (${check.label})` : ''}.{spent ? ` ${spent} spent` : ''}
      {allowance}
    </p>
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
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/20">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
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
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5 sm:px-8">
          <span className="text-base font-bold tracking-tight">ChattyDesk</span>
          <Link
            to="/chat"
            className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-slate-300 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Back to the chat
            <IconArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-5 py-10 sm:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-slate-400">
            Your account, and which OpenRouter key pays for your chats.
          </p>
        </div>

        {loadError && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-3 text-sm text-red-300"
          >
            Could not load your settings: {loadError}
          </p>
        )}

        <Card
          title="Account"
          description="Signed in on this device. The same account works in the desktop app and in the browser."
        >
          <dl className="mt-4 divide-y divide-slate-800 text-sm">
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-slate-400">Username</dt>
              <dd className="font-medium text-slate-100">
                {user?.username ?? '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-slate-400">Email</dt>
              <dd className="truncate font-medium text-slate-100">
                {user?.email || 'Not set'}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-2.5">
              <dt className="text-slate-400">Member since</dt>
              <dd className="font-medium text-slate-100">
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
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-400">Currently:</span>
            {loading ? (
              <span className="text-slate-500">checking…</span>
            ) : (
              <span className="font-medium text-slate-100">
                {hasKey ? (
                  <>
                    your key
                    <span className="ml-1.5 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-300">
                      sk-or-…{settings?.key_hint}
                    </span>
                  </>
                ) : (
                  "the server's key"
                )}
              </span>
            )}
          </p>

          {notice && (
            <p
              role="status"
              className="mt-3 rounded-lg border border-slate-700 bg-slate-800/60 px-3.5 py-3 text-sm text-slate-200"
            >
              {notice}
            </p>
          )}

          {keyError && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-3 text-sm text-red-300"
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
                <span className="block text-sm font-medium text-slate-300">
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
                className="absolute bottom-[2px] right-1 flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                {revealed ? (
                  <IconEyeOff className="h-5 w-5" />
                ) : (
                  <IconEye className="h-5 w-5" />
                )}
              </button>
            </div>
            <p id="openrouter-key-hint" className="mt-2 text-sm text-slate-500">
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
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-transparent motion-safe:animate-spin" />
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
              className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-3 text-sm text-red-300"
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
                className="flex cursor-pointer gap-3 rounded-lg border border-slate-800 p-3.5 transition-colors duration-200 hover:border-slate-700"
              >
                <input
                  id={`preference-${option.value}`}
                  type="radio"
                  name="prefer-own-key"
                  className="mt-1 h-4 w-4 accent-blue-500"
                  checked={Boolean(settings?.prefer_own_key) === option.value}
                  onChange={() => choosePreference(option.value)}
                />
                <span>
                  <span className="block text-sm font-medium text-slate-100">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-400">
                    {option.blurb}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {!hasKey && (
            <p className="mt-3 text-sm text-slate-500">
              Save a key above to choose.
            </p>
          )}
        </Card>
      </main>
    </div>
  );
}

export default Settings;
