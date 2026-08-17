import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../renderer/App';
import services from '../services/services';

// The API layer is the boundary here: these tests are about the sign-in page
// and where it sends you, not about HTTP.
jest.mock('../services/services', () => ({
  __esModule: true,
  onSessionExpired: jest.fn(),
  default: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    me: jest.fn(),
    listModels: jest.fn(),
    getHistory: jest.fn(),
    sendMessage: jest.fn(),
    getSettings: jest.fn(),
    saveSettings: jest.fn(),
  },
}));

const mocked = services as jest.Mocked<typeof services>;

const account = {
  id: 1,
  username: 'ada',
  email: 'ada@example.com',
  date_joined: '2026-01-01T00:00:00Z',
};

const signInAs = () => {
  fireEvent.change(screen.getByLabelText(/username/i), {
    target: { value: 'ada' },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: 'correct-horse-42' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
};

describe('signing in', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    window.location.hash = '';
    window.history.pushState({}, '', '/login');

    mocked.signIn.mockResolvedValue({
      access: 'access-token',
      refresh: 'refresh-token',
      user: account,
    });
    mocked.listModels.mockResolvedValue({
      count: 0,
      default_model: 'openai/gpt-4o-mini',
      models: [],
    });
    mocked.getHistory.mockResolvedValue({
      count: 0,
      limit: 100,
      offset: 0,
      results: [],
    });
  });

  it('takes a username and password through to the chat', async () => {
    render(<App />);
    signInAs();

    await waitFor(() =>
      expect(mocked.signIn).toHaveBeenCalledWith({
        username: 'ada',
        password: 'correct-horse-42',
      }),
    );

    // The chat's own toolbar is the proof the route changed.
    expect(
      await screen.findByRole('button', { name: /new chat/i }),
    ).toBeInTheDocument();
  });

  it('shows the reason the server gave when sign-in fails', async () => {
    mocked.signIn.mockRejectedValue(new Error('Invalid username or password.'));

    render(<App />);
    signInAs();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid username or password.',
    );
    expect(
      screen.getByRole('heading', { level: 1, name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it('returns to the page that required an account', async () => {
    window.history.pushState({}, '', '/settings');
    mocked.getSettings.mockResolvedValue({
      has_own_key: false,
      key_hint: '',
      prefer_own_key: false,
      updated_at: '2026-01-01T00:00:00Z',
    });

    render(<App />);
    // RequireAuth bounced /settings to the sign-in page.
    signInAs();

    expect(
      await screen.findByRole('heading', { level: 1, name: /settings/i }),
    ).toBeInTheDocument();
  });
});

describe('the desktop build', () => {
  afterEach(() => {
    delete (window as unknown as { electron?: unknown }).electron;
  });

  /**
   * Packaged, the desktop app is loaded from a file:// URL: only hash routing
   * works there, and there is no landing page to show. Signed out, that has to
   * land on the sign-in form — which is what this asserts, via the hash the
   * router wrote.
   */
  it('routes on the hash and opens on the sign-in page', async () => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/');
    // What the Electron preload script exposes, and the only thing the app
    // uses to recognise the desktop build.
    (window as unknown as { electron: unknown }).electron = {
      ipcRenderer: {
        sendMessage: jest.fn(),
        on: jest.fn(),
        once: jest.fn(),
      },
    };

    render(<App />);

    expect(
      await screen.findByRole('heading', { level: 1, name: /sign in/i }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe('#/login');
  });
});
