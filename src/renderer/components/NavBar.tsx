interface NavBarProps {
  selectedModel: string;
  conversationId: string | null;
  onNewChat: () => void;
}

function NavBar({ selectedModel, conversationId, onNewChat }: NavBarProps) {
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

      <div className="flex items-center gap-3">
        {/* A thread only exists once the server has returned an id for it. */}
        <span className="text-xs text-gray-400">
          {conversationId ? 'Conversation in progress' : 'New conversation'}
        </span>
        <button
          type="button"
          onClick={onNewChat}
          className="bg-gray-700 hover:bg-gray-600 text-sm px-3 py-1.5 rounded"
        >
          New chat
        </button>
      </div>
    </nav>
  );
}

export default NavBar;
