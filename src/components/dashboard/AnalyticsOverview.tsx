import React from 'react';
import { 
  TrendingUp 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface AnalyticsOverviewProps {
  metrics: any;
  revenueTrendData: any[];
  categoryPerformanceData: any[];
  formatCurrency: (value: number) => string;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ 
  metrics, 
  revenueTrendData, 
  categoryPerformanceData, 
  formatCurrency 
}) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Analytics Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-2 text-left relative overflow-hidden group hover:border-gold-pure/45 duration-300">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[9px] tracking-widest uppercase font-mono">TOTAL REVENUE</span>
            <TrendingUp className="w-4 h-4 text-gold-pure" />
          </div>
          <span className="text-2xl sm:text-3xl font-mono text-gold-pure font-bold block">
            {formatCurrency(metrics.totalRevenue)} SAR
          </span>
          <div className="flex justify-between text-[8.5px] font-mono text-zinc-500 pt-1 border-t border-white/5">
            <span>Monthly quota: {formatCurrency(metrics.monthlySales)} SAR</span>
            <span className="text-emerald-400 font-bold">+18.4%</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-2 text-left relative overflow-hidden group hover:border-gold-pure/45 duration-300">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[9px] tracking-widest uppercase font-mono">TOTAL ORDERS</span>
            <TrendingUp className="w-4 h-4 text-[#AA8C2C]" />
          </div>
          <span className="text-2xl sm:text-3xl font-mono text-white font-bold block">
            {metrics.totalOrders} Orders
          </span>
          <div className="flex justify-between text-[8.5px] font-mono text-zinc-500 pt-1 border-t border-white/5">
            <span>Active Pending: {metrics.pendingOrders}</span>
            <span className="text-amber-400 font-bold">Processing: {metrics.preparingOrders}</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-2 text-left relative overflow-hidden group hover:border-gold-pure/45 duration-300">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[9px] tracking-widest uppercase font-mono">TOTAL CUSTOMERS</span>
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-mono text-white font-bold block">
            {metrics.totalCustomers} Accounts
          </span>
          <div className="flex justify-between text-[8.5px] font-mono text-zinc-500 pt-1 border-t border-white/5">
            <span>Active Staff: {metrics.totalStaff}</span>
            <span className="text-gold-pure font-bold">100% Verified</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-2 text-left relative overflow-hidden group hover:border-gold-pure/45 duration-300">
          <div className="flex justify-between items-center text-zinc-500">
            <span className="text-[9px] tracking-widest uppercase font-mono">TOTAL PRODUCTS</span>
            <TrendingUp className="w-4 h-4 text-zinc-400" />
          </div>
          <span className="text-2xl sm:text-3xl font-mono text-white font-bold block">
            {metrics.totalProductsCount} Catalog Items
          </span>
          <div className="flex justify-between text-[8.5px] font-mono pt-1 border-t border-white/5">
            <span className="text-zinc-500">Out of Stock: {metrics.outOfStockCount}</span>
            <span className={metrics.lowStockCount > 0 ? 'text-red-400 font-bold animate-pulse' : 'text-zinc-500'}>
              Low Stock Alert: {metrics.lowStockCount}
            </span>
          </div>
        </div>

      </div>

      {/* 2. Interactive Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-8 bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-white text-[10px] font-display uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold-pure" /> Net Revenues Trend Analysis
            </h3>
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Live List Feed</span>
          </div>

          <div className="h-[250px] w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdminRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#222" tick={{ fill: '#666', fontSize: 10 }} />
                <YAxis stroke="#222" tick={{ fill: '#666', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#090909', borderColor: '#222', color: '#fff' }} />
                <Area type="monotone" dataKey="sales" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorAdminRev)" name="Revenues (SAR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-zinc-950 border border-white/5 p-5 rounded-xs space-y-4 text-left">
          <h3 className="text-white text-[10px] font-display uppercase tracking-widest border-b border-white/5 pb-3">
            CATEGORIES BREAKDOWN
          </h3>

          <div className="h-[180px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPerformanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryPerformanceData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#090909', borderColor: '#222' }} />
              </PieChart>
            </ResponsiveContainer>
            <p className="absolute text-[9px] uppercase font-display tracking-widest text-gold-pure font-bold">5 Categories</p>
          </div>

          <div className="space-y-2 text-[9px] font-mono">
            {categoryPerformanceData.map((entry, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-zinc-500 font-sans">{entry.name}</span>
                </div>
                <span className="text-white font-bold">{entry.value} items</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsOverview;
