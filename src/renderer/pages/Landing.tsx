import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { webChatURL } from '../../constant';
import { useAuth } from '../AuthContext';
import { usePageMeta } from '../pageMeta';
import {
  IconArrowRight,
  IconBot,
  IconCatalogue,
  IconCheck,
  IconCpu,
  IconDevices,
  IconExternal,
  IconKey,
  IconLogo,
  IconShield,
  IconSparkles,
  IconThread,
} from '../components/icons';

const chatIsHere = !webChatURL;

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-150 hover:bg-blue-500 active:bg-blue-700 shadow-md shadow-blue-600/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

const compactButton =
  'inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-all duration-150 hover:bg-blue-500 active:bg-blue-700 shadow-sm shadow-blue-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400';

const ghostButton =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/60 px-6 py-3 text-sm font-medium text-slate-200 transition-all duration-150 hover:bg-slate-800 hover:border-slate-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

const quietLink =
  'rounded text-xs font-medium text-slate-400 transition-colors duration-150 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400';

function ChatCta({ label, className }: { label: string; className: string }) {
  if (chatIsHere) {
    return (
      <Link to="/chat" className={className}>
        <span>{label}</span>
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
      <span>{label}</span>
      <IconExternal className="h-4 w-4" />
    </a>
  );
}

function FeatureCard({
  icon,
  badge,
  title,
  children,
}: {
  icon: ReactNode;
  badge?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 transition-all duration-200 hover:border-slate-700/90 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-black/20">
      <div className="flex items-center justify-between">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/60 text-blue-400 transition-colors group-hover:text-blue-300 group-hover:border-blue-500/40">
          {icon}
        </div>
        {badge && (
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-400">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-400">{children}</p>
    </div>
  );
}

/**
 * Realistic Desktop Window Preview with native controls, sidebar mockup,
 * model switch pill, and syntax-highlighted code response.
 */
function ChatPreview() {
  return (
    <div
      aria-hidden="true"
      className="relative rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/60 overflow-hidden text-xs select-none"
    >
      {/* Window Title Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/90 bg-slate-950/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-500/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 font-mono text-[11px] text-slate-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>anthropic/claude-3.5-sonnet</span>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <span className="font-mono text-[10px]">$0.003 / req</span>
        </div>
      </div>

      {/* App Body */}
      <div className="grid grid-cols-[180px_1fr] min-h-[320px] bg-slate-950">
        {/* Mock Mini Sidebar */}
        <div className="hidden sm:block border-r border-slate-800/80 bg-slate-900/40 p-3 space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
              Recent Threads
            </span>
            <div className="p-2 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-200 text-[11px] truncate font-medium">
              Summarize 40-page report
            </div>
            <div className="p-2 rounded-lg hover:bg-slate-800/40 text-slate-400 text-[11px] truncate">
              Debounce async queue
            </div>
            <div className="p-2 rounded-lg hover:bg-slate-800/40 text-slate-400 text-[11px] truncate">
              PostgreSQL partitioning
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
              Catalogue
            </span>
            <div className="text-[11px] text-slate-400 flex items-center justify-between py-1">
              <span>Claude 3.5 Sonnet</span>
              <span className="text-[9px] font-mono text-emerald-400">active</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between py-1">
              <span>GPT-4o</span>
              <span className="text-[9px] font-mono text-slate-600">$2.50/M</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between py-1">
              <span>DeepSeek V3</span>
              <span className="text-[9px] font-mono text-emerald-400">free</span>
            </div>
          </div>
        </div>

        {/* Mock Chat View */}
        <div className="p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3 overflow-hidden">
            {/* User message */}
            <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-xs bg-blue-600 px-3.5 py-2.5 text-white shadow-sm">
              <p className="font-normal text-xs leading-relaxed">
                Compare two models for summarising a 40-page PDF report.
              </p>
            </div>

            {/* Assistant message */}
            <div className="max-w-[95%] rounded-xl rounded-tl-xs border border-slate-800 bg-slate-900 p-3.5 text-slate-200 shadow-sm space-y-2">
              <p className="leading-relaxed text-xs">
                Both handle long context well. The 200K window allows ingesting
                the entire document in one turn with zero loss of coherence:
              </p>

              <div className="rounded-lg bg-slate-950 border border-slate-800 p-2.5 font-mono text-[11px] text-slate-300">
                <span className="text-blue-400">const</span> summary ={' '}
                <span className="text-blue-400">await</span> ai.summarize(pdf, &#123;
                <br />
                &nbsp;&nbsp;model: <span className="text-emerald-400">&apos;claude-3.5-sonnet&apos;</span>,
                <br />
                &nbsp;&nbsp;maxTokens: <span className="text-amber-400">4096</span>
                <br />
                &#125;);
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                <span>anthropic/claude-3.5-sonnet · 1,204 tokens</span>
                <span className="text-emerald-400">0.42s latency</span>
              </div>
            </div>
          </div>

          {/* Mock Input */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-2 flex items-center justify-between">
            <span className="text-slate-500 text-xs pl-2">Ask a follow-up question…</span>
            <span className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white">
              Send
            </span>
          </div>
        </div>
      </div>
    </div>
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
    <div className="min-h-dvh bg-slate-950 text-slate-100 selection:bg-blue-500/30 selection:text-blue-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <IconLogo className="h-6 w-6 shadow-sm shadow-blue-500/20" />
            <span className="text-base font-semibold tracking-tight">ChattyDesk</span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6">
            <a
              href="https://chattydesk.sourceforge.io/"
              target="_blank"
              rel="noreferrer noopener"
              className={quietLink}
            >
              Desktop App
            </a>
            {chatIsHere && !signedIn && (
              <Link to="/login" className={quietLink}>
                Sign in
              </Link>
            )}
            <ChatCta
              label={signedIn || !chatIsHere ? 'Open the chat' : 'Get started'}
              className={compactButton}
            />
          </nav>
        </div>
      </header>

      <main>
        {/* ---------------------------------------------------------- HERO --- */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24">
          {/* Subtle Ambient Radial Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[450px] w-[750px] rounded-full bg-blue-600/10 blur-[120px]"
          />

          <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur-sm">
                <IconSparkles className="h-3.5 w-3.5 text-blue-400" />
                <span>400+ models · zero lock-in</span>
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-slate-100 leading-[1.1]">
                Every model.
                <br />
                <span className="text-slate-400 font-normal">One chat window.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-slate-400">
                Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro, DeepSeek, and Mistral
                in a single unified desktop &amp; web interface. Switch models
                mid-conversation while preserving full context history.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ChatCta
                  label={signedIn ? 'Open the chat' : 'Start chatting'}
                  className={primaryButton}
                />
                {chatIsHere && !signedIn && (
                  <Link to="/register" className={ghostButton}>
                    Create free account
                  </Link>
                )}
                <a
                  href="https://chattydesk.sourceforge.io/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className={ghostButton}
                >
                  Download desktop app
                </a>
              </div>

              <p className="mt-5 text-xs sm:text-sm text-slate-500 flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-emerald-400" />
                {signedIn && user
                  ? `Signed in as ${user.username}.`
                  : 'Free tier models included. Optional BYO OpenRouter key.'}
              </p>
            </div>

            <div className="mt-10 lg:mt-0">
              <ChatPreview />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ PROVIDERS STRIP --- */}
        <section className="border-y border-slate-900 bg-slate-900/30 py-6">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="text-center text-xs font-mono uppercase tracking-widest text-slate-500 mb-4">
              Direct access via OpenRouter proxies
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm font-medium text-slate-400">
              <span>Anthropic Claude</span>
              <span className="text-slate-700">·</span>
              <span>OpenAI GPT</span>
              <span className="text-slate-700">·</span>
              <span>Google Gemini</span>
              <span className="text-slate-700">·</span>
              <span>Meta Llama</span>
              <span className="text-slate-700">·</span>
              <span>Mistral AI</span>
              <span className="text-slate-700">·</span>
              <span>DeepSeek</span>
              <span className="text-slate-700">·</span>
              <span>Qwen</span>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- FEATURES --- */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
                One window, the whole catalogue
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-400">
                Built for engineers, researchers, and writers who need to compare
                outputs and switch between specialized models without managing
                ten different subscriptions.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<IconCatalogue className="h-5 w-5" />}
                badge="400+ Models"
                title="Searchable Catalogue"
              >
                Instant search across providers, filter by free tier or capability,
                and inspect live per-million token pricing before sending.
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
                badge="Client Encryption"
                title="Your Key or Ours"
              >
                Chat on the included shared pool, or securely store your personal
                OpenRouter key with client-side encryption and automatic fallback.
              </FeatureCard>

              <FeatureCard
                icon={<IconDevices className="h-5 w-5" />}
                badge="Cross-Platform"
                title="Desktop & Web"
              >
                A single unified codebase packaged for Windows, macOS, Linux, and
                modern web browsers with synced account sessions.
              </FeatureCard>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ HOW IT WORKS --- */}
        <section className="border-t border-slate-900 bg-slate-900/20 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:grid lg:grid-cols-[1fr_1.2fr] lg:gap-14">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
                Three steps to full model freedom
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-400">
                No complex API tooling, YAML configuration, or fragmented logins.
                Everything works out of the box.
              </p>
            </div>

            <div className="mt-8 space-y-6 lg:mt-0">
              <div className="flex gap-4 p-4 rounded-xl border border-slate-800/80 bg-slate-900/60">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/30 text-xs font-mono font-bold text-blue-400">
                  01
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Create your account</h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                    A simple username and password keeps your conversation threads
                    and model preferences synced.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl border border-slate-800/80 bg-slate-900/60">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/30 text-xs font-mono font-bold text-blue-400">
                  02
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Select any model in the catalogue</h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Filter by provider, toggle free models, or pick frontier reasoning
                    models with exact pricing transparency.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 rounded-xl border border-slate-800/80 bg-slate-900/60">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/30 text-xs font-mono font-bold text-blue-400">
                  03
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Chat with formatted Markdown &amp; telemetry</h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Receive rich code blocks, tables, and token consumption metrics
                    on every single prompt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- FINAL CTA --- */}
        <section className="border-t border-slate-900 py-16 sm:py-20 text-center">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
              Ready to explore 400+ models?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-slate-400 leading-relaxed">
              Launch in your browser immediately, or download the native desktop
              installer for your platform.
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
                className={ghostButton}
              >
                <span>Download Desktop Installer</span>
                <IconExternal className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 sm:px-8 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <IconLogo className="h-4 w-4" />
            <span>ChattyDesk · Unified AI Model Desktop Client</span>
          </div>

          <div className="flex items-center gap-6">
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
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;

