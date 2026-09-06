import React, { useCallback, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface DashboardSyncStatusProps {
  onRefresh?: () => Promise<void> | void;
}

/**
 * Dashboard synchronization control.
 *
 * Important: this component never claims synchronization unless the refresh
 * operation has completed successfully. It intentionally avoids any
 * client-side "master records verified" assertion.
 */
export default function DashboardSyncStatus({ onRefresh }: DashboardSyncStatusProps) {
  const [status, setStatus] = useState<'idle' | 'refreshing' | 'verified' | 'failed'>('idle');

  const handleRefresh = useCallback(async () => {
    setStatus('refreshing');
    try {
      await onRefresh?.();
      setStatus('verified');
    } catch {
      setStatus('failed');
    }
  }, [onRefresh]);

  const label =
    status === 'refreshing'
      ? 'Refreshing…'
      : status === 'verified'
        ? 'Server data verified'
        : status === 'failed'
          ? 'Verification failed'
          : 'Server sync status unknown';

  return (
    <div className="flex items-center gap-2">
      <div
        className="hidden lg:flex items-center gap-2 border border-border/60 bg-background/40 px-3 py-1 rounded-full text-muted-foreground text-[9px] uppercase tracking-widest font-mono"
        aria-live="polite"
      >
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            status === 'verified'
              ? 'bg-emerald-500'
              : status === 'failed'
                ? 'bg-red-500'
                : status === 'refreshing'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-muted-foreground'
          }`}
        />
        <span>{label}</span>
      </div>

      <button
        type="button"
        onClick={handleRefresh}
        disabled={status === 'refreshing'}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background/50 hover:bg-background disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        aria-label="Refresh dashboard data"
      >
        <RefreshCw className={`w-4 h-4 ${status === 'refreshing' ? 'animate-spin' : ''}`} />
        Refresh Data
      </button>
    </div>
  );
}
