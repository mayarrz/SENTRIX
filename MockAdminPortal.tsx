import React, { useState } from 'react';
import { Shield, KeyRound, Lock, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { useDeception } from '../../context/DeceptionContext';

export const MockAdminPortal: React.FC = () => {
  const { triggerDecoyInteraction } = useDeception();
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('********');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);

  const handleLoginAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLastActionStatus(null);

    await triggerDecoyInteraction(
      'AST-DEC-01',
      'DECOY_LOGIN_ATTEMPT',
      `Simulated authentication probe on Decoy Admin Portal with username "${username}"`,
      `POST /api/v1/auth/login HTTP/1.1\nHost: admin-sso.corporate.local\nPayload: {"user": "${username}", "auth": "REDACTED_MOCK"}`,
      'high'
    );

    setSubmitting(false);
    setLastActionStatus('Decoy credentials captured. Fake authentication denied to delay attacker.');
  };

  const handleAuditExport = async () => {
    setSubmitting(true);
    await triggerDecoyInteraction(
      'AST-DEC-01',
      'DATA_EXPORT_ATTEMPT',
      'Simulated unauthorized administrative audit log export requested.',
      'GET /admin/v2/audit-logs/export.json HTTP/1.1',
      'critical'
    );
    setSubmitting(false);
    setLastActionStatus('Admin Audit Export decoy triggered. High-risk telemetry broadcasted.');
  };

  const handleToggleMaintenance = async () => {
    const nextState = !maintenanceMode;
    setMaintenanceMode(nextState);
    await triggerDecoyInteraction(
      'AST-DEC-01',
      'DECOY_LOGIN_ATTEMPT',
      `Simulated administrative state change attempt: Maintenance Mode toggled to ${nextState ? 'ON' : 'OFF'}`,
      `PUT /admin/system/state {"maintenance": ${nextState}}`,
      'high'
    );
    setLastActionStatus(`Decoy Maintenance state toggled. Telemetry logged.`);
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 space-y-6">
      {/* Banner */}
      <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg flex items-center justify-between text-xs text-cyan-300">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
          <span><strong>FICTIONAL DECOY PORTAL:</strong> Safe sandbox. Interacting triggers simulated SOC alerts.</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">Target ID: AST-DEC-01</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mock Login Section */}
        <div className="bg-[#0B0F19] p-5 rounded-xl border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white">Mock Executive SSO Portal</h4>
          </div>
          <p className="text-xs text-slate-400">
            Adversaries encountering this decoy attempt credential stuffing or default passwords.
          </p>

          <form onSubmit={handleLoginAttempt} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Decoy Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-[#111C35] border border-slate-700 rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-cyan-500 font-mono"
                placeholder="e.g. admin, executive, root"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Decoy Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#111C35] border border-slate-700 rounded px-3 py-1.5 text-xs text-white focus:outline-hidden focus:border-cyan-500 font-mono"
                placeholder="e.g. Winter2026!"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs rounded transition-colors"
              >
                {submitting ? 'Transmitting Probe...' : 'Simulate Login Probe'}
              </button>

              <button
                type="button"
                onClick={() => { setUsername('root'); setPassword('HoneyPass!2026'); }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition-colors"
              >
                Auto-fill Bait
              </button>
            </div>
          </form>
        </div>

        {/* Mock Admin Controls Decoy Trap */}
        <div className="bg-[#0B0F19] p-5 rounded-xl border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-semibold text-white">Privileged Trap Actions</h4>
          </div>
          <p className="text-xs text-slate-400">
            Fictional administrative controls that adversaries target after bypassing front authentication.
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">System Maintenance Mode</span>
                <span className="text-[11px] text-slate-400">Simulates setting core services to offline</span>
              </div>
              <button
                onClick={handleToggleMaintenance}
                className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                  maintenanceMode
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {maintenanceMode ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">System Audit Logs</span>
                <span className="text-[11px] text-slate-400">High-value decoy export containing lure tokens</span>
              </div>
              <button
                onClick={handleAuditExport}
                disabled={submitting}
                className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded text-xs font-medium transition-colors"
              >
                Trigger Export Lure
              </button>
            </div>
          </div>
        </div>
      </div>

      {lastActionStatus && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{lastActionStatus} Check <strong>Event Logs</strong> or <strong>Threat Monitoring</strong> to see the recorded event!</span>
        </div>
      )}
    </div>
  );
};
