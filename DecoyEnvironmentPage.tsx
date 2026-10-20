import React, { useState } from 'react';
import { DemoNoticeBanner } from '../components/common/DemoNoticeBanner';
import { MockAdminPortal } from '../components/decoy/MockAdminPortal';
import { MockDatabaseBrowser } from '../components/decoy/MockDatabaseBrowser';
import { MockConfigViewer } from '../components/decoy/MockConfigViewer';
import { MockDocRepository } from '../components/decoy/MockDocRepository';
import { Lock, Database, FileCode, FileText, Sparkles } from 'lucide-react';

type DecoyTab = 'admin' | 'database' | 'config' | 'documents';

export const DecoyEnvironmentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DecoyTab>('admin');

  return (
    <div className="space-y-6">
      <DemoNoticeBanner />

      {/* Header */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Interactive Decoy Environment</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Interact directly with synthetic corporate honey-nodes. Every action (probe, login, query, download) safely generates real-time telemetry events.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/40 border border-cyan-800/40 rounded-lg text-xs text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fully Safe Educational Sandbox</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 pt-5 border-t border-slate-800/80 mt-4">
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'admin'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white bg-[#0B0F19] border border-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Decoy Admin Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'database'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white bg-[#0B0F19] border border-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Fictional Database Browser</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'config'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white bg-[#0B0F19] border border-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Configuration File Viewer</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'documents'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-white bg-[#0B0F19] border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Internal Document Repository</span>
          </button>
        </div>
      </div>

      {/* Render Active Decoy View */}
      {activeTab === 'admin' && <MockAdminPortal />}
      {activeTab === 'database' && <MockDatabaseBrowser />}
      {activeTab === 'config' && <MockConfigViewer />}
      {activeTab === 'documents' && <MockDocRepository />}
    </div>
  );
};
