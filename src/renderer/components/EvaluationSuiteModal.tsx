import React from 'react';
import { ragReaderURL } from '../../constant';
import {
  IconBarChart,
  IconClose,
  IconDatabase,
  IconExternal,
  IconFlask,
  IconLogo,
  IconSliders,
  IconTrophy,
} from './icons';

interface EvaluationSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EvaluationSuiteModal({
  isOpen,
  onClose,
}: EvaluationSuiteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evaluation-suite-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl border-2 border-ink bg-paper shadow-[8px_8px_0_0_#2B2A27] overflow-hidden select-none">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-ink bg-paper-sunken px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-rust animate-pulse" />
            <h2
              id="evaluation-suite-title"
              className="font-display font-semibold text-base text-ink tracking-tight"
            >
              AI Evaluation Suite
            </h2>
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-hairline-strong bg-paper text-ink-soft">
              ChattyDesk × RagReader
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-ink-soft hover:text-ink transition-colors p-1"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div>
            <p className="text-sm text-ink-soft leading-relaxed">
              Modern AI systems require two distinct evaluation pillars:
              evaluating <strong>foundation models</strong> for raw speed,
              reasoning, and cost, and evaluating{' '}
              <strong>retrieval pipelines</strong> for context precision and
              document groundedness.
            </p>
          </div>

          {/* Two Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pillar 1: ChattyDesk */}
            <div className="border-2 border-ink bg-paper-raised p-4 space-y-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 border border-ink bg-paper-sunken flex items-center justify-center text-ink">
                    <IconFlask className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-sm text-ink">
                      ChattyDesk
                    </h3>
                    <p className="text-[10px] text-ink-faint font-mono">
                      Foundation Model Lab
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-pine-soft text-pine border border-pine">
                  active app
                </span>
              </div>

              <ul className="text-xs space-y-1.5 text-ink-soft border-t border-hairline pt-3 font-mono text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-ink" />
                  <span>MMLU-Pro, GSM8K, HumanEval</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-ink" />
                  <span>P50 / P90 / P95 Latency & Jitter</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-ink" />
                  <span>Throughput (tokens/s) & Cost ($/1M)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-ink" />
                  <span>2–10 Side-by-Side Model Battles</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: RagReader */}
            <div className="border-2 border-ink bg-paper-raised p-4 space-y-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 border border-ink bg-paper-sunken flex items-center justify-center text-rust">
                    <IconDatabase className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-sm text-ink">
                      RagReader
                    </h3>
                    <p className="text-[10px] text-ink-faint font-mono">
                      Document & RAG Lab
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-paper-sunken text-ink-soft border border-hairline-strong">
                  companion lab
                </span>
              </div>

              <ul className="text-xs space-y-1.5 text-ink-soft border-t border-hairline pt-3 font-mono text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-rust" />
                  <span>RAG Triad: Faithfulness & Groundedness</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-rust" />
                  <span>Dense vs BM25 vs Hybrid + Cross-Encoder</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-rust" />
                  <span>Precision@K, Recall@K, nDCG, MRR</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1 w-1 bg-rust" />
                  <span>PDF Ingestion & Provenance Waterfalls</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Workflow Synergy */}
          <div className="border border-hairline bg-paper-sunken p-3.5 space-y-2 text-xs">
            <h4 className="font-semibold text-ink uppercase text-[10px] tracking-wider font-mono">
              Recommended Evaluation Workflow
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-ink-soft">
              <div className="p-2 border border-hairline bg-paper">
                <strong className="block text-ink font-semibold mb-0.5 font-mono">
                  1. Screen Models
                </strong>
                Benchmark speed, reasoning & token costs on ChattyDesk.
              </div>
              <div className="p-2 border border-hairline bg-paper">
                <strong className="block text-ink font-semibold mb-0.5 font-mono">
                  2. Ingest Documents
                </strong>
                Upload PDFs and create ground-truth test sets in RagReader.
              </div>
              <div className="p-2 border border-hairline bg-paper">
                <strong className="block text-ink font-semibold mb-0.5 font-mono">
                  3. Verify RAG Triad
                </strong>
                Score retrieval accuracy and answer faithfulness with bootstrap
                CIs.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-ink bg-paper-sunken px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border-2 border-ink bg-paper text-ink text-xs font-semibold hover:bg-paper-sunken transition-colors"
          >
            Close
          </button>
          <a
            href={ragReaderURL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-ink text-paper text-xs font-semibold hover:bg-rust transition-colors shadow-xs"
          >
            <span>Launch RagReader Lab</span>
            <IconExternal className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
