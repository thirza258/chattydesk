import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { isDesktop } from '../environment';
import { IconLogo } from './icons';

/** Shared field styling, so the sign-in and sign-up forms cannot drift apart. */
export const labelClasses =
  'block text-xs font-mono font-semibold uppercase tracking-wider text-ink-faint';

export const fieldClasses =
  'mt-2 w-full border-2 border-hairline-strong bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors focus:border-rust focus:outline-none disabled:opacity-60';

export const submitClasses =
  'mt-4 inline-flex w-full items-center justify-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-rust shadow-[3px_3px_0_0_#C6BEA8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust disabled:cursor-not-allowed disabled:bg-hairline-strong disabled:text-ink-faint';

export const linkClasses =
  'font-medium text-rust transition-colors hover:text-rust-deep hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

export const fieldErrorClasses =
  'mt-1.5 text-xs text-ember font-mono font-medium';

/**
 * The frame around the sign-in and sign-up forms in Paper & Ink style.
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
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-paper px-5 py-12 text-ink selection:bg-rust-soft selection:text-rust-deep">
      <div className="relative mx-auto w-full max-w-md">
        <div className="text-center mb-6">
          {isDesktop() ? (
            <div className="inline-flex items-center gap-2.5">
              <IconLogo className="h-7 w-7" />
              <span className="font-display text-xl font-bold tracking-tight">
                ChattyDesk
              </span>
            </div>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight transition-colors hover:text-rust-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
            >
              <IconLogo className="h-7 w-7" />
              <span>ChattyDesk</span>
            </Link>
          )}
        </div>

        <div className="border-2 border-ink bg-paper-raised p-6 shadow-[6px_6px_0_0_#C6BEA8] sm:p-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-soft">
            {subtitle}
          </p>

          {children}
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">{footer}</p>
      </div>
    </div>
  );
}

export default AuthShell;
