import React from 'react';
import { BarChart3, ClipboardList, PackageCheck, Bookmark, Users, Bell, User, Shield, ArrowUpRight, TrendingUp } from 'lucide-react';
import { MetricCard } from '../common/MetricCard';
import { formatCurrency } from '../../../utils';

interface OverviewDashboardProps {
  orders: any[];
  allProducts: any[];
  staffDutyStatus: string;
  staffLogs: any[];
  addStaffLog: (action: string, target: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ 
  orders, allProducts, staffDutyStatus, staffLogs, addStaffLog 
}) => {
  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Outstanding Orders" 
          value={orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length} 
          icon={ClipboardList} 
          desc="Awaiting artisan dispatch"
        />
        <MetricCard 
          label="Critical Stock" 
          value={allProducts.filter(p => p.inventory < 15).length} 
          icon={PackageCheck} 
          color="text-rose-500"
          desc="Stock level under 15 units"
        />
        <MetricCard 
          label="Tailoring" 
          value="3 Active" 
          icon={Bookmark} 
          color="text-indigo-400"
          desc="Premium custom thobe cuts"
        />
        <MetricCard 
          label="Duty Status" 
          value={`${staffDutyStatus} Duty`} 
          icon={Shield} 
          color="text-[#D4AF37]"
          desc="Last status sync: Live"
        />
      </div>
      
      {/* ... Add other overview modules ... */}
    </div>
  );
};
