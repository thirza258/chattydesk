import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BenchmarkLab from '../renderer/pages/BenchmarkLab';
import Leaderboard from '../renderer/pages/Leaderboard';
import Analytics from '../renderer/pages/Analytics';
import Models from '../renderer/pages/Models';
import services from '../services/services';
import { AuthProvider } from '../renderer/AuthContext';

jest.mock('../services/services', () => ({
  __esModule: true,
  onSessionExpired: jest.fn(),
  default: {
    getAnalyticsOverview: jest.fn(),
    listDatasets: jest.fn(),
    listBenchmarks: jest.fn(),
    getLeaderboard: jest.fn(),
    getRecommendations: jest.fn(),
    getPerformanceAnalytics: jest.fn(),
    getCostAnalytics: jest.fn(),
    listRegisteredModels: jest.fn(),
    getModelHistory: jest.fn(),
    refreshModels: jest.fn(),
    downloadBenchmarkExport: jest.fn(),
  },
}));

const mocked = services as jest.Mocked<typeof services>;

const mockOverview = {
  total_experiments: 12,
  completed_experiments: 10,
  total_benchmark_requests: 1540,
  successful_requests: 1510,
  avg_success_rate: 98.1,
  models_evaluated_count: 8,
};

const mockDatasets = [
  {
    id: 'ds-1',
    name: 'General QA Suite',
    description: 'Knowledge and factual QA questions',
    category: 'general_qa' as const,
    visibility: 'public' as const,
    is_builtin: true,
    created_at: '2026-11-20T00:00:00Z',
    updated_at: '2026-11-20T00:00:00Z',
    latest_version: {
      id: 'v-1',
      version: 1,
      schema_version: '1.0',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      test_case_count: 5,
      created_at: '2026-11-20T00:00:00Z',
    },
  },
];

const mockExperiments = [
  {
    id: 'exp-1',
    name: 'Python Coding Benchmark Run #1',
    description: 'Testing code generation across models',
    status: 'completed' as const,
    dataset_name: 'Python Coding Problems',
    dataset_category: 'coding',
    dataset_version_num: 1,
    total_cases: 10,
    completed_cases: 10,
    failed_cases: 0,
    models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
    created_at: '2026-11-21T10:00:00Z',
  },
];

const mockLeaderboardRankings = [
  {
    ranking: 1,
    model_identifier: 'anthropic/claude-3.5-sonnet',
    provider: 'anthropic',
    category: 'overall',
    composite_score: 92.4,
    quality_score: 96.0,
    speed_score: 82.5,
    cost_per_1m: 3.0,
    reliability_score: 99.0,
    sample_count: 24,
    updated_at: '2026-11-21T12:00:00Z',
  },
  {
    ranking: 2,
    model_identifier: 'openai/gpt-4o',
    provider: 'openai',
    category: 'overall',
    composite_score: 89.8,
    quality_score: 91.5,
    speed_score: 88.0,
    cost_per_1m: 2.5,
    reliability_score: 98.0,
    sample_count: 24,
    updated_at: '2026-11-21T12:00:00Z',
  },
];

const mockCostProjections = [
  {
    model_id: 'openai/gpt-4o-mini',
    prompt_per_1m: 0.15,
    completion_per_1m: 0.6,
    cost_per_request: 0.000255,
    cost_per_1k_requests: 0.255,
    cost_per_1m_tokens: 0.318,
    daily_cost: 0.255,
    monthly_cost: 7.65,
    annual_cost: 93.07,
  },
];

const mockRegisteredModels = [
  {
    id: 'm-1',
    model_identifier: 'anthropic/claude-3.5-sonnet',
    display_name: 'Claude 3.5 Sonnet',
    provider_id: 'anthropic',
    context_length: 200000,
    max_output_tokens: 8192,
    is_free: false,
    is_active: true,
    input_price_per_token: '0.000003',
    output_price_per_token: '0.000015',
  },
  {
    id: 'm-2',
    model_identifier: 'meta/llama-3-8b-instruct:free',
    display_name: 'Llama 3 8B Free',
    provider_id: 'meta',
    context_length: 8192,
    is_free: true,
    is_active: true,
    input_price_per_token: '0',
    output_price_per_token: '0',
  },
];

describe('AI Benchmark Lab Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.getAnalyticsOverview.mockResolvedValue(mockOverview);
    mocked.listDatasets.mockResolvedValue(mockDatasets);
    mocked.listBenchmarks.mockResolvedValue(mockExperiments);
  });

  it('renders benchmark lab overview with KPI cards and suites', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <BenchmarkLab />
        </BrowserRouter>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('AI Benchmark Lab').length).toBeGreaterThan(0);
      expect(screen.getByText('12')).toBeInTheDocument(); // total experiments
    });

    expect(screen.getByText('1,540')).toBeInTheDocument(); // total test executions
    expect(screen.getByText('98.1%')).toBeInTheDocument(); // success rate
    expect(screen.getByText('General QA Suite')).toBeInTheDocument();
    expect(screen.getByText('Python Coding Benchmark Run #1')).toBeInTheDocument();
  });
});

describe('Leaderboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.getLeaderboard.mockResolvedValue({
      category: 'overall',
      rankings: mockLeaderboardRankings,
      weights_used: {},
    });
    mocked.getRecommendations.mockResolvedValue({
      category: 'coding',
      recommendations: mockLeaderboardRankings,
    });
  });

  it('renders rankings and dynamic scoring formula sliders', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Leaderboard />
        </BrowserRouter>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('AI Performance Leaderboard')).toBeInTheDocument();
    });

    expect(screen.getAllByText('anthropic/claude-3.5-sonnet').length).toBeGreaterThan(0);
    expect(screen.getAllByText('openai/gpt-4o').length).toBeGreaterThan(0);
    expect(screen.getByText('92.4')).toBeInTheDocument(); // composite score
    expect(screen.getByText('96.0%')).toBeInTheDocument(); // quality score
  });
});

describe('Analytics & Cost Calculator Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.getAnalyticsOverview.mockResolvedValue(mockOverview);
    mocked.getPerformanceAnalytics.mockResolvedValue([]);
    mocked.getCostAnalytics.mockResolvedValue({
      workload_params: {},
      projections: mockCostProjections,
    });
  });

  it('renders cost projections and workload parameters', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Analytics />
        </BrowserRouter>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Production Workload Cost Projection')).toBeInTheDocument();
    });

    expect(screen.getByText('Daily Requests')).toBeInTheDocument();
    expect(screen.getByText('$7.65 / mo')).toBeInTheDocument();
  });
});

describe('Model Registry Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.listRegisteredModels.mockResolvedValue({
      count: 2,
      results: mockRegisteredModels,
    });
  });

  it('renders model catalogue with specifications and pricing', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Models />
        </BrowserRouter>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('AI Model Registry')).toBeInTheDocument();
    });

    expect(screen.getByText('Claude 3.5 Sonnet')).toBeInTheDocument();
    expect(screen.getByText('Llama 3 8B Free')).toBeInTheDocument();
    expect(screen.getAllByText('FREE').length).toBeGreaterThan(0);
  });
});
