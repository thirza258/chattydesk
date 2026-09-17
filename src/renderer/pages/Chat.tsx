import { useCallback, useEffect, useRef, useState } from 'react';
import NavBar from '../components/NavBar';
import Chatbot from '../components/Chatbot';
import Sidebar from '../components/Sidebar';
import UpgradeModal from '../components/UpgradeModal';
import MemoryControls from '../components/MemoryControls';
import services from '../../services/services';
import {
  ChatMessage,
  ConversationMemory,
  HistoryEntry,
  MemoryPatch,
  Model,
} from '../../interface';
import { useAuth } from '../AuthContext';
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
const DEFAULT_MEMORY: ConversationMemory = {
  enabled: true,
  history_turns: 10,
  available_turns: 0,
};

function Chat() {
  usePageMeta({ title: 'Chat · ChattyDesk', path: '/chat', noindex: true });
  const { updateUser } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [defaultModel, setDefaultModel] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [loadingModels, setLoadingModels] = useState(true);
  const [catalogueError, setCatalogueError] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(() =>
    Boolean(readStored(CONVERSATION_KEY)),
  );
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [memory, setMemory] = useState(DEFAULT_MEMORY);
  const [updatingMemory, setUpdatingMemory] = useState(false);
  // Async work belongs to the thread in which it began. A late response must
  // never overwrite a newly opened thread or restore an old conversation id.
  const threadVersion = useRef(0);
  const historyVersion = useRef(0);
  const sendingRef = useRef(false);

  const refreshHistory = useCallback(async () => {
    historyVersion.current += 1;
    const version = historyVersion.current;
    try {
      const page = await services.getHistory({ limit: HISTORY_LIMIT });
      if (version !== historyVersion.current) return;
      setHistory(page.results);
      setHistoryError('');
    } catch (error) {
      if (version === historyVersion.current)
        setHistoryError((error as Error).message);
    }
  }, []);

  const forgetConversation = useCallback(() => {
    threadVersion.current += 1;
    sendingRef.current = false;
    setMessages([]);
    setConversationId(null);
    setMemory(DEFAULT_MEMORY);
    setRestoring(false);
    setSending(false);
    setUpdatingMemory(false);
    setChatError('');
    setSidebarOpen(false);
    removeStored(CONVERSATION_KEY);
  }, []);

  const loadConversation = useCallback(
    async (id: string) => {
      threadVersion.current += 1;
      const version = threadVersion.current;
      sendingRef.current = false;
      setRestoring(true);
      setSending(false);
      setUpdatingMemory(false);
      setChatError('');
      setMessages([]);
      setMemory(DEFAULT_MEMORY);
      setSidebarOpen(false);
      try {
        const [page, savedMemory] = await Promise.all([
          services.getHistory({ conversationId: id, limit: HISTORY_LIMIT }),
          services.getMemory(id),
        ]);
        if (version !== threadVersion.current) return;
        if (page.results.length === 0) {
          forgetConversation();
          return;
        }
        setMessages(
          [...page.results].reverse().flatMap((entry): ChatMessage[] => [
            { text: entry.prompt, user: 'me' },
            { text: entry.response, user: 'bot', model: entry.model_name },
          ]),
        );
        setConversationId(id);
        setMemory(savedMemory);
        writeStored(CONVERSATION_KEY, id);
      } catch (error) {
        if (version !== threadVersion.current) return;
        forgetConversation();
        setChatError(
          `Could not restore this conversation: ${(error as Error).message}`,
        );
      } finally {
        if (version === threadVersion.current) setRestoring(false);
      }
    },
    [forgetConversation],
  );

  useEffect(() => {
    let cancelled = false;
    const loadModels = async () => {
      try {
        const catalogue = await services.listModels();
        if (cancelled) return;
        setModels(catalogue.models);
        setDefaultModel(catalogue.default_model);
        const stored = readStored(MODEL_KEY);
        setSelectedModel(
          stored && catalogue.models.some((model) => model.id === stored)
            ? stored
            : catalogue.default_model,
        );
        setCatalogueError('');
      } catch (error) {
        if (!cancelled) setCatalogueError((error as Error).message);
      } finally {
        if (!cancelled) setLoadingModels(false);
      }
    };
    clearLegacyConversationId();
    loadModels();
    refreshHistory();
    const stored = readStored(CONVERSATION_KEY);
    if (stored) loadConversation(stored);
    return () => {
      cancelled = true;
      threadVersion.current += 1;
      historyVersion.current += 1;
    };
  }, [loadConversation, refreshHistory]);

  const chooseModel = useCallback((id: string) => {
    setSelectedModel(id);
    setSidebarOpen(false);
    writeStored(MODEL_KEY, id);
  }, []);

  const changeMemory = async (patch: MemoryPatch) => {
    if (sending || restoring || updatingMemory) return;
    if (!conversationId) {
      setMemory((previous) => ({ ...previous, ...patch }));
      return;
    }
    const version = threadVersion.current;
    setUpdatingMemory(true);
    setChatError('');
    try {
      const result = await services.updateMemory(conversationId, patch);
      if (version === threadVersion.current) setMemory(result);
    } catch (error) {
      if (version === threadVersion.current)
        setChatError((error as Error).message);
    } finally {
      if (version === threadVersion.current) setUpdatingMemory(false);
    }
  };

  const sendMessage = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || sendingRef.current || restoring || updatingMemory) return;
    const version = threadVersion.current;
    sendingRef.current = true;
    setMessages((previous) => [...previous, { text: prompt, user: 'me' }]);
    setSending(true);
    setChatError('');
    try {
      const result = await services.sendMessage({
        message: prompt,
        model: selectedModel || undefined,
        conversationId,
        useHistory: memory.enabled,
        historyTurns: memory.history_turns,
      });
      refreshHistory();
      if (version !== threadVersion.current) return;
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
      if (result.quota) {
        updateUser(result.quota);
      }
      setConversationId(result.conversation_id);
      writeStored(CONVERSATION_KEY, result.conversation_id);
      if (result.memory) setMemory(result.memory);
    } catch (error) {
      if (version !== threadVersion.current) return;
      const { message } = error as Error;
      setChatError(message);
      setMessages((previous) => [
        ...previous,
        { text: message, user: 'bot', error: true },
      ]);
      if (message.includes('Free limit reached') || message.includes('Paddle')) {
        setShowUpgradeModal(true);
      }
    } finally {
      if (version === threadVersion.current) {
        sendingRef.current = false;
        setSending(false);
      }
    }
  };

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-paper text-ink">
      <NavBar
        selectedModel={selectedModel}
        conversationId={conversationId}
        onNewChat={forgetConversation}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
      />
      <div className="min-h-0 flex flex-1 overflow-hidden">
        <div
          className={`${sidebarOpen ? 'flex' : 'hidden'} min-h-0 w-full shrink-0 md:flex md:w-auto`}
        >
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
            onOpenConversation={loadConversation}
          />
        </div>
        <main
          className={`${sidebarOpen ? 'hidden' : 'flex'} min-h-0 min-w-0 flex-1 flex-col bg-paper md:flex`}
        >
          <MemoryControls
            memory={memory}
            disabled={sending || restoring || updatingMemory}
            onChange={changeMemory}
          />
          <Chatbot
            messages={messages}
            selectedModel={selectedModel}
            sending={sending}
            loading={restoring || updatingMemory}
            error={chatError}
            onSend={sendMessage}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        </main>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => {
          setChatError('');
        }}
      />
    </div>
  );
}

export default Chat;
