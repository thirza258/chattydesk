import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { IconSettings, IconSignOut } from './icons';

interface NavBarProps {
  selectedModel: string;
  conversationId: string | null;
  onNewChat: () => void;
}

const iconButton =
  'flex h-9 w-9 items-center justify-center rounded text-gray-300 transition-colors duration-200 hover:bg-gray-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400';

function NavBar({ selectedModel, conversationId, onNewChat }: NavBarProps) {
  const { user, signOut } = useAuth();

  return (
    <nav className="w-full h-16 bg-gray-800 text-white flex items-center justify-between px-4 border-b-2 border-white z-10 flex-shrink-0">
      <div className="flex items-baseline gap-3 min-w-0">
        <h1 className="text-lg font-bold flex-shrink-0">ChattyDesk</h1>
        {selectedModel && (
          <span className="text-sm text-gray-300 truncate">
            {selectedModel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* A thread only exists once the server has returned an id for it. */}
        <span className="hidden sm:inline text-xs text-gray-400">
          {conversationId ? 'Conversation in progress' : 'New conversation'}
        </span>
        <button
          type="button"
          onClick={onNewChat}
          className="bg-gray-700 hover:bg-gray-600 text-sm px-3 py-1.5 rounded transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          New chat
        </button>

        {user && (
          <span className="hidden md:inline max-w-[10rem] truncate text-sm text-gray-300">
            {user.username}
          </span>
        )}

        <Link
          to="/settings"
          aria-label="Settings"
          title="Settings"
          className={iconButton}
        >
          <IconSettings className="h-5 w-5" />
        </Link>

        <button
          type="button"
          onClick={signOut}
          aria-label="Sign out"
          title="Sign out"
          className={iconButton}
        >
          <IconSignOut className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
}

export default NavBar;
