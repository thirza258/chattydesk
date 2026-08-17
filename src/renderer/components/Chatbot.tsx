import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../../interface';
import {
  IconBot,
  IconCopy,
  IconCpu,
  IconSend,
  IconSparkles,
  IconUser,
} from './icons';

interface ChatbotProps {
  messages: ChatMessage[];
  selectedModel: string;
  sending: boolean;
  error: string;
  onSend: (text: string) => void;
}

const STARTER_PROMPTS = [
  'Explain the tradeoffs between REST, GraphQL, and gRPC for high-throughput APIs.',
  'Write a TypeScript function to debounce an async function with cancellation.',
  'Draft a succinct README section detailing architecture and state management.',
  'Review this code for edge cases and concurrency bugs.',
];

function Chatbot({
  messages,
  selectedModel,
  sending,
  error,
  onSend,
}: ChatbotProps) {
  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const endOfMessages = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Optional-called: scrollIntoView is missing in jsdom, where the tests run.
    endOfMessages.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, sending]);

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

  const submit = () => {
    if (!input.trim() || sending) return;
    onSend(input);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
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

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-text">
      {/* Messages Scroll Area */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Empty State */}
        {messages.length === 0 && !sending && (
          <div className="max-w-2xl mx-auto py-12 px-4 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4 shadow-inner">
              <IconSparkles className="h-6 w-6" />
            </div>

            <h2 className="text-xl font-semibold tracking-tight text-slate-100">
              {selectedModel ? selectedModel : 'Pick a model to start'}
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              Every query is streamed with full Markdown support, token metrics,
              and seamless model-switching mid-conversation.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInput(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700/80 text-xs text-slate-300 hover:text-slate-100 transition-all duration-150 text-left group"
                >
                  <span className="line-clamp-2 leading-relaxed">{prompt}</span>
                  <span className="mt-2 flex items-center gap-1 text-[10px] font-medium text-blue-400 group-hover:text-blue-300">
                    Use prompt →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message List */}
        {messages.map((msg, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={`flex items-start gap-3 ${
              msg.user === 'me' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.user === 'bot' && (
              <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 mt-0.5">
                <IconBot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`relative group max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.user === 'me'
                  ? 'bg-blue-600 text-white rounded-tr-xs shadow-md shadow-blue-950/20'
                  : msg.error
                  ? 'bg-red-950/40 text-red-200 border border-red-800/60 rounded-tl-xs'
                  : 'bg-slate-900 border border-slate-800/90 text-slate-200 rounded-tl-xs shadow-md shadow-black/20'
              }`}
            >
              {msg.user === 'me' ? (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              ) : (
                <div className="chat-markdown">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              )}

              {/* Bot Message Telemetry / Model Info */}
              {msg.user === 'bot' && !msg.error && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center gap-2 truncate">
                    {msg.model && (
                      <span className="truncate text-slate-400 font-medium">
                        {msg.model}
                      </span>
                    )}
                    {msg.usage?.total_tokens && (
                      <span>· {msg.usage.total_tokens.toLocaleString()} tokens</span>
                    )}
                    {msg.usedOwnKey && (
                      <span className="text-emerald-400 font-sans font-medium">
                        · your key
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(msg.text, index)}
                    title="Copy response"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 hover:text-slate-300 text-slate-500"
                  >
                    {copiedIndex === index ? (
                      <span className="text-[10px] text-emerald-400 font-sans">
                        Copied!
                      </span>
                    ) : (
                      <IconCopy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {msg.user === 'me' && (
              <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-blue-700/60 border border-blue-500/40 flex items-center justify-center text-blue-200 mt-0.5">
                <IconUser className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {/* Loading / Generating State */}
        {sending && (
          <div className="flex items-start gap-3 justify-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 mt-0.5">
              <IconBot className="h-4 w-4 animate-pulse" />
            </div>
            <div className="rounded-2xl rounded-tl-xs bg-slate-900 border border-slate-800 p-4 text-xs text-slate-300 shadow-md shadow-black/20 flex items-center gap-3">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-600 border-t-blue-500 animate-spin" />
              <span>
                Streaming response from{' '}
                <strong className="font-mono text-blue-400">
                  {selectedModel || 'the model'}
                </strong>
                …
              </span>
            </div>
          </div>
        )}

        <div ref={endOfMessages} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex-shrink-0 px-4 py-2.5 bg-red-950/60 text-red-200 text-xs border-t border-red-800/80 flex items-center justify-between">
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="flex-shrink-0 p-3 sm:p-4 bg-slate-900/70 border-t border-slate-800/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl border border-slate-700/80 bg-slate-950 shadow-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all duration-150 p-2.5">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              disabled={sending}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                sending ? 'Waiting for response…' : 'Type your message here'
              }
              aria-label="Chat input"
              className="w-full resize-none bg-transparent px-2.5 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-50 min-h-[38px] max-h-[200px]"
            />

            <div className="flex items-center justify-between pt-2 px-1 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
                    Enter
                  </kbd>{' '}
                  to send
                </span>
                <span className="hidden sm:inline text-slate-600">·</span>
                <span className="hidden sm:inline">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
                    Shift+Enter
                  </kbd>{' '}
                  newline
                </span>
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={sending || !input.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-semibold px-4 py-2 transition-all duration-150 shadow-sm shadow-blue-600/30"
              >
                <span>{sending ? 'Sending…' : 'Send'}</span>
                <IconSend className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;

