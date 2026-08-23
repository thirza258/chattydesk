import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import services from '../../services/services';
import { CompareResult, Model } from '../../interface';
import { usePageMeta } from '../pageMeta';
import {
  IconArrowRight,
  IconLogo,
  IconPlus,
  IconSend,
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
    default:
      return 'sm:grid-cols-2';
  }
};

function Compare() {
  usePageMeta({
    title: 'Compare · ChattyDesk',
    path: '/compare',
    noindex: true,
  });

  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [catalogueError, setCatalogueError] = useState('');

  const [slots, setSlots] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [comparing, setComparing] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const [promptEcho, setPromptEcho] = useState('');
  const [results, setResults] = useState<CompareResult[] | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  const groupedModels = useMemo(() => {
    const byProvider = new Map<string, Model[]>();
    models.forEach((model) => {
      const provider = model.provider || 'other';
      const bucket = byProvider.get(provider);
      if (bucket) bucket.push(model);
      else byProvider.set(provider, [model]);
    });
    return [...byProvider.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [models]);

  const handleSlotChange = (index: number, newModel: string) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = newModel;
      return next;
    });
  };

  const addSlot = () => {
    if (slots.length >= 5 || models.length === 0) return;
    const fallback =
      models.find((m) => !slots.includes(m.id))?.id || models[0]?.id || '';
    setSlots((prev) => [...prev, fallback]);
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

    try {
      const response = await services.compareModels(prompt, slots);
      setResults(response.results);
      setPromptEcho(response.prompt || prompt);
    } catch (error) {
      setGlobalError((error as Error).message);
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
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/chat"
              className="inline-flex items-center gap-1.5 border-2 border-ink px-3 py-1.5 text-xs font-medium text-ink transition-colors duration-150 hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
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
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
              01–0{slots.length} — pick the panel
            </span>
          </div>

          <div className="flex items-center gap-2">
            {slots.length < 5 && (
              <button
                type="button"
                onClick={addSlot}
                aria-label="+ add slot"
                className="inline-flex items-center gap-1 border border-ink bg-paper-raised hover:bg-paper-sunken px-2.5 py-1 text-xs font-mono text-ink transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
              >
                <IconPlus className="h-3 w-3" />
                <span>+ add</span>
              </button>
            )}

            {slots.length > 2 && (
              <button
                type="button"
                onClick={removeSlot}
                aria-label="− remove slot"
                className="inline-flex items-center gap-1 border border-ink bg-paper-raised hover:bg-paper-sunken px-2.5 py-1 text-xs font-mono text-ink transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
              >
                <span>− remove</span>
              </button>
            )}
          </div>
        </div>

        {catalogueError && (
          <div className="mt-2 text-xs text-ember bg-ember-soft border border-ember p-2 font-mono">
            Could not load models: {catalogueError}
          </div>
        )}

        {/* Slot Selectors */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {slots.map((slotModel, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="flex flex-col gap-1 border border-hairline-strong bg-paper-raised p-2"
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-ink-faint">
                <span>SLOT 0{index + 1}</span>
                {slotModel && (
                  <span className="truncate max-w-[110px] text-rust-deep font-medium">
                    {models.find((m) => m.id === slotModel)?.is_free
                      ? 'free'
                      : ''}
                  </span>
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
                          {m.name}
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
            className="mb-6 px-4 py-3 bg-ember-soft text-ember text-xs border border-ember flex items-center justify-between"
          >
            <span>{globalError}</span>
          </div>
        )}

        {/* Empty State */}
        {!comparing && !results && (
          <div className="max-w-3xl mx-auto py-12 px-4 text-center my-auto">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
              compare — one prompt, many models
            </p>
            <h1 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Ask once. Read five answers.
            </h1>
            <p className="mt-2 text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
              Benchmark models side by side. Inspect variations in reasoning,
              speed, token spend, and response style with a single click.
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
              className={`grid ${gridColsClass(
                slots.length,
              )} divide-y sm:divide-y-0 sm:divide-x divide-hairline border-2 border-ink bg-paper-raised flex-1`}
            >
              {slots.map((modelId, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={index} className="p-4 sm:p-5 flex flex-col">
                  <div className="border-b border-hairline pb-2 mb-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint truncate">
                      {modelId}
                    </p>
                  </div>
                  <div className="flex-1 flex items-center justify-start py-8">
                    <div className="flex items-center gap-2.5 border-l-2 border-hairline-strong pl-4 text-xs">
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-ink/20 border-t-rust animate-spin flex-shrink-0" />
                      <span className="font-mono text-ink-soft">
                        streaming from{' '}
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
            <div className="mb-4 bg-paper-sunken border border-hairline p-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint block">
                Prompt
              </span>
              <p className="mt-1 text-sm font-medium text-ink">{promptEcho}</p>
            </div>

            <div
              className={`grid ${gridColsClass(
                results.length,
              )} divide-y sm:divide-y-0 sm:divide-x divide-hairline border-2 border-ink bg-paper-raised flex-1`}
            >
              {results.map((res, index) => {
                const footerTokens = formatTokens(res.usage);
                const footerDuration = formatDuration(res.duration_ms);

                return (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    className="p-4 sm:p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="border-b border-hairline pb-2 mb-4">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint truncate">
                          {res.model}
                        </p>
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
    </div>
  );
}

export default Compare;
