import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import services from '../../services/services';
import { BenchmarkDataset, Model } from '../../interface';
import { usePageMeta } from '../pageMeta';
import {
  IconArrowRight,
  IconCheck,
  IconFlask,
  IconLogo,
  IconPlay,
  IconSearch,
} from '../components/icons';

function BenchmarkWizard() {
  usePageMeta({
    title: 'New Benchmark · ChattyDesk',
    path: '/benchmarks/new',
    noindex: true,
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [datasets, setDatasets] = useState<BenchmarkDataset[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('Standard Model Evaluation');
  const [description, setDescription] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [selectedDatasetVersionId, setSelectedDatasetVersionId] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // Execution Settings
  const [repetitions, setRepetitions] = useState(1);
  const [concurrency, setConcurrency] = useState(3);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [systemPrompt, setSystemPrompt] = useState('');

  // Filter for model selection
  const [modelSearch, setModelSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [freeOnly, setFreeOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [dsList, catalogue] = await Promise.all([
          services.listDatasets(),
          services.listModels(),
        ]);
        if (cancelled) return;

        setDatasets(dsList);
        setModels(catalogue.models);

        // Pre-select dataset from query params or first dataset
        const qDatasetId = searchParams.get('dataset_id');
        const qVersionId = searchParams.get('dataset_version_id');

        if (qDatasetId) {
          setSelectedDatasetId(qDatasetId);
          if (qVersionId) setSelectedDatasetVersionId(qVersionId);
        } else if (dsList.length > 0) {
          setSelectedDatasetId(dsList[0].id);
          setSelectedDatasetVersionId(dsList[0].latest_version?.id || '');
        }

        // Pre-select 2-3 standard models
        const def = catalogue.default_model;
        const second =
          catalogue.models.find((m) => m.id !== def && m.is_free)?.id ||
          catalogue.models[1]?.id ||
          def;
        setSelectedModels([def, second]);
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
  }, [searchParams]);

  const selectedDataset = useMemo(() => {
    return datasets.find((d) => d.id === selectedDatasetId);
  }, [datasets, selectedDatasetId]);

  const testCaseCount =
    selectedDataset?.latest_version?.test_case_count ||
    selectedDataset?.test_cases?.length ||
    5;

  const totalExecutions = testCaseCount * selectedModels.length * repetitions;

  // Filtered models for selection
  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase();
    return models.filter((m) => {
      if (freeOnly && !m.is_free) {
        return false;
      }
      if (selectedProvider !== 'all' && m.provider !== selectedProvider) {
        return false;
      }
      if (!q) return true;
      return (
        m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
      );
    });
  }, [models, modelSearch, selectedProvider, freeOnly]);

  const providers = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => {
      if (m.provider) set.add(m.provider);
    });
    return Array.from(set).sort();
  }, [models]);

  const toggleModel = (id: string) => {
    if (selectedModels.includes(id)) {
      if (selectedModels.length <= 1) return;
      setSelectedModels(selectedModels.filter((m) => m !== id));
    } else {
      if (selectedModels.length >= 10) return;
      setSelectedModels([...selectedModels, id]);
    }
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedModels.length < 2) {
      setError('Please select at least 2 models for the benchmark.');
      return;
    }
    if (!selectedDatasetId) {
      setError('Please select a benchmark dataset.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await services.createBenchmark({
        name,
        dataset_id: selectedDatasetId,
        dataset_version_id: selectedDatasetVersionId || undefined,
        models: selectedModels,
        configuration: {
          repetitions,
          concurrency,
          temperature,
          max_tokens: maxTokens,
          system_prompt: systemPrompt || undefined,
        },
        auto_start: true,
      });

      navigate(`/benchmarks/experiments/${res.experiment_id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
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
              Create Benchmark Experiment
            </span>
          </div>

          <Link
            to="/benchmarks"
            className="inline-flex items-center gap-1.5 border border-hairline-strong px-2.5 py-1.5 text-xs font-mono text-ink hover:border-ink transition-colors"
          >
            <span>Cancel</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 select-text">
        <form onSubmit={handleLaunch} className="space-y-8">
          {error && (
            <div className="p-3 bg-ember-soft text-ember text-xs border border-ember font-mono">
              {error}
            </div>
          )}

          {/* Section 1: Experiment Details */}
          <div className="border-2 border-ink bg-paper-raised p-5 shadow-tactile-sm space-y-4">
            <h2 className="font-display text-lg font-bold border-b border-hairline pb-2 flex items-center gap-2">
              <span className="h-5 w-5 bg-ink text-paper rounded-full text-xs flex items-center justify-center font-mono">
                1
              </span>
              <span>Experiment Details</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block text-ink-faint mb-1">EXPERIMENT NAME</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Reasoning & Code Performance Comparison"
                  className="w-full border border-hairline bg-paper-sunken px-3 py-2 text-ink focus:border-rust focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-ink-faint mb-1">
                  OPTIONAL DESCRIPTION
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Assessing latency and accuracy on GSM8K logic"
                  className="w-full border border-hairline bg-paper-sunken px-3 py-2 text-ink focus:border-rust focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Benchmark Dataset */}
          <div className="border-2 border-ink bg-paper-raised p-5 shadow-tactile-sm space-y-4">
            <h2 className="font-display text-lg font-bold border-b border-hairline pb-2 flex items-center gap-2">
              <span className="h-5 w-5 bg-ink text-paper rounded-full text-xs flex items-center justify-center font-mono">
                2
              </span>
              <span>Select Evaluation Dataset</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {datasets.map((ds) => {
                const isSelected = ds.id === selectedDatasetId;
                return (
                  <button
                    key={ds.id}
                    type="button"
                    onClick={() => {
                      setSelectedDatasetId(ds.id);
                      setSelectedDatasetVersionId(
                        ds.latest_version?.id || '',
                      );
                    }}
                    className={`text-left p-3 border-2 transition-all ${
                      isSelected
                        ? 'border-rust bg-rust-soft/30'
                        : 'border-hairline bg-paper hover:border-hairline-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-ink-faint mb-1">
                      <span className="uppercase text-rust font-medium">
                        {ds.category.replace('_', ' ')}
                      </span>
                      <span>{ds.latest_version?.test_case_count || 5} cases</span>
                    </div>
                    <p className="font-semibold text-xs text-ink">{ds.name}</p>
                    <p className="text-[11px] text-ink-soft line-clamp-2 mt-1">
                      {ds.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Select Models (2–10) */}
          <div className="border-2 border-ink bg-paper-raised p-5 shadow-tactile-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-hairline pb-2 gap-2">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <span className="h-5 w-5 bg-ink text-paper rounded-full text-xs flex items-center justify-center font-mono">
                  3
                </span>
                <span>Select Models ({selectedModels.length}/10 selected)</span>
              </h2>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono border border-hairline bg-paper px-2 py-1 select-none">
                  <input
                    type="checkbox"
                    checked={freeOnly}
                    onChange={(e) => setFreeOnly(e.target.checked)}
                    className="accent-pine h-3.5 w-3.5"
                  />
                  <span className={freeOnly ? 'font-bold text-pine' : 'text-ink-soft'}>
                    Free models only
                  </span>
                </label>

                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="border border-hairline bg-paper px-2 py-1 text-xs font-mono"
                >
                  <option value="all">All Providers</option>
                  {providers.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="Search models…"
                    className="border border-hairline bg-paper px-2.5 py-1 text-xs font-mono pl-7"
                  />
                  <IconSearch className="h-3 w-3 absolute left-2 top-2 text-ink-faint" />
                </div>
              </div>
            </div>

            {/* Selected Pills */}
            <div className="flex flex-wrap gap-1.5 p-2 bg-paper-sunken border border-hairline min-h-[38px] items-center">
              {selectedModels.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-paper-raised border border-ink text-xs font-mono"
                >
                  <span>{id}</span>
                  <button
                    type="button"
                    onClick={() => toggleModel(id)}
                    className="text-rust hover:text-ember font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Models Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
              {filteredModels.slice(0, 30).map((m) => {
                const isSelected = selectedModels.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleModel(m.id)}
                    className={`text-left p-2 border transition-all text-xs flex items-center justify-between ${
                      isSelected
                        ? 'border-rust bg-rust-soft/40 font-medium'
                        : 'border-hairline bg-paper hover:border-hairline-strong'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate text-ink">{m.name}</p>
                      <p className="font-mono text-[10px] text-ink-faint truncate">
                        {m.id}
                      </p>
                    </div>
                    {isSelected && (
                      <IconCheck className="h-4 w-4 text-rust flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Execution Parameters */}
          <div className="border-2 border-ink bg-paper-raised p-5 shadow-tactile-sm space-y-4 font-mono text-xs">
            <h2 className="font-display text-lg font-bold border-b border-hairline pb-2 flex items-center gap-2 font-sans">
              <span className="h-5 w-5 bg-ink text-paper rounded-full text-xs flex items-center justify-center font-mono">
                4
              </span>
              <span>Execution & Sampling Configuration</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-ink-faint mb-1">
                  REPETITIONS: {repetitions} run{repetitions > 1 ? 's' : ''}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={repetitions}
                  onChange={(e) => setRepetitions(parseInt(e.target.value, 10))}
                  className="w-full accent-rust"
                />
                <span className="text-[10px] text-ink-faint">
                  Measures latency variance
                </span>
              </div>

              <div>
                <label className="block text-ink-faint mb-1">
                  CONCURRENCY: {concurrency} requests
                </label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={concurrency}
                  onChange={(e) => setConcurrency(parseInt(e.target.value, 10))}
                  className="w-full accent-rust"
                />
                <span className="text-[10px] text-ink-faint">
                  Bounded worker concurrency
                </span>
              </div>

              <div>
                <label className="block text-ink-faint mb-1">
                  TEMPERATURE: {temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-rust"
                />
                <span className="text-[10px] text-ink-faint">
                  Generation temperature
                </span>
              </div>

              <div>
                <label className="block text-ink-faint mb-1">
                  MAX OUTPUT TOKENS: {maxTokens}
                </label>
                <input
                  type="range"
                  min="256"
                  max="4096"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                  className="w-full accent-rust"
                />
                <span className="text-[10px] text-ink-faint">Completion ceiling</span>
              </div>
            </div>
          </div>

          {/* Section 5: Execution Budget Preview & Submit */}
          <div className="border-2 border-rust bg-rust-soft/20 p-5 flex flex-wrap items-center justify-between gap-4 font-mono">
            <div>
              <span className="text-[10px] uppercase text-rust font-semibold">
                EXECUTION BUDGET PREVIEW
              </span>
              <p className="text-lg font-bold text-ink">
                {totalExecutions} total API executions
              </p>
              <p className="text-xs text-ink-soft">
                {testCaseCount} test cases × {selectedModels.length} models ×{' '}
                {repetitions} rep{repetitions > 1 ? 's' : ''}
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || selectedModels.length < 2 || !selectedDatasetId}
              className="inline-flex items-center gap-2 bg-rust hover:bg-rust-deep disabled:bg-hairline-strong text-paper text-sm font-semibold px-6 py-3 transition-colors shadow-tactile-sm"
            >
              <IconPlay className="h-4 w-4" />
              <span>{submitting ? 'Launching Experiment…' : 'Start Experiment'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default BenchmarkWizard;
