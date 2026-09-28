import React from 'react';

interface Props {
  children: React.ReactNode;
  onRetry: () => void;
}

interface State {
  hasError: boolean;
}

export default class AdminDashboardErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AdminDashboard] Section render failure:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onRetry();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="w-full max-w-lg border border-red-500/20 bg-zinc-950 p-6 text-center rounded-xs">
          <div className="text-[10px] font-mono uppercase tracking-widest text-red-400 mb-2">
            Admin Section Error
          </div>
          <p className="text-sm text-zinc-300 mb-5">
            This admin section could not render. Your data was not changed.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="bg-gold-pure text-black px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-xs hover:bg-gold-light"
          >
            Retry Section
          </button>
        </div>
      </div>
    );
  }
}
