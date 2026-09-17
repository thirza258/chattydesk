import { ConversationMemory, MemoryPatch } from '../../interface';

interface MemoryControlsProps {
  memory: ConversationMemory;
  disabled: boolean;
  onChange: (patch: MemoryPatch) => void;
}

function MemoryControls({ memory, disabled, onChange }: MemoryControlsProps) {
  const limits = [...new Set([5, 10, 20, 50, memory.history_turns])].sort(
    (a, b) => a - b,
  );

  return (
    <details className="shrink-0 border-b border-hairline-strong bg-paper-raised px-4 py-2 text-xs">
      <summary className="cursor-pointer py-1.5 text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust">
        <span className="font-medium text-ink">Conversation memory</span>
        <span className="ml-2 text-rust-deep">
          {memory.enabled ? 'On' : 'Off'}
        </span>
        {memory.enabled && (
          <span className="ml-2">
            · up to {memory.history_turns} previous turns
          </span>
        )}
      </summary>
      <fieldset disabled={disabled} className="pb-2 pt-3 disabled:opacity-60">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <label
            htmlFor="conversation-memory-enabled"
            className="flex min-h-10 cursor-pointer items-center gap-2 font-medium"
          >
            <input
              id="conversation-memory-enabled"
              type="checkbox"
              checked={memory.enabled}
              onChange={(event) => onChange({ enabled: event.target.checked })}
              aria-describedby="memory-description"
              className="h-4 w-4 accent-rust"
            />
            Remember this conversation
          </label>
          <label
            htmlFor="conversation-memory-turns"
            className="flex items-center gap-2"
          >
            Previous turns
            <select
              id="conversation-memory-turns"
              value={memory.history_turns}
              onChange={(event) =>
                onChange({ history_turns: Number(event.target.value) })
              }
              disabled={disabled || !memory.enabled}
              className="min-h-10 border border-hairline-strong bg-paper px-2 focus:border-rust focus:outline-none"
            >
              {limits.map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={disabled || memory.available_turns === 0}
            onClick={() => onChange({ reset: true })}
            className="min-h-10 border border-hairline-strong px-3 font-medium hover:border-rust hover:text-rust-deep disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust"
          >
            Reset memory
          </button>
        </div>
        <p
          id="memory-description"
          className="mt-2 max-w-2xl leading-relaxed text-ink-soft"
        >
          {memory.enabled
            ? 'Replies can use earlier messages from this chat, even when you switch models. Long chats use a limited set of recent messages.'
            : 'Replies use only your latest message. Messages are still saved in your chat history.'}{' '}
          Resetting memory keeps your history and starts fresh context for the
          next reply.
        </p>
        {memory.reset_at && memory.available_turns === 0 && (
          <p role="status" className="mt-2 text-pine">
            Memory reset. Earlier messages remain in history.
          </p>
        )}
        {memory.trimmed && (
          <p className="mt-2 text-ink-faint">
            The last reply used {memory.used_turns} previous turns; older
            messages were left out.
          </p>
        )}
      </fieldset>
    </details>
  );
}

export default MemoryControls;
