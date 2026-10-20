import React from 'react';
import { DecoyStatus, SessionStatus, AlertStatus } from '../../types';

interface StatusIndicatorProps {
  status: DecoyStatus | SessionStatus | AlertStatus | string;
  type?: 'decoy' | 'session' | 'alert';
}

const formatStatusText = (status: string): string => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, type = 'decoy' }) => {
  let colorClass = 'text-slate-400';
  let dotColor = 'bg-slate-400';

  if (status === 'active_decoy' || status === 'active' || status === 'new') {
    colorClass = 'text-emerald-400';
    dotColor = 'bg-emerald-400';
  } else if (status === 'canary_token' || status === 'monitored' || status === 'investigating') {
    colorClass = 'text-cyan-400';
    dotColor = 'bg-cyan-400';
  } else if (status === 'lure_file' || status === 'reviewed') {
    colorClass = 'text-amber-400';
    dotColor = 'bg-amber-400';
  } else if (status === 'isolated') {
    colorClass = 'text-rose-400';
    dotColor = 'bg-rose-400';
  } else if (status === 'resolved' || status === 'terminated' || status === 'dormant') {
    colorClass = 'text-slate-400';
    dotColor = 'bg-slate-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{formatStatusText(status)}</span>
    </span>
  );
};
