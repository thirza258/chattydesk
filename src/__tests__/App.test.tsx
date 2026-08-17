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
