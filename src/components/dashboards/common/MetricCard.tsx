import React from 'react';
import { motion } from 'motion/react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  desc?: string;
  color?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, desc, color = 'text-[#D4AF37]', onClick }) => (
  <button
    onClick={onClick}
    className={`bg-zinc-950 border border-white/5 hover:border-[#D4AF37]/30 hover:bg-zinc-950/85 duration-300 p-4 rounded-xs text-center relative group cursor-pointer flex flex-col justify-between h-28 focus:outline-none ${onClick ? '' : 'cursor-default'}`}
  >
    <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color} group-hover:scale-115 duration-300`} />
    <div>
      <span className="text-[8.5px] uppercase tracking-widest text-zinc-500 block mb-1 font-mono truncate">{label}</span>
      <span className="text-xl font-mono text-white font-bold block leading-none">{value}</span>
    </div>
    {desc && <span className="text-[7.5px] text-zinc-600 block leading-tight mt-1 truncate">{desc}</span>}
  </button>
);
