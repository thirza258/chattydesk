import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ragReaderURL } from '../../constant';
import services from '../../services/services';
import {
  CompareResult,
  ComparisonSessionItem,
  Model,
  UserSettings,
} from '../../interface';
import { useAuth } from '../AuthContext';
import { usePageMeta } from '../pageMeta';
import UpgradeModal from '../components/UpgradeModal';
import {
  IconArrowRight,
  IconCheck,
  IconClose,
  IconDownload,
  IconExternal,
  IconEye,
  IconEyeOff,
  IconGrid,
  IconKey,
  IconList,
  IconLogo,
  IconPlus,
  IconSend,
  IconSliders,
  IconTrash,
} from '../components/icons';

const STARTER_PROMPTS = [
  'Explain quicksort in two sentences.',
  'Write a TypeScript function to debounce an async function with cancellation.',
  'What are the key architectural tradeoffs between REST, GraphQL, and gRPC?',
  'Draft a succinct summary of how Raft consensus handles leader election.',
];

const gridColsClass = (count: number): string => {
  switch (count) {
    case 2:
      return 'sm:grid-cols-2';
    case 3:
      return 'md:grid-cols-3';
    case 4:
      return 'sm:grid-cols-2 lg:grid-cols-4';
    case 5:
      return 'sm:grid-cols-2 lg:grid-cols-5';
    case 6:
      return 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
    case 7:
    case 8:
      return 'sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4';
    default:
      return 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
  }
};

