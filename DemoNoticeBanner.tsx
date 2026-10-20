import React from 'react';
import { ShieldAlert, RefreshCw, Play } from 'lucide-react';
import { useDeception } from '../../context/DeceptionContext';
import { API_CONFIG } from '../../services/api';
import { adaptiveMode, ADAPTIVE_THRESHOLD } from '../../services/risk';

interface DemoNoticeBannerProps {
  onOpenSimulation?: () => void;
}

export const DemoNoticeBanner: React.FC<DemoNoticeBannerProps> = ({ onOpenSimulation }) => {
  const { resetToDefaultDemoData, isSimulating, backendHealthy, riskScore } = useDeception();
  const backendLabel = !API_CONFIG.useRealBackend
    ? 'LOCAL DEMO DATA'
    : backendHealthy ? 'BACKEND CONNECTED' : 'BACKEND UNAVAILABLE — NO MOCK FALLBACK';

  return (
    <div className="bg-[#111C35]/60 border border-cyan-900/40 rounded-lg p-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 text-slate-300">
        <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
        <div>
          <span className="font-semibold text-cyan-300 mr-2">{backendLabel}:</span>
          <span className="text-slate-400">
            {API_CONFIG.useRealBackend ? 'Management telemetry is stored in local SQLite. The separate honeypot captures incoming requests and redacts payload values.' : 'All IP addresses, credentials, databases, and events are synthetic mock data for university graduation demonstration.'}
          </span>
          <span className="text-amber-300 ml-2">Adaptive deception: {adaptiveMode(riskScore)} (threshold {ADAPTIVE_THRESHOLD}/100)</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        {onOpenSimulation && (
          <button
            onClick={onOpenSimulation}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              isSimulating
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
            }`}
          >
            <Play className="w-3 h-3" />
            <span>{isSimulating ? 'Scenario Active' : 'Run Scenario'}</span>
          </button>
        )}
        {!API_CONFIG.useRealBackend && <button
          onClick={resetToDefaultDemoData}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          title="Reset simulated events back to default demo state"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Demo</span>
        </button>}
      </div>
    </div>
  );
};
