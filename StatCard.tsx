import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  subtext?: string;
  trend?: string;
  accentColor?: 'cyan' | 'teal' | 'rose' | 'amber' | 'slate';
}

const colorMap = {
  cyan: {
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    borderHover: 'hover:border-cyan-500/30'
  },
  teal: {
    iconBg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    borderHover: 'hover:border-teal-500/30'
  },
  rose: {
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    borderHover: 'hover:border-rose-500/30'
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    borderHover: 'hover:border-amber-500/30'
  },
  slate: {
    iconBg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    borderHover: 'hover:border-slate-500/30'
  }
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
  accentColor = 'cyan'
}) => {
  const colors = colorMap[accentColor] || colorMap.cyan;

  return (
    <div className={`bg-[#0F172A] border border-slate-800 rounded-xl p-5 transition-all duration-200 ${colors.borderHover}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 truncate">{label}</span>
        <div className={`p-2 rounded-lg border ${colors.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
          {value}
        </span>
        {trend && (
          <span className="text-xs text-slate-400 font-medium">{trend}</span>
        )}
      </div>
      {subtext && (
        <p className="text-xs text-slate-400 mt-1.5 truncate">{subtext}</p>
      )}
    </div>
  );
};
