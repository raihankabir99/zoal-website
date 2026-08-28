import React from 'react';

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div 
    className={`bg-gradient-to-r from-zinc-900 via-zinc-800/60 to-zinc-900 rounded-sm animate-pulse border border-white/[0.03] ${className}`}
    aria-hidden="true"
  />
);

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-zinc-950/80 border border-white/5 rounded-sm p-3.5 space-y-3 flex flex-col justify-between animate-pulse">
    <div className="w-full aspect-[4/5] bg-zinc-900/80 rounded-sm overflow-hidden relative border border-white/5">
      <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/40 via-transparent to-[#D4AF37]/5"></div>
    </div>
    <div className="space-y-2 pt-1">
      <div className="h-2.5 w-1/3 bg-zinc-800/60 rounded"></div>
      <div className="h-4 w-3/4 bg-zinc-800 rounded"></div>
      <div className="h-3 w-1/2 bg-zinc-900 rounded"></div>
    </div>
    <div className="flex items-center justify-between pt-2 border-t border-white/5">
      <div className="h-4 w-1/4 bg-zinc-800/80 rounded"></div>
      <div className="h-8 w-20 bg-zinc-800/60 rounded-sm"></div>
    </div>
  </div>
);

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const KpiCardSkeleton: React.FC = () => (
  <div className="bg-zinc-900/40 border border-white/5 p-4 rounded-sm space-y-3 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-3 w-1/3 bg-zinc-800 rounded"></div>
      <div className="w-6 h-6 bg-zinc-800/60 rounded-full"></div>
    </div>
    <div className="h-7 w-1/2 bg-zinc-800 rounded"></div>
    <div className="h-2.5 w-2/3 bg-zinc-900 rounded"></div>
  </div>
);

export const TableRowsSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="w-full space-y-2 animate-pulse">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex items-center space-x-3 p-3 bg-zinc-900/30 border border-white/5 rounded-sm">
        {Array.from({ length: cols }).map((_, c) => (
          <div 
            key={c} 
            className={`h-3 bg-zinc-800/60 rounded ${
              c === 0 ? 'w-1/4' : c === 1 ? 'w-1/3' : 'w-1/6'
            }`}
          />
        ))}
      </div>
    ))}
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse p-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-zinc-900/30 border border-white/5 p-5 rounded-sm space-y-4">
        <div className="h-4 w-1/4 bg-zinc-800 rounded"></div>
        <div className="h-48 w-full bg-zinc-800/40 rounded-sm"></div>
      </div>
      <div className="bg-zinc-900/30 border border-white/5 p-5 rounded-sm space-y-4">
        <div className="h-4 w-1/3 bg-zinc-800 rounded"></div>
        <TableRowsSkeleton rows={4} cols={2} />
      </div>
    </div>
  </div>
);

export const CmsFormSkeleton: React.FC = () => (
  <div className="space-y-5 p-4 bg-zinc-900/30 border border-white/5 rounded-sm animate-pulse">
    <div className="h-5 w-1/3 bg-zinc-800 rounded"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="h-3 w-1/4 bg-zinc-800/60 rounded"></div>
        <div className="h-10 w-full bg-zinc-900 rounded border border-white/5"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-1/4 bg-zinc-800/60 rounded"></div>
        <div className="h-10 w-full bg-zinc-900 rounded border border-white/5"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 w-1/5 bg-zinc-800/60 rounded"></div>
      <div className="h-24 w-full bg-zinc-900 rounded border border-white/5"></div>
    </div>
  </div>
);

export const GenericPageSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 py-10 space-y-8 animate-pulse">
    <div className="space-y-3 text-center max-w-xl mx-auto">
      <div className="h-3 w-1/4 mx-auto bg-zinc-800/60 rounded"></div>
      <div className="h-8 w-2/3 mx-auto bg-zinc-800 rounded"></div>
      <div className="h-4 w-1/2 mx-auto bg-zinc-900 rounded"></div>
    </div>
    <ProductGridSkeleton count={6} />
  </div>
);
