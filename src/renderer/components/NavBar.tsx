import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  IconCheck,
  IconCompare,
  IconLogo,
  IconPlus,
  IconSettings,
  IconSignOut,
} from './icons';

interface NavBarProps {
  selectedModel: string;
  conversationId: string | null;
  onNewChat: () => void;
}

const iconButton =
  'flex h-8 w-8 items-center justify-center text-ink-soft transition-colors duration-150 hover:bg-paper-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust';

function NavBar({ selectedModel, conversationId, onNewChat }: NavBarProps) {
  const { user, signOut } = useAuth();

  return (
    <nav className="w-full h-14 bg-paper text-ink flex items-center justify-between px-4 border-b-2 border-ink z-20 flex-shrink-0 select-none">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight transition-colors hover:text-rust-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
        >
          <IconLogo className="h-6 w-6" />
          <span className="font-display text-base">ChattyDesk</span>
        </Link>

        {selectedModel && (
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l-2 border-hairline text-xs min-w-0">
            <span className="h-1.5 w-1.5 bg-pine flex-shrink-0" />
            <span className="font-mono text-ink-soft truncate max-w-[220px] md:max-w-xs">
              {selectedModel}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
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
          className="inline-flex items-center gap-1.5 border-2 border-ink hover:border-rust hover:text-rust-deep text-ink text-xs font-semibold px-3 py-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <IconCompare className="h-3.5 w-3.5" />
          <span>Compare AI</span>
        </Link>

        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex items-center gap-1.5 bg-ink hover:bg-rust text-paper text-xs font-semibold px-3 py-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <IconPlus className="h-3.5 w-3.5" />
          <span>New chat</span>
        </button>

        {user && (
          <div className="hidden md:flex items-center gap-2 pl-2 border-l-2 border-hairline text-xs text-ink">
            {user.is_unlimited ? (
              <Link
                to="/settings"
                title="Unlimited Plan Active ($0.99 Lifetime Access)"
                className="inline-flex items-center gap-1 border border-pine bg-pine-soft px-2 py-0.5 text-[11px] font-mono text-pine font-medium hover:bg-pine hover:text-paper transition-colors"
              >
                <IconCheck className="h-3 w-3" />
                <span>Unlimited</span>
              </Link>
            ) : (
              <Link
                to="/settings"
                title={`${user.remaining_paid_requests ?? 50} free paid requests remaining. Click to upgrade for $0.99.`}
                className="inline-flex items-center gap-1.5 border border-hairline-strong bg-paper-sunken px-2 py-0.5 text-[11px] font-mono text-ink hover:border-rust hover:text-rust-deep transition-colors"
              >
                <span className="font-semibold text-rust">
                  {user.remaining_paid_requests ?? 50}/50
                </span>
                <span className="text-[10px] text-ink-faint">paid reqs</span>
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
    </nav>
  );
}

export default NavBar;
