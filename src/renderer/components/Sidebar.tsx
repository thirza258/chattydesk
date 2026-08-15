import { useMemo, useState } from 'react';
import { HistoryEntry, Model } from '../../interface';

interface SidebarProps {
  models: Model[];
  selectedModel: string;
  defaultModel: string;
  onSelectModel: (id: string) => void;
  loadingModels: boolean;
  catalogueError: string;
  history: HistoryEntry[];
  historyError: string;
  conversationId: string | null;
  onOpenConversation: (id: string) => void;
}

/** Pricing arrives as USD per token, as a string. Show the usual per-1M rate. */
const formatPrice = (perToken: string | null): string => {
  if (perToken === null || perToken === undefined) return '—';
  const perMillion = Number(perToken) * 1_000_000;
  if (!Number.isFinite(perMillion)) return '—';
  if (perMillion === 0) return '$0';
  if (perMillion < 0.01) return `$${perMillion.toFixed(4)}`;
  return `$${perMillion.toFixed(2)}`;
};

function Sidebar({
  models,
  selectedModel,
  defaultModel,
  onSelectModel,
  loadingModels,
  catalogueError,
  history,
  historyError,
  conversationId,
  onOpenConversation,
}: SidebarProps) {
  const [search, setSearch] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);

  // The whole catalogue is already in memory, so filter here rather than
  // issuing a request per keystroke.
  const grouped = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const matches = models.filter((model) => {
      if (freeOnly && !model.is_free) return false;
      if (!needle) return true;
      return (
        model.id.toLowerCase().includes(needle) ||
        model.name.toLowerCase().includes(needle)
      );
    });

    const byProvider = new Map<string, Model[]>();
    matches.forEach((model) => {
      const provider = model.provider || 'other';
      const bucket = byProvider.get(provider);
      if (bucket) bucket.push(model);
      else byProvider.set(provider, [model]);
    });

    return [...byProvider.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [models, search, freeOnly]);

  const matchCount = grouped.reduce(
    (total, [, list]) => total + list.length,
    0,
  );

  // One row per prompt/response pair; collapse them into threads.
  const conversations = useMemo(() => {
    const seen = new Map<string, HistoryEntry>();
    history.forEach((entry) => {
      if (!seen.has(entry.conversation_id))
        seen.set(entry.conversation_id, entry);
    });
    return [...seen.values()];
  }, [history]);

  return (
    <div className="w-80 flex-shrink-0 bg-gray-200 h-full border-r-2 border-white shadow-lg flex flex-col">
      <div className="p-4 pb-2 flex-shrink-0">
        <h2 className="text-xl mb-2">Models</h2>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search models"
          aria-label="Search models"
          className="w-full border rounded px-3 py-1.5 text-sm mb-2"
        />

        <label
          htmlFor="free-only"
          className="flex items-center gap-2 text-sm text-gray-700 mb-1"
        >
          <input
            id="free-only"
            type="checkbox"
            checked={freeOnly}
            onChange={(event) => setFreeOnly(event.target.checked)}
          />
          Free models only
        </label>

        {!loadingModels && !catalogueError && (
          <p className="text-xs text-gray-500">
            {matchCount} of {models.length} models
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 min-h-0">
        {loadingModels && (
          <p className="text-sm text-gray-500">Loading models…</p>
        )}

        {catalogueError && (
          <p className="text-sm text-red-700 bg-red-100 border border-red-300 rounded p-2">
            Could not load models: {catalogueError}
          </p>
        )}

        {!loadingModels && !catalogueError && matchCount === 0 && (
          <p className="text-sm text-gray-500">No models match that search.</p>
        )}

        {grouped.map(([provider, list]) => (
          <div key={provider} className="mb-3">
            <h3 className="text-xs uppercase tracking-wide text-gray-500 sticky top-0 bg-gray-200 py-1">
              {provider}
            </h3>
            <ul>
              {list.map((model) => {
                const isSelected = model.id === selectedModel;
                return (
                  <li key={model.id}>
                    <button
                      type="button"
                      onClick={() => onSelectModel(model.id)}
                      aria-pressed={isSelected}
                      title={model.description || model.id}
                      className={`w-full text-left px-2 py-1.5 rounded mb-1 text-sm ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate">{model.name}</span>
                        {model.is_free && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                              isSelected
                                ? 'bg-white text-blue-700'
                                : 'bg-green-600 text-white'
                            }`}
                          >
                            Free
                          </span>
                        )}
                      </span>
                      <span
                        className={`block text-[11px] ${
                          isSelected ? 'text-blue-100' : 'text-gray-500'
                        }`}
                      >
                        {formatPrice(model.pricing?.prompt)} in ·{' '}
                        {formatPrice(model.pricing?.completion)} out · per 1M
                        {model.id === defaultModel ? ' · default' : ''}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 border-t border-gray-300 p-4 max-h-[35%] overflow-y-auto">
        <h2 className="text-xl mb-2">History</h2>

        {historyError && (
          <p className="text-sm text-red-700 bg-red-100 border border-red-300 rounded p-2 mb-2">
            {historyError}
          </p>
        )}

        {!historyError && conversations.length === 0 && (
          <p className="text-gray-500 text-sm">No history available.</p>
        )}

        {conversations.map((entry) => (
          <button
            type="button"
            key={entry.conversation_id}
            onClick={() => onOpenConversation(entry.conversation_id)}
            className={`w-full text-left mb-2 p-2 rounded border text-sm ${
              entry.conversation_id === conversationId
                ? 'bg-blue-50 border-blue-400'
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="block truncate font-medium">{entry.prompt}</span>
            <span className="block text-xs text-gray-500 truncate">
              {entry.model_name} · {new Date(entry.created_at).toLocaleString()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
