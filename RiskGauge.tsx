import React from 'react';
import { SeverityLevel } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';

interface RiskGaugeProps {
  score: number; // 0 - 100
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score }) => {
  const getSeverity = (val: number): SeverityLevel => {
    if (val >= 80) return 'critical';
    if (val >= 60) return 'high';
    if (val >= 35) return 'medium';
    return 'low';
  };

  const severity = getSeverity(score);

  // Meter percentage (max 100%)
  const clamped = Math.max(0, Math.min(100, score));

  // Determine stroke color
  const colorHex = 
    severity === 'critical' ? '#F43F5E' :
    severity === 'high' ? '#F59E0B' :
    severity === 'medium' ? '#06B6D4' : '#10B981';

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 text-left">Aggregated Risk Score</h3>
          <p className="text-xs text-slate-400 text-left">Heuristic scoring calculated from honeynet telemetry</p>
        </div>
        <SeverityBadge severity={severity} size="md" />
      </div>

      <div className="relative w-44 h-44 flex items-center justify-center my-2">
        {/* SVG Circular Gauge */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="48"
            className="stroke-slate-800 fill-none"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="48"
            className="fill-none transition-all duration-700 ease-out"
            strokeWidth="8"
            stroke={colorHex}
            strokeDasharray={301.6}
            strokeDashoffset={301.6 - (clamped / 100) * 301.6}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-4xl font-bold font-mono tracking-tight text-white tabular-nums">
            {score}
          </span>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
            / 100 MAX
          </span>
        </div>
      </div>

      {/* Severity Band Labels */}
      <div className="w-full grid grid-cols-4 gap-1 pt-4 border-t border-slate-800/80 text-[11px] font-mono text-center">
        <div className={`p-1 rounded ${score < 35 ? 'bg-slate-800 text-emerald-300 font-semibold' : 'text-slate-400'}`}>
          0-34 Low
        </div>
        <div className={`p-1 rounded ${score >= 35 && score < 60 ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400'}`}>
          35-59 Med
        </div>
        <div className={`p-1 rounded ${score >= 60 && score < 80 ? 'bg-slate-800 text-amber-300 font-semibold' : 'text-slate-400'}`}>
          60-79 High
        </div>
        <div className={`p-1 rounded ${score >= 80 ? 'bg-slate-800 text-rose-300 font-semibold' : 'text-slate-400'}`}>
          80+ Crit
        </div>
      </div>
    </div>
  );
};
