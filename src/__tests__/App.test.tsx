import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from '../renderer/App';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('should render', () => {
    expect(render(<App />)).toBeTruthy();
  });

  it('opens the web build on the landing page', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { level: 1, name: /every model/i }),
    ).toBeInTheDocument();
  });

  it('sends a signed-out visitor from the chat to the sign-in page', () => {
    window.history.pushState({}, '', '/chat');
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });
});

const metaContent = (name: string): string | null | undefined =>
  document.head.querySelector(`meta[name="${name}"]`)?.getAttribute('content');

describe('page metadata', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('gives the landing page a search-result title and lets it be indexed', () => {
    render(<App />);

    expect(document.title).toMatch(/every AI model in one chat window/i);
    expect(metaContent('description')).toMatch(/400\+ more models/);
    expect(metaContent('robots')).toBe('index, follow');
  });

  it('keeps the pages behind the sign-in out of search results', () => {
    window.history.pushState({}, '', '/chat');
    render(<App />);

    // RequireAuth sent us to the sign-in page, which is noindex as well.
    expect(document.title).toBe('Sign in · ChattyDesk');
    expect(metaContent('robots')).toBe('noindex, nofollow');
  });

  it('writes no canonical URL when the build was not told the site origin', () => {
    render(<App />);

    // SITE_URL is unset here, and a guessed canonical is worse than none.
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  });
});
