import React, { useState } from 'react';
import { Asset } from '../../types';
import { Modal } from '../common/Modal';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusIndicator } from '../common/StatusIndicator';
import { Copy, Check, Zap, Server, Shield } from 'lucide-react';
import { useDeception } from '../../context/DeceptionContext';

interface AssetDetailsModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AssetDetailsModal: React.FC<AssetDetailsModalProps> = ({
  asset,
  isOpen,
  onClose
}) => {
  const { triggerDecoyInteraction } = useDeception();
  const [copied, setCopied] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);

  if (!asset) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualTrip = async () => {
    setTesting(true);
    await triggerDecoyInteraction(
      asset.id,
      asset.type === 'admin_portal' ? 'DECOY_LOGIN_ATTEMPT' :
      asset.type === 'database_record' ? 'DATABASE_QUERY_EXPLORATION' :
      asset.type === 'config_file' ? 'CONFIGURATION_DOWNLOAD' : 'CANARY_TOKEN_TRIGGERED',
      `Manual operator probe dispatched to test decoy response on "${asset.name}"`
    );
    setTimeout(() => setTesting(false), 500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={asset.name}
      subtitle={`Asset Identifier: ${asset.id}`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Top Badges & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Risk Assessment:</span>
            <SeverityBadge severity={asset.riskLevel} size="md" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Deception Mode:</span>
            <StatusIndicator status={asset.decoyStatus} />
          </div>
        </div>

        {/* Technical Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
            <span className="text-slate-400 block mb-1">Resource Category</span>
            <span className="font-semibold text-slate-200 capitalize font-mono">
              {asset.type.replace('_', ' ')}
            </span>
          </div>

          <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
            <span className="text-slate-400 block mb-1">Deployed Honeynet Zone</span>
            <span className="font-semibold text-cyan-300 font-mono">
              {asset.deployedEnvironment}
            </span>
          </div>

          <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg sm:col-span-2">
            <span className="text-slate-400 block mb-1">Synthetic Resource Path</span>
            <div className="flex items-center justify-between gap-2 bg-[#0B0F19] p-2 rounded border border-slate-800 font-mono text-cyan-300 text-xs">
              <span className="truncate">{asset.fakeResourcePath}</span>
              <button
                onClick={() => handleCopy(asset.fakeResourcePath)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                title="Copy fake path"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Canary Payload Box */}
        {asset.canaryPayload && (
          <div className="p-3 bg-[#111C35]/40 border border-cyan-900/40 rounded-lg text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Embedded Canary Token Payload</span>
              </div>
              <button
                onClick={() => handleCopy(asset.canaryPayload || '')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Token</span>
              </button>
            </div>
            <code className="block bg-[#0B0F19] p-2 rounded border border-slate-800 font-mono text-slate-300 text-[11px] break-all">
              {asset.canaryPayload}
            </code>
            <p className="text-[11px] text-slate-400">
              When an adversary copies, parses, or queries this token, external telemetry triggers immediate incident escalation.
            </p>
          </div>
        )}

        {/* Description & Deception Strategy */}
        <div className="space-y-3 text-xs">
          <div>
            <h4 className="font-semibold text-slate-200 mb-1">Deception Strategy & Intent</h4>
            <p className="text-slate-400 leading-relaxed bg-slate-900/30 p-3 rounded-lg border border-slate-800">
              {asset.deceptionStrategy}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-1">Architecture Description</h4>
            <p className="text-slate-400 leading-relaxed">
              {asset.description}
            </p>
          </div>
        </div>

        {/* Telemetry Stats & Action Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs font-mono text-slate-400">
            Total Trips: <span className="text-white font-bold tabular-nums">{asset.interactionCount}</span>
            <span className="mx-2 text-slate-400">·</span>
            Last: <span className="text-slate-300">{new Date(asset.lastSimulatedInteraction).toLocaleTimeString()}</span>
          </div>

          <button
            onClick={handleManualTrip}
            disabled={testing}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{testing ? 'Transmitting Probe...' : 'Trigger Test Interaction'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
