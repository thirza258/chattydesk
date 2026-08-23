import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../../interface';
import { IconBot, IconCopy, IconSend, IconUser } from './icons';

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
    <div className="flex flex-col h-full bg-paper text-ink select-text">
      {/* Messages Scroll Area */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Empty State */}
        {messages.length === 0 && !sending && (
          <div className="max-w-2xl mx-auto py-12 px-4 text-center my-auto">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-faint">
              session ready
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {selectedModel || 'Pick a model to start'}
            </h2>
            <p className="mt-2 text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
              Every query is streamed with full Markdown support, token metrics,
              and seamless model-switching mid-conversation.
            </p>

            <div className="mt-8 border-t-2 border-ink text-left max-w-xl mx-auto">
              {STARTER_PROMPTS.map((prompt, index) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInput(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="group flex w-full items-baseline gap-3 border-b border-hairline px-1 py-3 text-left transition-colors hover:bg-rust-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
                >
                  <span className="font-mono text-xs font-semibold text-rust">
                    0{index + 1}
                  </span>
                  <span className="flex-1 text-xs sm:text-sm leading-relaxed text-ink-soft transition-colors group-hover:text-ink">
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
              <div className="flex-shrink-0 h-8 w-8 border-2 border-ink bg-paper-sunken flex items-center justify-center text-rust mt-0.5">
                <IconBot className="h-4 w-4" />
              </div>
            )}

            <div
              className={`relative group max-w-[88%] sm:max-w-[80%] p-4 text-sm leading-relaxed ${
                msg.user === 'me'
                  ? 'bg-ink text-paper border border-ink shadow-tactile-sm'
                  : ''
              } ${
                msg.user !== 'me' && msg.error
                  ? 'bg-ember-soft text-ember border-2 border-ember border-l-4 border-l-ember'
                  : ''
              } ${
                msg.user !== 'me' && !msg.error
                  ? 'bg-paper-raised border-2 border-hairline-strong text-ink border-l-4 border-l-rust shadow-tactile-sm'
                  : ''
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
                <div className="mt-3 pt-2.5 border-t border-hairline flex items-center justify-between gap-3 text-[10px] text-ink-faint font-mono">
                  <div className="flex items-center gap-2 truncate">
                    {msg.model && (
                      <span className="truncate text-ink font-medium">
                        {msg.model}
                      </span>
                    )}
                    {msg.usage?.total_tokens && (
                      <span>
                        · {msg.usage.total_tokens.toLocaleString()} tok
                      </span>
                    )}
                    {msg.usedOwnKey && (
                      <span className="text-pine font-medium">· your key</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(msg.text, index)}
                    title="Copy response"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 hover:text-ink text-ink-faint"
                  >
                    {copiedIndex === index ? (
                      <span className="text-[10px] text-pine font-sans">
                        copied ✓
                      </span>
                    ) : (
                      <IconCopy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {msg.user === 'me' && (
              <div className="flex-shrink-0 h-8 w-8 border-2 border-ink bg-ink text-paper flex items-center justify-center mt-0.5">
                <IconUser className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {/* Loading / Generating State */}
        {sending && (
          <div className="flex items-start gap-3 justify-start">
            <div className="flex-shrink-0 h-8 w-8 border-2 border-ink bg-paper-sunken flex items-center justify-center text-rust mt-0.5">
              <IconBot className="h-4 w-4 animate-pulse" />
            </div>
            <div className="bg-paper-raised border-2 border-hairline-strong border-l-4 border-l-rust p-4 text-xs text-ink shadow-tactile-sm flex items-center gap-3">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-ink/20 border-t-rust animate-spin" />
              <span className="font-mono text-ink-soft">
                streaming response from{' '}
                <strong className="font-medium text-rust-deep">
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
        <div className="flex-shrink-0 px-4 py-2.5 bg-ember-soft text-ember text-xs border-t-2 border-ember flex items-center justify-between font-mono">
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Input Form Bar */}
      <div className="flex-shrink-0 p-3 sm:p-4 bg-paper border-t-2 border-ink">
        <div className="max-w-4xl mx-auto">
          <div className="relative border-2 border-ink bg-paper-raised shadow-[4px_4px_0_0_#C6BEA8] transition-colors focus-within:border-rust p-2.5">
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
                disabled={sending || !input.trim()}
                className="inline-flex items-center gap-1.5 bg-ink hover:bg-rust disabled:bg-hairline-strong disabled:text-ink-faint text-paper text-xs font-semibold px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
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
