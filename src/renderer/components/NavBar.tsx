import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ragReaderURL } from '../../constant';
import { useAuth } from '../AuthContext';
import EvaluationSuiteModal from './EvaluationSuiteModal';
import {
  IconCheck,
  IconCompare,
  IconExternal,
  IconFlask,
  IconLogo,
  IconPlus,
  IconSettings,
  IconSignOut,
  IconCatalogue,
  IconTrophy,
  IconBarChart,
} from './icons';

interface NavBarProps {
  selectedModel: string;
  conversationId: string | null;
  onNewChat: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const iconButton =
  'flex h-10 w-10 shrink-0 items-center justify-center text-ink-soft transition-colors duration-150 hover:bg-paper-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

function NavBar({
  selectedModel,
  conversationId,
  onNewChat,
  sidebarOpen,
  onToggleSidebar,
}: NavBarProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const [suiteModalOpen, setSuiteModalOpen] = useState(false);

  const navItemClass = (path: string) => {
    const active = pathname === path || pathname.startsWith(`${path}/`);
    return `inline-flex h-9 items-center gap-1.5 px-2.5 sm:px-3 text-xs font-semibold border-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust ${
      active
        ? 'border-ink bg-ink text-paper'
        : 'border-transparent text-ink-soft hover:text-ink hover:border-hairline-strong bg-paper'
    }`;
  };

  return (
    <nav
      aria-label="Chat navigation"
      className="w-full h-16 bg-paper text-ink flex items-center justify-between gap-2 px-2 sm:px-4 border-b-2 border-ink z-20 flex-shrink-0 select-none"
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={
            sidebarOpen ? 'Back to conversation' : 'Models and history'
          }
          aria-expanded={sidebarOpen}
          aria-controls="chat-sidebar"
          className={`${iconButton} md:hidden`}
        >
          <IconCatalogue className="h-5 w-5" />
        </button>
        <Link
          to="/"
          aria-label="ChattyDesk home"
          className="flex items-center gap-2.5 font-semibold tracking-tight transition-colors hover:text-rust-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
        >
          <IconLogo className="h-6 w-6 shrink-0" />
          <span className="hidden sm:inline font-display text-base">
            ChattyDesk
          </span>
        </Link>

        {/* Top-level Navigation Links */}
        <div className="hidden md:flex items-center gap-1 pl-3 border-l-2 border-hairline">
          <Link
            to="/chat"
            className={navItemClass('/chat')}
            title="Interactive AI Chat"
          >
            <span>Chat</span>
          </Link>
          <Link
            to="/compare"
            className={navItemClass('/compare')}
            title="Compare AI Models"
          >
            <IconCompare className="h-3.5 w-3.5" />
            <span>Compare</span>
          </Link>
          <Link
            to="/benchmarks"
            className={navItemClass('/benchmarks')}
            title="AI Benchmark Lab"
          >
            <IconFlask className="h-3.5 w-3.5" />
            <span>Benchmark Lab</span>
          </Link>
          <Link
            to="/leaderboard"
            className={navItemClass('/leaderboard')}
            title="Model Leaderboards & Rankings"
          >
            <IconTrophy className="h-3.5 w-3.5" />
            <span>Leaderboard</span>
          </Link>
          <Link
            to="/analytics"
            className={navItemClass('/analytics')}
            title="Performance & Cost Analytics"
          >
            <IconBarChart className="h-3.5 w-3.5" />
            <span>Analytics</span>
          </Link>
          <Link
            to="/models"
            className={navItemClass('/models')}
            title="Model Registry Catalogue"
          >
            <span>Models</span>
          </Link>
        </div>

        {/* Companion AI Evaluation Suite Link & Modal Trigger */}
        <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l-2 border-hairline">
          <button
            type="button"
            onClick={() => setSuiteModalOpen(true)}
            className="inline-flex h-9 items-center gap-1 px-2 text-[11px] font-semibold font-mono border-2 border-hairline hover:border-ink hover:text-ink transition-colors bg-paper text-ink-soft"
            title="Overview of the AI Evaluation Suite (ChattyDesk × RagReader)"
          >
            <span className="h-1.5 w-1.5 bg-rust rounded-full" />
            <span>AI Suite</span>
          </button>
          <a
            href={ragReaderURL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 px-2.5 text-xs font-semibold border-2 border-hairline-strong hover:border-rust hover:text-rust-deep transition-colors bg-paper text-ink"
            title="Open RagReader: Document QA & Retrieval-Augmented Generation Evaluation"
          >
            <span className="h-1.5 w-1.5 bg-pine inline-block" />
            <span>RagReader (RAG Lab)</span>
            <IconExternal className="h-3 w-3 text-rust" />
          </a>
        </div>

        {selectedModel && pathname === '/chat' && (
          <div className="hidden 2xl:flex items-center gap-2 pl-3 border-l-2 border-hairline text-xs min-w-0">
            <span className="h-1.5 w-1.5 bg-pine flex-shrink-0" />
            <span className="font-mono text-ink-soft truncate max-w-[200px]">
              {selectedModel}
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {pathname === '/chat' && (
          <button
            type="button"
            onClick={onNewChat}
            aria-label="New chat"
            className="inline-flex h-9 items-center gap-1.5 bg-ink hover:bg-rust text-paper text-xs font-semibold px-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
          >
            <IconPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New chat</span>
          </button>
        )}

        {user && (
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l-2 border-hairline text-xs text-ink">
            {user.has_own_key || user.plan === 'byok' ? (
              <Link
                to="/settings"
                title="BYOK Plan Active (Using your own OpenRouter key)"
                className="inline-flex items-center gap-1 border border-pine bg-pine-soft px-2 py-0.5 text-[11px] font-mono text-pine font-medium hover:bg-pine hover:text-paper transition-colors"
              >
                <IconCheck className="h-3 w-3" />
                <span>BYOK Plan</span>
              </Link>
            ) : (
              <Link
                to="/settings"
                title={`${user.remaining_paid_requests ?? 50} free paid requests remaining. Add your own OpenRouter key in Settings for BYOK Plan.`}
                className="inline-flex items-center gap-1.5 border border-hairline-strong bg-paper-sunken px-2 py-0.5 text-[11px] font-mono text-ink hover:border-rust hover:text-rust-deep transition-colors"
              >
                <span className="font-semibold text-rust">
                  {user.remaining_paid_requests ?? 50}/50
                </span>
                <span className="text-[10px] text-ink-faint">free reqs</span>
              </Link>
            )}

            <span className="h-6 w-6 bg-ink text-paper flex items-center justify-center text-[10px] font-semibold">
              {user.username.charAt(0).toUpperCase()}
            </span>
            <span className="max-w-[8rem] truncate font-medium">
              {user.username}
            </span>
          </div>
        )}

        <div className="flex items-center gap-0.5 pl-1">
          <Link
            to="/settings"
            aria-label="Settings"
            title="Settings"
            className={iconButton}
          >
            <IconSettings className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
            className={iconButton}
          >
            <IconSignOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <EvaluationSuiteModal
        isOpen={suiteModalOpen}
        onClose={() => setSuiteModalOpen(false)}
      />
    </nav>
  );
}

export default NavBar;
