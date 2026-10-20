import React, { useState } from 'react';
import { useDeception } from '../context/DeceptionContext';
import { DemoNoticeBanner } from '../components/common/DemoNoticeBanner';
import {
  RotateCcw,
  Sliders,
  CheckCircle,
  Code2,
  Shield,
  Zap,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';
import { API_CONFIG } from '../services/api';

export const SettingsPage: React.FC = () => {
  const {
    autoRefresh,
    setAutoRefresh,
    simulationSpeed,
    setSimulationSpeed,
    resetToDefaultDemoData
  } = useDeception();

  const [resetDone, setResetDone] = useState<boolean>(false);
  const [activeTheme, setActiveTheme] = useState<'midnight' | 'charcoal'>('midnight');

  const handleReset = () => {
    resetToDefaultDemoData();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  return (
    <div className="space-y-6">
      <DemoNoticeBanner />

      {/* Header */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Platform Demonstration Settings</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Frontend demonstration preferences, simulation controls, and backend integration parameters
            </p>
          </div>

          <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-lg">
            Local SQLite · Demo Mode
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demonstration Preferences */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Demonstration Controls</h3>
          </div>

          {/* Simulation Speed */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-200 block">
              Simulation Scenario Playback Speed
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(speed => (
                <button
                  key={speed}
                  onClick={() => setSimulationSpeed(speed)}
                  className={`py-2 text-xs font-mono font-medium rounded-lg border transition-colors ${
                    simulationSpeed === speed
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {speed}x Velocity
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              Accelerates step transitions during automated attack replay demonstrations.
            </p>
          </div>

          {/* Auto Refresh */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Simulated Background Polling
                </span>
                <span className="text-[11px] text-slate-400">
                  Refreshes telemetry timestamps and active honeynet status
                </span>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  autoRefresh
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {autoRefresh ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Reset Demo State */}
          <div className="space-y-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-rose-300 block">
                  Reset Simulated State & Local Cache
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Clears locally recorded demo interactions and restores the standard initial 8 assets and baseline event stream.
                </p>
              </div>
              <button
                onClick={handleReset}
                disabled={API_CONFIG.useRealBackend}
                title={API_CONFIG.useRealBackend ? 'Remote reset is disabled in the UI; use the protected localhost API with ADMIN_TOKEN.' : undefined}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            </div>

            {resetDone && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/50 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Initial demonstration dataset successfully reloaded!</span>
              </div>
            )}
          </div>
        </div>

        {/* Backend Team Integration Architecture Panel */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Backend Integration Contract</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            SENTRIX uses a local SQLite management API and a separate optional honeypot listener. Browser requests pass through <code className="text-cyan-300 font-mono text-[11px]">src/services/api.ts</code>.
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 bg-[#0B0F19] rounded-lg border border-slate-800">
              <span className="font-semibold text-slate-300 block mb-1">1. Base URL Configuration</span>
              <p className="text-[11px] text-slate-400">
                Set <code className="text-cyan-400 font-mono">VITE_API_BASE_URL=/api/v1</code> in your <code className="font-mono text-slate-300">.env</code> file.
              </p>
            </div>

            <div className="p-2.5 bg-[#0B0F19] rounded-lg border border-slate-800">
              <span className="font-semibold text-slate-300 block mb-1">2. Switch Backend Mode</span>
              <p className="text-[11px] text-slate-400">
                Set <code className="text-cyan-400 font-mono">VITE_USE_REAL_BACKEND=true</code> to use the local HTTP and SQLite backend. If it is unavailable, the status banner reports the problem instead of switching to mock data.
              </p>
            </div>

            <div className="p-2.5 bg-[#0B0F19] rounded-lg border border-slate-800">
              <span className="font-semibold text-slate-300 block mb-1">3. Expected REST Endpoints</span>
              <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-400">
                <li><code className="text-slate-300">GET /api/v1/assets</code> - Returns Asset[]</li>
                <li><code className="text-slate-300">GET /api/v1/events</code> - Returns SecurityEvent[]</li>
                <li><code className="text-slate-300">GET /api/v1/sessions</code> - Returns Session[]</li>
                <li><code className="text-slate-300">GET /api/v1/alerts</code> - Returns Alert[]</li>
                <li><code className="text-slate-300">GET /api/v1/risk/analysis</code> - Returns RiskScoreAnalysis</li>
                <li><code className="text-slate-300">POST /api/v1/simulation/trigger-event</code> - Receives telemetry</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Graduation Project Information Card */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">About SENTRIX — Academic Project Information</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          SENTRIX (Adaptive Cyber Deception Platform) is designed as a university graduation project exploring modern active defense and cyber deception methodologies. In contrast to conventional passive monitoring, deception technologies deploy realistic synthetic honeypots, fake credentials, and canary tokens across enterprise network perimeters to reliably detect malicious lateral reconnaissance with near-zero false positive rates.
        </p>
        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
          <span>Project Name: <strong>SENTRIX</strong></span>
          <span>·</span>
          <span>Role: Frontend UI/UX Architecture</span>
          <span>·</span>
          <span>Target Audience: Cybersecurity SOC Operators & Evaluation Panel</span>
        </div>
      </div>
    </div>
  );
};
