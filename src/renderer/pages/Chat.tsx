import { useCallback, useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import Chatbot from '../components/Chatbot';
import Sidebar from '../components/Sidebar';
import services from '../../services/services';
import { ChatMessage, HistoryEntry, Model } from '../../interface';
import { usePageMeta } from '../pageMeta';
import {
  CONVERSATION_KEY,
  MODEL_KEY,
  clearLegacyConversationId,
  readStored,
  removeStored,
  writeStored,
} from '../storage';

const HISTORY_LIMIT = 100;

/**
 * The app itself: model picker, history sidebar, conversation.
 *
 * Reached at /chat and gated by RequireAuth — every request it makes needs the
 * account's bearer token, and the history it shows is that account's own.
 */
function Chat() {
  // Nothing here is public, so there is nothing to index.
  usePageMeta({ title: 'Chat · ChattyDesk', path: '/chat', noindex: true });

  const [models, setModels] = useState<Model[]>([]);
  const [defaultModel, setDefaultModel] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(true);
  const [catalogueError, setCatalogueError] = useState('');

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(() =>
    readStored(CONVERSATION_KEY),
  );
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');

  const refreshHistory = useCallback(async () => {
    try {
      const page = await services.getHistory({ limit: HISTORY_LIMIT });
      setHistory(page.results);
      setHistoryError('');
    } catch (error) {
      setHistoryError((error as Error).message);
    }
  }, []);

  // History rows are one prompt/response pair each, newest first — reverse
  // them to replay the thread in the order it happened. Returns the number of
  // turns restored so callers can tell an empty thread from a full one.
  const loadConversation = useCallback(async (id: string): Promise<number> => {
    const page = await services.getHistory({
      conversationId: id,
      limit: HISTORY_LIMIT,
    });

    const thread = [...page.results]
      .reverse()
      .flatMap((entry): ChatMessage[] => [
        { text: entry.prompt, user: 'me' },
        { text: entry.response, user: 'bot', model: entry.model_name },
      ]);

    setMessages(thread);
    setConversationId(id);
    writeStored(CONVERSATION_KEY, id);
    return page.results.length;
  }, []);

  const forgetConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    removeStored(CONVERSATION_KEY);
  }, []);

  // Load the catalogue once. Model ids come and go, so a previously chosen
  // model is only honoured if it is still in the catalogue.
  useEffect(() => {
    let cancelled = false;

    const loadModels = async () => {
      try {
        const catalogue = await services.listModels();
        if (cancelled) return;

        setModels(catalogue.models);
        setDefaultModel(catalogue.default_model);

        const stored = readStored(MODEL_KEY);
        const storedIsAvailable =
          stored && catalogue.models.some((model) => model.id === stored);
        setSelectedModel(storedIsAvailable ? stored : catalogue.default_model);
        setCatalogueError('');
      } catch (error) {
        if (!cancelled) setCatalogueError((error as Error).message);
      } finally {
        if (!cancelled) setLoadingModels(false);
      }
    };

    // A stored id means the next message would continue a thread the server
    // still remembers, so replay that thread rather than opening on a blank
    // window. If it cannot be restored, drop the id instead of silently
    // appending to a conversation the user cannot see.
    const restorePreviousConversation = async () => {
      const stored = readStored(CONVERSATION_KEY);
      if (!stored) return;

      try {
        const turns = await loadConversation(stored);
        if (!cancelled && turns === 0) forgetConversation();
      } catch {
        if (!cancelled) forgetConversation();
      }
    };

    clearLegacyConversationId();
    loadModels();
    refreshHistory();
    restorePreviousConversation();

    return () => {
      cancelled = true;
    };
  }, [forgetConversation, loadConversation, refreshHistory]);

  const chooseModel = useCallback((id: string) => {
    setSelectedModel(id);
    writeStored(MODEL_KEY, id);
  }, []);

  const startNewChat = useCallback(() => {
    setChatError('');
    forgetConversation();
  }, [forgetConversation]);

  const sendMessage = useCallback(
    async (text: string) => {
      const prompt = text.trim();
      if (!prompt || sending) return;

      setMessages((previous) => [...previous, { text: prompt, user: 'me' }]);
      setSending(true);
      setChatError('');

      try {
        // conversationId is omitted on the first turn; the server mints one.
        const result = await services.sendMessage({
          message: prompt,
          model: selectedModel || undefined,
          conversationId,
        });

        setMessages((previous) => [
          ...previous,
          {
            text: result.response,
            user: 'bot',
            model: result.model,
            usage: result.usage,
            usedOwnKey: result.used_own_key,
          },
        ]);

        if (result.conversation_id) {
          setConversationId(result.conversation_id);
          writeStored(CONVERSATION_KEY, result.conversation_id);
        }

        refreshHistory();
      } catch (error) {
        const { message } = error as Error;
        setChatError(message);
        setMessages((previous) => [
          ...previous,
          { text: message, user: 'bot', error: true },
        ]);
      } finally {
        setSending(false);
      }
    },
    [conversationId, refreshHistory, selectedModel, sending],
  );

  // History rows are one prompt/response pair each, newest first — reverse
  // them to replay the thread in the order it happened.
  const openConversation = useCallback(
    async (id: string) => {
      setChatError('');
      try {
        await loadConversation(id);
      } catch (error) {
        setChatError((error as Error).message);
      }
    },
    [loadConversation],
  );

  return (
    <div className="h-dvh flex flex-col bg-slate-950">
      <NavBar
        selectedModel={selectedModel}
        conversationId={conversationId}
        onNewChat={startNewChat}
      />
      <div className="flex flex-grow overflow-hidden">
        <Sidebar
          models={models}
          selectedModel={selectedModel}
          defaultModel={defaultModel}
          onSelectModel={chooseModel}
          loadingModels={loadingModels}
          catalogueError={catalogueError}
          history={history}
          historyError={historyError}
          conversationId={conversationId}
          onOpenConversation={openConversation}
        />
        <div className="flex-grow overflow-hidden bg-slate-950">
          <Chatbot
            messages={messages}
            selectedModel={selectedModel}
            sending={sending}
            error={chatError}
            onSend={sendMessage}
          />
        </div>
      </div>
    </div>
  );

}

export default Chat;
