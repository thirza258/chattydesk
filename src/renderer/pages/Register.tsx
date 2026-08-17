import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthShell, {
  fieldClasses,
  fieldErrorClasses,
  labelClasses,
  linkClasses,
  submitClasses,
} from '../components/AuthShell';
import { IconEye, IconEyeOff } from '../components/icons';
import { useAuth } from '../AuthContext';
import { usePageMeta } from '../pageMeta';

type Field = 'username' | 'password' | 'email';

/**
 * The API reports a rejected field as "Bad Request: password: too short", which
 * is worth showing under the field it is about rather than in a banner at the
 * top of the form.
 */
const locateError = (
  message: string,
): { field: Field | null; text: string } => {
  const match = /^(?:Bad Request: )?(username|password|email): (.+)$/s.exec(
    message,
  );
  if (!match) return { field: null, text: message };
  return { field: match[1] as Field, text: match[2] };
};

function Register() {
  const { status, signUp } = useAuth();
  usePageMeta({
    title: 'Create an account · ChattyDesk',
    description:
      'Create a ChattyDesk account to chat with 400+ models in one window.',
    path: '/register',
    noindex: true,
  });
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [failure, setFailure] = useState<{ field: Field | null; text: string }>(
    {
      field: null,
      text: '',
    },
  );
  const [submitting, setSubmitting] = useState(false);

  if (status === 'signed-in') return <Navigate to="/chat" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setFailure({ field: null, text: '' });
    setSubmitting(true);
    try {
      await signUp({
        username: username.trim(),
        password,
        email: email.trim() || undefined,
      });
      navigate('/chat', { replace: true });
    } catch (caught) {
      setFailure(locateError((caught as Error).message));
      setSubmitting(false);
    }
  };

  const errorFor = (field: Field) =>
    failure.field === field ? failure.text : '';

  return (
    <AuthShell
      title="Create an account"
      subtitle="A username and a password is all it takes. Chats are charged to the server's OpenRouter key until you add your own."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className={linkClasses}>
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
        {failure.text && !failure.field && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-3 text-sm text-red-300"
          >
            {failure.text}
          </p>
        )}

        <div>
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
              aria-invalid={Boolean(errorFor('username'))}
              aria-describedby={
                errorFor('username') ? 'username-error' : undefined
              }
              className={fieldClasses}
            />
          </label>
          {errorFor('username') && (
            <p id="username-error" role="alert" className={fieldErrorClasses}>
              {errorFor('username')}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block">
            <span className={labelClasses}>
              Email{' '}
              <span className="font-normal text-slate-500">(optional)</span>
            </span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              disabled={submitting}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={Boolean(errorFor('email'))}
              aria-describedby={errorFor('email') ? 'email-error' : undefined}
              className={fieldClasses}
            />
          </label>
          {errorFor('email') && (
            <p id="email-error" role="alert" className={fieldErrorClasses}>
              {errorFor('email')}
            </p>
          )}
        </div>

        <div>
          {/* The reveal button sits outside the label: a control nested in a
              label steals the click that should focus the input. */}
          <div className="relative">
            <label htmlFor="password" className="block">
              <span className={labelClasses}>Password</span>
              <input
                id="password"
                name="password"
                type={revealed ? 'text' : 'password'}
                autoComplete="new-password"
                required
                disabled={submitting}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(errorFor('password'))}
                aria-describedby={
                  errorFor('password') ? 'password-error' : 'password-hint'
                }
                className={`${fieldClasses} pr-12`}
              />
            </label>
            <button
              type="button"
              onClick={() => setRevealed((shown) => !shown)}
              aria-label={revealed ? 'Hide password' : 'Show password'}
              className="absolute bottom-[3px] right-1 flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {revealed ? (
                <IconEyeOff className="h-5 w-5" />
              ) : (
                <IconEye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errorFor('password') ? (
            <p id="password-error" role="alert" className={fieldErrorClasses}>
              {errorFor('password')}
            </p>
          ) : (
            <p id="password-hint" className="mt-1.5 text-sm text-slate-500">
              At least 8 characters, and not one of the obvious ones.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || !username.trim() || !password}
          className={submitClasses}
        >
          {submitting && (
            <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-transparent motion-safe:animate-spin" />
          )}
          {submitting ? 'Creating your account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}

export default Register;
