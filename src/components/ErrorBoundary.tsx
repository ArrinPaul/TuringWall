import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearSavedProgress } from '../storage/clear';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  failed: boolean;
  confirmingReset: boolean;
}

/**
 * Last line of defence: a render error anywhere below shows a recoverable message
 * instead of a blank page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false, confirmingReset: false };

  static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('TuringWall render error:', error, info.componentStack);
  }

  private reload = () => {
    window.location.reload();
  };

  private reset = () => {
    if (!this.state.confirmingReset) {
      this.setState({ confirmingReset: true });
      return;
    }
    clearSavedProgress();
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="w-full min-h-screen bg-ink text-paper font-body flex items-center justify-center p-6">
        <div role="alert" className="max-w-md border border-panel-line bg-panel p-6">
          <h1 className="font-display text-2xl mb-2">Something went wrong</h1>
          <p className="text-muted text-sm leading-relaxed mb-5">
            The game hit an unexpected error. Reloading usually fixes it, and your saved progress is kept.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.reload}
              className="min-h-11 px-5 bg-signal text-ink font-600 font-mono text-xs uppercase tracking-wider cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.reset}
              className="min-h-11 px-4 border border-panel-line text-muted hover:text-paper font-mono text-xs uppercase tracking-wider cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal"
            >
              {this.state.confirmingReset ? 'Confirm: erase saved progress' : 'Reset saved progress'}
            </button>
          </div>
        </div>
      </main>
    );
  }
}
