import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ragReaderURL } from '../../constant';
import services from '../../services/services';
import { LeaderboardEntry } from '../../interface';
import { usePageMeta } from '../pageMeta';
import {
  IconArrowRight,
  IconBarChart,
  IconCheck,
  IconCompare,
  IconExternal,
  IconFlask,
  IconLogo,
  IconPlay,
  IconSliders,
  IconTrophy,
} from '../components/icons';

const CATEGORIES = [
  { id: 'overall', label: 'Overall Benchmark' },
  { id: 'coding', label: 'Code Generation' },
  { id: 'reasoning', label: 'Reasoning & Logic' },
  { id: 'math', label: 'Mathematics' },
  { id: 'speed', label: 'Low Latency & Speed' },
  { id: 'cost', label: 'Cost Efficiency' },
  { id: 'reliability', label: 'Reliability & Uptime' },
];

const PRESETS = [
  { name: 'Balanced', q: 0.4, s: 0.25, c: 0.2, r: 0.15 },
  { name: 'Quality First', q: 0.7, s: 0.1, c: 0.1, r: 0.1 },
  { name: 'Speed First', q: 0.1, s: 0.7, c: 0.1, r: 0.1 },
  { name: 'Cost Sensitive', q: 0.2, s: 0.1, c: 0.6, r: 0.1 },
];

