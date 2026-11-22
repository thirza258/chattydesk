import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ragReaderURL } from '../../constant';
import services from '../../services/services';
import { AIModelItem, ModelMetadataSnapshotItem } from '../../interface';
import { usePageMeta } from '../pageMeta';
import {
  IconArrowRight,
  IconCheck,
  IconClose,
  IconCompare,
  IconExternal,
  IconFlask,
  IconLogo,
  IconPlay,
  IconSearch,
} from '../components/icons';

export default function Models() {
  usePageMeta({
    title: 'Model Registry & Catalogue · ChattyDesk',
    path: '/models',
    noindex: true,
  });

  const navigate = useNavigate();
  const [models, setModels] = useState<AIModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [freeOnly, setFreeOnly] = useState(false);

  // History modal
  const [selectedModel, setSelectedModel] = useState<AIModelItem | null>(null);
  const [snapshots, setSnapshots] = useState<ModelMetadataSnapshotItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await services.listRegisteredModels({ limit: 300 });
      setModels(data.results || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleRefreshCatalogue = async () => {
    try {
      setRefreshing(true);
      await services.refreshModels();
      await loadModels();
    } catch (err) {
      alert(`Refresh failed: ${(err as Error).message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const openHistoryModal = async (model: AIModelItem) => {
    setSelectedModel(model);
    setLoadingHistory(true);
    try {
      const hist = await services.getModelHistory(model.model_identifier);
      setSnapshots(hist || []);
    } catch {
      setSnapshots([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Derive unique providers list
  const providers = useMemo(() => {
    const set = new Set<string>();
    for (const m of models) {
      if (m.provider_id) set.add(m.provider_id);
    }
    return ['all', ...Array.from(set).sort()];
  }, [models]);

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      if (selectedProvider !== 'all' && m.provider_id !== selectedProvider) return false;
      if (freeOnly && !m.is_free) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = m.model_identifier.toLowerCase().includes(q);
        const nameMatch = m.display_name.toLowerCase().includes(q);
        const descMatch = (m.description || '').toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !descMatch) return false;
      }
      return true;
    });
  }, [models, selectedProvider, freeOnly, searchQuery]);

  return (
    <div className="min-h-dvh flex flex-col bg-paper text-ink">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b-2 border-ink bg-paper flex-shrink-0">
        <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <IconLogo className="h-6 w-6" />
              <span className="font-display text-base sm:text-lg font-semibold tracking-tight">
                ChattyDesk
              </span>
            </Link>
            <span className="border-l-2 border-hairline pl-3 font-mono text-xs uppercase tracking-wider text-rust">
              Model Registry
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleRefreshCatalogue}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 border border-hairline-strong px-2.5 py-1.5 text-xs font-mono text-ink hover:border-ink transition-colors"
            >
              <span>{refreshing ? 'Syncing…' : 'Sync Catalogue'}</span>
            </button>
            <Link
              to="/benchmarks"
              className="inline-flex items-center gap-1.5 border border-hairline-strong px-2.5 py-1.5 text-xs font-mono text-ink hover:border-ink transition-colors"
            >
              <span>Benchmark Lab →</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="border-b-2 border-ink pb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rust font-bold">
            NORMALIZED REGISTRY & METADATA SNAPSHOTS
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">
            AI Model Registry
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-ink-soft max-w-3xl leading-relaxed">
            Search 400+ models, view specification metadata, pricing per 1M tokens, and historical version snapshots.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Search by model ID, name, or capability…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-2 border-ink bg-paper p-2 text-ink placeholder:text-ink-faint focus:outline-none focus:border-rust"
            />
          </div>

          <div>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="border-2 border-ink bg-paper p-2 text-ink focus:outline-none focus:border-rust"
            >
              {providers.map((p) => (
                <option key={p} value={p}>
                  {p === 'all' ? 'All Providers' : p}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 border-2 border-ink bg-paper px-3 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="accent-rust"
            />
            <span className="font-semibold text-ink">Free Models Only</span>
          </label>

          <span className="text-ink-soft ml-auto">
            {filteredModels.length} models
          </span>
        </div>

        {error && (
          <div className="p-3 bg-ember-soft text-ember text-xs border border-ember font-mono">
            {error}
          </div>
        )}

        {/* Models Table */}
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-ink-faint">
            Loading model registry…
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="border-2 border-dashed border-hairline-strong p-12 text-center bg-paper-sunken">
            <h3 className="font-display text-base font-bold text-ink">No Models Found</h3>
            <p className="mt-1 text-xs text-ink-soft font-mono">
              Try adjusting your search query or provider filter.
            </p>
          </div>
        ) : (
          <div className="border-2 border-ink bg-paper-raised overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-paper-sunken border-b-2 border-ink uppercase text-[10px] text-ink-soft">
                <tr>
                  <th className="p-3 border-r border-hairline">Model Identifier</th>
                  <th className="p-3 border-r border-hairline">Provider</th>
                  <th className="p-3 border-r border-hairline">Context Length</th>
                  <th className="p-3 border-r border-hairline">Prompt / 1M</th>
                  <th className="p-3 border-r border-hairline">Completion / 1M</th>
                  <th className="p-3 border-r border-hairline">Type</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filteredModels.map((m) => {
                  const promptPrice = m.input_price_per_token
                    ? (parseFloat(m.input_price_per_token) * 1000000).toFixed(2)
                    : '0.00';
                  const completionPrice = m.output_price_per_token
                    ? (parseFloat(m.output_price_per_token) * 1000000).toFixed(2)
                    : '0.00';

                  return (
                    <tr key={m.id} className="hover:bg-paper-sunken transition-colors">
                      <td className="p-3 font-bold text-ink border-r border-hairline">
                        <div>
                          <span>{m.display_name || m.model_identifier}</span>
                          <span className="block text-[10px] text-ink-faint font-normal">
                            {m.model_identifier}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 border-r border-hairline text-ink-soft uppercase text-[11px]">
                        {m.provider_id}
                      </td>
                      <td className="p-3 border-r border-hairline text-ink">
                        {m.context_length
                          ? `${(m.context_length / 1000).toFixed(0)}k`
                          : '—'}
                      </td>
                      <td className="p-3 border-r border-hairline text-ink">
                        {m.is_free ? (
                          <span className="text-pine font-bold">FREE</span>
                        ) : (
                          `$${promptPrice}`
                        )}
                      </td>
                      <td className="p-3 border-r border-hairline text-ink">
                        {m.is_free ? (
                          <span className="text-pine font-bold">FREE</span>
                        ) : (
                          `$${completionPrice}`
                        )}
                      </td>
                      <td className="p-3 border-r border-hairline">
                        {m.is_free ? (
                          <span className="px-1.5 py-0.5 text-[9px] bg-pine-soft text-pine border border-pine font-semibold uppercase">
                            Free Tier
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[9px] bg-paper border border-hairline text-ink uppercase">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openHistoryModal(m)}
                            className="text-[10px] text-ink-soft hover:text-ink underline"
                          >
                            Snapshots
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/compare?m1=${encodeURIComponent(m.model_identifier)}`)
                            }
                            className="text-xs text-ink-soft hover:text-rust font-semibold"
                          >
                            Compare
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/benchmarks/new?model=${encodeURIComponent(m.model_identifier)}`,
                              )
                            }
                            className="bg-ink hover:bg-rust text-paper px-2 py-0.5 text-[11px] font-semibold transition-colors"
                          >
                            Benchmark
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* AI Evaluation Suite Companion Card */}
        <div className="mt-8 border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_0_#2B2A27]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-semibold text-pine bg-pine-soft border border-pine px-1.5 py-0.5">
                  AI Evaluation Suite
                </span>
                <h4 className="font-display font-semibold text-base text-ink">
                  Evaluate Models with Retrieval &amp; Embeddings in RagReader
                </h4>
              </div>
              <p className="text-xs text-ink-soft max-w-2xl leading-relaxed">
                Found the right model in the registry? Test how well it handles long documents, PDF citations, and retrieval pipelines on <strong>RagReader</strong>, our companion workbench for RAG evaluation.
              </p>
            </div>
            <a
              href={ragReaderURL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-ink text-paper text-xs font-semibold hover:bg-rust transition-colors shadow-xs shrink-0"
            >
              <span>Open in RagReader</span>
              <IconExternal className="h-3.5 w-3.5 text-rust" />
            </a>
          </div>
        </div>
      </main>

      {/* History Snapshots Modal */}
      {selectedModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-2xl bg-paper border-2 border-ink flex flex-col shadow-2xl">
            <div className="p-4 border-b-2 border-ink flex items-center justify-between bg-paper-raised">
              <div>
                <span className="text-[10px] font-mono text-rust uppercase">
                  Version Metadata Snapshots
                </span>
                <h3 className="font-display text-lg font-bold text-ink">
                  {selectedModel.display_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModel(null)}
                className="p-1 hover:bg-paper-sunken border border-hairline text-ink"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 font-mono text-xs space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-ink-soft">
                Historical snapshots recorded whenever upstream pricing, context length, or parameters changed.
              </p>

              {loadingHistory ? (
                <div className="py-8 text-center text-ink-faint">Loading snapshots…</div>
              ) : snapshots.length === 0 ? (
                <div className="border border-dashed border-hairline p-6 text-center text-ink-soft bg-paper-sunken">
                  Current specification is initial snapshot. No historical regressions detected.
                </div>
              ) : (
                <div className="space-y-3">
                  {snapshots.map((snap) => (
                    <div key={snap.id} className="border border-hairline bg-paper-raised p-3 space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-ink-faint">
                        <span>Hash: {snap.snapshot_hash.slice(0, 12)}…</span>
                        <span>{new Date(snap.recorded_at).toLocaleString()}</span>
                      </div>
                      <pre className="p-2 bg-paper border border-hairline text-[11px] overflow-x-auto text-ink">
                        {JSON.stringify(snap.metadata_json, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t-2 border-ink flex justify-end bg-paper-raised">
              <button
                type="button"
                onClick={() => setSelectedModel(null)}
                className="border border-hairline-strong px-4 py-1.5 text-xs text-ink hover:bg-paper-sunken"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
