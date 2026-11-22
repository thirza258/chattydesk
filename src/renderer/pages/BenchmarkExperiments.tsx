import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import services from '../../services/services';
import { BenchmarkExperimentItem } from '../../interface';
import { usePageMeta } from '../pageMeta';
import {
  IconDownload,
  IconFlask,
  IconLogo,
  IconPlay,
  IconPlus,
  IconSquare,
} from '../components/icons';

type StatusFilter = 'all' | 'running' | 'completed' | 'failed';

export default function BenchmarkExperiments() {
  usePageMeta({
    title: 'Benchmark Experiments · ChattyDesk',
    path: '/benchmarks/experiments',
    noindex: true,
  });

  const navigate = useNavigate();
  const [experiments, setExperiments] = useState<BenchmarkExperimentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const data = await services.listBenchmarks();
      setExperiments(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, []);

  const filteredExperiments = useMemo(() => {
    return experiments.filter((exp) => {
      if (statusFilter === 'running') {
        if (!['queued', 'validating', 'running', 'evaluating', 'aggregating'].includes(exp.status)) {
          return false;
        }
      } else if (statusFilter === 'completed') {
        if (exp.status !== 'completed' && exp.status !== 'partially_completed') {
          return false;
        }
      } else if (statusFilter === 'failed') {
        if (exp.status !== 'failed' && exp.status !== 'cancelled') {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = exp.name.toLowerCase().includes(q);
        const datasetMatch = (exp.dataset_name || '').toLowerCase().includes(q);
        const modelMatch = exp.models.some((m) => m.toLowerCase().includes(q));
        if (!nameMatch && !datasetMatch && !modelMatch) return false;
      }

      return true;
    });
  }, [experiments, statusFilter, searchQuery]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono bg-pine-soft text-pine border border-pine font-medium">
            completed
          </span>
        );
      case 'partially_completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-300 font-medium">
            partial
          </span>
        );
      case 'running':
      case 'validating':
      case 'evaluating':
      case 'aggregating':
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono bg-rust-soft text-rust border border-rust font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-rust animate-pulse" />
            {status}
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono bg-ember-soft text-ember border border-ember font-medium">
            failed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono bg-paper-sunken text-ink-faint border border-hairline font-medium">
            cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono bg-paper-sunken text-ink font-medium">
            {status}
          </span>
        );
    }
  };

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
              Experiments
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/benchmarks/new"
              className="inline-flex items-center gap-1.5 bg-ink hover:bg-rust text-paper text-xs font-semibold px-3 py-1.5 transition-colors"
            >
              <IconPlus className="h-3.5 w-3.5" />
              <span>New Experiment</span>
            </Link>
            <Link
              to="/benchmarks"
              className="inline-flex items-center gap-1.5 border border-hairline-strong px-2.5 py-1.5 text-xs font-mono text-ink hover:border-ink transition-colors"
            >
              <span>← Lab</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-ink pb-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight">
              Benchmark Experiments
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-ink-soft">
              All executed and queued evaluation runs, duration, and test status.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-paper-sunken p-1 border border-hairline font-mono text-xs">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'running', label: 'Active' },
                { id: 'completed', label: 'Completed' },
                { id: 'failed', label: 'Failed' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1 transition-colors ${
                  statusFilter === f.id
                    ? 'bg-paper text-ink font-bold shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search experiment name, dataset, or model ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-2 border-ink bg-paper p-2.5 text-xs font-mono text-ink placeholder:text-ink-faint focus:outline-none focus:border-rust"
          />
          <button
            type="button"
            onClick={loadExperiments}
            className="border-2 border-ink bg-paper hover:bg-paper-sunken p-2.5 text-xs font-mono font-semibold"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-3 bg-ember-soft text-ember text-xs border border-ember font-mono">
            {error}
          </div>
        )}

        {/* Experiments Table */}
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-ink-faint">
            Loading experiments…
          </div>
        ) : filteredExperiments.length === 0 ? (
          <div className="border-2 border-dashed border-hairline-strong p-12 text-center bg-paper-sunken">
            <IconFlask className="h-10 w-10 mx-auto text-ink-faint mb-3" />
            <h3 className="font-display text-base font-bold text-ink">No Experiments Found</h3>
            <p className="mt-1 text-xs text-ink-soft font-mono">
              {searchQuery ? 'Try clearing your search query.' : 'Launch your first multi-model benchmark.'}
            </p>
            <Link
              to="/benchmarks/new"
              className="mt-4 inline-flex items-center gap-1.5 bg-rust hover:bg-rust-deep text-paper text-xs font-semibold px-4 py-2 transition-colors"
            >
              <IconPlay className="h-3 w-3" />
              <span>Create Experiment</span>
            </Link>
          </div>
        ) : (
          <div className="border-2 border-ink bg-paper-raised overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-paper-sunken border-b-2 border-ink uppercase text-[10px] text-ink-soft">
                <tr>
                  <th className="p-3 border-r border-hairline">Experiment Name</th>
                  <th className="p-3 border-r border-hairline">Dataset Suite</th>
                  <th className="p-3 border-r border-hairline">Models Evaluated</th>
                  <th className="p-3 border-r border-hairline">Status</th>
                  <th className="p-3 border-r border-hairline">Progress</th>
                  <th className="p-3 border-r border-hairline">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filteredExperiments.map((exp) => {
                  const pct =
                    exp.total_cases > 0
                      ? Math.round((exp.completed_cases / exp.total_cases) * 100)
                      : 0;

                  return (
                    <tr key={exp.id} className="hover:bg-paper-sunken transition-colors">
                      <td className="p-3 font-semibold text-ink border-r border-hairline">
                        <Link
                          to={`/benchmarks/experiments/${exp.id}`}
                          className="hover:text-rust transition-colors"
                        >
                          {exp.name}
                        </Link>
                      </td>
                      <td className="p-3 text-ink-soft border-r border-hairline">
                        {exp.dataset_name || 'Standard QA'} (v{exp.dataset_version_num || 1})
                      </td>
                      <td className="p-3 text-ink-soft border-r border-hairline">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {exp.models.map((m) => (
                            <span
                              key={m}
                              className="px-1.5 py-0.5 text-[9px] bg-paper border border-hairline text-ink truncate max-w-[120px]"
                              title={m}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 border-r border-hairline">{renderStatusBadge(exp.status)}</td>
                      <td className="p-3 border-r border-hairline">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] w-12 text-ink-soft">
                            {exp.completed_cases}/{exp.total_cases}
                          </span>
                          <div className="w-16 h-1.5 bg-hairline rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rust"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-ink-faint">{pct}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-ink-soft border-r border-hairline text-[11px]">
                        {new Date(exp.created_at).toLocaleDateString()}{' '}
                        {new Date(exp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          to={`/benchmarks/experiments/${exp.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rust hover:text-rust-deep"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
