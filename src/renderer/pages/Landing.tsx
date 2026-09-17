import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { webChatURL } from '../../constant';
import { useAuth } from '../AuthContext';
import { usePageMeta } from '../pageMeta';
import {
  IconArrowRight,
  IconCatalogue,
  IconCheck,
  IconCompare,
  IconDevices,
  IconExternal,
  IconKey,
  IconLogo,
  IconThread,
} from '../components/icons';

const chatIsHere = !webChatURL;

const primaryButton =
  'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap bg-ink text-paper px-5 py-3 text-sm font-semibold transition-colors hover:bg-rust shadow-[4px_4px_0_0_#C6BEA8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

const compactButton =
  'inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap bg-ink text-paper px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-rust focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

const secondaryButton =
  'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap border-2 border-ink bg-paper-raised px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

const quietLink =
  'text-xs font-medium text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

function ChatCta({ label, className }: { label: string; className: string }) {
  if (chatIsHere) {
    return (
      <Link to="/chat" className={className}>
        {label}
        <IconArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <a
      href={webChatURL}
      target="_blank"
      rel="noreferrer noopener"
      className={className}
    >
      {label}
      <IconExternal className="h-4 w-4" />
    </a>
  );
}

/* eslint-disable react/require-default-props */
interface FeatureCardProps {
  icon: ReactNode;
  badge?: string;
  title: string;
  children: ReactNode;
}

function FeatureCard({ icon, badge, title, children }: FeatureCardProps) {
  return (
    <article className="border-2 border-ink bg-paper-raised p-6 shadow-[4px_4px_0_0_#C6BEA8] transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className="inline-flex h-9 w-9 items-center justify-center border-2 border-ink bg-paper-sunken text-rust">
          {icon}
        </div>
        {badge && (
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-hairline-strong bg-paper-sunken text-ink-faint">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">
        {title}
      </h3>
      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink-soft">
        {children}
      </p>
    </article>
  );
}

/**
 * Realistic Desktop Window Preview in Paper & Ink style with native window frame,
 * mini sidebar mockup, and clean syntax-highlighted response.
 */
function ChatPreview() {
  return (
    <figure
      aria-hidden="true"
      className="min-w-0 border-2 border-ink bg-paper-raised shadow-[6px_6px_0_0_#C6BEA8] overflow-hidden text-xs select-none"
    >
      {/* Window Title Bar */}
      <header className="flex items-center justify-between gap-3 border-b-2 border-ink bg-paper-sunken px-3 py-2.5">
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-ink" />
          <div className="h-2.5 w-2.5 rounded-full border border-ink bg-paper-raised" />
          <div className="h-2.5 w-2.5 rounded-full border border-ink bg-paper-sunken" />
        </div>

        <div className="min-w-0 truncate font-mono text-[10px] text-ink font-medium px-2 py-0.5 border border-hairline-strong bg-paper-raised">
          anthropic/claude-3.5-sonnet
        </div>

        <data
          value="0.003"
          className="hidden shrink-0 font-mono text-[10px] text-ink-faint xl:block"
        >
          $0.003 / req
        </data>
      </header>

      {/* App Body */}
      <div className="grid grid-cols-1 sm:grid-cols-[140px_minmax(0,1fr)] min-h-[300px] bg-paper">
        {/* Mock Mini Sidebar */}
        <aside className="hidden min-w-0 sm:block border-r border-hairline bg-paper-sunken p-3 space-y-3">
          <div className="space-y-1">
            <h4 className="font-mono text-[10px] uppercase font-semibold text-ink-faint tracking-wider">
              Recent Threads
            </h4>
            <div className="p-1.5 border border-ink bg-paper-raised text-ink text-[11px] truncate font-medium">
              Summarize 40-page report
            </div>
            <div className="p-1.5 text-ink-soft text-[11px] truncate">
              Debounce async queue
            </div>
            <div className="p-1.5 text-ink-soft text-[11px] truncate">
              PostgreSQL partitioning
            </div>
          </div>

          <div className="pt-2 border-t border-hairline space-y-1">
            <h4 className="font-mono text-[10px] uppercase font-semibold text-ink-faint tracking-wider">
              Catalogue
            </h4>
            <div className="text-[11px] text-ink flex items-center justify-between py-0.5">
              <span>Claude 3.5 Sonnet</span>
              <strong className="font-mono text-[9px] text-pine font-normal">
                active
              </strong>
            </div>
            <div className="text-[11px] text-ink-soft flex items-center justify-between py-0.5">
              <span>GPT-4o</span>
              <span className="font-mono text-[9px] text-ink-faint">
                $2.50/M
              </span>
            </div>
            <div className="text-[11px] text-ink-soft flex items-center justify-between py-0.5">
              <span>DeepSeek V3</span>
              <strong className="font-mono text-[9px] text-pine font-normal">
                free
              </strong>
            </div>
          </div>
        </aside>

        {/* Mock Chat View */}
        <div className="min-w-0 p-3 sm:p-4 space-y-4 flex flex-col justify-between bg-paper-raised">
          <div className="space-y-3">
            {/* User message */}
            <div className="ml-auto max-w-[85%] bg-ink p-3 text-paper border border-ink text-xs">
              Compare two models for summarising a 40-page PDF report.
            </div>

            {/* Assistant message */}
            <div className="max-w-[95%] border-2 border-hairline-strong bg-paper p-3 text-ink text-xs border-l-4 border-l-rust space-y-2">
              <p className="leading-relaxed">
                Both handle long context well. The 200K window allows ingesting
                the entire document in one turn with zero loss of coherence:
              </p>

              <pre className="max-w-full overflow-x-auto p-2 font-mono text-[11px] bg-paper-sunken border border-hairline text-ink">
                const summary = await ai.summarize(pdf, &#123; model:
                &apos;claude-3.5-sonnet&apos; &#125;);
              </pre>

              <footer className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-hairline font-mono text-[10px] text-ink-faint">
                <p>Claude · 1,204 tokens</p>
                <p className="text-pine font-medium">0.42s latency</p>
              </footer>
            </div>
          </div>

          {/* Mock Input */}
          <div className="border-2 border-ink bg-paper-sunken p-1.5 flex items-center justify-between">
            <p className="text-ink-faint text-xs pl-2">
              Ask a follow-up question…
            </p>
            <div className="bg-ink px-2.5 py-1 text-[11px] font-semibold text-paper">
              Send
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

function Landing() {
  const { status, user } = useAuth();

  usePageMeta({
    title: 'ChattyDesk — every AI model in one chat window',
    description:
      'Chat with Claude, GPT, Gemini, Mistral and 400+ more models from one window. Switch model mid-conversation, keep the thread, and reopen anything you asked last week.',
    path: '/',
  });
  const signedIn = status === 'signed-in';

  return (
    <div className="min-h-dvh bg-paper text-ink selection:bg-rust-soft selection:text-rust-deep">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-display text-base font-semibold tracking-tight text-ink hover:text-rust-deep"
          >
            <IconLogo className="h-6 w-6" />
            <span>ChattyDesk</span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="order-3 flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 text-nowrap sm:order-none sm:ml-auto sm:w-auto sm:justify-start"
          >
            <a
              href="https://chattydesk.sourceforge.io/"
              target="_blank"
              rel="noreferrer noopener"
              className={quietLink}
            >
              Desktop App
            </a>
            <Link to="/courses" className={quietLink}>
              AI courses
            </Link>
            {chatIsHere && (
              <Link to="/compare" className={quietLink}>
                Compare AI
              </Link>
            )}
            {chatIsHere && !signedIn && (
              <Link to="/login" className={quietLink}>
                Sign in
              </Link>
            )}
          </nav>
          <ChatCta
            label={signedIn || !chatIsHere ? 'Open the chat' : 'Get started'}
            className={compactButton}
          />
        </div>
      </header>

      <main>
        {/* ---------------------------------------------------------- HERO --- */}
        <section className="pt-12 pb-16 sm:pt-16 sm:pb-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-8">
            <div className="min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
                01 — 400+ models · zero lock-in
              </p>

              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl text-ink leading-[1.1]">
                Every model.
                <br />
                <em className="font-normal not-italic text-ink-soft">
                  One chat window.
                </em>
              </h1>

              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-ink-soft">
                Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro, DeepSeek, and Mistral
                in a single unified desktop &amp; web interface. Switch models
                mid-conversation while preserving full context history.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ChatCta
                  label={signedIn ? 'Open the chat' : 'Start chatting'}
                  className={primaryButton}
                />
                {chatIsHere && !signedIn && (
                  <Link to="/register" className={secondaryButton}>
                    Create free account
                  </Link>
                )}
                <a
                  href="https://chattydesk.sourceforge.io/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className={secondaryButton}
                >
                  Download desktop app
                </a>
              </div>

              <footer className="mt-6 flex items-center gap-2 text-xs sm:text-sm text-ink-faint">
                <IconCheck className="h-4 w-4 text-pine flex-shrink-0" />
                <p>
                  {signedIn && user
                    ? `Signed in as ${user.username}.`
                    : 'Free tier models included. Optional BYO OpenRouter key.'}
                </p>
              </footer>
            </div>

            <div className="min-w-0 mt-10 lg:mt-0">
              <ChatPreview />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ PROVIDERS STRIP --- */}
        <section className="border-y-2 border-ink bg-paper-sunken py-6">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 className="text-center font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint mb-4">
              Direct access via OpenRouter proxies
            </h2>
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs sm:text-sm font-medium text-ink-soft">
              <li>Anthropic Claude</li>
              <li aria-hidden="true" className="text-hairline-strong">
                ·
              </li>
              <li>OpenAI GPT</li>
              <li aria-hidden="true" className="text-hairline-strong">
                ·
              </li>
              <li>Google Gemini</li>
              <li aria-hidden="true" className="text-hairline-strong">
                ·
              </li>
              <li>Meta Llama</li>
              <li aria-hidden="true" className="text-hairline-strong">
                ·
              </li>
              <li>Mistral AI</li>
              <li aria-hidden="true" className="text-hairline-strong">
                ·
              </li>
              <li>DeepSeek</li>
              <li aria-hidden="true" className="text-hairline-strong">
                ·
              </li>
              <li>Qwen</li>
            </ul>
          </div>
        </section>

        <section className="border-b-2 border-ink bg-paper-raised py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="font-mono text-[10px] uppercase tracking-widest text-rust">
                Learn at your pace
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                Put AI to work, one lesson at a time.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Free beginner courses with practical prompts, short lessons, and
                knowledge checks. No account required.
              </p>
            </div>
            <Link to="/courses" className={secondaryButton}>
              Explore AI courses <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ---------------------------------------------------- FEATURES --- */}
        <section className="py-16 sm:py-24 bg-paper">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <header className="max-w-2xl">
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                One window, the whole catalogue
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-ink-soft">
                Built for engineers, researchers, and writers who need to
                compare outputs and switch between specialized models without
                managing ten different subscriptions.
              </p>
            </header>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<IconCatalogue className="h-5 w-5" />}
                badge="400+ Models"
                title="Searchable Catalogue"
              >
                Instant search across providers, filter by free tier or
                capability, and inspect live per-million token pricing before
                sending.
              </FeatureCard>

              <FeatureCard
                icon={<IconThread className="h-5 w-5" />}
                badge="Full Context"
                title="Threads that Remember"
              >
                Seamlessly change models on turn five of a conversation. Context
                stays intact while the server persists full thread history.
              </FeatureCard>

              <FeatureCard
                icon={<IconKey className="h-5 w-5" />}
                badge="Encrypted Storage"
                title="Your Key or Ours"
              >
                Chat on the included shared pool, or securely store your
                personal OpenRouter key with encrypted storage and automatic
                fallback.
              </FeatureCard>

              <FeatureCard
                icon={<IconDevices className="h-5 w-5" />}
                badge="Cross-Platform"
                title="Desktop & Web"
              >
                A single unified codebase packaged for Windows, macOS, Linux,
                and modern web browsers with synced account sessions.
              </FeatureCard>
            </div>

            <Link
              to="/compare"
              className="group mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-ink bg-rust text-paper p-6 shadow-[4px_4px_0_0_#C6BEA8] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 flex-none items-center justify-center border-2 border-paper">
                  <IconCompare className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-paper">
                    Compare AI — one prompt, up to five models
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm leading-relaxed text-paper/80">
                    Put Claude, GPT, Gemini, and the rest head-to-head on the
                    same question, then compare answers, speed, and cost side by
                    side.
                  </p>
                </div>
              </div>
              <IconArrowRight className="h-5 w-5 flex-none transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        {/* ------------------------------------------------ HOW IT WORKS --- */}
        <section className="border-t-2 border-ink bg-paper-sunken py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:grid lg:grid-cols-[1fr_1.2fr] lg:gap-14">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Three steps to full model freedom
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-ink-soft">
                No complex API tooling, YAML configuration, or fragmented
                logins. Everything works out of the box.
              </p>
            </div>

            <ol className="mt-8 space-y-4 lg:mt-0">
              <li className="flex gap-4 p-4 border-2 border-ink bg-paper-raised shadow-[3px_3px_0_0_#C6BEA8]">
                <div className="flex h-8 w-8 flex-none items-center justify-center border-2 border-ink bg-rust text-paper text-xs font-mono font-bold">
                  01
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Create your account
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-ink-soft leading-relaxed">
                    A simple username and password keeps your conversation
                    threads and model preferences synced across web and desktop.
                  </p>
                </div>
              </li>

              <li className="flex gap-4 p-4 border-2 border-ink bg-paper-raised shadow-[3px_3px_0_0_#C6BEA8]">
                <div className="flex h-8 w-8 flex-none items-center justify-center border-2 border-ink bg-rust text-paper text-xs font-mono font-bold">
                  02
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Select any model in the catalogue
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-ink-soft leading-relaxed">
                    Filter by provider, toggle free models, or pick frontier
                    reasoning models with exact pricing transparency.
                  </p>
                </div>
              </li>

              <li className="flex gap-4 p-4 border-2 border-ink bg-paper-raised shadow-[3px_3px_0_0_#C6BEA8]">
                <div className="flex h-8 w-8 flex-none items-center justify-center border-2 border-ink bg-rust text-paper text-xs font-mono font-bold">
                  03
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Chat with formatted Markdown &amp; telemetry
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-ink-soft leading-relaxed">
                    Receive rich code blocks, tables, and token consumption
                    metrics on every single prompt.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* --------------------------------------------------- FINAL CTA --- */}
        <section className="py-16 sm:py-20 bg-paper text-center">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <div className="border-2 border-ink bg-paper-raised p-8 sm:p-12 shadow-[6px_6px_0_0_#C6BEA8]">
              <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Ready to explore 400+ models?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-ink-soft leading-relaxed">
                Launch in your browser immediately, or download the native
                desktop installer for your platform.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ChatCta
                  label={signedIn ? 'Open the chat' : 'Start chatting'}
                  className={primaryButton}
                />
                <a
                  href="https://chattydesk.sourceforge.io/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className={secondaryButton}
                >
                  Download Desktop Installer
                  <IconExternal className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-ink bg-paper-sunken py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 sm:px-8 sm:flex-row sm:items-center sm:justify-between text-xs text-ink-faint">
          <div className="flex items-center gap-2">
            <IconLogo className="h-4 w-4" />
            <p>ChattyDesk · Unified AI Model Desktop Client</p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link to="/courses" className={quietLink}>
              AI courses
            </Link>
            {chatIsHere && !signedIn && (
              <Link to="/login" className={quietLink}>
                Sign in
              </Link>
            )}
            <a
              href="https://github.com/thirza258/chattydesk_backend"
              target="_blank"
              rel="noreferrer noopener"
              className={quietLink}
            >
              Backend Source
            </a>
            <a
              href="https://chattydesk.sourceforge.io/"
              target="_blank"
              rel="noreferrer noopener"
              className={quietLink}
            >
              SourceForge
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
