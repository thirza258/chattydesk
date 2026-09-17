import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import App from '../renderer/App';
import { isDesktop } from '../renderer/environment';

jest.mock('../renderer/environment', () => ({
  isDesktop: jest.fn(() => false),
}));
const desktop = isDesktop as jest.MockedFunction<typeof isDesktop>;
const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});

beforeEach(() => {
  desktop.mockReturnValue(false);
  window.localStorage.clear();
  window.history.replaceState(
    {},
    '',
    '/courses/ai-essentials/strengths-and-limits',
  );
});

afterAll(() => scrollTo.mockRestore());

it('only records completion for a correct answer and restores progress on reload', () => {
  const view = render(<App />);
  fireEvent.click(
    screen.getByLabelText('As a guaranteed fact if it sounds confident'),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
  expect(screen.getByRole('status')).toHaveTextContent('Not quite.');
  expect(
    window.localStorage.getItem('chattydesk.courses.completed.v1'),
  ).toBeNull();
  fireEvent.click(screen.getByLabelText('As a draft to review and verify'));
  fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
  expect(screen.getByRole('status')).toHaveTextContent('Correct.');
  expect(
    screen.getByRole('link', { name: /next lesson/i }),
  ).toBeInTheDocument();
  view.unmount();
  window.history.replaceState({}, '', '/courses');
  render(<App />);
  expect(screen.getByText('1 of 12 lessons complete')).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: /continue course/i }),
  ).toHaveAttribute('href', '/courses/ai-essentials/choose-a-task');
});

it('keeps course routes unavailable in the desktop app', () => {
  desktop.mockReturnValue(true);
  window.history.replaceState({}, '', '/#/courses');
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  expect(
    screen.queryByRole('heading', { name: 'AI, made practical.' }),
  ).not.toBeInTheDocument();
});

it('recovers from invalid saved progress and unknown lesson URLs', () => {
  window.localStorage.setItem(
    'chattydesk.courses.completed.v1',
    'invalid-json',
  );
  window.history.replaceState({}, '', '/courses/ai-essentials/unknown-lesson');
  render(<App />);
  expect(
    screen.getByRole('heading', { name: 'Course not found' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'Browse AI courses' }),
  ).toHaveAttribute('href', '/courses');
});
