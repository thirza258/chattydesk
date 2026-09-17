import '@testing-library/jest-dom';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import services from '../services/services';
import { ChatResult, HistoryPage } from '../interface';
import { AuthProvider } from '../renderer/AuthContext';
import Chat from '../renderer/pages/Chat';
import { CONVERSATION_KEY } from '../renderer/storage';

jest.mock('../services/services');
const mocked = services as jest.Mocked<typeof services>;
const emptyHistory: HistoryPage = {
  count: 0,
  results: [],
  limit: 100,
  offset: 0,
};
const savedHistory: HistoryPage = {
  ...emptyHistory,
  count: 1,
  results: [
    {
      id: 1,
      prompt: 'Remember Ada',
      response: 'Hello Ada',
      conversation_id: 'saved-thread',
      model_name: 'test/model',
      created_at: '2026-09-17T10:00:00Z',
    },
  ],
};
const reply: ChatResult = {
  response: 'A reply',
  model: 'test/model',
  conversation_id: 'saved-thread',
  memory: { enabled: true, history_turns: 10, available_turns: 1 },
};
const renderChat = () =>
  render(
    <AuthProvider>
      <BrowserRouter>
        <Chat />
      </BrowserRouter>
    </AuthProvider>,
  );
const send = (text: string) => {
  fireEvent.change(screen.getByRole('textbox', { name: 'Chat input' }), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
};

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  window.history.replaceState({}, '', '/chat');
  mocked.listModels.mockResolvedValue({
    count: 1,
    default_model: 'test/model',
    models: [
      {
        id: 'test/model',
        name: 'Test model',
        provider: 'test',
        description: '',
        context_length: 8000,
        pricing: { prompt: '0', completion: '0' },
        is_free: true,
      },
    ],
  });
  mocked.getHistory.mockResolvedValue(emptyHistory);
  mocked.getMemory.mockResolvedValue({
    enabled: false,
    history_turns: 20,
    available_turns: 1,
  });
  mocked.sendMessage.mockResolvedValue(reply);
});

it('sends the chosen memory preferences on the first turn', async () => {
  renderChat();
  await screen.findByRole('heading', { name: 'test/model' });
  fireEvent.click(screen.getByText('Conversation memory'));
  fireEvent.change(screen.getByLabelText('Previous turns'), {
    target: { value: '5' },
  });
  fireEvent.click(screen.getByLabelText('Remember this conversation'));
  send('Hello');
  await waitFor(() =>
    expect(mocked.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        useHistory: false,
        historyTurns: 5,
        conversationId: null,
      }),
    ),
  );
});

it('restores both the conversation and its saved memory settings', async () => {
  window.localStorage.setItem(CONVERSATION_KEY, 'saved-thread');
  mocked.getHistory.mockImplementation(async (query) =>
    query?.conversationId ? savedHistory : emptyHistory,
  );
  renderChat();
  await screen.findByText('Hello Ada');
  expect(screen.getByLabelText('Remember this conversation')).not.toBeChecked();
  expect(screen.getByLabelText('Previous turns')).toHaveValue('20');
  send('Continue');
  await waitFor(() =>
    expect(mocked.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'saved-thread',
        useHistory: false,
        historyTurns: 20,
      }),
    ),
  );
});

it('does not attach a late AI reply to a new conversation', async () => {
  let resolveReply!: (value: ChatResult) => void;
  mocked.sendMessage.mockReturnValue(
    new Promise((resolve) => {
      resolveReply = resolve;
    }),
  );
  renderChat();
  await screen.findByRole('heading', { name: 'test/model' });
  send('First thread');
  fireEvent.click(screen.getByRole('button', { name: 'New chat' }));
  await act(async () => {
    resolveReply({ ...reply, response: 'Late reply from another thread' });
  });
  expect(
    screen.queryByText('Late reply from another thread'),
  ).not.toBeInTheDocument();
  expect(window.localStorage.getItem(CONVERSATION_KEY)).toBeNull();
  expect(screen.getByRole('textbox', { name: 'Chat input' })).toBeEnabled();
});

it('does not restore an old thread after the user starts a new chat', async () => {
  window.localStorage.setItem(CONVERSATION_KEY, 'saved-thread');
  let resolveHistory!: (value: HistoryPage) => void;
  const pending = new Promise<HistoryPage>((resolve) => {
    resolveHistory = resolve;
  });
  mocked.getHistory.mockImplementation(async (query) =>
    query?.conversationId ? pending : emptyHistory,
  );
  renderChat();
  expect(screen.getByRole('textbox', { name: 'Chat input' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'New chat' }));
  await act(async () => {
    resolveHistory(savedHistory);
  });
  expect(screen.queryByText('Hello Ada')).not.toBeInTheDocument();
  expect(window.localStorage.getItem(CONVERSATION_KEY)).toBeNull();
});

it('resets memory while leaving visible conversation messages intact', async () => {
  window.localStorage.setItem(CONVERSATION_KEY, 'saved-thread');
  mocked.getHistory.mockImplementation(async (query) =>
    query?.conversationId ? savedHistory : emptyHistory,
  );
  mocked.updateMemory.mockResolvedValue({
    enabled: false,
    history_turns: 20,
    available_turns: 0,
    reset_at: '2026-09-17T11:00:00Z',
  });
  renderChat();
  await screen.findByText('Hello Ada');
  fireEvent.click(screen.getByText('Conversation memory'));
  fireEvent.click(screen.getByRole('button', { name: 'Reset memory' }));
  await screen.findByText('Memory reset. Earlier messages remain in history.');
  expect(mocked.updateMemory).toHaveBeenCalledWith('saved-thread', {
    reset: true,
  });
  expect(screen.getByText('Hello Ada')).toBeInTheDocument();
});
