import React, { useState } from 'react';
import { FileCode, Download, ShieldCheck, Copy, Check, ShieldAlert, CheckCircle } from 'lucide-react';
import { useDeception } from '../../context/DeceptionContext';
import { MOCK_CONFIG_FILES } from '../../data/mockData';

export const MockConfigViewer: React.FC = () => {
  const { triggerDecoyInteraction } = useDeception();
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const file = MOCK_CONFIG_FILES[selectedFileIdx];

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadConfig = async () => {
    setStatusMessage(null);
    await triggerDecoyInteraction(
      'AST-DEC-04',
      'CONFIGURATION_DOWNLOAD',
      `Simulated extraction of bait configuration file "${file.filename}"`,
      `GET ${file.path} HTTP/1.1\nHost: backup-stage.corp\nUser-Agent: Simulated-Recon/1.0`,
      'critical'
    );

    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(url);

    setStatusMessage(`Canary configuration "${file.filename}" downloaded. Critical file exfiltration event recorded.`);
  };

  const handleTripCanaryKey = async () => {
    setStatusMessage(null);
    await triggerDecoyInteraction(
      'AST-DEC-04',
      'CANARY_TOKEN_TRIGGERED',
      `Critical: Honey-token AWS key "AKIA_MOCK_CANARY_HONEY_KEY_88" tested against external authentication gate`,
      `aws sts get-caller-identity --access-key AKIA_MOCK_CANARY_HONEY_KEY_88\n[CANARY GATEWAY INTERCEPTION]`,
      'critical'
    );
    setStatusMessage(`Canary Token tripped! Out-of-band notification dispatched to SOC.`);
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 space-y-6">
      {/* Banner */}
      <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg flex items-center justify-between text-xs text-cyan-300">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
          <span><strong>CANARY CONFIGURATION TRAPS:</strong> Fictional secrets seeded with tripwire tokens.</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">Target ID: AST-DEC-04</span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {MOCK_CONFIG_FILES.map((f, idx) => (
          <button
            key={f.filename}
            onClick={() => setSelectedFileIdx(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 ${
              selectedFileIdx === idx
                ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{f.filename}</span>
          </button>
        ))}
      </div>

      {/* File Card */}
      <div className="bg-[#0B0F19] rounded-xl border border-slate-800 overflow-hidden space-y-0">
        <div className="p-3 bg-[#111C35]/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-300 font-semibold">{file.path}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-400 text-[11px]">Updated {file.updated}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-white rounded border border-slate-700 bg-slate-800 transition-colors"
              title="Copy contents"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleDownloadConfig}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Download File</span>
            </button>

            <button
              onClick={handleTripCanaryKey}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-medium transition-colors"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Simulate Token Trip</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <pre className="p-4 font-mono text-xs text-slate-300 bg-[#0B0F19] overflow-x-auto leading-relaxed select-all">
          {file.content}
        </pre>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
};
