import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthShell, {
  fieldClasses,
  labelClasses,
  linkClasses,
  submitClasses,
} from '../components/AuthShell';
import { IconEye, IconEyeOff } from '../components/icons';
import { useAuth } from '../AuthContext';
import { usePageMeta } from '../pageMeta';

function Login() {
  const { status, signIn } = useAuth();
  usePageMeta({
    title: 'Sign in · ChattyDesk',
    description:
      'Sign in to ChattyDesk to chat with 400+ models in one window.',
    path: '/login',
    noindex: true,
  });
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Set by RequireAuth when it turned somebody away from a page. Sending them
  // there afterwards is the difference between signing in and starting over.
  const intended = (location.state as { from?: string } | null)?.from;

  if (status === 'signed-in') {
    return <Navigate to={intended || '/chat'} replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setError('');
    setSubmitting(true);
    try {
      await signIn({ username: username.trim(), password });
      navigate(intended || '/chat', { replace: true });
    } catch (caught) {
      setError((caught as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Your conversations and your model history are tied to your account."
      footer={
        <>
          No account yet?{' '}
          <Link to="/register" className={linkClasses}>
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
        {/* aria-live so the failure is announced, not just drawn. */}
        {error && (
          <p
            role="alert"
            className="border-2 border-ember bg-ember-soft p-3 text-xs text-ember font-mono"
          >
            {error}
          </p>
        )}

        <label htmlFor="username" className="block">
          <span className={labelClasses}>Username</span>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={submitting}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className={fieldClasses}
          />
        </label>

        {/* The reveal button sits outside the label: a control nested in a
            label steals the click that should focus the input. */}
        <div className="relative">
          <label htmlFor="password" className="block">
            <span className={labelClasses}>Password</span>
            <input
              id="password"
              name="password"
              type={revealed ? 'text' : 'password'}
              autoComplete="current-password"
              required
              disabled={submitting}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${fieldClasses} pr-12`}
            />
          </label>
          <button
            type="button"
            onClick={() => setRevealed((shown) => !shown)}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute bottom-[3px] right-1 flex h-11 w-11 items-center justify-center text-ink-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
          >
            {revealed ? (
              <IconEyeOff className="h-4 w-4" />
            ) : (
              <IconEye className="h-4 w-4" />
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting || !username.trim() || !password}
          className={submitClasses}
        >
          {submitting && (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-paper/40 border-t-transparent motion-safe:animate-spin" />
          )}
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}

export default Login;
