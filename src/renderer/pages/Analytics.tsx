import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import services from '../../services/services';
import { AnalyticsOverview, CostProjectionItem } from '../../interface';
import { usePageMeta } from '../pageMeta';
import {
  IconBarChart,
  IconFlask,
  IconLogo,
  IconPlay,
  IconTrophy,
} from '../components/icons';

const DEFAULT_POPULAR_MODELS = [
  'anthropic/claude-3.5-sonnet',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'deepseek/deepseek-chat',
  'meta-llama/llama-3.3-70b-instruct',
  'google/gemini-2.5-flash',
];

export default function Analytics() {
  usePageMeta({
    title: 'Performance & Cost Analytics · ChattyDesk',
    path: '/analytics',
    noindex: true,
  });

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cost Calculator State
  const [dailyRequests, setDailyRequests] = useState<number>(1000);
  const [inputTokens, setInputTokens] = useState<number>(500);
  const [outputTokens, setOutputTokens] = useState<number>(300);
  const [selectedModels, setSelectedModels] = useState<string[]>(
    DEFAULT_POPULAR_MODELS.slice(0, 4),
  );
  const [costProjections, setCostProjections] = useState<CostProjectionItem[]>(
    [],
  );
  const [loadingCost, setLoadingCost] = useState(false);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [ovData, perfData] = await Promise.all([
        services.getAnalyticsOverview().catch(() => null),
        services.getPerformanceAnalytics().catch(() => []),
      ]);
      setOverview(ovData);
      setPerformanceData(perfData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCostProjections = async () => {
    try {
      setLoadingCost(true);
      const data = await services.getCostAnalytics({
        daily_requests: dailyRequests,
        avg_input_tokens: inputTokens,
        avg_output_tokens: outputTokens,
        models: selectedModels.join(','),
      });
      setCostProjections(data.projections || []);
    } catch {
      setCostProjections([]);
    } finally {
      setLoadingCost(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    fetchCostProjections();
  }, [dailyRequests, inputTokens, outputTokens, selectedModels]);

  const toggleModelSelection = (mId: string) => {
    if (selectedModels.includes(mId)) {
      if (selectedModels.length > 1) {
        setSelectedModels(selectedModels.filter((m) => m !== mId));
      }
    } else if (selectedModels.length < 6) {
      setSelectedModels([...selectedModels, mId]);
    }
  };

  // Find max monthly cost to compute comparison delta
  const maxMonthlyCost = useMemo(() => {
    if (!costProjections.length) return 0;
    return Math.max(...costProjections.map((p) => p.monthly_cost));
  }, [costProjections]);

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
              Analytics & Cost Intelligence
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8">
        <div className="border-b-2 border-ink pb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rust font-bold">
            OBSERVED METRICS & INFERENCE ECONOMICS
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">
            Performance & Cost Intelligence
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-ink-soft max-w-3xl leading-relaxed">
            Analyze empirical latency percentiles across models, generation
            throughput, and model inference costs at production scale.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-ember-soft text-ember text-xs border border-ember font-mono">
            {error}
          </div>
        )}

        {/* Overview KPIs */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div className="border-2 border-ink bg-paper-raised p-4">
              <span className="text-[10px] uppercase text-ink-faint">
                Total Experiments
              </span>
              <p className="mt-1 text-2xl font-bold text-ink">
                {overview.total_experiments}
              </p>
            </div>
            <div className="border-2 border-ink bg-paper-raised p-4">
              <span className="text-[10px] uppercase text-ink-faint">
                Total Executions
              </span>
              <p className="mt-1 text-2xl font-bold text-rust">
                {overview.total_benchmark_requests.toLocaleString()}
              </p>
            </div>
            <div className="border-2 border-ink bg-paper-raised p-4">
              <span className="text-[10px] uppercase text-ink-faint">
                Models Evaluated
              </span>
              <p className="mt-1 text-2xl font-bold text-ink">
                {overview.models_evaluated_count}
              </p>
            </div>
            <div className="border-2 border-ink bg-paper-raised p-4">
              <span className="text-[10px] uppercase text-ink-faint">
                Platform Success Rate
              </span>
              <p className="mt-1 text-2xl font-bold text-pine">
                {overview.avg_success_rate}%
              </p>
            </div>
          </div>
        )}

        {/* Cost Intelligence & Workload Calculator (Module J) */}
        <div className="border-2 border-ink bg-paper-raised p-6 shadow-tactile-sm">
          <div className="border-b border-hairline pb-4 mb-6">
            <span className="font-mono text-[10px] uppercase tracking-wider text-rust font-bold">
              WORKLOAD COST CALCULATOR
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold">
              Production Workload Cost Projection
            </h2>
            <p className="mt-1 text-xs text-ink-soft font-mono">
              Simulate actual monthly and annual inference costs across models
              based on your token volume.
            </p>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs mb-6">
            <div className="border border-hairline bg-paper p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-ink">Daily Requests</span>
                <span className="font-bold text-rust text-sm">
                  {dailyRequests.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="50000"
                step="500"
                value={dailyRequests}
                onChange={(e) => setDailyRequests(parseInt(e.target.value, 10))}
                className="w-full accent-rust"
              />
              <span className="text-[10px] text-ink-faint mt-1 block">
                {(dailyRequests * 30).toLocaleString()} requests/month
              </span>
            </div>

            <div className="border border-hairline bg-paper p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-ink">
                  Avg Input (Prompt) Tokens
                </span>
                <span className="font-bold text-ink text-sm">
                  {inputTokens} tokens
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="8000"
                step="50"
                value={inputTokens}
                onChange={(e) => setInputTokens(parseInt(e.target.value, 10))}
                className="w-full accent-ink"
              />
              <span className="text-[10px] text-ink-faint mt-1 block">
                {((inputTokens * dailyRequests) / 1000).toFixed(0)}k prompt
                tokens/day
              </span>
            </div>

            <div className="border border-hairline bg-paper p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-ink">
                  Avg Output (Completion) Tokens
                </span>
                <span className="font-bold text-pine text-sm">
                  {outputTokens} tokens
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="4000"
                step="50"
                value={outputTokens}
                onChange={(e) => setOutputTokens(parseInt(e.target.value, 10))}
                className="w-full accent-pine"
              />
              <span className="text-[10px] text-ink-faint mt-1 block">
                {((outputTokens * dailyRequests) / 1000).toFixed(0)}k output
                tokens/day
              </span>
            </div>
          </div>

          {/* Model Toggle Chips */}
          <div className="mb-6">
            <span className="text-xs font-mono font-semibold text-ink-soft block mb-2">
              Select Models to Compare (max 6):
            </span>
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              {DEFAULT_POPULAR_MODELS.map((mId) => {
                const isSelected = selectedModels.includes(mId);
                return (
                  <button
                    key={mId}
                    type="button"
                    onClick={() => toggleModelSelection(mId)}
                    className={`px-3 py-1.5 border transition-colors ${
                      isSelected
                        ? 'border-ink bg-ink text-paper font-bold'
                        : 'border-hairline bg-paper text-ink hover:border-hairline-strong'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {mId}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Projections Table */}
          {loadingCost ? (
            <div className="py-8 text-center text-xs font-mono text-ink-faint">
              Calculating cost projections…
            </div>
          ) : (
            <div className="border-2 border-ink bg-paper overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="bg-paper-sunken border-b-2 border-ink uppercase text-[10px] text-ink-soft">
                  <tr>
                    <th className="p-3 border-r border-hairline">Model</th>
                    <th className="p-3 border-r border-hairline">
                      Prompt / 1M
                    </th>
                    <th className="p-3 border-r border-hairline">
                      Completion / 1M
                    </th>
                    <th className="p-3 border-r border-hairline">
                      Cost / 1k Requests
                    </th>
                    <th className="p-3 border-r border-hairline">Daily Cost</th>
                    <th className="p-3 border-r border-hairline">
                      Monthly Cost (30d)
                    </th>
                    <th className="p-3">Annual Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {costProjections.map((p) => {
                    const monthlySavings =
                      maxMonthlyCost > p.monthly_cost
                        ? maxMonthlyCost - p.monthly_cost
                        : 0;

                    return (
                      <tr
                        key={p.model_id}
                        className="hover:bg-paper-sunken transition-colors"
                      >
                        <td className="p-3 font-bold text-ink border-r border-hairline">
                          {p.model_id}
                        </td>
                        <td className="p-3 border-r border-hairline text-ink-soft">
                          ${p.prompt_per_1m.toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-hairline text-ink-soft">
                          ${p.completion_per_1m.toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-hairline text-ink">
                          ${p.cost_per_1k_requests.toFixed(3)}
                        </td>
                        <td className="p-3 border-r border-hairline text-ink font-semibold">
                          ${p.daily_cost.toFixed(2)}
                        </td>
                        <td className="p-3 border-r border-hairline font-bold text-rust">
                          <div>
                            <span>${p.monthly_cost.toFixed(2)} / mo</span>
                            {monthlySavings > 5 && (
                              <span className="block text-[10px] text-pine font-normal">
                                Saves ${monthlySavings.toFixed(0)}/mo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-ink">
                          ${p.annual_cost.toFixed(0)} / yr
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Observed Performance Metrics */}
        <div>
          <div className="border-b-2 border-ink pb-2 mb-4">
            <h2 className="font-display text-xl font-bold">
              Observed Model Performance
            </h2>
            <p className="text-xs text-ink-soft font-mono">
              Empirical latency and generation speeds aggregated across all
              experiments.
            </p>
          </div>

          {performanceData.length === 0 ? (
            <div className="border border-dashed border-hairline p-8 text-center text-xs font-mono text-ink-soft bg-paper-sunken">
              No aggregated performance data recorded yet. Run benchmark
              experiments to populate.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {performanceData.map((item: any) => (
                <div
                  key={item.model_identifier}
                  className="border-2 border-ink bg-paper-raised p-4 font-mono text-xs space-y-2"
                >
                  <div className="flex justify-between items-center border-b border-hairline pb-2">
                    <span className="font-bold text-ink truncate max-w-[200px]">
                      {item.model_identifier}
                    </span>
                    <span className="text-[10px] text-ink-faint">
                      {item.sample_count} runs
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-ink-faint block text-[10px]">
                        Latency P50
                      </span>
                      <span className="font-bold text-rust">
                        {item.p50_latency_ms
                          ? `${Math.round(item.p50_latency_ms)} ms`
                          : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-faint block text-[10px]">
                        Latency P95
                      </span>
                      <span className="font-bold text-ink">
                        {item.p95_latency_ms
                          ? `${Math.round(item.p95_latency_ms)} ms`
                          : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-faint block text-[10px]">
                        Avg Throughput
                      </span>
                      <span className="font-bold text-ink">
                        {item.avg_throughput
                          ? `${item.avg_throughput.toFixed(1)} t/s`
                          : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-faint block text-[10px]">
                        Success Rate
                      </span>
                      <span className="font-bold text-pine">
                        {item.success_rate
                          ? `${item.success_rate.toFixed(1)}%`
                          : '100%'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
