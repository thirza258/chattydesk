import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { IconLogo, IconPlus, IconSettings, IconSignOut } from './icons';

interface NavBarProps {
  selectedModel: string;
  conversationId: string | null;
  onNewChat: () => void;
}

const iconButton =
  'flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all duration-150 hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40';

function NavBar({ selectedModel, conversationId, onNewChat }: NavBarProps) {
  const { user, signOut } = useAuth();

  return (
    <nav className="w-full h-14 bg-slate-900/90 backdrop-blur-md text-slate-100 flex items-center justify-between px-4 border-b border-slate-800/80 z-20 flex-shrink-0 select-none">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-bold tracking-tight text-slate-100 hover:text-white transition-colors"
        >
          <IconLogo className="h-6 w-6 shadow-sm shadow-blue-500/20" />
          <span className="text-sm font-semibold tracking-tight">ChattyDesk</span>
        </Link>

        {selectedModel && (
          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-slate-800 text-xs text-slate-400 min-w-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
            <span className="font-mono text-slate-300 truncate max-w-[220px] md:max-w-xs">
              {selectedModel}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium px-2 py-0.5 rounded-full bg-slate-800/40 border border-slate-800/60">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              conversationId ? 'bg-blue-400' : 'bg-slate-500'
            }`}
          />
          {conversationId ? 'Active thread' : 'New session'}
        </span>

        <button
          type="button"
          onClick={onNewChat}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 shadow-sm shadow-blue-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <IconPlus className="h-3.5 w-3.5" />
          <span>New chat</span>
        </button>

        {user && (
          <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-slate-800 text-xs text-slate-300">
            <span className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center text-[10px] font-semibold text-blue-400">
              {user.username.charAt(0).toUpperCase()}
            </span>
            <span className="max-w-[8rem] truncate font-medium">{user.username}</span>
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

