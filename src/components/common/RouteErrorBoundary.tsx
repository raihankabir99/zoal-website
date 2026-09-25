import React from 'react';

type Props = {
  children: React.ReactNode;
  fallbackTitle?: string;
};

type State = {
  hasError: boolean;
  errorMessage?: string;
};

export default class RouteErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Unexpected application error',
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[ZOAL RouteErrorBoundary]', error, info);
  }

  retry = () => {
    this.setState({ hasError: false, errorMessage: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[50vh] flex items-center justify-center px-6 py-20 text-center text-white bg-black">
        <div className="max-w-md space-y-4">
          <div className="text-[#D4AF37] text-xs font-semibold tracking-[0.25em] uppercase">
            {this.props.fallbackTitle || 'Section unavailable'}
          </div>
          <p className="text-zinc-400 text-sm leading-6">
            This section could not be rendered. Your data has not been changed.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.retry}
              className="bg-[#D4AF37] text-black px-4 py-2 text-xs font-bold uppercase tracking-widest"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="border border-white/15 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest"
            >
              Reload
            </button>
          </div>
          {import.meta.env.DEV && this.state.errorMessage ? (
            <pre className="mt-4 max-h-32 overflow-auto text-left text-[10px] text-zinc-600 whitespace-pre-wrap">
              {this.state.errorMessage}
            </pre>
          ) : null}
        </div>
      </div>
    );
  }
}
