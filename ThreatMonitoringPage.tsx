import React, { useState, useMemo } from 'react';
import { useDeception } from '../context/DeceptionContext';
import { API_CONFIG } from '../services/api';
import { Session, SeverityLevel, SessionStatus } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { SessionDetailsModal } from '../components/monitoring/SessionDetailsModal';
import { DemoNoticeBanner } from '../components/common/DemoNoticeBanner';
import { Search, Radio, Eye, Ban, ShieldAlert, Laptop, ArrowUpRight } from 'lucide-react';

export const ThreatMonitoringPage: React.FC = () => {
  const { sessions, updateSessionStatus } = useDeception();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const matchesSearch =
        session.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.sourceIdentifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.sourceSubnet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.attributedTactic.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = severityFilter === 'all' || session.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || session.status === statusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [sessions, searchQuery, severityFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <DemoNoticeBanner />

      {/* Header & Controls */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Live Threat Sessions & Honeypot Probers</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Observed honeypot and simulated interactions grouped by network origin and session risk
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Tracking <strong className="text-cyan-300 font-mono">{filteredSessions.length}</strong> simulated sessions
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search session ID, source IP, subnet..."
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
              <option value="active">Active</option>
              <option value="monitored">Monitored</option>
              <option value="isolated">Isolated</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {API_CONFIG.useRealBackend && (
        <p className="text-xs text-amber-300/90" role="note">
          Session status changes are disabled in the browser. Use the protected localhost administration API with a Bearer token; the admin token is never sent to this UI.
        </p>
      )}

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSessions.map(session => (
          <div
            key={session.id}
            className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-white block">
                      {session.id}
                    </span>
                    <span className="font-mono text-[11px] text-cyan-300">
                      {session.sourceIdentifier}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <SeverityBadge severity={session.severity} size="sm" />
                  <StatusIndicator status={session.status} />
                </div>
              </div>

              <div className="p-3 bg-[#0B0F19] rounded-lg border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subnet Zone:</span>
                  <span className="text-slate-200 font-mono">{session.sourceSubnet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Attributed Tactic:</span>
                  <span className="text-cyan-300 font-medium">{session.attributedTactic}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Score:</span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {session.cumulativeRiskScore} / 100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Event Frequency:</span>
                  <span className="font-mono text-slate-300">{session.eventCount} recorded events</span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-slate-400 truncate">
                UA: {session.userAgent}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Last seen: {new Date(session.lastActiveAt).toLocaleTimeString()}
              </span>

              <div className="flex items-center gap-2">
                {session.status !== 'isolated' && (
                  <button
                    onClick={() => updateSessionStatus(session.id, 'isolated')}
                    disabled={API_CONFIG.useRealBackend}
                    className="px-2 py-1 text-[11px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded font-medium transition-colors"
                  >
                    Simulate Isolated Status
                  </button>
                )}

                <button
                  onClick={() => setSelectedSession(session)}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium border border-slate-700 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Inspect Timeline</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSession}
        isOpen={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
};
