import React from 'react';
import { DemoNoticeBanner } from '../components/common/DemoNoticeBanner';
import { ScenarioPlayer } from '../components/simulation/ScenarioPlayer';
import { PlayCircle, ShieldAlert, Cpu } from 'lucide-react';

export const SimulationCenterPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <DemoNoticeBanner />

      {/* Header */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Controlled Attack Simulation Center</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Replay standardized adversarial campaigns (MITRE ATT&CK patterns) against SENTRIX honeypots to demonstrate detection and scoring capabilities.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/40 border border-cyan-800/40 rounded-lg text-xs text-cyan-300">
            <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Scenario Playback Engine</span>
          </div>
        </div>
      </div>

      {/* Scenario Player Component */}
      <ScenarioPlayer />
    </div>
  );
};
