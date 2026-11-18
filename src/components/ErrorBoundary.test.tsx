import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { clearSavedProgress } from '../storage/clear';

function Boom(): never {
  throw new Error('render exploded');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when nothing fails', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('all good')).toBeInTheDocument();
  });

  it('shows a recoverable alert instead of a blank page when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('requires a second click before erasing saved progress', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reset saved progress' }));
    expect(screen.getByRole('button', { name: /confirm: erase saved progress/i })).toBeInTheDocument();
  });

  it('clearSavedProgress removes only the game keys', () => {
    localStorage.setItem('real-or-ai-wall:mastery:v2', '{}');
    localStorage.setItem('real-or-ai-wall:prefs:v1', '{}');
    localStorage.setItem('someone-elses-key', 'keep');
    clearSavedProgress();
    expect(localStorage.getItem('real-or-ai-wall:mastery:v2')).toBeNull();
    expect(localStorage.getItem('real-or-ai-wall:prefs:v1')).toBeNull();
    expect(localStorage.getItem('someone-elses-key')).toBe('keep');
  });
});
