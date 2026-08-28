import React from 'react';
import { BarChart3, ClipboardList, PackageCheck, Bookmark, Users, Bell, User, Shield, LogOut } from 'lucide-react';

interface SidebarItem {
  id: string;
  name: string;
  icon: React.ElementType;
}

interface SidebarGroup {
  title: string;
  icon: React.ElementType;
  items: SidebarItem[];
}

interface SidebarProps {
  groups: SidebarGroup[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onLogout?: () => void;
}

export const DashboardSidebar: React.FC<SidebarProps> = ({ groups, activeTab, onTabChange, onLogout }) => {
  return (
    <div className="hidden lg:block w-64 shrink-0 bg-zinc-950 border border-white/5 rounded-sm p-4 space-y-4">
      {groups.map((group, groupIdx) => (
        <div key={groupIdx} className="space-y-1">
          <div className="flex items-center gap-2 px-3 py-1 text-[8px] font-mono uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">
            <group.icon className="w-3.5 h-3.5 text-[#D4AF37]/70" />
            <span>{group.title}</span>
          </div>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full text-left py-2 px-3 flex items-center gap-3 text-[9px] font-display uppercase tracking-[0.15em] transition-all rounded-xs cursor-pointer ${
                  activeTab === item.id 
                    ? 'bg-[#D4AF37] text-black font-bold shadow-[0_4px_12px_rgba(212,175,55,0.15)]' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      {onLogout && (
        <button
          onClick={onLogout}
          className="w-full text-left py-2.5 px-3 flex items-center gap-3 text-[9px] font-display uppercase tracking-[0.15em] transition-all rounded-xs text-rose-500/80 hover:text-rose-400 hover:bg-rose-950/20 border-t border-white/5 pt-4 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>Log Out Session</span>
        </button>
      )}
    </div>
  );
};
