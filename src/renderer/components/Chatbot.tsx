import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../../interface';

interface ChatbotProps {
  messages: ChatMessage[];
  selectedModel: string;
  sending: boolean;
  error: string;
  onSend: (text: string) => void;
}

const bubbleClasses = (msg: ChatMessage): string => {
  if (msg.user === 'me') return 'bg-blue-500 text-white';
  if (msg.error) return 'bg-red-100 text-red-800 border border-red-300';
  return 'bg-gray-300 text-black';
};

function Chatbot({
  messages,
  selectedModel,
  sending,
  error,
  onSend,
}: ChatbotProps) {
  const [input, setInput] = useState('');
  const endOfMessages = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Optional-called: scrollIntoView is missing in jsdom, where the tests run.
    endOfMessages.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, sending]);

  const submit = () => {
    if (!input.trim() || sending) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex-grow overflow-y-auto p-4">
        {messages.length === 0 && !sending && (
          <p className="text-gray-500 text-sm">
            {selectedModel
              ? `Ask ${selectedModel} anything.`
              : 'Pick a model to get started.'}
          </p>
        )}

        {messages.map((msg, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={`mb-2 ${msg.user === 'me' ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block px-4 py-2 rounded text-left max-w-[80%] ${bubbleClasses(
                msg,
              )}`}
            >
              <ReactMarkdown>{msg.text}</ReactMarkdown>

              {msg.user === 'bot' && !msg.error && msg.model && (
                <p className="mt-1 text-[11px] text-gray-600">
                  {msg.model}
                  {msg.usage?.total_tokens
                    ? ` · ${msg.usage.total_tokens} tokens`
                    : ''}
                  {/* Worth saying out loud when it is the user's credit. */}
                  {msg.usedOwnKey ? ' · your key' : ''}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Some models take a minute or more, so say so rather than looking hung. */}
        {sending && (
          <div className="mb-2 text-left">
            <div className="inline-block px-4 py-2 rounded bg-gray-300 text-black">
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border-2 border-gray-500 border-t-transparent animate-spin" />
                Waiting for {selectedModel || 'the model'}…
              </span>
            </div>
          </div>
        )}

        <div ref={endOfMessages} />
      </div>

      {error && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-100 text-red-800 text-sm border-t border-red-300">
          {error}
        </div>
      )}

      <div className="flex-shrink-0 flex p-4 bg-white shadow-md">
        <input
          type="text"
          className="flex-grow border rounded px-4 py-2 mr-4 disabled:bg-gray-100"
          value={input}
          disabled={sending}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' ? submit() : null)}
          placeholder={
            sending ? 'Waiting for a reply…' : 'Type your message here'
          }
        />
        <button
          type="button"
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
          onClick={submit}
          disabled={sending || !input.trim()}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
