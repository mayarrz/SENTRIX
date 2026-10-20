import React, { useState, useEffect } from 'react';
import { PageId } from './Sidebar';
import { Play, RotateCcw, Clock, ShieldAlert } from 'lucide-react';
import { useDeception } from '../../context/DeceptionContext';
import { API_CONFIG } from '../../services/api';

interface HeaderProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

const PAGE_TITLES: Record<PageId, { title: string; category: string }> = {
  overview: { title: 'Overview Dashboard', category: 'Executive Telemetry' },
  assets: { title: 'Protected Assets & Honeypots', category: 'Decoy Inventory' },
  threats: { title: 'Threat Monitoring', category: 'Adversary Tracking' },
  decoys: { title: 'Decoy Environment', category: 'Interactive Traps' },
  risk: { title: 'Risk Analysis', category: 'Scoring Engine' },
  simulation: { title: 'Simulation Center', category: 'Scenario Replay' },
  alerts: { title: 'Security Alerts', category: 'Incident Queue' },
  logs: { title: 'Event Logs', category: 'Audit Trail' },
  analytics: { title: 'Deception Analytics', category: 'Trend Analysis' },
  settings: { title: 'Platform Settings', category: 'Configuration' }
};

export const Header: React.FC<HeaderProps> = ({ activePage, onNavigate }) => {
  const { isSimulating, resetToDefaultDemoData, riskScore } = useDeception();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const meta = PAGE_TITLES[activePage] || { title: 'Dashboard', category: 'SENTRIX' };

  return (
    <header className="h-16 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between gap-6 shrink-0 z-20">
      {/* Zone 1: Contextual Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-medium text-slate-400 hidden sm:inline whitespace-nowrap">
          {meta.category}
        </span>
        <span className="text-slate-400 hidden sm:inline" aria-hidden="true">/</span>
        <h1 className="text-sm font-semibold text-slate-100 truncate">
          {meta.title}
        </h1>
      </div>

      {/* Zone 2: Simulated Environment Badge */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/30 border border-cyan-800/40 rounded text-xs text-cyan-300">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium">SIMULATION MODE</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300">Active Risk Score: <strong className="font-mono text-cyan-300 tabular-nums">{riskScore}/100</strong></span>
        </div>
      </div>

      {/* Zone 3: Actions & System Clock */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-400 px-2 py-1 bg-slate-900 border border-slate-800 rounded tabular-nums">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime || '12:00:00 UTC'}</span>
        </div>

        <button
          onClick={() => onNavigate('simulation')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
            isSimulating
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 border-cyan-500 font-semibold shadow-xs'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isSimulating ? 'Sim In Progress' : 'Start Simulation'}</span>
        </button>

        {!API_CONFIG.useRealBackend && <button
          onClick={resetToDefaultDemoData}
          title="Reset simulated data"
          aria-label="Reset demo state"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>}
      </div>
    </header>
  );
};
