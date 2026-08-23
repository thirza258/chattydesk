import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Compare from '../renderer/pages/Compare';
import services from '../services/services';
import { AuthProvider } from '../renderer/AuthContext';
import { ModelCatalogue } from '../interface';

jest.mock('../services/services', () => ({
  __esModule: true,
  onSessionExpired: jest.fn(),
  default: {
    listModels: jest.fn(),
    compareModels: jest.fn(),
    sendMessage: jest.fn(),
    getHistory: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    me: jest.fn(),
    getSettings: jest.fn(),
    saveSettings: jest.fn(),
  },
}));

const mocked = services as jest.Mocked<typeof services>;

const mockCatalogue: ModelCatalogue = {
  count: 4,
  default_model: 'openai/gpt-4o-mini',
  models: [
    {
      id: 'openai/gpt-4o-mini',
      name: 'GPT-4o mini',
      provider: 'openai',
      description: 'Small OpenAI model',
      context_length: 128000,
      pricing: { prompt: '0.00000015', completion: '0.0000006' },
      is_free: false,
    },
    {
      id: 'meta/llama-3-8b-instruct:free',
      name: 'Llama 3 8B Free',
      provider: 'meta',
      description: 'Free Meta model',
      context_length: 8192,
      pricing: { prompt: '0', completion: '0' },
      is_free: true,
    },
    {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      description: 'Anthropic flagship model',
      context_length: 200000,
      pricing: { prompt: '0.000003', completion: '0.000015' },
      is_free: false,
    },
    {
      id: 'google/gemini-flash-1.5',
      name: 'Gemini Flash 1.5',
      provider: 'google',
      description: 'Fast Google model',
      context_length: 1000000,
      pricing: { prompt: '0.000000075', completion: '0.0000003' },
      is_free: false,
    },
    {
      id: 'mistralai/mistral-7b-instruct',
      name: 'Mistral 7B Instruct',
      provider: 'mistralai',
      description: 'Mistral base model',
      context_length: 32000,
      pricing: { prompt: '0.0000002', completion: '0.0000002' },
      is_free: false,
    },
  ],
};

const renderCompare = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <Compare />
      </BrowserRouter>
    </AuthProvider>,
  );
};