export default function Leaderboard() {
  usePageMeta({
    title: 'Model Leaderboards & Intelligence · ChattyDesk',
    path: '/leaderboard',
    noindex: true,
  });

  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('overall');
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interactive Composite Weights
  const [wQuality, setWQuality] = useState(0.4);
  const [wSpeed, setWSpeed] = useState(0.25);
  const [wCost, setWCost] = useState(0.2);
  const [wReliability, setWReliability] = useState(0.15);

  // Recommendation Advisor State
  const [advisorCategory, setAdvisorCategory] = useState('coding');
  const [advisorLatency, setAdvisorLatency] = useState<number | undefined>(undefined);
  const [advisorCost, setAdvisorCost] = useState<number | undefined>(undefined);
  const [advisorFreeOnly, setAdvisorFreeOnly] = useState(false);
  const [recommendations, setRecommendations] = useState<LeaderboardEntry[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await services.getLeaderboard(selectedCategory, {
        quality: wQuality,
        speed: wSpeed,
        cost: wCost,
        reliability: wReliability,
      });
      setRankings(data.rankings || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedCategory, wQuality, wSpeed, wCost, wReliability]);

  const fetchRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const data = await services.getRecommendations({
        category: advisorCategory,
        max_latency_ms: advisorLatency,
        max_cost_per_1m: advisorCost,
        free_only: advisorFreeOnly,
      });
      setRecommendations(data.recommendations || []);
    } catch {
      setRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [advisorCategory, advisorLatency, advisorCost, advisorFreeOnly]);

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setWQuality(preset.q);
    setWSpeed(preset.s);
    setWCost(preset.c);
    setWReliability(preset.r);
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
              Model Leaderboards
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/benchmarks/new"
              className="inline-flex items-center gap-1.5 bg-rust hover:bg-rust-deep text-paper text-xs font-semibold px-3 py-1.5 transition-colors"
            >
              <IconPlay className="h-3.5 w-3.5" />
              <span>Run Benchmark</span>
            </Link>
            <Link
              to="/compare"
              className="inline-flex items-center gap-1.5 border border-hairline-strong px-2.5 py-1.5 text-xs font-mono text-ink hover:border-ink transition-colors"
            >
              <IconCompare className="h-3 w-3" />
              <span>Compare</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8">
        {/* Title Header */}
        <div className="border-b-2 border-ink pb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rust font-bold">
            EMPIRICAL MODEL EVALUATION RANKINGS
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium tracking-tight">
            AI Performance Leaderboard
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-ink-soft max-w-3xl leading-relaxed">
            Composite rankings derived from empirical benchmark runs. Customize your evaluation priorities
            with dynamic weights for quality, generation speed, inference cost, and reliability.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 font-mono text-xs border-b border-hairline">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 whitespace-nowrap transition-colors border ${
                selectedCategory === cat.id
                  ? 'border-ink bg-ink text-paper font-bold'
                  : 'border-hairline bg-paper text-ink hover:border-hairline-strong'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Interactive Composite Scoring Weights */}
        <div className="border-2 border-ink bg-paper-raised p-5 font-mono text-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-3">
            <div>
              <div className="flex items-center gap-2">
                <IconSliders className="h-4 w-4 text-rust" />
                <h3 className="font-display text-base font-bold text-ink">
                  Composite Scoring Formula: S = w_q Q + w_s S_p + w_c C_e + w_r R
                </h3>
              </div>
              <p className="text-[11px] text-ink-soft mt-0.5">
                Adjust sliders to dynamically re-rank models based on your application&apos;s specific latency, quality, and cost constraints.
              </p>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase text-ink-faint mr-1">Presets:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2 py-0.5 border border-hairline text-[10px] bg-paper hover:bg-paper-sunken font-medium"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-ink font-semibold">Quality (w_q)</span>
                <span className="font-bold text-pine">{Math.round(wQuality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={wQuality}
                onChange={(e) => setWQuality(parseFloat(e.target.value))}
                className="w-full accent-pine"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-ink font-semibold">Speed (w_s)</span>
                <span className="font-bold text-rust">{Math.round(wSpeed * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={wSpeed}
                onChange={(e) => setWSpeed(parseFloat(e.target.value))}
                className="w-full accent-rust"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-ink font-semibold">Cost Efficiency (w_c)</span>
                <span className="font-bold text-ink">{Math.round(wCost * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={wCost}
                onChange={(e) => setWCost(parseFloat(e.target.value))}
                className="w-full accent-ink"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-ink font-semibold">Reliability (w_r)</span>
                <span className="font-bold text-amber-600">{Math.round(wReliability * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={wReliability}
                onChange={(e) => setWReliability(parseFloat(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-ember-soft text-ember text-xs border border-ember font-mono">
            {error}
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="border-2 border-ink bg-paper-raised overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead className="bg-paper-sunken border-b-2 border-ink uppercase text-[10px] text-ink-soft">
              <tr>
                <th className="p-3 border-r border-hairline w-14 text-center">Rank</th>
                <th className="p-3 border-r border-hairline">Model & Provider</th>
                <th className="p-3 border-r border-hairline">Composite Score</th>
                <th className="p-3 border-r border-hairline">Quality Score</th>
                <th className="p-3 border-r border-hairline">Speed Score</th>
                <th className="p-3 border-r border-hairline">Cost / 1M Tokens</th>
                <th className="p-3 border-r border-hairline">Reliability</th>
                <th className="p-3 border-r border-hairline">Samples</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-ink-faint">
                    Computing leaderboard rankings…
                  </td>
                </tr>
              ) : rankings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-ink-faint">
                    No leaderboard data available for this category yet. Run experiments to populate.
                  </td>
                </tr>
              ) : (
                rankings.map((r, idx) => {
                  const isTop3 = idx < 3;
                  const rankColor =
                    idx === 0
                      ? 'text-amber-600 font-black'
                      : idx === 1
                      ? 'text-slate-600 font-bold'
                      : idx === 2
                      ? 'text-amber-800 font-bold'
                      : 'text-ink';

                  return (
                    <tr key={r.model_identifier} className="hover:bg-paper-sunken transition-colors">
                      <td className={`p-3 text-center border-r border-hairline text-sm ${rankColor}`}>
                        #{idx + 1}
                      </td>
                      <td className="p-3 font-bold text-ink border-r border-hairline">
                        <div className="flex items-center gap-2">
                          <span>{r.model_identifier}</span>
                          <span className="px-1.5 py-0.2 text-[9px] bg-paper border border-hairline text-ink-soft uppercase">
                            {r.provider}
                          </span>
                          {idx === 0 && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-pine-soft text-pine border border-pine font-bold uppercase">
                              Champion
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 border-r border-hairline">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-ink w-10">
                            {r.composite_score?.toFixed(1) || '0.0'}
                          </span>
                          <div className="w-20 h-2 bg-hairline rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rust"
                              style={{ width: `${Math.min(r.composite_score || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 border-r border-hairline font-bold text-pine">
                        {r.quality_score?.toFixed(1) || '0.0'}%
                      </td>
                      <td className="p-3 border-r border-hairline text-rust font-semibold">
                        {r.speed_score?.toFixed(1) || '0.0'}
                      </td>
                      <td className="p-3 border-r border-hairline text-ink">
                        ${(r.cost_per_1m || 0).toFixed(2)}
                      </td>
                      <td className="p-3 border-r border-hairline font-semibold text-pine">
                        {r.reliability_score?.toFixed(1) || '100.0'}%
                      </td>
                      <td className="p-3 border-r border-hairline text-ink-soft">
                        {r.sample_count || 1}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/compare?m1=${encodeURIComponent(r.model_identifier)}`)}
                            className="text-ink-soft hover:text-ink text-[11px]"
                            title="Compare in Playground"
                          >
                            Playground
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/benchmarks/new?model=${encodeURIComponent(r.model_identifier)}`)}
                            className="bg-ink hover:bg-rust text-paper px-2 py-0.5 text-[11px] font-semibold transition-colors"
                          >
                            Benchmark
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Model Recommendation Advisor Section */}
        <div className="border-2 border-ink bg-paper-raised p-6 shadow-tactile-sm">
          <div className="border-b border-hairline pb-4 mb-5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-rust font-bold">
              AI MODEL ADVISOR
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold">
              Find the Best Model for Your Workload
            </h2>
            <p className="mt-1 text-xs text-ink-soft font-mono">
              Filter by specific task requirements, latency tolerances, and budget limits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs mb-6">
            <div>
              <label className="block text-ink-soft mb-1 font-semibold">Task Category</label>
              <select
                value={advisorCategory}
                onChange={(e) => setAdvisorCategory(e.target.value)}
                className="w-full border-2 border-ink bg-paper p-2 text-ink focus:outline-none focus:border-rust"
              >
                <option value="coding">Code Generation</option>
                <option value="reasoning">Reasoning & Logic</option>
                <option value="math">Mathematics</option>
                <option value="general_qa">General QA</option>
                <option value="speed">Speed / Low Latency</option>
                <option value="cost">Cost Efficiency</option>
              </select>
            </div>

            <div>
              <label className="block text-ink-soft mb-1 font-semibold">Max Latency Budget</label>
              <select
                value={advisorLatency === undefined ? 'any' : String(advisorLatency)}
                onChange={(e) =>
                  setAdvisorLatency(e.target.value === 'any' ? undefined : Number(e.target.value))
                }
                className="w-full border-2 border-ink bg-paper p-2 text-ink focus:outline-none focus:border-rust"
              >
                <option value="any">Any Latency</option>
                <option value="1000">&lt; 1,000 ms (Ultra Fast)</option>
                <option value="2500">&lt; 2,500 ms (Fast)</option>
                <option value="5000">&lt; 5,000 ms (Standard)</option>
              </select>
            </div>

            <div>
              <label className="block text-ink-soft mb-1 font-semibold">Max Cost / 1M Tokens</label>
              <select
                value={advisorCost === undefined ? 'any' : String(advisorCost)}
                onChange={(e) =>
                  setAdvisorCost(e.target.value === 'any' ? undefined : Number(e.target.value))
                }
                className="w-full border-2 border-ink bg-paper p-2 text-ink focus:outline-none focus:border-rust"
              >
                <option value="any">Any Price</option>
                <option value="1">&lt; $1.00 / 1M (Budget)</option>
                <option value="5">&lt; $5.00 / 1M (Mid-Tier)</option>
                <option value="20">&lt; $20.00 / 1M (High-End)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 border-2 border-ink bg-paper p-2 cursor-pointer h-[38px]">
                <input
                  type="checkbox"
                  checked={advisorFreeOnly}
                  onChange={(e) => setAdvisorFreeOnly(e.target.checked)}
                  className="accent-rust"
                />
                <span className="font-semibold text-ink">Free Models Only</span>
              </label>
            </div>
          </div>

          {/* Recommendations Result Cards */}
          {loadingRecommendations ? (
            <div className="py-8 text-center text-xs font-mono text-ink-faint">
              Evaluating candidate models…
            </div>
          ) : recommendations.length === 0 ? (
            <div className="border border-dashed border-hairline p-6 text-center text-xs font-mono text-ink-soft bg-paper-sunken">
              No matching models meet these criteria. Try relaxing your latency or budget budget.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <div
                  key={rec.model_identifier}
                  className="border-2 border-ink bg-paper p-4 flex flex-col justify-between font-mono text-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-bold text-rust">
                        {idx === 0 ? 'Top Recommendation' : `Option #${idx + 1}`}
                      </span>
                      <span className="font-bold text-pine">
                        {rec.quality_score?.toFixed(1)}% score
                      </span>
                    </div>

                    <h4 className="font-display text-base font-bold text-ink mb-1">
                      {rec.model_identifier}
                    </h4>

                    <p className="text-ink-soft text-[11px] mb-3">
                      {rec.recommendation_reason ||
                        `Optimal tradeoff for ${advisorCategory.replace('_', ' ')} workloads.`}
                    </p>

                    <div className="space-y-1 text-[11px] border-t border-hairline pt-2 text-ink-soft">
                      <div className="flex justify-between">
                        <span>Cost / 1M tokens:</span>
                        <span className="font-bold text-ink">${(rec.cost_per_1m || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Speed rating:</span>
                        <span className="font-bold text-rust">{rec.speed_score?.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => navigate(`/compare?m1=${encodeURIComponent(rec.model_identifier)}`)}
                      className="text-xs font-semibold text-ink hover:text-rust"
                    >
                      Compare →
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/benchmarks/new?model=${encodeURIComponent(rec.model_identifier)}`)}
                      className="bg-rust hover:bg-rust-deep text-paper px-2.5 py-1 text-xs font-semibold transition-colors"
                    >
                      Run Test
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Evaluation Suite Companion Card */}
        <div className="border-2 border-ink bg-paper p-5 shadow-[4px_4px_0_0_#2B2A27]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase font-semibold text-pine bg-pine-soft border border-pine px-1.5 py-0.5">
                  AI Evaluation Suite
                </span>
                <h4 className="font-display font-semibold text-base text-ink">
                  Next Step: Evaluating Models in Retrieval Pipelines (RAG)
                </h4>
              </div>
              <p className="text-xs text-ink-soft max-w-2xl leading-relaxed">
                Leaderboards reveal raw model intelligence and speed. Once you've selected high-performing models, evaluate their context faithfulness, citation adherence, and consensus voting on real documents in our companion workbench <strong>RagReader</strong>.
              </p>
            </div>
            <a
              href={ragReaderURL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ink text-paper text-xs font-semibold hover:bg-rust transition-colors shadow-xs shrink-0"
            >
              <span>Test in RagReader</span>
              <IconExternal className="h-3.5 w-3.5 text-rust" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
