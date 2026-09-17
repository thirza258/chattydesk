import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isDesktop } from '../environment';
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
    <aside
      id="chat-sidebar"
      aria-label="Models and history"
      className="w-full md:w-72 lg:w-80 flex-shrink-0 bg-paper-sunken md:border-r-2 border-ink h-full min-h-0 flex flex-col select-none text-ink"
    >
      {/* Sidebar Tabs */}
      <div className="p-3 pb-0 flex-shrink-0 border-b-2 border-ink">
        <div className="flex border-2 border-ink bg-paper p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('models')}
            className={`flex-1 py-1.5 px-3 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'models'
                ? 'bg-ink text-paper font-semibold'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <span>Models</span>
            {!loadingModels && (
              <span
                className={`text-[10px] px-1.5 py-0.2 font-mono ${
                  activeTab === 'models'
                    ? 'bg-rust text-paper'
                    : 'bg-paper-sunken text-ink-faint border border-hairline-strong'
                }`}
              >
                {models.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 px-3 transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-ink text-paper font-semibold'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            <IconThread className="h-3.5 w-3.5" />
            <span>History</span>
            {conversations.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 font-mono ${
                  activeTab === 'history'
                    ? 'bg-rust text-paper'
                    : 'bg-paper-sunken text-ink-faint border border-hairline-strong'
                }`}
              >
                {conversations.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'models' && (
          <div className="pt-3 pb-2.5">
            <div className="relative">
              <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-ink-faint" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search 400+ models…"
                aria-label="Search models"
                className="w-full border-2 border-hairline-strong bg-paper pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-faint transition-colors focus:border-rust focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between mt-2 pt-1 font-mono text-xs">
              <label
                htmlFor="free-only"
                className="flex items-center gap-2 text-ink-soft cursor-pointer hover:text-ink transition-colors"
              >
                <input
                  id="free-only"
                  type="checkbox"
                  checked={freeOnly}
                  onChange={(event) => setFreeOnly(event.target.checked)}
                  className="accent-rust h-3.5 w-3.5"
                />
                <span>Free models only</span>
              </label>

              {!loadingModels && !catalogueError && (
                <span className="text-[11px] text-ink-faint">
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
            <div className="flex items-center justify-center py-10 text-xs text-ink-faint gap-2 font-mono">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-ink/20 border-t-rust animate-spin" />
              Loading model catalogue…
            </div>
          )}

          {catalogueError && (
            <div className="text-xs text-ember bg-ember-soft border-2 border-ember p-3 font-mono">
              Could not load models: {catalogueError}
            </div>
          )}

          {!loadingModels && !catalogueError && matchCount === 0 && (
            <div className="text-center py-10 text-xs text-ink-faint font-mono">
              No models match &ldquo;{search}&rdquo;
            </div>
          )}

          {grouped.map(([provider, list]) => (
            <div key={provider} className="space-y-1">
              <div className="sticky top-0 z-10 bg-paper-sunken/95 py-1 px-1 flex items-center justify-between border-b border-hairline">
                <h3 className="text-[11px] uppercase tracking-wider font-semibold font-mono text-ink-soft">
                  {provider}
                </h3>
                <span className="text-[10px] text-ink-faint font-mono">
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
                      className={`w-full text-left p-2.5 text-xs transition-colors relative group border-2 ${
                        isSelected
                          ? 'bg-rust-soft border-rust text-rust-deep shadow-xs'
                          : 'bg-paper border-transparent hover:border-hairline-strong text-ink'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {model.name}
                        </span>
                        {model.is_free && (
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 font-mono font-semibold flex-shrink-0 border ${
                              isSelected
                                ? 'bg-rust text-paper border-rust'
                                : 'bg-pine-soft text-pine border-pine'
                            }`}
                          >
                            Free
                          </span>
                        )}
                      </div>
                      <div
                        className={`mt-1 flex items-center justify-between text-[10px] font-mono ${
                          isSelected ? 'text-rust-deep' : 'text-ink-faint'
                        }`}
                      >
                        <span className="truncate">
                          {formatPrice(model.pricing?.prompt)} in ·{' '}
                          {formatPrice(model.pricing?.completion)} out
                        </span>
                        {model.id === defaultModel && (
                          <span className="text-rust font-sans font-medium flex-shrink-0">
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
            <div className="text-xs text-ember bg-ember-soft border-2 border-ember p-3 font-mono">
              {historyError}
            </div>
          )}

          {!historyError && conversations.length === 0 && (
            <div className="text-center py-12 text-xs text-ink-faint font-mono">
              <IconThread className="h-6 w-6 mx-auto mb-2 text-ink-faint" />
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
                className={`w-full text-left p-3 border-2 text-xs transition-colors ${
                  isActive
                    ? 'bg-rust-soft border-rust text-rust-deep shadow-xs'
                    : 'bg-paper border-hairline hover:border-hairline-strong hover:bg-paper-raised text-ink'
                }`}
              >
                <span className="block truncate font-medium text-ink">
                  {entry.prompt}
                </span>
                <span className="mt-1 flex items-center justify-between text-[11px] text-ink-faint font-mono">
                  <span className="truncate text-[10px] text-ink-soft">
                    {entry.model_name}
                  </span>
                  <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      {!isDesktop() && (
        <Link
          to="/courses"
          className="shrink-0 border-t border-hairline-strong px-4 py-3 text-sm font-medium text-rust-deep hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
        >
          Learn to use AI →
        </Link>
      )}
    </aside>
  );
}

export default Sidebar;