describe('Compare page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mocked.listModels.mockResolvedValue(mockCatalogue);
  });

  it('renders with 2 default slots (default model + first free model)', async () => {
    renderCompare();

    await waitFor(() => expect(mocked.listModels).toHaveBeenCalled());

    const selects = screen.getAllByRole('combobox', { name: /slot \d model/i });
    expect(selects).toHaveLength(2);
    expect(selects[0]).toHaveValue('openai/gpt-4o-mini');
    expect(selects[1]).toHaveValue('meta/llama-3-8b-instruct:free');

    // Empty state should be visible
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /ask once\. read five answers\./i,
      }),
    ).toBeInTheDocument();
  });

  it('+ grows to 5 and then disappears; − shrinks to 2 and then disappears', async () => {
    renderCompare();

    await waitFor(() => expect(mocked.listModels).toHaveBeenCalled());

    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    // At 2 slots, remove button should be hidden
    expect(
      screen.queryByRole('button', { name: /− remove/i }),
    ).not.toBeInTheDocument();

    const addButton = () => screen.getByRole('button', { name: /\+ add/i });

    // Click + to add 3rd slot
    fireEvent.click(addButton());
    expect(screen.getAllByRole('combobox')).toHaveLength(3);

    // Now remove button is present
    const removeButton = () =>
      screen.getByRole('button', { name: /− remove/i });
    expect(removeButton()).toBeInTheDocument();

    // Click + to add 4th slot
    fireEvent.click(addButton());
    expect(screen.getAllByRole('combobox')).toHaveLength(4);

    // Click + to add 5th slot
    fireEvent.click(addButton());
    expect(screen.getAllByRole('combobox')).toHaveLength(5);

    // At 5 slots, add button disappears
    expect(
      screen.queryByRole('button', { name: /\+ add/i }),
    ).not.toBeInTheDocument();

    // Now shrink back down
    fireEvent.click(removeButton());
    expect(screen.getAllByRole('combobox')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /\+ add/i })).toBeInTheDocument();

    fireEvent.click(removeButton());
    expect(screen.getAllByRole('combobox')).toHaveLength(3);

    fireEvent.click(removeButton());
    expect(screen.getAllByRole('combobox')).toHaveLength(2);

    // At 2 slots, remove button disappears
    expect(
      screen.queryByRole('button', { name: /− remove/i }),
    ).not.toBeInTheDocument();
  });

  it('sending one prompt renders one column per slot with model id and response', async () => {
    mocked.compareModels.mockResolvedValue({
      prompt: 'Explain quicksort in two sentences.',
      results: [
        {
          model: 'openai/gpt-4o-mini',
          response: 'Quicksort divides and conquers using a pivot.',
          usage: { total_tokens: 45 },
          used_own_key: false,
          duration_ms: 1200,
          error: undefined,
        },
        {
          model: 'meta/llama-3-8b-instruct:free',
          response:
            'It recursively partitions an array around a chosen pivot element.',
          usage: { total_tokens: 38 },
          used_own_key: true,
          duration_ms: 1850,
          error: undefined,
        },
      ],
    });

    renderCompare();
    await waitFor(() => expect(mocked.listModels).toHaveBeenCalled());

    const input = screen.getByRole('textbox', { name: /compare input/i });
    fireEvent.change(input, {
      target: { value: 'Explain quicksort in two sentences.' },
    });

    const compareBtn = screen.getByRole('button', { name: /^compare$/i });
    fireEvent.click(compareBtn);

    await waitFor(() =>
      expect(mocked.compareModels).toHaveBeenCalledWith(
        'Explain quicksort in two sentences.',
        ['openai/gpt-4o-mini', 'meta/llama-3-8b-instruct:free'],
      ),
    );

    // Verify response texts are displayed
    expect(
      await screen.findByText(
        /Quicksort divides and conquers using a pivot\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /It recursively partitions an array around a chosen pivot element\./i,
      ),
    ).toBeInTheDocument();

    // Verify footers (token count, duration, own key)
    expect(screen.getByText('45 tok')).toBeInTheDocument();
    expect(screen.getByText('1.20s')).toBeInTheDocument();
    expect(screen.getByText('38 tok')).toBeInTheDocument();
    expect(screen.getByText('1.85s')).toBeInTheDocument();
    expect(screen.getByText('your key')).toBeInTheDocument();
  });

  it('a per-slot error renders the error block in that column while others render', async () => {
    mocked.compareModels.mockResolvedValue({
      prompt: 'Test prompt',
      results: [
        {
          model: 'openai/gpt-4o-mini',
          response: 'Valid answer from GPT.',
          usage: { total_tokens: 30 },
          used_own_key: false,
          duration_ms: 900,
        },
        {
          model: 'meta/llama-3-8b-instruct:free',
          error: 'OpenRouter error: Provider is out of capacity',
          duration_ms: 400,
        },
      ],
    });

    renderCompare();
    await waitFor(() => expect(mocked.listModels).toHaveBeenCalled());

    const input = screen.getByRole('textbox', { name: /compare input/i });
    fireEvent.change(input, { target: { value: 'Test prompt' } });
    fireEvent.click(screen.getByRole('button', { name: /^compare$/i }));

    await waitFor(() => expect(mocked.compareModels).toHaveBeenCalled());

    // Valid answer is present
    expect(
      await screen.findByText('Valid answer from GPT.'),
    ).toBeInTheDocument();
    // Error block in the second column is present
    expect(
      screen.getByText('OpenRouter error: Provider is out of capacity'),
    ).toBeInTheDocument();
  });

  it('displays a global error banner when all slots fail or request rejects', async () => {
    mocked.compareModels.mockRejectedValue(
      new Error('OpenRouter error: Payment Required'),
    );

    renderCompare();
    await waitFor(() => expect(mocked.listModels).toHaveBeenCalled());

    const input = screen.getByRole('textbox', { name: /compare input/i });
    fireEvent.change(input, { target: { value: 'Will fail' } });
    fireEvent.click(screen.getByRole('button', { name: /^compare$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'OpenRouter error: Payment Required',
    );
  });

  it('allows clicking a starter prompt to populate input', async () => {
    renderCompare();
    await waitFor(() => expect(mocked.listModels).toHaveBeenCalled());

    const starterBtn = screen.getByRole('button', {
      name: /explain quicksort in two sentences\./i,
    });
    fireEvent.click(starterBtn);

    const input = screen.getByRole('textbox', { name: /compare input/i });
    expect(input).toHaveValue('Explain quicksort in two sentences.');
  });
});
