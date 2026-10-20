import React from 'react';
import { SeverityLevel } from '../../types';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: 'sm' | 'md';
}

const severityConfig: Record<SeverityLevel, { label: string; textClass: string; bgClass: string; borderClass: string }> = {
  critical: {
    label: 'Critical',
    textClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/30'
  },
  high: {
    label: 'High',
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30'
  },
  medium: {
    label: 'Medium',
    textClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/30'
  },
  low: {
    label: 'Low',
    textClass: 'text-slate-400',
    bgClass: 'bg-slate-500/10',
    borderClass: 'border-slate-500/30'
  }
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'sm' }) => {
  const config = severityConfig[severity] || severityConfig.low;
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded font-mono uppercase tracking-wider ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${config.textClass} ${config.bgClass} ${config.borderClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {config.label}
    </span>
  );
};
