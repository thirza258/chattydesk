import { useMemo, useState } from 'react';
import { HistoryEntry, Model } from '../../interface';
import { IconSearch, IconThread } from './icons';

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
  const [activeTab, setActiveTab] = useState<'models' | 'history'>('models');

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
    <aside className="w-80 flex-shrink-0 bg-slate-900 border-r border-slate-800/80 h-full flex flex-col select-none text-slate-200">
      {/* Sidebar Tabs */}
      <div className="p-3 pb-0 flex-shrink-0 border-b border-slate-800/60">
        <div className="flex rounded-lg bg-slate-950/60 p-1 border border-slate-800/80 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('models')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-all duration-150 flex items-center justify-center gap-1.5 ${
              activeTab === 'models'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Models</span>
            {!loadingModels && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/60 text-slate-300 font-mono">
                {models.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 px-3 rounded-md transition-all duration-150 flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <IconThread className="h-3.5 w-3.5" />
            <span>History</span>
            {conversations.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/60 text-slate-300 font-mono">
                {conversations.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'models' && (
          <div className="pt-3 pb-2.5">
            <div className="relative">
              <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search 400+ models…"
                aria-label="Search models"
                className="w-full rounded-lg border border-slate-700/70 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 transition-all duration-150 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between mt-2 pt-1">
              <label
                htmlFor="free-only"
                className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <input
                  id="free-only"
                  type="checkbox"
                  checked={freeOnly}
                  onChange={(event) => setFreeOnly(event.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/40 h-3.5 w-3.5"
                />
                <span>Free models only</span>
              </label>

              {!loadingModels && !catalogueError && (
                <span className="text-[11px] text-slate-500 font-mono">
                  {matchCount} models
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tab: Models Catalogue */}
      {activeTab === 'models' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
          {loadingModels && (
            <div className="flex items-center justify-center py-10 text-xs text-slate-500 gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-600 border-t-blue-500 animate-spin" />
              Loading model catalogue…
            </div>
          )}

          {catalogueError && (
            <div className="text-xs text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg p-3">
              Could not load models: {catalogueError}
            </div>
          )}

          {!loadingModels && !catalogueError && matchCount === 0 && (
            <div className="text-center py-10 text-xs text-slate-500">
              No models match &ldquo;{search}&rdquo;
            </div>
          )}

          {grouped.map(([provider, list]) => (
            <div key={provider} className="space-y-1">
              <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xs py-1 px-1 flex items-center justify-between">
                <h3 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  {provider}
                </h3>
                <span className="text-[10px] text-slate-600 font-mono">
                  {list.length}
                </span>
              </div>

              <div className="space-y-1">
                {list.map((model) => {
                  const isSelected = model.id === selectedModel;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => onSelectModel(model.id)}
                      aria-pressed={isSelected}
                      title={model.description || model.id}
                      className={`w-full text-left p-2.5 rounded-lg text-xs transition-all duration-150 relative group ${
                        isSelected
                          ? 'bg-blue-600/15 border border-blue-500/40 text-blue-100 shadow-sm'
                          : 'hover:bg-slate-800/80 border border-transparent text-slate-300 hover:text-slate-100'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 bg-blue-500 rounded-r" />
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{model.name}</span>
                        {model.is_free && (
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-semibold flex-shrink-0 ${
                              isSelected
                                ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            Free
                          </span>
                        )}
                      </div>
                      <div
                        className={`mt-1 flex items-center justify-between text-[10px] font-mono ${
                          isSelected ? 'text-blue-300/80' : 'text-slate-500'
                        }`}
                      >
                        <span className="truncate">
                          {formatPrice(model.pricing?.prompt)} in ·{' '}
                          {formatPrice(model.pricing?.completion)} out
                        </span>
                        {model.id === defaultModel && (
                          <span className="text-amber-400/90 font-sans font-medium flex-shrink-0">
                            default
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {historyError && (
            <div className="text-xs text-red-300 bg-red-950/40 border border-red-800/60 rounded-lg p-3">
              {historyError}
            </div>
          )}

          {!historyError && conversations.length === 0 && (
            <div className="text-center py-12 text-xs text-slate-500">
              <IconThread className="h-6 w-6 mx-auto mb-2 text-slate-600" />
              No conversations yet. Start a new chat to see history here.
            </div>
          )}

          {conversations.map((entry) => {
            const isActive = entry.conversation_id === conversationId;
            return (
              <button
                type="button"
                key={entry.conversation_id}
                onClick={() => onOpenConversation(entry.conversation_id)}
                className={`w-full text-left p-3 rounded-lg border text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600/15 border-blue-500/40 text-blue-100 shadow-sm'
                    : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300'
                }`}
              >
                <span className="block truncate font-medium text-slate-100">
                  {entry.prompt}
                </span>
                <span className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate font-mono text-[10px] text-slate-400">
                    {entry.model_name}
                  </span>
                  <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}

export default Sidebar;

