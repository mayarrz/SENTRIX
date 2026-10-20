import React, { useState, useMemo } from 'react';
import { useDeception } from '../context/DeceptionContext';
import { Alert, SeverityLevel, AlertStatus } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { Modal } from '../components/common/Modal';
import { DemoNoticeBanner } from '../components/common/DemoNoticeBanner';
import { API_CONFIG } from '../services/api';
import {
  Bell,
  Search,
  Filter,
  CheckCircle,
  Eye,
  ShieldAlert,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { alerts, updateAlertStatus } = useDeception();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSearch =
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.relatedResourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.summary.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [alerts, searchQuery, severityFilter, statusFilter]);

  const handleStatusChange = async (alertId: string, status: AlertStatus) => {
    await updateAlertStatus(alertId, status);
    if (selectedAlert && selectedAlert.id === alertId) {
      setSelectedAlert(prev => prev ? { ...prev, status } : null);
    }
  };

  return (
    <div className="space-y-6">
      <DemoNoticeBanner />

      {/* Header & Filter Controls */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Security Alerts & Incidents</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              High-priority incidents escalated from honeypot interactions and canary token breaches
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Active alerts: <strong className="text-cyan-300 font-mono">{filteredAlerts.length}</strong>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search alert title, ID, target resource..."
              className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="investigating">Investigating</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111C35]/60 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-normal">Alert ID</th>
                <th className="py-3 px-4 font-normal">Alert Details</th>
                <th className="py-3 px-4 font-normal">Target Decoy</th>
                <th className="py-3 px-4 font-normal">Severity</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal">Timestamp</th>
                <th className="py-3 px-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No security alerts matching the current criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map(alert => (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono text-cyan-400 whitespace-nowrap">
                      {alert.id}
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-slate-200 block">
                          {alert.title}
                        </span>
                        <span className="text-[11px] text-slate-400 line-clamp-1 max-w-md">
                          {alert.summary}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {alert.relatedResourceName}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <SeverityBadge severity={alert.severity} />
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusIndicator status={alert.status} />
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap tabular-nums">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAlert(alert);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium border border-slate-700 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <Modal
          isOpen={Boolean(selectedAlert)}
          onClose={() => setSelectedAlert(null)}
          title={selectedAlert.title}
          subtitle={`Incident: ${selectedAlert.id} · Associated with session ${selectedAlert.sessionId}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Severity:</span>
                <SeverityBadge severity={selectedAlert.severity} size="md" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Investigation Status:</span>
                <StatusIndicator status={selectedAlert.status} />
              </div>
            </div>

            <div className="p-3 bg-[#111C35]/40 border border-slate-800 rounded-lg space-y-1">
              <span className="text-slate-400 block">Incident Summary</span>
              <p className="text-slate-200 leading-relaxed">
                {selectedAlert.summary}
              </p>
            </div>

            <div className="p-3 bg-[#111C35]/40 border border-slate-800 rounded-lg space-y-1">
              <span className="text-slate-400 block">Trigger Heuristic</span>
              <p className="text-cyan-300 font-mono text-[11px]">
                {selectedAlert.triggerFactor}
              </p>
            </div>

            <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg space-y-1 text-amber-200">
              <span className="font-semibold block flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Recommended Deception Mitigation</span>
              </span>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                {selectedAlert.recommendedAction}
              </p>
            </div>

            {/* Status Change Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-slate-400 text-[11px]">
                {API_CONFIG.useRealBackend ? 'Status changes are disabled in the browser. Use the protected localhost administration API with a Bearer token; the admin token is never sent to this UI.' : 'Change Incident Status:'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange(selectedAlert.id, 'investigating')}
                  disabled={selectedAlert.status === 'investigating' || API_CONFIG.useRealBackend}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded transition-colors disabled:opacity-40"
                >
                  Investigating
                </button>
                <button
                  onClick={() => handleStatusChange(selectedAlert.id, 'reviewed')}
                  disabled={selectedAlert.status === 'reviewed' || API_CONFIG.useRealBackend}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded transition-colors disabled:opacity-40"
                >
                  Mark Reviewed
                </button>
                <button
                  onClick={() => handleStatusChange(selectedAlert.id, 'resolved')}
                  disabled={selectedAlert.status === 'resolved' || API_CONFIG.useRealBackend}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold rounded transition-colors disabled:opacity-40"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
