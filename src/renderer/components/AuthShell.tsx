import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { isDesktop } from '../environment';

/** Shared field styling, so the sign-in and sign-up forms cannot drift apart. */
export const labelClasses = 'block text-sm font-medium text-slate-300';

export const fieldClasses =
  'mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-3 text-base text-slate-100 placeholder:text-slate-600 transition-colors duration-200 focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:opacity-60';

export const submitClasses =
  'mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:bg-slate-700';

export const linkClasses =
  'rounded font-medium text-blue-400 transition-colors duration-200 hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

export const fieldErrorClasses = 'mt-1.5 text-sm text-red-400';

/**
 * The frame around the sign-in and sign-up forms.
 *
 * Used unchanged by both the web app and the desktop app — the only difference
 * is the wordmark, which links back to the landing page in a browser and is
 * plain text in the desktop app, where there is no landing page to return to.
 */
function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 px-5 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          {isDesktop() ? (
            <span className="text-lg font-bold tracking-tight">ChattyDesk</span>
          ) : (
            <Link
              to="/"
              className="rounded text-lg font-bold tracking-tight transition-colors duration-200 hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              ChattyDesk
            </Link>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-black/30 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {subtitle}
          </p>

          {children}
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">{footer}</p>
      </div>
    </div>
  );
}

export default AuthShell;
