import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { webChatURL } from '../../constant';
import { useAuth } from '../AuthContext';
import {
  IconArrowRight,
  IconCatalogue,
  IconCheck,
  IconDevices,
  IconExternal,
  IconKey,
  IconThread,
} from '../components/icons';

/**
 * The front door of the web version.
 *
 * Everything here points at one place: the chat. Normally that is the /chat
 * route in this same bundle. A deployment that publishes only the landing page
 * sets WEB_CHAT_URL, and every call to action becomes an outward link to the
 * hosted chat instead (see src/constant.ts).
 */
const chatIsHere = !webChatURL;

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

const compactButton =
  'inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

const ghostButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-6 py-3 text-base font-semibold text-slate-200 transition-colors duration-200 hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

const quietLink =
  'rounded text-sm font-medium text-slate-300 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

/** Routes internally when the chat is part of this build, links out when not. */
function ChatCta({ label, className }: { label: string; className: string }) {
  if (chatIsHere) {
    return (
      <Link to="/chat" className={className}>
        {label}
        <IconArrowRight className="h-5 w-5" />
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
      <IconExternal className="h-5 w-5" />
    </a>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{children}</p>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-slate-700 text-sm font-semibold text-slate-300">
        {number}
      </span>
      <div>
        <h3 className="font-semibold text-slate-100">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          {children}
        </p>
      </div>
    </li>
  );
}

/**
 * A drawing of the app, not a screenshot: it renders instantly, stays sharp at
 * any size, and cannot go stale. Hidden from screen readers — a made-up
 * conversation read aloud would be nonsense.
 */
function ChatPreview() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl shadow-blue-950/40"
    >
      <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-700" />
        </span>
        <span className="truncate rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
          anthropic/claude-haiku-4.5
        </span>
      </div>

      <div className="space-y-3 p-4">
        <p className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-blue-600 px-3 py-2 text-sm text-white">
          Compare two models for summarising a 40-page PDF.
        </p>
        <div className="max-w-[90%] rounded-lg rounded-bl-sm bg-slate-800 px-3 py-2 text-sm text-slate-200">
          <p>
            Either will manage it. The 200K-context model takes the whole
            document in one pass, so nothing has to be chunked —
          </p>
          <p className="mt-2 text-xs text-slate-500">
            anthropic/claude-haiku-4.5 · 1,204 tokens
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
          <span className="text-sm text-slate-600">Type your message here</span>
          <span className="ml-auto rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white">
            Send
          </span>
        </div>
      </div>
    </div>
  );
}

function Landing() {
  const { status, user } = useAuth();
  const signedIn = status === 'signed-in';

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <span className="text-base font-bold tracking-tight">ChattyDesk</span>

          <nav className="flex items-center gap-4 sm:gap-6">
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
        {/* ---------------------------------------------------------- hero --- */}
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              400+ models · one window
            </p>

            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Every model.
              <br />
              One chat window.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
              ChattyDesk puts Claude, GPT, Gemini, Mistral and a few hundred
              more behind a single conversation. Switch model mid-thread, keep
              the context, and reopen anything you asked last week.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ChatCta
                label={signedIn ? 'Open the chat' : 'Start chatting'}
                className={primaryButton}
              />
              {chatIsHere && !signedIn && (
                <Link to="/register" className={ghostButton}>
                  Create an account
                </Link>
              )}
            </div>

            <p className="mt-5 text-sm text-slate-500">
              {signedIn && user
                ? `Signed in as ${user.username}.`
                : 'Free models included. Bring your own OpenRouter key whenever you like.'}
            </p>
          </div>

          <div className="mt-12 lg:mt-2">
            <ChatPreview />
          </div>
        </section>

        {/* ------------------------------------------------------ features --- */}
        <section className="border-t border-slate-900 bg-slate-950">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              One window, the whole catalogue
            </h2>
            <p className="mt-3 max-w-2xl text-slate-400">
              Everything runs through OpenRouter, so a new model is a click in
              the sidebar rather than another account to open.
            </p>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              <Feature
                icon={<IconCatalogue className="h-5 w-5" />}
                title="Pick from 400+ models"
              >
                Search by name or provider, filter to the free ones, and see the
                per-million price before you send a single token.
              </Feature>
              <Feature
                icon={<IconThread className="h-5 w-5" />}
                title="Threads that remember"
              >
                Conversations keep their context on the server, and the history
                sidebar reopens any earlier thread exactly where it left off.
              </Feature>
              <Feature
                icon={<IconKey className="h-5 w-5" />}
                title="Your key or ours"
              >
                Chat on the server&apos;s OpenRouter key, or save your own in
                Settings — it takes over the moment the shared one runs dry.
              </Feature>
              <Feature
                icon={<IconDevices className="h-5 w-5" />}
                title="Desktop or browser"
              >
                The same app ships as a Windows, macOS and Linux build and as an
                ordinary web page. Your account works in both.
              </Feature>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- how it works --- */}
        <section className="border-t border-slate-900">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:grid lg:grid-cols-2 lg:gap-14 lg:py-20">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Three steps in
              </h2>
              <p className="mt-3 max-w-lg text-slate-400">
                No provider keys to collect, no configuration file to write.
              </p>
            </div>

            <ol className="mt-8 space-y-7 lg:mt-0">
              <Step number="1" title="Create an account">
                A username and a password. That is what keeps your conversations
                yours.
              </Step>
              <Step number="2" title="Choose a model">
                The sidebar lists everything OpenRouter proxies, grouped by
                provider, with the free ones badged.
              </Step>
              <Step number="3" title="Start typing">
                Answers come back as Markdown with the model and token count
                attached, so you always know what you spent.
              </Step>
            </ol>
          </div>
        </section>

        {/* ----------------------------------------------------- final CTA --- */}
        <section className="border-t border-slate-900 bg-slate-900/40">
          <div className="mx-auto max-w-6xl px-5 py-16 text-center sm:px-8">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready when you are
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">
              Open the chat in this browser, or install the desktop build and
              sign in with the same account.
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
                Get the desktop app
                <IconExternal className="h-5 w-5" />
              </a>
            </div>

            <ul className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-2 text-sm text-slate-500 sm:flex-row sm:justify-center sm:gap-6">
              {['No provider keys needed', 'Free models included'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <IconCheck className="h-4 w-4 text-green-500" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>ChattyDesk · every model OpenRouter proxies, in one window.</p>
          <nav className="flex items-center gap-5">
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
              Backend source
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
