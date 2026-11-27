import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ragReaderURL } from '../../constant';
import services from '../../services/services';
import {
  AnalyticsOverview,
  BenchmarkDataset,
  BenchmarkExperimentItem,
} from '../../interface';
import { usePageMeta } from '../pageMeta';
import {
  IconArrowRight,
  IconBarChart,
  IconDatabase,
  IconExternal,
  IconFlask,
  IconLogo,
  IconPlay,
  IconPlus,
  IconTrophy,
} from '../components/icons';

function BenchmarkLab() {
  usePageMeta({
    title: 'Benchmark Lab · ChattyDesk',
    path: '/benchmarks',
    noindex: true,
  });

  const navigate = useNavigate();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [datasets, setDatasets] = useState<BenchmarkDataset[]>([]);
  const [experiments, setExperiments] = useState<BenchmarkExperimentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [ovData, dsData, expData] = await Promise.all([
          services.getAnalyticsOverview().catch(() => null),
          services.listDatasets().catch(() => []),
          services.listBenchmarks().catch(() => []),
        ]);

        if (cancelled) return;
        setOverview(ovData);
        setDatasets(dsData);
        setExperiments(expData);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const getStatusBadge = (status: string) => {
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
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-rust-soft text-rust border border-rust font-medium">
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
              AI Benchmark Lab
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
              to="/chat"
              className="inline-flex items-center gap-1.5 border border-hairline-strong px-2.5 py-1.5 text-xs font-mono text-ink hover:border-ink transition-colors"
            >
              <span>Chat →</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-8">
        {error && (
          <div className="p-3 bg-ember-soft text-ember text-xs border border-ember font-mono">
            {error}
          </div>
        )}

        {/* Hero Section */}
        <div className="border-2 border-ink bg-paper-raised p-6 sm:p-8 shadow-[6px_6px_0_0_#C6BEA8]">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-rust font-semibold">
              EVIDENCE-BASED AI EVALUATION
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-medium tracking-tight">
              AI Benchmark Lab
            </h1>
            <p className="mt-3 text-sm text-ink-soft leading-relaxed">
              Run repeatable, controlled evaluation experiments across hundreds
              of AI models using standardized test cases. Measure response
              accuracy, latency distributions (P50/P95), throughput
              (tokens/sec), and actual inference cost.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/benchmarks/new"
                className="inline-flex items-center gap-2 bg-rust hover:bg-rust-deep text-paper text-xs font-semibold px-4 py-2.5 transition-colors shadow-tactile-sm"
              >
                <IconPlay className="h-3.5 w-3.5" />
                <span>Start Benchmark Experiment</span>
              </Link>
              <Link
                to="/benchmarks/datasets"
                className="inline-flex items-center gap-2 border-2 border-ink bg-paper hover:bg-paper-sunken text-ink text-xs font-semibold px-4 py-2 transition-colors"
              >
                <IconDatabase className="h-3.5 w-3.5" />
                <span>Manage Datasets</span>
              </Link>
              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-2 border-2 border-ink bg-paper hover:bg-paper-sunken text-ink text-xs font-semibold px-4 py-2 transition-colors"
              >
                <IconTrophy className="h-3.5 w-3.5" />
                <span>View Leaderboards</span>
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Overview Cards */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 font-mono">
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
                Total Test Executions
              </span>
              <p className="mt-1 text-2xl font-bold text-rust">
                {overview.total_benchmark_requests.toLocaleString()}
              </p>
            </div>
            <div className="border-2 border-ink bg-paper-raised p-4">
              <span className="text-[10px] uppercase text-ink-faint">
                Success Rate
              </span>
              <p className="mt-1 text-2xl font-bold text-pine">
                {overview.avg_success_rate}%
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
          </div>
        )}

        {/* Curated Benchmark Suites Showcase */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b-2 border-ink pb-2">
            <div>
              <h2 className="font-display text-xl font-bold">
                Standard Benchmark Suites
              </h2>
              <p className="text-xs text-ink-soft">
                Curated suites with deterministic ground truths and evaluation
                criteria
              </p>
            </div>
            <Link
              to="/benchmarks/datasets"
              className="text-xs font-mono text-rust hover:text-rust-deep"
            >
              View all datasets →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {datasets.slice(0, 8).map((ds) => (
              <div
                key={ds.id}
                className="border-2 border-ink bg-paper-raised p-4 flex flex-col justify-between hover:shadow-tactile-sm transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                    <span className="uppercase text-rust font-medium">
                      {ds.category.replace('_', ' ')}
                    </span>
                    <span className="text-ink-faint">
                      {ds.latest_version?.test_case_count || 5} cases
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-ink mb-1">
                    {ds.name}
                  </h3>
                  <p className="text-xs text-ink-soft line-clamp-2">
                    {ds.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between">
                  <span className="text-[10px] font-mono text-ink-faint">
                    v{ds.latest_version?.version || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/benchmarks/new?dataset_id=${ds.id}&dataset_version_id=${ds.latest_version?.id}`,
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs font-mono font-medium text-rust hover:text-rust-deep"
                  >
                    <span>Run Suite →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Experiments Table */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b-2 border-ink pb-2">
            <div>
              <h2 className="font-display text-xl font-bold">
                Recent Benchmark Experiments
              </h2>
              <p className="text-xs text-ink-soft">
                History of executed evaluations, timing, and progress
              </p>
            </div>
            <Link
              to="/benchmarks/experiments"
              className="text-xs font-mono text-rust hover:text-rust-deep"
            >
              View all experiments →
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-ink-faint">
              Loading experiments…
            </div>
          ) : experiments.length === 0 ? (
            <div className="border-2 border-dashed border-hairline-strong p-8 text-center bg-paper-sunken">
              <IconFlask className="h-8 w-8 mx-auto text-ink-faint mb-2" />
              <p className="text-sm font-medium text-ink">
                No benchmark experiments yet
              </p>
              <p className="text-xs text-ink-soft mt-1">
                Launch your first benchmark experiment to compare AI model
                quality and latency under controlled configurations.
              </p>
              <Link
                to="/benchmarks/new"
                className="mt-4 inline-flex items-center gap-1.5 bg-ink hover:bg-rust text-paper text-xs font-semibold px-4 py-2 transition-colors"
              >
                <IconPlus className="h-3.5 w-3.5" />
                <span>Create Experiment</span>
              </Link>
            </div>
          ) : (
            <div className="border-2 border-ink bg-paper-raised overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b-2 border-ink bg-paper-sunken text-ink-faint text-[10px] uppercase tracking-wider">
                    <th className="p-3">Experiment</th>
                    <th className="p-3">Suite</th>
                    <th className="p-3">Models</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Progress</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {experiments.slice(0, 10).map((exp) => (
                    <tr
                      key={exp.id}
                      className="hover:bg-paper-sunken transition-colors"
                    >
                      <td className="p-3 font-medium text-ink">
                        <Link
                          to={`/benchmarks/experiments/${exp.id}`}
                          className="hover:text-rust transition-colors"
                        >
                          {exp.name}
                        </Link>
                      </td>
                      <td className="p-3 text-ink-soft">
                        {exp.dataset_name || 'Standard QA'}
                      </td>
                      <td className="p-3 text-ink-soft">
                        <span className="truncate max-w-[150px] inline-block">
                          {exp.models.join(', ')}
                        </span>
                      </td>
                      <td className="p-3">{getStatusBadge(exp.status)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px]">
                            {exp.completed_cases}/{exp.total_cases}
                          </span>
                          <div className="w-16 h-1.5 bg-hairline rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rust"
                              style={{
                                width: `${
                                  exp.total_cases > 0
                                    ? ((exp.completed_cases +
                                        exp.failed_cases) /
                                        exp.total_cases) *
                                      100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-ink-faint">
                        {new Date(exp.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <Link
                          to={`/benchmarks/experiments/${exp.id}`}
                          className="inline-flex items-center gap-1 border border-ink px-2 py-0.5 text-[10px] hover:bg-ink hover:text-paper transition-colors"
                        >
                          <span>Inspect →</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Evaluation Suite: Companion RAG Lab */}
        <div className="border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_0_#2B2A27]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-ink text-paper font-semibold">
                  AI Evaluation Suite
                </span>
                <span className="text-xs font-mono text-rust font-semibold">
                  Companion Product
                </span>
              </div>
              <h3 className="font-display font-semibold text-lg text-ink">
                Evaluating Document Retrieval, RAG & Domain Grounding?
              </h3>
              <p className="text-xs sm:text-sm text-ink-soft max-w-2xl leading-relaxed">
                ChattyDesk evaluates foundation model speed, reasoning, and
                token economics. For end-to-end document retrieval pipelines
                (Dense, BM25 Sparse, Hybrid + Cross-Encoder reranking) and RAG
                Triad faithfulness scoring on your actual PDF and markdown
                documents, switch to our sister workbench{' '}
                <strong>RagReader</strong>.
              </p>
            </div>
            <a
              href={ragReaderURL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-ink text-paper text-xs sm:text-sm font-semibold hover:bg-rust transition-colors shadow-xs shrink-0"
            >
              <span>Launch RagReader (RAG Lab)</span>
              <IconExternal className="h-4 w-4 text-rust" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BenchmarkLab;
