import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import services from '../../services/services';
import { BenchmarkDataset, BenchmarkTestCase } from '../../interface';
import { usePageMeta } from '../pageMeta';
import {
  IconCheck,
  IconClose,
  IconDatabase,
  IconDownload,
  IconFlask,
  IconLogo,
  IconPlay,
  IconPlus,
  IconTrash,
  IconUpload,
} from '../components/icons';

const BUILTIN_CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'general_qa', label: 'General QA' },
  { id: 'reasoning', label: 'Reasoning (GSM8K)' },
  { id: 'math', label: 'Mathematics' },
  { id: 'coding', label: 'Code Generation' },
  { id: 'instruction_following', label: 'Instruction Following' },
  { id: 'summarization', label: 'Summarization' },
  { id: 'structured_output', label: 'Structured JSON' },
  { id: 'classification', label: 'Classification' },
];

export default function BenchmarkDatasets() {
  usePageMeta({
    title: 'Benchmark Datasets · ChattyDesk',
    path: '/benchmarks/datasets',
    noindex: true,
  });

  const navigate = useNavigate();
  const [datasets, setDatasets] = useState<BenchmarkDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Preview Modal
  const [previewDataset, setPreviewDataset] = useState<BenchmarkDataset | null>(null);
  const [previewCases, setPreviewCases] = useState<BenchmarkTestCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [copiedChecksum, setCopiedChecksum] = useState(false);

  // Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importName, setImportName] = useState('');
  const [importDescription, setImportDescription] = useState('');
  const [importCategory, setImportCategory] = useState('general_qa');
  const [importContent, setImportContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const data = await services.listDatasets();
      setDatasets(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const openPreview = async (ds: BenchmarkDataset) => {
    setPreviewDataset(ds);
    setLoadingCases(true);
    try {
      const full = await services.getDataset(ds.id);
      setPreviewDataset(full);
      setPreviewCases(full.latest_version?.test_cases || full.test_cases || []);
    } catch {
      setPreviewCases([]);
    } finally {
      setLoadingCases(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importName.trim() || !importContent.trim()) {
      setImportError('Dataset name and JSONL content are required.');
      return;
    }

    try {
      setImporting(true);
      setImportError('');
      await services.importDataset({
        name: importName.trim(),
        description: importDescription.trim(),
        category: importCategory,
        content: importContent,
      });
      setShowImportModal(false);
      setImportName('');
      setImportDescription('');
      setImportContent('');
      await loadDatasets();
    } catch (err) {
      setImportError((err as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete dataset "${name}"?`)) return;
    try {
      await services.deleteDataset(id);
      setDatasets((prev) => prev.filter((d) => d.id !== id));
      if (previewDataset?.id === id) setPreviewDataset(null);
    } catch (err) {
      alert(`Delete failed: ${(err as Error).message}`);
    }
  };

  const handleExportJSONL = (ds: BenchmarkDataset) => {
    const cases: BenchmarkTestCase[] = ds.latest_version?.test_cases || ds.test_cases || [];
    const lines = cases.map((c: BenchmarkTestCase) =>
      JSON.stringify({
        prompt: c.prompt || c.input_json?.prompt,
        expected_answer: c.expected_answer || c.expected_output_json?.answer,
        evaluation_method: c.evaluation_method || c.evaluation_config_json?.method,
        metadata: c.metadata,
      }),
    );
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ds.name.toLowerCase().replace(/\s+/g, '_')}_v${ds.latest_version?.version || 1}.jsonl`;
    document.body.appendChild(a);
    a.click();
    a.parentNode?.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredDatasets = useMemo(() => {
    return datasets.filter((ds) => {
      if (selectedCategory !== 'all' && ds.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = ds.name.toLowerCase().includes(q);
        const descMatch = (ds.description || '').toLowerCase().includes(q);
        if (!nameMatch && !descMatch) return false;
      }
      return true;
    });
  }, [datasets, selectedCategory, searchQuery]);

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
              Dataset Management
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 bg-ink hover:bg-rust text-paper text-xs font-semibold px-3 py-1.5 transition-colors"
            >
              <IconUpload className="h-3.5 w-3.5" />
              <span>Import Dataset</span>
            </button>
            <Link
              to="/benchmarks"
              className="inline-flex items-center gap-1.5 border border-hairline-strong px-2.5 py-1.5 text-xs font-mono text-ink hover:border-ink transition-colors"
            >
              <span>← Lab</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="border-b-2 border-ink pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight">
              Benchmark Datasets & Suites
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-ink-soft">
              Standardized, immutable test suites with SHA-256 integrity verification.
            </p>
          </div>

          <Link
            to="/benchmarks/new"
            className="inline-flex items-center gap-2 bg-rust hover:bg-rust-deep text-paper text-xs font-semibold px-4 py-2 transition-colors self-start sm:self-auto"
          >
            <IconPlay className="h-3 w-3" />
            <span>Run Benchmark</span>
          </Link>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 font-mono text-xs border-b border-hairline">
          {BUILTIN_CATEGORIES.map((cat) => (
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

        {/* Search */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search datasets by name or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border-2 border-ink bg-paper p-2.5 text-xs font-mono text-ink placeholder:text-ink-faint focus:outline-none focus:border-rust"
          />
          <span className="text-xs font-mono text-ink-soft whitespace-nowrap">
            {filteredDatasets.length} datasets
          </span>
        </div>

        {error && (
          <div className="p-3 bg-ember-soft text-ember text-xs border border-ember font-mono">
            {error}
          </div>
        )}

        {/* Datasets Grid */}
        {loading ? (
          <div className="py-16 text-center text-xs font-mono text-ink-faint">
            Loading benchmark suites…
          </div>
        ) : filteredDatasets.length === 0 ? (
          <div className="border-2 border-dashed border-hairline-strong p-12 text-center bg-paper-sunken">
            <IconDatabase className="h-10 w-10 mx-auto text-ink-faint mb-3" />
            <h3 className="font-display text-base font-bold text-ink">No Datasets Found</h3>
            <p className="mt-1 text-xs text-ink-soft font-mono">
              Try adjusting your category filter or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDatasets.map((ds) => {
              const testCaseCount = ds.latest_version?.test_case_count || 5;
              const versionNum = ds.latest_version?.version || 1;

              return (
                <div
                  key={ds.id}
                  className="border-2 border-ink bg-paper-raised p-5 flex flex-col justify-between hover:shadow-tactile-sm transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                      <span className="uppercase text-rust font-bold tracking-wider">
                        {ds.category.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        {ds.is_builtin && (
                          <span className="px-1.5 py-0.5 bg-paper border border-hairline text-ink font-semibold">
                            BUILT-IN
                          </span>
                        )}
                        <span className="text-ink-faint">v{versionNum}</span>
                      </div>
                    </div>

                    <h3 className="font-display text-base font-bold text-ink mb-1.5">{ds.name}</h3>
                    <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed">
                      {ds.description || 'Curated evaluation suite.'}
                    </p>

                    <div className="mt-3 flex items-center gap-4 text-xs font-mono text-ink-faint">
                      <span>{testCaseCount} test cases</span>
                      {ds.latest_version?.checksum && (
                        <span className="truncate max-w-[120px]" title={ds.latest_version.checksum}>
                          SHA: {ds.latest_version.checksum.slice(0, 8)}…
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-hairline flex items-center justify-between text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => openPreview(ds)}
                      className="text-ink-soft hover:text-ink font-semibold"
                    >
                      Preview Cases →
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleExportJSONL(ds)}
                        className="p-1 hover:text-rust text-ink-soft"
                        title="Export JSONL"
                      >
                        <IconDownload className="h-3.5 w-3.5" />
                      </button>
                      {!ds.is_builtin && (
                        <button
                          type="button"
                          onClick={() => handleDelete(ds.id, ds.name)}
                          className="p-1 hover:text-ember text-ink-soft"
                          title="Delete Dataset"
                        >
                          <IconTrash className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/benchmarks/new?dataset_id=${ds.id}&dataset_version_id=${ds.latest_version?.id}`,
                          )
                        }
                        className="bg-ink hover:bg-rust text-paper px-2.5 py-1 font-semibold transition-colors"
                      >
                        Run →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {previewDataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-paper border-2 border-ink flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b-2 border-ink flex items-center justify-between bg-paper-raised">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-rust uppercase">
                  <span>{previewDataset.category.replace('_', ' ')}</span>
                  <span>·</span>
                  <span>v{previewDataset.latest_version?.version || 1}</span>
                </div>
                <h2 className="font-display text-xl font-bold text-ink">{previewDataset.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDataset(null)}
                className="p-1 hover:bg-paper-sunken border border-hairline text-ink"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 font-mono text-xs flex-1">
              {previewDataset.description && (
                <p className="text-ink-soft leading-relaxed">{previewDataset.description}</p>
              )}

              {/* Checksum Badge */}
              {previewDataset.latest_version?.checksum && (
                <div className="flex items-center justify-between p-2.5 bg-paper-sunken border border-hairline">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase text-ink-faint font-semibold">
                      SHA-256 Checksum:
                    </span>
                    <code className="text-[11px] text-rust break-all">
                      {previewDataset.latest_version.checksum}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(previewDataset.latest_version?.checksum || '');
                      setCopiedChecksum(true);
                      setTimeout(() => setCopiedChecksum(false), 2000);
                    }}
                    className="border border-hairline px-2 py-0.5 text-[10px] bg-paper hover:bg-paper-sunken"
                  >
                    {copiedChecksum ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}

              {/* Test Cases List */}
              <div>
                <h3 className="font-display text-sm font-bold text-ink mb-2">
                  Test Cases ({previewCases.length})
                </h3>

                {loadingCases ? (
                  <div className="py-6 text-center text-ink-faint">Loading test cases…</div>
                ) : previewCases.length === 0 ? (
                  <div className="p-4 border border-dashed border-hairline text-center text-ink-faint">
                    No test cases available in this dataset version.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {previewCases.map((tc, idx) => {
                      const prompt = tc.prompt || tc.input_json?.prompt || '';
                      const expected = tc.expected_answer || tc.expected_output_json?.answer;
                      const evalMethod = tc.evaluation_method || tc.evaluation_config_json?.method || 'exact_match';

                      return (
                        <div key={tc.id || idx} className="border border-hairline bg-paper-raised p-3 space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-ink-faint">
                            <span className="font-bold text-ink">Case #{idx + 1}</span>
                            <span className="uppercase text-rust font-semibold">
                              Eval: {evalMethod}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase text-ink-faint block">Prompt:</span>
                            <pre className="text-xs whitespace-pre-wrap font-mono text-ink mt-0.5 bg-paper p-2 border border-hairline">
                              {prompt}
                            </pre>
                          </div>

                          {expected && (
                            <div>
                              <span className="text-[10px] uppercase text-ink-faint block">
                                Expected Answer:
                              </span>
                              <pre className="text-xs whitespace-pre-wrap font-mono text-pine mt-0.5 bg-paper p-2 border border-hairline">
                                {expected}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-ink flex items-center justify-between bg-paper-raised">
              <button
                type="button"
                onClick={() => handleExportJSONL(previewDataset)}
                className="inline-flex items-center gap-1.5 border border-hairline-strong px-3 py-1.5 text-xs font-mono text-ink hover:border-ink transition-colors"
              >
                <IconDownload className="h-3 w-3" />
                <span>Export JSONL</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate(
                    `/benchmarks/new?dataset_id=${previewDataset.id}&dataset_version_id=${previewDataset.latest_version?.id}`,
                  );
                }}
                className="inline-flex items-center gap-1.5 bg-rust hover:bg-rust-deep text-paper text-xs font-semibold px-4 py-2 transition-colors"
              >
                <IconPlay className="h-3 w-3" />
                <span>Run Experiment With This Suite</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dataset Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="w-full max-w-2xl bg-paper border-2 border-ink flex flex-col shadow-2xl">
            <div className="p-4 border-b-2 border-ink flex items-center justify-between bg-paper-raised">
              <h2 className="font-display text-lg font-bold text-ink">Import Custom Dataset (JSONL)</h2>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 hover:bg-paper-sunken border border-hairline text-ink"
              >
                <IconClose className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleImport} className="p-5 space-y-4 font-mono text-xs">
              {importError && (
                <div className="p-2.5 bg-ember-soft border border-ember text-ember">
                  {importError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-ink-soft mb-1 font-semibold">Dataset Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Python LeetCode Hard"
                    value={importName}
                    onChange={(e) => setImportName(e.target.value)}
                    className="w-full border-2 border-ink bg-paper p-2 text-ink focus:outline-none focus:border-rust"
                  />
                </div>

                <div>
                  <label className="block text-ink-soft mb-1 font-semibold">Category</label>
                  <select
                    value={importCategory}
                    onChange={(e) => setImportCategory(e.target.value)}
                    className="w-full border-2 border-ink bg-paper p-2 text-ink focus:outline-none focus:border-rust"
                  >
                    <option value="coding">Code Generation</option>
                    <option value="reasoning">Reasoning</option>
                    <option value="math">Mathematics</option>
                    <option value="general_qa">General QA</option>
                    <option value="summarization">Summarization</option>
                    <option value="structured_output">Structured JSON</option>
                    <option value="classification">Classification</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-ink-soft mb-1 font-semibold">Description</label>
                <input
                  type="text"
                  placeholder="Brief description of the test suite and evaluation criteria"
                  value={importDescription}
                  onChange={(e) => setImportDescription(e.target.value)}
                  className="w-full border border-hairline-strong bg-paper p-2 text-ink focus:outline-none focus:border-rust"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-ink-soft font-semibold">JSONL Content * (One JSON per line)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setImportContent(
                        '{"prompt": "Write a python function to reverse a linked list.", "expected_answer": "def reverse_list(head):", "evaluation_method": "exact_match"}\n' +
                          '{"prompt": "Solve 15 * 18.", "expected_answer": "270", "evaluation_method": "numeric_exact_match"}\n' +
                          '{"prompt": "Output a JSON with key \\"status\\": \\"ok\\"", "expected_answer": "{\\"status\\": \\"ok\\"}", "evaluation_method": "json_schema"}',
                      );
                    }}
                    className="text-[10px] text-rust hover:underline"
                  >
                    Load Sample Lines
                  </button>
                </div>
                <textarea
                  rows={8}
                  required
                  placeholder='{"prompt": "What is 2+2?", "expected_answer": "4", "evaluation_method": "exact_match"}'
                  value={importContent}
                  onChange={(e) => setImportContent(e.target.value)}
                  className="w-full border-2 border-ink bg-paper p-2 font-mono text-xs text-ink focus:outline-none focus:border-rust leading-relaxed"
                />
                <p className="text-[10px] text-ink-faint mt-1">
                  Each line must be a valid JSON object containing <code>prompt</code>, and optionally{' '}
                  <code>expected_answer</code> and <code>evaluation_method</code>.
                </p>
              </div>

              <div className="pt-3 border-t border-hairline flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="border border-hairline-strong px-3 py-1.5 text-xs text-ink hover:bg-paper-sunken"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="bg-rust hover:bg-rust-deep text-paper px-4 py-1.5 text-xs font-semibold transition-colors"
                >
                  {importing ? 'Importing…' : 'Import & Compute Checksum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
