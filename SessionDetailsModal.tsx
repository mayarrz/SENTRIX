import React from 'react';
import { Session, SecurityEvent } from '../../types';
import { Modal } from '../common/Modal';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusIndicator } from '../common/StatusIndicator';
import { ShieldAlert, Terminal, Clock, ShieldCheck, Ban, Eye } from 'lucide-react';
import { useDeception } from '../../context/DeceptionContext';
import { API_CONFIG } from '../../services/api';

interface SessionDetailsModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  session,
  isOpen,
  onClose
}) => {
  const { events, updateSessionStatus } = useDeception();

  if (!session) return null;

  // Filter events belonging to this session
  const sessionEvents = events.filter(e => e.sessionId === session.id);

  const handleStatusChange = (status: 'isolated' | 'monitored' | 'terminated') => {
    updateSessionStatus(session.id, status);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Threat Session ${session.id}`}
      subtitle={`Source: ${session.sourceIdentifier} (${session.sourceSubnet})`}
      maxWidth="3xl"
    >
      <div className="space-y-5 text-xs">
        {/* Session Metadata Header */}
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Threat Severity:</span>
              <SeverityBadge severity={session.severity} size="md" />
              <span className="text-slate-400">·</span>
              <span className="text-slate-400">Status:</span>
              <StatusIndicator status={session.status} />
            </div>

            <div className="flex items-center gap-2">
              {session.status !== 'isolated' && (
                <button
                  onClick={() => handleStatusChange('isolated')}
                  disabled={API_CONFIG.useRealBackend}
                  className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 rounded font-medium flex items-center gap-1 transition-colors"
                >
                  <Ban className="w-3 h-3" />
                  <span>Set Isolated (simulated)</span>
                </button>
              )}
              {session.status !== 'monitored' && (
                <button
                  onClick={() => handleStatusChange('monitored')}
                  disabled={API_CONFIG.useRealBackend}
                  className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 rounded font-medium flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  <span>Set Monitored (simulated)</span>
                </button>
              )}
            </div>
            {API_CONFIG.useRealBackend && (
              <p className="basis-full text-[11px] text-amber-300/90" role="note">
                Session status changes are disabled in the browser. Use the protected localhost administration API with a Bearer token; the admin token is never sent to this UI.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
            <div>
              <span className="text-slate-400 block mb-0.5">Cumulative Risk Score</span>
              <span className="text-lg font-mono font-bold text-white tabular-nums">
                {session.cumulativeRiskScore}
                <span className="text-xs text-slate-400 font-normal"> / 100</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Attributed Adversary Tactic</span>
              <span className="font-semibold text-cyan-300">
                {session.attributedTactic}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">User-Agent Signature</span>
              <span className="font-mono text-slate-300 truncate block">
                {session.userAgent}
              </span>
            </div>
          </div>
        </div>

        {/* Risk Score Explanation */}
        <div className="p-3 bg-[#111C35]/40 border border-cyan-900/40 rounded-lg space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-cyan-300">
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span>Risk Score Breakdown ({session.cumulativeRiskScore} / 100)</span>
          </div>
          <p className="text-slate-400">
            Deterministic additive severity score. It is capped at 100 and only decreases on an authorized reset.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 ml-1">
            <li>Low +5, medium +12, high +22, and critical +35 per event</li>
            <li>Adaptive deception changes from standard to enhanced at 60 points</li>
            <li>Isolation and monitoring status are simulated labels; no host is controlled</li>
          </ul>
        </div>

        {/* Session Event History Timeline */}
        <div>
          <h4 className="font-semibold text-slate-200 mb-2 flex items-center justify-between">
            <span>Session Event History ({sessionEvents.length} recorded)</span>
            <span className="font-normal text-slate-400 text-[11px]">Latest first</span>
          </h4>

          {sessionEvents.length === 0 ? (
            <p className="text-slate-400 p-4 text-center border border-slate-800 rounded-lg">
              No specific events logged for this session yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {sessionEvents.map((e, idx) => (
                <div
                  key={e.id}
                  className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-lg flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-medium">
                        {e.id}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-semibold text-slate-200">
                        {e.resourceName}
                      </span>
                    </div>
                    <p className="text-slate-300">{e.details}</p>
                    {e.rawPayloadSnippet && (
                      <pre className="p-1.5 bg-[#0B0F19] rounded border border-slate-800 font-mono text-[10px] text-slate-400 overflow-x-auto">
                        {e.rawPayloadSnippet}
                      </pre>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <SeverityBadge severity={e.severity} />
                    <span className="block text-[10px] font-mono text-slate-400 mt-1 tabular-nums">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
