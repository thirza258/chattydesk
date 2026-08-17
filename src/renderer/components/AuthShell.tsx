import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { isDesktop } from '../environment';
import { IconLogo } from './icons';

/** Shared field styling, so the sign-in and sign-up forms cannot drift apart. */
export const labelClasses = 'block text-xs font-semibold uppercase tracking-wider text-slate-300';

export const fieldClasses =
  'mt-2 w-full rounded-xl border border-slate-700/80 bg-slate-950/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all duration-150 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60';

export const submitClasses =
  'mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-blue-500 active:bg-blue-700 shadow-md shadow-blue-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500';

export const linkClasses =
  'rounded font-medium text-blue-400 transition-colors duration-150 hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

export const fieldErrorClasses = 'mt-1.5 text-xs text-red-400 font-medium';

/**
 * The frame around the sign-in and sign-up forms.
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
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-slate-950 px-5 py-12 text-slate-100 selection:bg-blue-500/30 selection:text-blue-200 overflow-hidden">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[500px] rounded-full bg-blue-600/10 blur-[100px]"
      />

      <div className="relative mx-auto w-full max-w-md">
        <div className="text-center mb-6">
          {isDesktop() ? (
            <div className="inline-flex items-center gap-2.5">
              <IconLogo className="h-7 w-7 shadow-sm shadow-blue-500/20" />
              <span className="text-lg font-bold tracking-tight">ChattyDesk</span>
            </div>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 rounded-lg text-lg font-bold tracking-tight transition-colors duration-150 hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <IconLogo className="h-7 w-7 shadow-sm shadow-blue-500/20" />
              <span>ChattyDesk</span>
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/80 p-6 shadow-2xl shadow-black/50 backdrop-blur-md sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">{title}</h1>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-400">
            {subtitle}
          </p>

          {children}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">{footer}</p>
      </div>
    </div>
  );
}

export default AuthShell;

