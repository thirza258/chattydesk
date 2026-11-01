import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IconLogo, IconExternal } from '../components/icons';

const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap bg-ink text-paper px-4 py-2 text-xs font-semibold shadow-[3px_3px_0_0_#C6BEA8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

const secondaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap border-2 border-ink bg-paper-raised px-4 py-2 text-xs font-medium text-ink hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

export default function Legal() {
  const location = useLocation();
  const [tab, setTab] = useState<'privacy' | 'terms'>(
    location.pathname.includes('terms') ? 'terms' : 'privacy'
  );

  return (
    <div className="min-h-screen bg-paper text-ink selection:bg-paper-sunken selection:text-rust font-body">
      {/* Top Navbar */}
      <header className="border-b-2 border-ink bg-paper-raised">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="inline-flex h-9 w-9 items-center justify-center border-2 border-ink bg-paper-sunken text-rust shadow-[2px_2px_0_0_#C6BEA8]">
              <IconLogo className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-ink">
                ChattyDesk
              </span>
              <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                Legal &amp; Privacy
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs font-semibold text-ink-soft hover:text-ink"
            >
              &larr; Back to Home
            </Link>
            <Link
              to="/chat"
              className={primaryButton}
            >
              Open Chat
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-rust">
            SELF-HOSTED PLATFORM TRANSPARENCY
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Privacy Policy &amp; Terms of Service
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            Clear, straightforward information on how data is handled on our self-hosted platform and our connection to OpenRouter.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setTab('privacy')}
              className={tab === 'privacy' ? primaryButton : secondaryButton}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setTab('terms')}
              className={tab === 'terms' ? primaryButton : secondaryButton}
            >
              Terms of Service
            </button>
          </div>
        </div>

        {tab === 'privacy' ? (
          <div className="space-y-6">
            <section className="border-2 border-ink bg-paper-raised p-6 sm:p-8 shadow-[4px_4px_0_0_#C6BEA8]">
              <h2 className="font-display text-xl font-bold text-ink">
                1. 100% Self-Hosted &amp; Private Storage
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                ChattyDesk is an open-source, fully self-hosted unified AI workspace and desktop interface.
                All chat histories, conversation branches, side-by-side model comparison logs, saved prompts,
                and user preferences are stored strictly in your self-hosted database or local desktop filesystem.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                There are zero central telemetry servers, analytics collectors, or data monetization trackers.
                We do not sell, rent, monetize, or harvest your personal information or chat logs.
              </p>
            </section>

            <section className="border-2 border-ink bg-paper-raised p-6 sm:p-8 shadow-[4px_4px_0_0_#C6BEA8]">
              <h2 className="font-display text-xl font-bold text-ink">
                2. AI Processing via OpenRouter
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                ChattyDesk connects to generative AI model providers through <strong>OpenRouter</strong> to offer unified access to multi-model chat and comparison features.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                When you initiate a chat or execute an automated comparison prompt:
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft space-y-1">
                <li>Only the prompt text and preceding contextual turns of the selected conversation are sent to OpenRouter for inference.</li>
                <li>Your local databases, unrelated chats, and host server files remain untouched and isolated.</li>
              </ul>
              <div className="mt-5 border border-hairline-strong bg-paper-sunken p-4">
                <p className="font-mono text-xs uppercase font-semibold text-ink">
                  OpenRouter Terms &amp; Privacy Policies
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold">
                  <a
                    href="https://openrouter.ai/privacy"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-rust hover:underline"
                  >
                    OpenRouter Privacy Policy <IconExternal className="h-3 w-3" />
                  </a>
                  <a
                    href="https://openrouter.ai/terms"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-rust hover:underline"
                  >
                    OpenRouter Terms of Service <IconExternal className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </section>

            <section className="border-2 border-ink bg-paper-raised p-6 sm:p-8 shadow-[4px_4px_0_0_#C6BEA8]">
              <h2 className="font-display text-xl font-bold text-ink">
                3. User Autonomy &amp; Data Deletion
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                You retain complete control of your data. Deleting conversations, messages, or purging account data through the settings view or database controls immediately and permanently removes that information from storage.
              </p>
            </section>

            <section className="border-2 border-ink bg-paper-raised p-6 sm:p-8 shadow-[4px_4px_0_0_#C6BEA8]">
              <h2 className="font-display text-xl font-bold text-ink">
                4. Privacy Contact
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                For questions regarding data protection, self-hosting policies, or privacy inquiries, contact us at:{' '}
                <a
                  href="mailto:nevatalapp@gmail.com"
                  className="font-semibold text-rust hover:underline"
                >
                  nevatalapp@gmail.com
                </a>
              </p>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="border-2 border-ink bg-paper-raised p-6 sm:p-8 shadow-[4px_4px_0_0_#C6BEA8]">
              <h2 className="font-display text-xl font-bold text-ink">
                1. Acceptance of Terms
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                By installing, accessing, or running ChattyDesk, you agree to these Terms of Service. If you do not agree, you should discontinue use.
              </p>
            </section>

            <section className="border-2 border-ink bg-paper-raised p-6 sm:p-8 shadow-[4px_4px_0_0_#C6BEA8]">
              <h2 className="font-display text-xl font-bold text-ink">
                2. AI Model Output Disclaimer
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                ChattyDesk provides an interface for interacting with third-party foundation models. Model outputs are generated automatically by external AI models and may occasionally produce inaccurate, misleading, or unexpected results. Outputs should be independently reviewed and verified before reliance in critical, medical, legal, or financial contexts.
              </p>
            </section>

            <section className="border-2 border-ink bg-paper-raised p-6 sm:p-8 shadow-[4px_4px_0_0_#C6BEA8]">
              <h2 className="font-display text-xl font-bold text-ink">
                3. Third-Party Service Compliance (OpenRouter)
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                You agree to comply with the usage policies and safety guidelines established by upstream model providers accessible via OpenRouter:
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold">
                <a
                  href="https://openrouter.ai/terms"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-rust hover:underline"
                >
                  OpenRouter Terms of Service <IconExternal className="h-3 w-3" />
                </a>
                <a
                  href="https://openrouter.ai/privacy"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-rust hover:underline"
                >
                  OpenRouter Privacy Policy <IconExternal className="h-3 w-3" />
                </a>
              </div>
            </section>

            <section className="border-2 border-ink bg-paper-raised p-6 sm:p-8 shadow-[4px_4px_0_0_#C6BEA8]">
              <h2 className="font-display text-xl font-bold text-ink">
                4. Software License &amp; Limitation of Liability
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                ChattyDesk is provided &ldquo;as is&rdquo;, without warranty of any kind, express or implied. Under no circumstances shall the authors or maintainers be held liable for any damages arising out of the use or inability to use this software.
              </p>
            </section>

            <section className="border-2 border-ink bg-paper-raised p-6 sm:p-8 shadow-[4px_4px_0_0_#C6BEA8]">
              <h2 className="font-display text-xl font-bold text-ink">
                5. Terms Contact
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                For questions regarding these Terms of Service, contact:{' '}
                <a
                  href="mailto:nevatalapp@gmail.com"
                  className="font-semibold text-rust hover:underline"
                >
                  nevatalapp@gmail.com
                </a>
              </p>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-ink bg-paper-sunken py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 sm:px-8 text-xs text-ink-faint">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <IconLogo className="h-4 w-4" />
              <p>ChattyDesk · Self-Hosted Multi-Model AI Client</p>
            </div>
            <p className="text-[11px]">This project is under nevatal.id for educational purposes.</p>
          </div>
          <p>Contact: nevatalapp@gmail.com</p>
        </div>
      </footer>
    </div>
  );
}
