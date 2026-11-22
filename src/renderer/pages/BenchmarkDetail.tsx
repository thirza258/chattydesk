import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import services from '../../services/services';
import {
  BenchmarkExperimentDetail,
  BenchmarkExecutionItem,
  BenchmarkProgress,
} from '../../interface';
import { usePageMeta } from '../pageMeta';
import {
  IconArrowRight,
  IconBarChart,
  IconCheck,
  IconDatabase,
  IconDownload,
  IconFlask,
  IconLogo,
  IconPlay,
  IconSquare,
  IconTrophy,
} from '../components/icons';

type TabKey =
  | 'overview'
  | 'comparison'
  | 'performance'
  | 'quality'
  | 'cases'
  | 'reproducibility';

export default function BenchmarkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  usePageMeta({
    title: 'Benchmark Experiment Details · ChattyDesk',
    path: `/benchmarks/experiments/${id || ''}`,
    noindex: true,
  });

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [experiment, setExperiment] = useState<BenchmarkExperimentDetail | null>(null);
  const [executions, setExecutions] = useState<BenchmarkExecutionItem[]>([]);
  const [progress, setProgress] = useState<BenchmarkProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [copiedChecksum, setCopiedChecksum] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  // Drilldown filters
  const [caseModelFilter, setCaseModelFilter] = useState<string>('all');
  const [caseStatusFilter, setCaseStatusFilter] = useState<string>('all');
  const [caseSearch, setCaseSearch] = useState<string>('');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  // Human feedback state: execution_id -> { rating, notes, preferred, submitted }
  const [feedbackState, setFeedbackState] = useState<
    Record<string, { rating: number; notes: string; preferred: boolean; submitted?: boolean }>
  >({});

  const isTerminalStatus = (status?: string) =>
    ['completed', 'partially_completed', 'failed', 'cancelled'].includes(status || '');

  const loadData = async (isPoll = false) => {
    if (!id) return;
    try {
      if (!isPoll) setRefreshing(true);
      const [expDetail, resData] = await Promise.all([
        services.getBenchmark(id),
        services.getBenchmarkResults(id).catch(() => ({ experiment: null as any, executions: [] })),
      ]);
      setExperiment(expDetail);
      if (resData && resData.executions) {
        setExecutions(resData.executions);
      }
    } catch (err) {
      if (!isPoll) setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Polling while active
  useEffect(() => {
    if (!id || !experiment || isTerminalStatus(experiment.status)) return;

    const interval = setInterval(async () => {
      try {
        const prog = await services.getBenchmarkProgress(id);
        setProgress(prog);
        if (isTerminalStatus(prog.status)) {
          // Final reload when transitioned to terminal
          loadData(true);
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [id, experiment?.status]);

  const handleCancel = async () => {
    if (!id || cancelling) return;
    if (!window.confirm('Are you sure you want to cancel this benchmark experiment?')) return;
    try {
      setCancelling(true);
      await services.cancelBenchmark(id);
      await loadData(false);
    } catch (err) {
      alert(`Failed to cancel: ${(err as Error).message}`);
    } finally {
      setCancelling(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (!id) return;
    try {
      await services.downloadBenchmarkExport(id, format);
    } catch (err) {
      alert(`Export failed: ${(err as Error).message}`);
    }
  };

  const handleFeedbackSubmit = async (executionId: string) => {
    const fb = feedbackState[executionId] || { rating: 5, notes: '', preferred: false };
    try {
      await services.submitHumanFeedback({
        execution_id: executionId,
        rating: fb.rating,
        notes: fb.notes,
        preferred_response: fb.preferred,
      });
      setFeedbackState((prev) => ({
        ...prev,
        [executionId]: { ...fb, submitted: true },
      }));
    } catch (err) {
      alert(`Failed to submit feedback: ${(err as Error).message}`);
    }
  };

  // Status badge styling
  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono bg-pine-soft text-pine border border-pine font-medium">
            completed
          </span>
        );
      case 'partially_completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono bg-amber-50 text-amber-700 border border-amber-300 font-medium">
            partially completed
          </span>
        );
      case 'running':
      case 'validating':
      case 'evaluating':
      case 'aggregating':
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono bg-rust-soft text-rust border border-rust font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-rust animate-pulse" />
            {status}
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono bg-ember-soft text-ember border border-ember font-medium">
            failed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono bg-paper-sunken text-ink-faint border border-hairline font-medium">
            cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono bg-paper-sunken text-ink font-medium">
            {status || 'unknown'}
          </span>
        );
    }
  };

  // Best performer highlights
  const bestMetrics = useMemo(() => {
    if (!experiment?.summaries?.length) return null;
    let bestQuality = { model: '', val: -1 };
    let lowestLatency = { model: '', val: Infinity };
    let highestThroughput = { model: '', val: -1 };
    let lowestCost = { model: '', val: Infinity };

    for (const s of experiment.summaries) {
      const q = s.metrics.overall_quality_score || 0;
      if (q > bestQuality.val) bestQuality = { model: s.model_identifier, val: q };

      const lat = s.metrics.latency_ms?.p50 ?? s.metrics.latency_ms?.mean ?? Infinity;
      if (lat > 0 && lat < lowestLatency.val) lowestLatency = { model: s.model_identifier, val: lat };

      const tps = s.metrics.tokens_per_second?.p50 ?? s.metrics.tokens_per_second?.mean ?? 0;
      if (tps > highestThroughput.val) highestThroughput = { model: s.model_identifier, val: tps };

      const cost = s.metrics.avg_cost_per_request_usd ?? Infinity;
      if (cost >= 0 && cost < lowestCost.val) lowestCost = { model: s.model_identifier, val: cost };
    }

    return { bestQuality, lowestLatency, highestThroughput, lowestCost };
  }, [experiment?.summaries]);

  // Filtered test cases for drill-down
  const filteredCases = useMemo(() => {
    return executions.filter((item) => {
      if (caseModelFilter !== 'all' && item.model_identifier !== caseModelFilter) return false;
      if (caseStatusFilter !== 'all' && item.status !== caseStatusFilter) return false;
      if (caseSearch.trim()) {
        const query = caseSearch.toLowerCase();
        const promptMatch = item.prompt?.toLowerCase().includes(query);
        const respMatch = item.response_text?.toLowerCase().includes(query);
        const modelMatch = item.model_identifier.toLowerCase().includes(query);
        if (!promptMatch && !respMatch && !modelMatch) return false;
      }
      return true;
    });
  }, [executions, caseModelFilter, caseStatusFilter, caseSearch]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-paper text-ink font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rust animate-ping" />
          Loading experiment results…
        </div>
      </div>
    );
  }

  if (error || !experiment) {
    return (
      <div className="min-h-dvh flex flex-col bg-paper text-ink p-6">
        <div className="max-w-xl mx-auto mt-12 border-2 border-ember bg-ember-soft p-6">
          <h2 className="font-display text-lg font-bold text-ember">Experiment Not Found</h2>
          <p className="mt-2 text-xs font-mono text-ember">{error || 'Could not load benchmark experiment.'}</p>
          <Link
            to="/benchmarks"
            className="mt-4 inline-flex items-center gap-1 text-xs font-mono font-semibold text-ink underline"
          >
            ← Back to Benchmark Lab
          </Link>
        </div>
      </div>
    );
  }

  const activeStatus = progress?.status || experiment.status;
  const completedCases = progress?.completed_cases ?? experiment.completed_cases;
  const totalCases = progress?.total_cases ?? experiment.total_cases;
  const progressPct =
    progress?.progress_percentage ??
    (totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0);

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
              Benchmark Experiment
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => handleExport('json')}
              className="inline-flex items-center gap-1.5 border border-hairline-strong px-2.5 py-1.5 text-xs font-mono text-ink hover:border-ink transition-colors"
              title="Download results as JSON"
            >
              <IconDownload className="h-3 w-3" />
              <span>JSON</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 border border-hairline-strong px-2.5 py-1.5 text-xs font-mono text-ink hover:border-ink transition-colors"
              title="Download results as CSV"
            >
              <IconDownload className="h-3 w-3" />
              <span>CSV</span>
            </button>
            {!isTerminalStatus(activeStatus) && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="inline-flex items-center gap-1.5 bg-ember hover:bg-ember-deep text-paper text-xs font-mono px-3 py-1.5 transition-colors"
              >
                <IconSquare className="h-3 w-3" />
                <span>{cancelling ? 'Cancelling…' : 'Cancel Run'}</span>
              </button>
            )}
            <Link
              to="/benchmarks"
              className="inline-flex items-center gap-1.5 border border-hairline-strong px-2.5 py-1.5 text-xs font-mono text-ink hover:border-ink transition-colors"
            >
              <span>← Lab</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Status Banner */}
      <div className="border-b-2 border-ink bg-paper-raised px-4 py-6 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 font-mono text-xs">
              {renderStatusBadge(activeStatus)}
              <span className="text-ink-faint">·</span>
              <span className="text-ink-soft">
                Suite: <strong>{experiment.dataset_name || experiment.dataset?.name || 'Benchmark Suite'}</strong> (v{experiment.dataset_version_num || experiment.dataset?.version || 1})
              </span>
              <span className="text-ink-faint">·</span>
              <span className="text-ink-soft">
                {experiment.models.length} {experiment.models.length === 1 ? 'model' : 'models'} evaluated
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight">
              {experiment.name}
            </h1>
            {experiment.description && (
              <p className="mt-1 text-xs sm:text-sm text-ink-soft max-w-2xl">{experiment.description}</p>
            )}
          </div>

          {/* Progress / Status metrics */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 font-mono text-xs">
            <div className="border border-hairline bg-paper p-3 min-w-[160px]">
              <div className="flex justify-between text-[10px] text-ink-faint uppercase mb-1">
                <span>Progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="w-full h-2 bg-hairline rounded-full overflow-hidden">
                <div
                  className="h-full bg-rust transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-ink-soft">
                <span>{completedCases}/{totalCases} cases</span>
                {experiment.failed_cases > 0 && (
                  <span className="text-ember font-semibold">{experiment.failed_cases} errors</span>
                )}
              </div>
            </div>

            <div className="border border-hairline bg-paper p-3 text-[11px] space-y-1">
              <div>
                <span className="text-ink-faint">Created: </span>
                <span className="text-ink">{new Date(experiment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {experiment.started_at && (
                <div>
                  <span className="text-ink-faint">Started: </span>
                  <span className="text-ink">{new Date(experiment.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              {experiment.completed_at && (
                <div>
                  <span className="text-ink-faint">Finished: </span>
                  <span className="text-ink">{new Date(experiment.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {experiment.error_message && (
          <div className="mt-4 p-3 border border-ember bg-ember-soft text-ember text-xs font-mono">
            <strong>Error:</strong> {experiment.error_message}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-hairline-strong bg-paper px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto text-xs font-mono font-medium">
          {[
            { key: 'overview', label: '1. Overview' },
            { key: 'comparison', label: '2. Model Comparison' },
            { key: 'performance', label: '3. Performance & Latency' },
            { key: 'quality', label: '4. Quality & Evaluation' },
            { key: 'cases', label: `5. Test Cases (${executions.length})` },
            { key: 'reproducibility', label: '6. Configuration & Checksum' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`py-3 px-3 sm:px-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-rust text-rust font-bold bg-rust-soft/20'
                  : 'border-transparent text-ink-soft hover:text-ink hover:border-hairline'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Performer Highlights */}
            {bestMetrics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border-2 border-pine bg-pine-soft p-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-pine font-bold">
                    Top Quality Score
                  </span>
                  <p className="mt-1 font-display text-xl font-bold text-ink truncate">
                    {bestMetrics.bestQuality.model}
                  </p>
                  <p className="text-sm font-mono font-semibold text-pine mt-0.5">
                    {bestMetrics.bestQuality.val.toFixed(1)}% score
                  </p>
                </div>

                <div className="border-2 border-rust bg-rust-soft p-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rust font-bold">
                    Lowest Median Latency
                  </span>
                  <p className="mt-1 font-display text-xl font-bold text-ink truncate">
                    {bestMetrics.lowestLatency.model}
                  </p>
                  <p className="text-sm font-mono font-semibold text-rust mt-0.5">
                    {bestMetrics.lowestLatency.val < Infinity
                      ? `${Math.round(bestMetrics.lowestLatency.val)} ms`
                      : 'N/A'}
                  </p>
                </div>

                <div className="border-2 border-ink bg-paper-raised p-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-soft font-bold">
                    Highest Throughput
                  </span>
                  <p className="mt-1 font-display text-xl font-bold text-ink truncate">
                    {bestMetrics.highestThroughput.model}
                  </p>
                  <p className="text-sm font-mono font-semibold text-ink mt-0.5">
                    {bestMetrics.highestThroughput.val > 0
                      ? `${bestMetrics.highestThroughput.val.toFixed(1)} tok/s`
                      : 'N/A'}
                  </p>
                </div>

                <div className="border-2 border-ink bg-paper-raised p-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-soft font-bold">
                    Lowest Cost per Request
                  </span>
                  <p className="mt-1 font-display text-xl font-bold text-ink truncate">
                    {bestMetrics.lowestCost.model}
                  </p>
                  <p className="text-sm font-mono font-semibold text-ink mt-0.5">
                    {bestMetrics.lowestCost.val < Infinity
                      ? `$${bestMetrics.lowestCost.val.toFixed(4)}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            )}

            {/* Model Summary Cards */}
            <div>
              <h2 className="font-display text-lg font-bold mb-3">Model Benchmark Summaries</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(experiment.summaries || []).map((summary) => {
                  const m = summary.metrics;
                  return (
                    <div
                      key={summary.model_identifier}
                      className="border-2 border-ink bg-paper-raised p-5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-mono text-sm font-bold truncate text-ink">
                            {summary.model_identifier}
                          </h3>
                          <span className="px-2 py-0.5 text-[10px] font-mono bg-paper border border-hairline font-semibold">
                            {summary.sample_count} samples
                          </span>
                        </div>

                        {/* Quality score bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className="text-ink-soft">Quality Score</span>
                            <span className="font-bold text-pine">
                              {m.overall_quality_score?.toFixed(1) || '0.0'}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-hairline rounded-full overflow-hidden">
                            <div
                              className="h-full bg-pine"
                              style={{ width: `${Math.min(m.overall_quality_score || 0, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Metrics grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-hairline pt-3">
                          <div>
                            <span className="text-[10px] text-ink-faint block">Latency P50</span>
                            <span className="font-semibold text-ink">
                              {m.latency_ms?.p50 ? `${Math.round(m.latency_ms.p50)} ms` : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-faint block">Latency P95</span>
                            <span className="font-semibold text-ink">
                              {m.latency_ms?.p95 ? `${Math.round(m.latency_ms.p95)} ms` : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-faint block">Throughput</span>
                            <span className="font-semibold text-rust">
                              {m.tokens_per_second?.p50
                                ? `${m.tokens_per_second.p50.toFixed(1)} t/s`
                                : m.tokens_per_second?.mean
                                ? `${m.tokens_per_second.mean.toFixed(1)} t/s`
                                : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-faint block">Success Rate</span>
                            <span
                              className={`font-semibold ${
                                m.success_rate >= 95 ? 'text-pine' : 'text-ember'
                              }`}
                            >
                              {m.success_rate?.toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-faint block">Total Tokens</span>
                            <span className="font-semibold text-ink">
                              {(m.total_tokens || 0).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-faint block">Avg Cost/Req</span>
                            <span className="font-semibold text-ink">
                              ${m.avg_cost_per_request_usd?.toFixed(4) || '0.0000'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between text-xs font-mono">
                        <span className="text-ink-faint">
                          Cost/1M: ${(m.cost_per_1m_tokens_usd || 0).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCaseModelFilter(summary.model_identifier);
                            setActiveTab('cases');
                          }}
                          className="text-rust hover:text-rust-deep font-semibold"
                        >
                          View test cases →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MODEL COMPARISON */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold">Side-by-Side Model Comparison</h2>
              <p className="text-xs text-ink-soft">
                Multi-metric comparison matrix with performance, throughput, reliability, and cost tradeoffs.
              </p>
            </div>

            <div className="border-2 border-ink overflow-x-auto bg-paper-raised">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="bg-paper-sunken border-b-2 border-ink uppercase text-[10px] text-ink-soft">
                  <tr>
                    <th className="p-3 border-r border-hairline">Model</th>
                    <th className="p-3 border-r border-hairline">Quality Score</th>
                    <th className="p-3 border-r border-hairline">Latency P50</th>
                    <th className="p-3 border-r border-hairline">Latency P95</th>
                    <th className="p-3 border-r border-hairline">Throughput</th>
                    <th className="p-3 border-r border-hairline">Success Rate</th>
                    <th className="p-3 border-r border-hairline">Total Tokens</th>
                    <th className="p-3 border-r border-hairline">Total Cost</th>
                    <th className="p-3">Cost / 1M</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {(experiment.summaries || []).map((s) => {
                    const m = s.metrics;
                    const isTopQuality = bestMetrics?.bestQuality.model === s.model_identifier;
                    const isLowestLat = bestMetrics?.lowestLatency.model === s.model_identifier;
                    const isHighestTPS = bestMetrics?.highestThroughput.model === s.model_identifier;
                    const isLowestCost = bestMetrics?.lowestCost.model === s.model_identifier;

                    return (
                      <tr key={s.model_identifier} className="hover:bg-paper-sunken">
                        <td className="p-3 font-bold text-ink border-r border-hairline">
                          <div className="flex items-center gap-2">
                            <span>{s.model_identifier}</span>
                            {isTopQuality && (
                              <span className="px-1.5 py-0.5 text-[9px] bg-pine-soft text-pine border border-pine uppercase">
                                Top Quality
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`p-3 border-r border-hairline font-bold ${isTopQuality ? 'text-pine' : 'text-ink'}`}>
                          {m.overall_quality_score?.toFixed(1) || '0.0'}%
                        </td>
                        <td className={`p-3 border-r border-hairline ${isLowestLat ? 'text-rust font-bold' : 'text-ink'}`}>
                          {m.latency_ms?.p50 ? `${Math.round(m.latency_ms.p50)} ms` : 'N/A'}
                        </td>
                        <td className="p-3 border-r border-hairline text-ink">
                          {m.latency_ms?.p95 ? `${Math.round(m.latency_ms.p95)} ms` : 'N/A'}
                        </td>
                        <td className={`p-3 border-r border-hairline font-bold ${isHighestTPS ? 'text-rust' : 'text-ink'}`}>
                          {m.tokens_per_second?.p50
                            ? `${m.tokens_per_second.p50.toFixed(1)} t/s`
                            : m.tokens_per_second?.mean
                            ? `${m.tokens_per_second.mean.toFixed(1)} t/s`
                            : 'N/A'}
                        </td>
                        <td className="p-3 border-r border-hairline">
                          <span
                            className={`font-semibold ${
                              m.success_rate >= 95 ? 'text-pine' : 'text-ember'
                            }`}
                          >
                            {m.success_rate?.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 border-r border-hairline text-ink">
                          {(m.total_tokens || 0).toLocaleString()}
                        </td>
                        <td className={`p-3 border-r border-hairline ${isLowestCost ? 'text-pine font-bold' : 'text-ink'}`}>
                          ${m.total_cost_usd?.toFixed(4) || '0.0000'}
                        </td>
                        <td className="p-3 text-ink">
                          ${(m.cost_per_1m_tokens_usd || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PERFORMANCE & LATENCY */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold">Latency Distributions & Throughput</h2>
              <p className="text-xs text-ink-soft">
                Detailed timing percentiles (P50, P90, P95, P99) and generation throughput.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Latency Percentiles Card */}
              <div className="border-2 border-ink bg-paper-raised p-5">
                <h3 className="font-display text-base font-bold mb-3">Latency Percentiles (ms)</h3>
                <div className="space-y-4">
                  {(experiment.summaries || []).map((s) => {
                    const lat = s.metrics.latency_ms || ({} as any);
                    const p50 = lat.p50 || 0;
                    const p90 = lat.p90 || 0;
                    const p95 = lat.p95 || 0;
                    const p99 = lat.p99 || 0;
                    const maxVal = Math.max(p99, p95, p50, 1000);

                    return (
                      <div key={s.model_identifier} className="border-t border-hairline pt-3 font-mono text-xs">
                        <div className="flex justify-between items-center mb-1.5 font-bold">
                          <span>{s.model_identifier}</span>
                          <span className="text-rust">P50: {Math.round(p50)} ms</span>
                        </div>
                        {/* Bar comparison */}
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="w-8 text-ink-faint">P50</span>
                            <div className="flex-1 h-3 bg-hairline rounded-sm overflow-hidden">
                              <div
                                className="h-full bg-pine"
                                style={{ width: `${Math.min((p50 / maxVal) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="w-16 text-right font-semibold">{Math.round(p50)} ms</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-8 text-ink-faint">P90</span>
                            <div className="flex-1 h-3 bg-hairline rounded-sm overflow-hidden">
                              <div
                                className="h-full bg-amber-500"
                                style={{ width: `${Math.min((p90 / maxVal) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="w-16 text-right font-semibold">{Math.round(p90)} ms</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-8 text-ink-faint">P95</span>
                            <div className="flex-1 h-3 bg-hairline rounded-sm overflow-hidden">
                              <div
                                className="h-full bg-rust"
                                style={{ width: `${Math.min((p95 / maxVal) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="w-16 text-right font-semibold">{Math.round(p95)} ms</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Throughput Bar Chart */}
              <div className="border-2 border-ink bg-paper-raised p-5">
                <h3 className="font-display text-base font-bold mb-3">Generation Speed (Tokens / Second)</h3>
                <div className="space-y-4">
                  {(experiment.summaries || []).map((s) => {
                    const tps = s.metrics.tokens_per_second?.p50 || s.metrics.tokens_per_second?.mean || 0;
                    return (
                      <div key={s.model_identifier} className="border-t border-hairline pt-3 font-mono text-xs">
                        <div className="flex justify-between items-center mb-1 font-bold">
                          <span>{s.model_identifier}</span>
                          <span className="text-rust">{tps.toFixed(1)} tok/s</span>
                        </div>
                        <div className="w-full h-4 bg-hairline rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-rust"
                            style={{ width: `${Math.min((tps / 150) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
                          <span>Min: {s.metrics.tokens_per_second?.min?.toFixed(1) || 0}</span>
                          <span>Max: {s.metrics.tokens_per_second?.max?.toFixed(1) || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: QUALITY & EVALUATION */}
        {activeTab === 'quality' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold">Evaluation Metrics & Accuracy</h2>
              <p className="text-xs text-ink-soft">
                Breakdown of deterministic matches, Token-F1, ROUGE scores, and LLM-as-a-judge rubric scoring.
              </p>
            </div>

            <div className="space-y-4">
              {(experiment.summaries || []).map((s) => {
                const metricsObj = s.metrics.quality_metrics || {};
                const metricEntries = Object.entries(metricsObj);

                return (
                  <div key={s.model_identifier} className="border-2 border-ink bg-paper-raised p-5">
                    <div className="flex items-center justify-between mb-3 border-b border-hairline pb-2">
                      <h3 className="font-mono text-sm font-bold text-ink">
                        {s.model_identifier}
                      </h3>
                      <span className="text-xs font-mono font-bold text-pine">
                        Overall Score: {s.metrics.overall_quality_score?.toFixed(1)}%
                      </span>
                    </div>

                    {metricEntries.length === 0 ? (
                      <p className="text-xs font-mono text-ink-faint">No detailed metrics recorded.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
                        {metricEntries.map(([mName, mData]) => (
                          <div key={mName} className="border border-hairline bg-paper p-3">
                            <span className="text-[10px] uppercase text-ink-faint font-semibold block">
                              {mName.replace('_', ' ')}
                            </span>
                            <div className="mt-1 flex items-baseline justify-between">
                              <span className="text-base font-bold text-ink">
                                {mData.mean_score.toFixed(2)}
                              </span>
                              <span className="text-xs text-pine font-medium">
                                Pass: {(mData.pass_rate * 100).toFixed(0)}%
                              </span>
                            </div>
                            <span className="text-[10px] text-ink-soft mt-1 block">
                              {mData.count} evaluations (max: {mData.max_score})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: TEST CASES DRILL-DOWN */}
        {activeTab === 'cases' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold">Individual Test Cases Drill-Down</h2>
              <p className="text-xs text-ink-soft">
                Inspect prompts, model answers, rubric evaluations, latency, and record human feedback.
              </p>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3 border-2 border-ink bg-paper-raised p-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="text-ink-soft">Model:</span>
                <select
                  value={caseModelFilter}
                  onChange={(e) => setCaseModelFilter(e.target.value)}
                  className="border border-hairline-strong bg-paper px-2 py-1 text-ink focus:outline-none focus:border-rust"
                >
                  <option value="all">All Models</option>
                  {experiment.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-ink-soft">Status:</span>
                <select
                  value={caseStatusFilter}
                  onChange={(e) => setCaseStatusFilter(e.target.value)}
                  className="border border-hairline-strong bg-paper px-2 py-1 text-ink focus:outline-none focus:border-rust"
                >
                  <option value="all">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                  <option value="timeout">Timeout</option>
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search prompt, response, model…"
                  value={caseSearch}
                  onChange={(e) => setCaseSearch(e.target.value)}
                  className="w-full border border-hairline-strong bg-paper px-2 py-1 text-ink focus:outline-none focus:border-rust"
                />
              </div>

              <span className="text-ink-faint">
                Showing {filteredCases.length} of {executions.length} executions
              </span>
            </div>

            {/* Cases List */}
            {filteredCases.length === 0 ? (
              <div className="border-2 border-dashed border-hairline-strong p-8 text-center text-xs font-mono text-ink-soft bg-paper-sunken">
                No matching test executions found.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCases.map((item) => {
                  const isExpanded = expandedCaseId === item.id;
                  const fb = feedbackState[item.id] || { rating: 5, notes: '', preferred: false };

                  return (
                    <div
                      key={item.id}
                      className="border-2 border-ink bg-paper-raised transition-all"
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => setExpandedCaseId(isExpanded ? null : item.id)}
                        className="w-full text-left p-4 flex items-center justify-between gap-4 hover:bg-paper-sunken transition-colors font-mono text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-semibold border ${
                              item.status === 'success'
                                ? 'bg-pine-soft text-pine border-pine'
                                : 'bg-ember-soft text-ember border-ember'
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="font-bold text-ink">{item.model_identifier}</span>
                          <span className="text-ink-soft truncate max-w-md">
                            {item.prompt || 'Prompt'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 text-ink-soft">
                          <span>{item.duration_ms ? `${item.duration_ms} ms` : '—'}</span>
                          <span>{item.tokens_per_second ? `${item.tokens_per_second.toFixed(1)} t/s` : '—'}</span>
                          <span>{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </button>

                      {/* Accordion Body */}
                      {isExpanded && (
                        <div className="p-4 border-t-2 border-ink space-y-4 font-mono text-xs bg-paper">
                          {/* Prompt & Expected */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border border-hairline p-3 bg-paper-sunken">
                              <span className="text-[10px] uppercase text-ink-faint font-semibold block mb-1">
                                Input Prompt
                              </span>
                              <pre className="text-xs whitespace-pre-wrap font-mono text-ink leading-relaxed">
                                {item.prompt}
                              </pre>
                            </div>
                            <div className="border border-hairline p-3 bg-paper-sunken">
                              <span className="text-[10px] uppercase text-ink-faint font-semibold block mb-1">
                                Expected Answer
                              </span>
                              <pre className="text-xs whitespace-pre-wrap font-mono text-ink-soft leading-relaxed">
                                {item.expected_answer || 'No explicit reference answer specified.'}
                              </pre>
                            </div>
                          </div>

                          {/* Model Response */}
                          <div className="border border-hairline p-3 bg-paper-raised">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] uppercase text-rust font-semibold">
                                Observed Model Response
                              </span>
                              <div className="text-[10px] text-ink-soft flex items-center gap-3">
                                <span>Tokens: {item.total_tokens || 0}</span>
                                <span>Cost: ${Number(item.estimated_cost || 0).toFixed(4)}</span>
                              </div>
                            </div>
                            {item.error_message ? (
                              <div className="p-2 bg-ember-soft border border-ember text-ember text-xs">
                                {item.error_message}
                              </div>
                            ) : (
                              <pre className="text-xs whitespace-pre-wrap font-mono text-ink leading-relaxed bg-paper p-3 border border-hairline overflow-x-auto max-h-96">
                                {item.response_text || '(Empty response)'}
                              </pre>
                            )}
                          </div>

                          {/* Evaluation Scores */}
                          {item.evaluations && item.evaluations.length > 0 && (
                            <div className="border border-hairline p-3 bg-paper-sunken">
                              <span className="text-[10px] uppercase text-ink-faint font-semibold block mb-2">
                                Evaluation Results
                              </span>
                              <div className="space-y-2">
                                {item.evaluations.map((ev) => (
                                  <div
                                    key={ev.id}
                                    className="flex items-start justify-between gap-4 p-2 bg-paper border border-hairline"
                                  >
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold uppercase text-ink">
                                          {ev.metric_name}
                                        </span>
                                        <span
                                          className={`px-1.5 py-0.2 text-[9px] font-bold border ${
                                            ev.passed
                                              ? 'bg-pine-soft text-pine border-pine'
                                              : 'bg-ember-soft text-ember border-ember'
                                          }`}
                                        >
                                          {ev.passed ? 'PASSED' : 'FAILED'}
                                        </span>
                                      </div>
                                      {ev.explanation && (
                                        <p className="mt-1 text-ink-soft text-[11px] leading-relaxed">
                                          {ev.explanation}
                                        </p>
                                      )}
                                    </div>
                                    <div className="font-bold text-sm text-ink shrink-0">
                                      {ev.score} / {ev.maximum_score}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Human Feedback Widget */}
                          <div className="border border-rust bg-rust-soft/20 p-3">
                            <span className="text-[10px] uppercase text-rust font-bold block mb-2">
                              Record Human Evaluation & Feedback
                            </span>
                            <div className="flex flex-wrap items-center gap-4 mb-2">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-ink-soft mr-1">Rating:</span>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                      setFeedbackState((prev) => ({
                                        ...prev,
                                        [item.id]: { ...fb, rating: star },
                                      }))
                                    }
                                    className={`px-2 py-0.5 border text-xs font-bold ${
                                      fb.rating >= star
                                        ? 'bg-rust text-paper border-rust'
                                        : 'bg-paper text-ink border-hairline'
                                    }`}
                                  >
                                    {star}★
                                  </button>
                                ))}
                              </div>

                              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-ink">
                                <input
                                  type="checkbox"
                                  checked={fb.preferred}
                                  onChange={(e) =>
                                    setFeedbackState((prev) => ({
                                      ...prev,
                                      [item.id]: { ...fb, preferred: e.target.checked },
                                    }))
                                  }
                                  className="accent-rust"
                                />
                                <span>Preferred Response</span>
                              </label>
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Optional human feedback notes…"
                                value={fb.notes}
                                onChange={(e) =>
                                  setFeedbackState((prev) => ({
                                    ...prev,
                                    [item.id]: { ...fb, notes: e.target.value },
                                  }))
                                }
                                className="flex-1 border border-hairline-strong bg-paper px-2 py-1 text-xs text-ink"
                              />
                              <button
                                type="button"
                                onClick={() => handleFeedbackSubmit(item.id)}
                                className="bg-ink hover:bg-rust text-paper px-3 py-1 text-xs font-semibold transition-colors"
                              >
                                {fb.submitted ? 'Saved ✓' : 'Save Rating'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: CONFIGURATION & REPRODUCIBILITY */}
        {activeTab === 'reproducibility' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold">Reproducibility & Verification</h2>
              <p className="text-xs text-ink-soft">
                Full cryptographic dataset checksum and experiment hyperparameters required for independent replication.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dataset Metadata Card */}
              <div className="border-2 border-ink bg-paper-raised p-5 font-mono text-xs space-y-3">
                <h3 className="font-display text-base font-bold text-ink">Benchmark Dataset</h3>
                <div className="space-y-2 border-t border-hairline pt-3">
                  <div>
                    <span className="text-ink-faint block text-[10px] uppercase">Dataset Name</span>
                    <span className="font-bold text-ink">{experiment.dataset?.name || experiment.dataset_name}</span>
                  </div>
                  <div>
                    <span className="text-ink-faint block text-[10px] uppercase">Category</span>
                    <span className="text-ink">{experiment.dataset?.category || experiment.dataset_category}</span>
                  </div>
                  <div>
                    <span className="text-ink-faint block text-[10px] uppercase">Version</span>
                    <span className="text-ink">v{experiment.dataset?.version || experiment.dataset_version_num}</span>
                  </div>
                  <div>
                    <span className="text-ink-faint block text-[10px] uppercase">SHA-256 Checksum</span>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="bg-paper p-1.5 border border-hairline text-[11px] text-rust break-all">
                        {experiment.dataset?.checksum || '729f8f2b…'}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(experiment.dataset?.checksum || '');
                          setCopiedChecksum(true);
                          setTimeout(() => setCopiedChecksum(false), 2000);
                        }}
                        className="border border-hairline px-2 py-1 bg-paper hover:bg-paper-sunken shrink-0 text-[10px]"
                      >
                        {copiedChecksum ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Hyperparameters */}
              <div className="border-2 border-ink bg-paper-raised p-5 font-mono text-xs space-y-3">
                <h3 className="font-display text-base font-bold text-ink">Execution Parameters</h3>
                <div className="space-y-2 border-t border-hairline pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-ink-faint block text-[10px] uppercase">Repetitions</span>
                      <span className="font-bold text-ink">{experiment.configuration_json?.repetitions || 1}</span>
                    </div>
                    <div>
                      <span className="text-ink-faint block text-[10px] uppercase">Concurrency</span>
                      <span className="font-bold text-ink">{experiment.configuration_json?.concurrency || 2}</span>
                    </div>
                    <div>
                      <span className="text-ink-faint block text-[10px] uppercase">Temperature</span>
                      <span className="font-bold text-ink">{experiment.configuration_json?.temperature ?? 0.0}</span>
                    </div>
                    <div>
                      <span className="text-ink-faint block text-[10px] uppercase">Max Tokens</span>
                      <span className="font-bold text-ink">{experiment.configuration_json?.max_tokens || 1024}</span>
                    </div>
                    <div>
                      <span className="text-ink-faint block text-[10px] uppercase">Timeout</span>
                      <span className="font-bold text-ink">{experiment.configuration_json?.timeout || 60}s</span>
                    </div>
                  </div>
                  {experiment.configuration_json?.system_prompt && (
                    <div>
                      <span className="text-ink-faint block text-[10px] uppercase">System Prompt</span>
                      <p className="mt-1 text-ink-soft italic">{experiment.configuration_json.system_prompt}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Exportable Experiment Configuration JSON */}
            <div className="border-2 border-ink bg-paper-raised p-5 font-mono text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-ink">Exportable Reproduction Specification</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(experiment, null, 2));
                    setCopiedConfig(true);
                    setTimeout(() => setCopiedConfig(false), 2000);
                  }}
                  className="border border-hairline-strong bg-paper px-2 py-1 text-[10px] text-ink hover:border-ink"
                >
                  {copiedConfig ? 'Copied JSON!' : 'Copy JSON'}
                </button>
              </div>
              <pre className="bg-paper p-3 border border-hairline overflow-x-auto text-[11px] leading-relaxed max-h-80">
                {JSON.stringify(
                  {
                    experiment_id: experiment.id,
                    name: experiment.name,
                    dataset: experiment.dataset,
                    models: experiment.models,
                    configuration: experiment.configuration_json,
                    created_at: experiment.created_at,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