function Compare() {
  usePageMeta({
    title: 'Compare AI · ChattyDesk',
    path: '/compare',
    noindex: true,
  });

  const { updateUser } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [catalogueError, setCatalogueError] = useState('');

  const [slots, setSlots] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [comparing, setComparing] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Advanced Comparison Modes (PRD Module A)
  const [mode, setMode] = useState<
    'standard' | 'repeated_sampling' | 'configuration_comparison'
  >('standard');
  const [layout, setLayout] = useState<'grid' | 'stacked'>('grid');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [temperature, setTemperature] = useState<number | undefined>(undefined);

  // User Settings & OpenRouter Key Insertion
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyRevealed, setKeyRevealed] = useState(false);
  const [keyNotice, setKeyNotice] = useState('');
  const [keyError, setKeyError] = useState('');

  // Only Available for Free Models from OpenRouter
  const [freeOnly, setFreeOnly] = useState(false);

  const [promptEcho, setPromptEcho] = useState('');
  const [results, setResults] = useState<CompareResult[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Past comparisons drawer
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [pastSessions, setPastSessions] = useState<ComparisonSessionItem[]>([]);
  const [loadingPastSessions, setLoadingPastSessions] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCatalogue = async () => {
      try {
        const catalogue = await services.listModels();
        if (cancelled) return;

        setModels(catalogue.models);
        const def = catalogue.default_model;
        const firstFree =
          catalogue.models.find((m) => m.is_free && m.id !== def)?.id ||
          catalogue.models.find((m) => m.id !== def)?.id ||
          def;

        setSlots([def, firstFree]);
        setCatalogueError('');
      } catch (error) {
        if (!cancelled) setCatalogueError((error as Error).message);
      } finally {
        if (!cancelled) setLoadingModels(false);
      }
    };

    loadCatalogue();
    services.getSettings().then((settings) => {
      if (!cancelled && settings) setUserSettings(settings);
    }).catch(() => null);

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200,
      )}px`;
    }
  }, [input]);

  const displayedModels = useMemo(() => {
    return freeOnly ? models.filter((m) => m.is_free) : models;
  }, [models, freeOnly]);

  const groupedModels = useMemo(() => {
    const byProvider = new Map<string, Model[]>();
    displayedModels.forEach((model) => {
      const provider = model.provider || 'other';
      const bucket = byProvider.get(provider);
      if (bucket) bucket.push(model);
      else byProvider.set(provider, [model]);
    });
    return [...byProvider.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [displayedModels]);

  const hasPaidModelSelected = useMemo(() => {
    return slots.some((s) => {
      const found = models.find((m) => m.id === s);
      return found ? !found.is_free : false;
    });
  }, [slots, models]);

  const handleSlotChange = (index: number, newModel: string) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = newModel;
      return next;
    });
  };

  const addSlot = () => {
    if (slots.length >= 10 || models.length === 0) return;
    const pool = freeOnly ? models.filter((m) => m.is_free) : models;
    const fallback =
      pool.find((m) => !slots.includes(m.id))?.id ||
      pool[0]?.id ||
      models.find((m) => !slots.includes(m.id))?.id ||
      models[0]?.id ||
      '';
    setSlots((prev) => [...prev, fallback]);
  };

  const toggleFreeOnly = (checked: boolean) => {
    setFreeOnly(checked);
    if (checked) {
      const freeList = models.filter((m) => m.is_free);
      if (freeList.length > 0) {
        setSlots((prev) =>
          prev.map((slotId, idx) => {
            const found = models.find((m) => m.id === slotId);
            if (found && !found.is_free) {
              return freeList[idx % freeList.length]?.id || slotId;
            }
            return slotId;
          }),
        );
      }
    }
  };

  const fillWithFreeModels = () => {
    const freeList = models.filter((m) => m.is_free);
    if (freeList.length >= 2) {
      setSlots(freeList.slice(0, Math.min(slots.length, freeList.length)).map((m) => m.id));
      setFreeOnly(true);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = keyInput.trim();
    if (!key || savingKey) return;
    setSavingKey(true);
    setKeyError('');
    setKeyNotice('');
    try {
      const updated = await services.saveSettings({ openrouterKey: key, preferOwnKey: true });
      setUserSettings(updated);
      setKeyInput('');
      setKeyNotice('Your OpenRouter API key is active! Paid model comparisons will now use your key.');
      setGlobalError('');
    } catch (err) {
      setKeyError((err as Error).message);
    } finally {
      setSavingKey(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!window.confirm('Are you sure you want to remove your saved OpenRouter API key?')) return;
    setSavingKey(true);
    setKeyError('');
    try {
      const updated = await services.saveSettings({ openrouterKey: '', preferOwnKey: false });
      setUserSettings(updated);
      setKeyNotice('Key removed. Paid model comparisons will fall back to server trial quota.');
    } catch (err) {
      setKeyError((err as Error).message);
    } finally {
      setSavingKey(false);
    }
  };

  const removeSlot = () => {
    if (slots.length <= 2) return;
    setSlots((prev) => prev.slice(0, prev.length - 1));
  };

  const runCompare = async (promptText: string) => {
    const prompt = promptText.trim();
    if (!prompt || comparing || slots.length < 2) return;

    setComparing(true);
    setGlobalError('');
    setPromptEcho(prompt);
    setResults(null);
    setSavedSuccess(false);

    try {
      const hasCustomOptions = Boolean(systemPrompt.trim() || temperature !== undefined || mode !== 'standard');
      const response = await (hasCustomOptions
        ? services.compareModels(prompt, slots, {
            systemPrompt: systemPrompt.trim() || undefined,
            temperature,
            mode,
            saveSession: true,
          })
        : services.compareModels(prompt, slots));
      setResults(response.results);
      setPromptEcho(response.prompt || prompt);
      if (response.quota) {
        updateUser(response.quota);
      }
    } catch (error) {
      const msg = (error as Error).message;
      setGlobalError(msg);
      if (msg.includes('Free limit reached') || msg.includes('Paddle') || (error as any).status === 402) {
        if (!userSettings?.has_own_key) {
          setKeyNotice('Free limit reached for paid models. Insert your OpenRouter API key to continue comparing without limits.');
          setShowKeyModal(true);
        } else {
          setShowUpgradeModal(true);
        }
      }
    } finally {
      setComparing(false);
    }
  };

  const submit = () => {
    if (!input.trim() || comparing) return;
    const prompt = input;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    runCompare(prompt);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveToHistory = async () => {
    if (!results || !promptEcho) return;
    try {
      await services.saveComparison({
        prompt: promptEcho,
        models: slots,
        results,
        mode,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      setGlobalError((error as Error).message);
    }
  };

  const exportAsJSON = () => {
    if (!results) return;
    const data = {
      prompt: promptEcho,
      mode,
      exported_at: new Date().toISOString(),
      results,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chattydesk-comparison-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    if (!results) return;
    const headers = [
      'Model',
      'Prompt',
      'Response',
      'Duration (ms)',
      'Total Tokens',
      'Error',
    ];
    const rows = results.map((r) => [
      `"${r.model.replace(/"/g, '""')}"`,
      `"${promptEcho.replace(/"/g, '""')}"`,
      `"${(r.response || '').replace(/"/g, '""')}"`,
      r.duration_ms || 0,
      r.usage?.total_tokens || 0,
      `"${(r.error || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join(
      '\n',
    );
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chattydesk-comparison-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openHistoryModal = async () => {
    setShowHistoryModal(true);
    setLoadingPastSessions(true);
    try {
      const data = await services.listComparisons();
      setPastSessions(data.results);
    } catch (err) {
      // ignore
    } finally {
      setLoadingPastSessions(false);
    }
  };

  const formatTokens = (usage?: { total_tokens?: number }): string | null => {
    if (usage?.total_tokens !== undefined && usage.total_tokens !== null) {
      return `${usage.total_tokens.toLocaleString()} tok`;
    }
    return null;
  };

  const formatDuration = (durationMs?: number): string | null => {
    if (durationMs !== undefined && durationMs !== null) {
      return `${(durationMs / 1000).toFixed(2)}s`;
    }
    return null;
  };

  return (
    <div className="min-h-dvh flex flex-col bg-paper text-ink">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b-2 border-ink bg-paper flex-shrink-0">
        <div className="flex w-full items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-sm transition-colors duration-150 hover:text-rust-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
          >
            <IconLogo className="h-6 w-6" />
            <span className="font-display text-base sm:text-lg font-semibold tracking-tight">
              ChattyDesk
            </span>
            <span className="border-l-2 border-hairline pl-2.5 font-mono text-xs uppercase tracking-wider text-rust">
              Playground · Compare
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={openHistoryModal}
              title="View past comparisons"
              className="inline-flex items-center gap-1.5 border border-hairline-strong bg-paper px-2.5 py-1.5 text-xs font-mono text-ink hover:border-ink transition-colors"
            >
              <span>Past Sessions</span>
            </button>
            <Link
              to="/benchmarks"
              className="inline-flex items-center gap-1.5 border border-hairline-strong bg-paper px-2.5 py-1.5 text-xs font-mono text-ink hover:border-rust hover:text-rust transition-colors"
            >
              <span>Benchmark Lab →</span>
            </Link>
            <a
              href={ragReaderURL}
              target="_blank"
              rel="noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 border border-hairline-strong bg-paper px-2.5 py-1.5 text-xs font-mono text-ink hover:border-rust hover:text-rust transition-colors"
              title="Open RagReader: Document QA & Retrieval-Augmented Generation Evaluation"
            >
              <span>RAG Lab</span>
              <IconExternal className="h-3 w-3 text-rust" />
            </a>
            <Link
              to="/chat"
              className="inline-flex items-center gap-1.5 border-2 border-ink px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:bg-ink hover:text-paper"
            >
              <span>Back to chat</span>
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Controls strip */}
      <div className="border-b-2 border-ink bg-paper-sunken px-4 py-3 sm:px-6 flex-shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              {slots.length} MODELS (2–10)
            </span>

            {/* Mode Selector */}
            <div className="flex items-center gap-1 border border-hairline-strong bg-paper p-0.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setMode('standard')}
                className={`px-2 py-0.5 transition-colors ${
                  mode === 'standard' ? 'bg-ink text-paper font-semibold' : 'text-ink-soft hover:text-ink'
                }`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setMode('repeated_sampling')}
                className={`px-2 py-0.5 transition-colors ${
                  mode === 'repeated_sampling'
                    ? 'bg-ink text-paper font-semibold'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                Repeated
              </button>
              <button
                type="button"
                onClick={() => setMode('configuration_comparison')}
                className={`px-2 py-0.5 transition-colors ${
                  mode === 'configuration_comparison'
                    ? 'bg-ink text-paper font-semibold'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                Config
              </button>
            </div>

            {/* Layout Switcher */}
            <div className="flex items-center gap-1 border border-hairline-strong bg-paper p-0.5">
              <button
                type="button"
                onClick={() => setLayout('grid')}
                title="Grid side-by-side view"
                className={`p-1 ${layout === 'grid' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}
              >
                <IconGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLayout('stacked')}
                title="Stacked vertical cards view"
                className={`p-1 ${layout === 'stacked' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}
              >
                <IconList className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="inline-flex items-center gap-1 text-xs font-mono text-ink-soft hover:text-ink"
            >
              <IconSliders className="h-3 w-3" />
              <span>{showConfig ? 'Hide Settings' : 'Prompt / Temp'}</span>
            </button>

            {/* Free Models Only Filter Toggle */}
            <div className="flex items-center gap-2 border border-hairline-strong bg-paper px-2 py-1 text-xs font-mono">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={freeOnly}
                  onChange={(e) => toggleFreeOnly(e.target.checked)}
                  className="accent-pine h-3.5 w-3.5"
                />
                <span className={freeOnly ? 'font-bold text-pine' : 'text-ink-soft'}>
                  Free models only
                </span>
              </label>
              <button
                type="button"
                onClick={fillWithFreeModels}
                className="text-[10px] text-rust hover:underline font-semibold"
                title="Populate all comparison slots with free OpenRouter models"
              >
                (Fill slots)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* OpenRouter Key insertion status button */}
            <button
              type="button"
              onClick={() => {
                setShowKeyModal(true);
                setKeyError('');
                setKeyNotice('');
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono transition-colors border ${
                userSettings?.has_own_key
                  ? 'border-pine bg-pine-soft text-pine hover:bg-pine/20'
                  : hasPaidModelSelected
                  ? 'border-rust bg-rust-soft text-rust font-bold animate-pulse'
                  : 'border-hairline-strong bg-paper text-ink hover:border-ink'
              }`}
              title={
                userSettings?.has_own_key
                  ? `Your OpenRouter key is active (…${userSettings.key_hint})`
                  : 'Insert your personal OpenRouter API key for comparing paid models without limits'
              }
            >
              <IconKey className="h-3 w-3" />
              <span>
                {userSettings?.has_own_key
                  ? `Key: …${userSettings.key_hint}`
                  : '+ OpenRouter Key'}
              </span>
            </button>

            {results && (
              <>
                <button
                  type="button"
                  onClick={handleSaveToHistory}
                  disabled={savedSuccess}
                  className="inline-flex items-center gap-1 border border-hairline-strong bg-paper px-2.5 py-1 text-xs font-mono text-ink hover:border-rust hover:text-rust transition-colors"
                >
                  <IconCheck className="h-3 w-3" />
                  <span>{savedSuccess ? 'Saved ✓' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={exportAsJSON}
                  title="Export comparison as JSON"
                  className="inline-flex items-center gap-1 border border-hairline-strong bg-paper px-2 py-1 text-xs font-mono text-ink hover:border-ink transition-colors"
                >
                  <IconDownload className="h-3 w-3" />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  onClick={exportAsCSV}
                  title="Export comparison as CSV"
                  className="inline-flex items-center gap-1 border border-hairline-strong bg-paper px-2 py-1 text-xs font-mono text-ink hover:border-ink transition-colors"
                >
                  <IconDownload className="h-3 w-3" />
                  <span>CSV</span>
                </button>
              </>
            )}

            {slots.length < 10 && (
              <button
                type="button"
                onClick={addSlot}
                aria-label="+ add slot"
                className="inline-flex items-center gap-1 border border-ink bg-paper-raised hover:bg-paper-sunken px-2.5 py-1 text-xs font-mono text-ink transition-colors"
              >
                <IconPlus className="h-3 w-3" />
                <span>+ add slot</span>
              </button>
            )}

            {slots.length > 2 && (
              <button
                type="button"
                onClick={removeSlot}
                aria-label="− remove slot"
                className="inline-flex items-center gap-1 border border-ink bg-paper-raised hover:bg-paper-sunken px-2.5 py-1 text-xs font-mono text-ink transition-colors"
              >
                <span>− remove</span>
              </button>
            )}
          </div>
        </div>

        {/* Optional Config Accordion */}
        {showConfig && (
          <div className="mt-3 p-3 bg-paper border border-hairline grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <label className="block text-ink-faint mb-1">SYSTEM PROMPT</label>
              <input
                type="text"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Optional system instruction override for all models…"
                className="w-full border border-hairline bg-paper-sunken px-2 py-1 text-ink focus:border-rust focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-ink-faint mb-1">
                TEMPERATURE: {temperature !== undefined ? temperature : 'Default'}
              </label>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.1"
                value={temperature !== undefined ? temperature : 0.7}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-rust"
              />
            </div>
          </div>
        )}

        {catalogueError && (
          <div className="mt-2 text-xs text-ember bg-ember-soft border border-ember p-2 font-mono">
            Could not load models: {catalogueError}
          </div>
        )}

        {/* Slot Selectors */}
        <div
          className={`mt-3 grid grid-cols-1 ${gridColsClass(slots.length)} gap-2.5`}
        >
          {slots.map((slotModel, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="flex flex-col gap-1 border border-hairline-strong bg-paper-raised p-2"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-ink-faint">
                <span>SLOT 0{index + 1}</span>
                {slotModel && (
                  <div>
                    {models.find((m) => m.id === slotModel)?.is_free ? (
                      <span className="px-1.5 py-0.5 text-[9px] bg-pine-soft text-pine border border-pine font-bold uppercase">
                        FREE
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 text-[9px] bg-amber-50 text-amber-700 border border-amber-300 font-bold uppercase">
                        PAID
                      </span>
                    )}
                  </div>
                )}
              </div>
              <select
                value={slotModel}
                onChange={(e) => handleSlotChange(index, e.target.value)}
                disabled={loadingModels || comparing}
                aria-label={`Slot ${index + 1} model`}
                className="w-full border border-hairline bg-paper px-2 py-1 text-xs font-mono text-ink truncate focus:border-rust focus:outline-none disabled:opacity-50"
              >
                {loadingModels ? (
                  <option value="">Loading catalogue…</option>
                ) : (
                  groupedModels.map(([provider, list]) => (
                    <optgroup key={provider} label={provider}>
                      {list.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.is_free ? `[FREE] ${m.name}` : m.name}
                        </option>
                      ))}
                    </optgroup>
                  ))
                )}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 select-text">
        {/* Global Error Banner */}
        {globalError && (
          <div
            role="alert"
            className="mb-6 px-4 py-3 bg-ember-soft text-ember text-xs border border-ember flex items-center justify-between font-mono"
          >
            <span>{globalError}</span>
            {(globalError.includes('Free limit') ||
              globalError.includes('Upgrade') ||
              globalError.includes('Paddle')) && (
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="flex-shrink-0 bg-ember text-paper hover:bg-ink px-3 py-1 text-xs font-semibold font-sans transition-colors ml-3"
              >
                Upgrade $0.99
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!comparing && !results && (
          <div className="max-w-3xl mx-auto py-12 px-4 text-center my-auto">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
              compare — multi-model AI playground
            </p>
            <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Ask once. Read five answers.
            </h1>
            <p className="mt-2 text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
              Benchmark models simultaneously. Inspect response quality, speed,
              latency distributions, and inference cost with a single click.
            </p>

            <div className="mt-8 border-t-2 border-ink text-left max-w-2xl mx-auto">
              {STARTER_PROMPTS.map((prompt, index) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInput(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="group flex w-full items-baseline gap-4 border-b border-hairline px-1 py-3 text-left transition-colors duration-150 hover:bg-rust-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
                >
                  <span className="font-mono text-xs font-semibold text-rust">
                    0{index + 1}
                  </span>
                  <span className="flex-1 text-sm leading-relaxed text-ink-soft transition-colors group-hover:text-ink">
                    {prompt}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
                    use →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* In-Flight Comparing State */}
        {comparing && (
          <div className="flex-1 flex flex-col">
            <div className="mb-4 bg-paper-sunken border border-hairline p-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint block">
                Prompt
              </span>
              <p className="mt-1 text-sm font-medium text-ink">{promptEcho}</p>
            </div>

            <div
              className={`grid ${
                layout === 'stacked' ? 'grid-cols-1' : gridColsClass(slots.length)
              } divide-y sm:divide-y-0 sm:divide-x divide-hairline border-2 border-ink bg-paper-raised flex-1`}
            >
              {slots.map((modelId, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={index} className="min-w-0 p-4 sm:p-5 flex flex-col">
                  <div className="border-b border-hairline pb-2 mb-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint truncate">
                      {modelId}
                    </p>
                  </div>
                  <div className="flex-1 flex items-center justify-start py-8">
                    <div className="flex items-center gap-2.5 border-l-2 border-hairline-strong pl-4 text-xs">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-ink/20 border-t-rust animate-spin flex-shrink-0" />
                      <span className="min-w-0 break-words font-mono text-ink-soft">
                        Waiting for{' '}
                        <span className="font-medium text-rust-deep">
                          {modelId}
                        </span>
                        …
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!comparing && results && (
          <div ref={resultsRef} className="flex-1 flex flex-col">
            <div className="mb-4 bg-paper-sunken border border-hairline p-3 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint block">
                  Prompt
                </span>
                <p className="mt-1 text-sm font-medium text-ink">{promptEcho}</p>
              </div>
              <span className="font-mono text-xs text-rust font-semibold">
                {results.filter((r) => !r.error).length}/{results.length} answered
              </span>
            </div>

            <div
              className={`grid ${
                layout === 'stacked' ? 'grid-cols-1' : gridColsClass(results.length)
              } divide-y sm:divide-y-0 sm:divide-x divide-hairline border-2 border-ink bg-paper-raised flex-1`}
            >
              {results.map((res, index) => {
                const footerTokens = formatTokens(res.usage);
                const footerDuration = formatDuration(res.duration_ms);

                return (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    className="min-w-0 p-4 sm:p-5 flex flex-col justify-between [overflow-wrap:anywhere]"
                  >
                    <div>
                      <div className="border-b border-hairline pb-2 mb-4 flex items-center justify-between">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint truncate">
                          {res.model}
                        </p>
                        <span className="font-mono text-[10px] text-ink-faint">
                          SLOT 0{index + 1}
                        </span>
                      </div>

                      {res.error ? (
                        <div className="border-l-2 border-ember pl-4 bg-ember-soft p-3">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ember">
                            {res.error}
                          </p>
                        </div>
                      ) : (
                        <div className="border-l-2 border-rust pl-4">
                          <div className="chat-markdown text-sm leading-relaxed">
                            <ReactMarkdown>{res.response || ''}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>

                    {!res.error && (
                      <div className="mt-6 pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-ink-faint">
                        <div className="flex items-center gap-2">
                          {footerTokens && <span>{footerTokens}</span>}
                          {footerTokens && footerDuration && <span>·</span>}
                          {footerDuration && <span>{footerDuration}</span>}
                          {res.used_own_key && (
                            <>
                              <span>·</span>
                              <span className="text-pine font-medium">
                                your key
                              </span>
                            </>
                          )}
                        </div>

                        {res.response && (
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(res.response || '', index)
                            }
                            title="Copy response"
                            className="uppercase tracking-wider transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
                          >
                            {copiedIndex === index ? 'copied ✓' : 'copy'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Query Input Bar */}
      <div className="flex-shrink-0 p-3 sm:p-4 bg-paper border-t-2 border-ink">
        <div className="max-w-4xl mx-auto">
          {hasPaidModelSelected && !userSettings?.has_own_key && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 bg-amber-50 border border-amber-300 text-xs font-mono text-amber-900 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 bg-amber-200 border border-amber-400">
                  Paid Models Selected
                </span>
                <span>Comparing paid models requires an OpenRouter API key (or free trial quota).</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowKeyModal(true);
                  setKeyError('');
                  setKeyNotice('');
                }}
                className="bg-ink hover:bg-rust text-paper px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors"
              >
                Insert Your OpenRouter Key →
              </button>
            </div>
          )}

          <div className="relative border-2 border-ink bg-paper-raised shadow-[4px_4px_0_0_#C6BEA8] transition-colors duration-150 focus-within:border-rust p-2.5">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              disabled={comparing || loadingModels || slots.length < 2}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                comparing
                  ? 'Waiting for responses…'
                  : 'Type your message to compare models…'
              }
              aria-label="Compare input"
              className="w-full resize-none bg-transparent px-2.5 py-1 text-sm text-ink placeholder:text-ink-faint focus:outline-none disabled:opacity-50 min-h-[38px] max-h-[200px]"
            />

            <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-ink-faint">
              <div className="flex items-center gap-2 font-mono">
                <span className="hidden sm:inline">
                  <kbd className="px-1.5 py-0.5 rounded-sm bg-paper-sunken border border-hairline-strong text-[10px]">
                    Enter
                  </kbd>{' '}
                  send
                </span>
                <span className="hidden sm:inline text-hairline-strong">·</span>
                <span className="hidden sm:inline">
                  <kbd className="px-1.5 py-0.5 rounded-sm bg-paper-sunken border border-hairline-strong text-[10px]">
                    Shift+Enter
                  </kbd>{' '}
                  newline
                </span>
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={
                  comparing ||
                  !input.trim() ||
                  loadingModels ||
                  slots.length < 2
                }
                className="inline-flex items-center gap-1.5 bg-ink hover:bg-rust disabled:bg-hairline-strong disabled:text-ink-faint text-paper text-xs font-semibold px-4 py-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
              >
                <span>{comparing ? 'Comparing…' : 'Compare'}</span>
                <IconSend className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Past Comparisons Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-2xl bg-paper border-2 border-ink shadow-[8px_8px_0_0_#C6BEA8] p-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
              <h3 className="font-display text-lg font-bold">
                Comparison History
              </h3>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-xs font-mono text-ink-soft hover:text-ink"
              >
                [close]
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {loadingPastSessions ? (
                <div className="py-8 text-center text-xs font-mono text-ink-faint">
                  Loading history…
                </div>
              ) : pastSessions.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-ink-faint">
                  No previous comparison sessions found. Run a comparison to
                  save one!
                </div>
              ) : (
                pastSessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-hairline p-3 hover:border-rust transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-ink truncate">
                        {session.prompt}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-ink-faint">
                        <span>{session.models.length} models</span>
                        <span>·</span>
                        <span>{new Date(session.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSlots(session.models);
                        setInput(session.prompt);
                        setShowHistoryModal(false);
                      }}
                      className="ml-3 border border-ink bg-paper px-2.5 py-1 text-xs font-mono hover:bg-ink hover:text-paper"
                    >
                      Load
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Insert OpenRouter Key Modal */}
      {showKeyModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70 backdrop-blur-xs animate-fadeIn"
        >
          <div className="relative w-full max-w-md border-2 border-ink bg-paper p-6 shadow-[8px_8px_0_0_#1E293B] text-ink select-none font-mono">
            <div className="flex items-start justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center border border-ink bg-rust text-paper">
                  <IconKey className="h-4 w-4" />
                </span>
                <h2 className="font-display text-lg font-bold text-ink">
                  OpenRouter API Key
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowKeyModal(false);
                  setKeyError('');
                  setKeyNotice('');
                }}
                aria-label="Close modal"
                className="text-ink-faint hover:text-ink font-mono text-sm px-1.5 py-0.5 border border-transparent hover:border-hairline-strong transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs text-ink-soft leading-relaxed font-sans">
              Insert your personal OpenRouter key to compare paid models directly without limits.
              Stored keys are encrypted securely on the server with Fernet cryptography.
            </p>

            {userSettings?.has_own_key && (
              <div className="mt-3 p-2.5 bg-pine-soft border border-pine text-pine text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconCheck className="h-4 w-4 flex-shrink-0" />
                  <span>Key Active: <strong>…{userSettings.key_hint}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  disabled={savingKey}
                  className="text-[10px] text-ember hover:underline font-bold"
                >
                  Remove Key
                </button>
              </div>
            )}

            {keyNotice && (
              <div className="mt-3 p-2.5 bg-pine-soft border border-pine text-pine text-xs">
                {keyNotice}
              </div>
            )}

            {keyError && (
              <div className="mt-3 p-2.5 bg-ember-soft border border-ember text-ember text-xs">
                {keyError}
              </div>
            )}

            <form onSubmit={handleSaveKey} className="mt-4 space-y-3">
              <div>
                <label className="block text-[10px] text-ink-faint uppercase font-semibold mb-1">
                  {userSettings?.has_own_key ? 'Replace Key' : 'API Key (sk-or-v1-…)'}
                </label>
                <div className="relative">
                  <input
                    type={keyRevealed ? 'text' : 'password'}
                    required
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="sk-or-v1-…"
                    className="w-full border-2 border-ink bg-paper p-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-rust font-mono pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setKeyRevealed(!keyRevealed)}
                    className="absolute right-2 top-2.5 text-ink-faint hover:text-ink"
                    title={keyRevealed ? 'Hide' : 'Show'}
                  >
                    {keyRevealed ? <IconEyeOff className="h-3.5 w-3.5" /> : <IconEye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-rust hover:underline"
                >
                  Get key on OpenRouter →
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-3 py-1.5 border border-hairline-strong text-xs text-ink hover:bg-paper-sunken"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={savingKey || !keyInput.trim()}
                    className="bg-rust hover:bg-rust-deep text-paper px-4 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {savingKey ? 'Verifying…' : 'Save & Activate'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => {
          setGlobalError('');
        }}
      />
    </div>
  );
}

export default Compare;
