'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[MapErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="h-full w-full rounded-lg border border-border flex items-center justify-center bg-muted/30">
            <div className="text-center p-6">
              <div className="text-lg font-semibold text-muted-foreground">Map unavailable</div>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Something went wrong loading the map.
              </p>
              <button
                className="mt-3 text-sm text-syncora-500 hover:underline cursor-pointer"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
