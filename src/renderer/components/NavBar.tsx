import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  IconCompare,
  IconLogo,
  IconPlus,
  IconSettings,
  IconSignOut,
  IconCatalogue,
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

        {selectedModel && (
          <div className="hidden xl:flex items-center gap-2 pl-3 border-l-2 border-hairline text-xs min-w-0">
            <span className="h-1.5 w-1.5 bg-pine flex-shrink-0" />
            <span className="font-mono text-ink-soft truncate max-w-[220px] md:max-w-xs">
              {selectedModel}
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <span className="hidden lg:inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
          <span
            className={`inline-block h-1.5 w-1.5 ${
              conversationId ? 'bg-rust' : 'bg-hairline-strong'
            }`}
          />
          {conversationId ? 'active thread' : 'new session'}
        </span>

        <Link
          to="/compare"
          aria-label="Compare AI"
          title="Compare AI models side by side"
          className="inline-flex h-10 items-center gap-1.5 border-2 border-ink hover:border-rust hover:text-rust-deep text-ink text-xs font-semibold px-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <IconCompare className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Compare AI</span>
        </Link>

        <button
          type="button"
          onClick={onNewChat}
          aria-label="New chat"
          className="inline-flex h-10 items-center gap-1.5 bg-ink hover:bg-rust text-paper text-xs font-semibold px-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <IconPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New chat</span>
        </button>

        {user && (
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l-2 border-hairline text-xs text-ink">
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
    </nav>
  );
}

export default NavBar;
