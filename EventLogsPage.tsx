import React, { useState, useMemo } from 'react';
import { useDeception } from '../context/DeceptionContext';
import { SecurityEvent, SeverityLevel } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { Modal } from '../components/common/Modal';
import { DemoNoticeBanner } from '../components/common/DemoNoticeBanner';
import {
  Search,
  Download,
  FileJson,
  FileSpreadsheet,
  Eye,
  Filter,
  Terminal,
  Clock
} from 'lucide-react';

export const EventLogsPage: React.FC = () => {
  const { events, exportEventsAsCsv, exportEventsAsJson } = useDeception();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch =
        event.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.sourceIp.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.eventType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = severityFilter === 'all' || event.severity === severityFilter;
      const matchesType = typeFilter === 'all' || event.eventType === typeFilter;

      return matchesSearch && matchesSeverity && matchesType;
    });
  }, [events, searchQuery, severityFilter, typeFilter]);

  const uniqueEventTypes = useMemo(() => {
    return Array.from(new Set(events.map(e => e.eventType)));
  }, [events]);

  return (
    <div className="space-y-6">
      <DemoNoticeBanner />

      {/* Header and Controls */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Security Event Logs & Telemetry Audit</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Granular record of all network interactions, honeypot access probes, and canary token hits
            </p>
          </div>

          {/* Export Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportEventsAsCsv(filteredEvents)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Download currently filtered events as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => exportEventsAsJson(filteredEvents)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Download currently filtered events as JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Filter inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by event ID, IP, resource or text..."
              className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500 font-mono"
            >
              <option value="all">All Event Types</option>
              {uniqueEventTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
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
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111C35]/60 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-normal">Event ID</th>
                <th className="py-3 px-4 font-normal">Timestamp</th>
                <th className="py-3 px-4 font-normal">Source IP</th>
                <th className="py-3 px-4 font-normal">Resource</th>
                <th className="py-3 px-4 font-normal">Event Type</th>
                <th className="py-3 px-4 font-normal">Severity</th>
                <th className="py-3 px-4 font-normal">Risk Impact</th>
                <th className="py-3 px-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No security events match the current filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map(event => (
                  <tr
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono text-cyan-400 whitespace-nowrap">
                      {event.id}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap tabular-nums">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {event.sourceIp}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-200 truncate max-w-xs">
                      {event.resourceName}
                      {event.requestMethod && <span className="block text-[10px] text-slate-400 font-mono">{event.requestMethod} {event.requestResource}</span>}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      {event.eventType}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <SeverityBadge severity={event.severity} />
                    </td>

                    <td className="py-3 px-4 font-mono text-amber-400 font-bold tabular-nums">
                      +{event.riskScoreDelta}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium border border-slate-700 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Payload</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details & Raw Payload Modal */}
      {selectedEvent && (
        <Modal
          isOpen={Boolean(selectedEvent)}
          onClose={() => setSelectedEvent(null)}
          title={`Event Details: ${selectedEvent.id}`}
          subtitle={`Resource: ${selectedEvent.resourceName} · Session: ${selectedEvent.sessionId}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Classification:</span>
                <span className="font-mono text-cyan-300 font-semibold">{selectedEvent.classification || (selectedEvent.isSimulatedDemo ? 'simulated' : 'honeypot')} · {selectedEvent.eventType}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Severity:</span>
                <SeverityBadge severity={selectedEvent.severity} size="md" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Origin Host</span>
                <span className="font-mono text-slate-200">{selectedEvent.sourceIp} ({selectedEvent.sourceHost})</span>
              </div>
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Score Contribution</span>
                <span className="font-mono font-bold text-amber-400">+{selectedEvent.riskScoreDelta} Risk Points</span>
              </div>
            </div>

            {selectedEvent.requestMethod && <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg"><span className="text-slate-400 block mb-0.5">HTTP Request</span><span className="font-mono text-slate-200">{selectedEvent.requestMethod} {selectedEvent.requestResource}</span></div>
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg"><span className="text-slate-400 block mb-0.5">User-Agent</span><span className="font-mono text-slate-200 break-all">{selectedEvent.userAgent || 'Not provided'}</span></div>
            </div>}

            {selectedEvent.adaptiveState && <div className="p-3 rounded-lg border border-amber-700/40 bg-amber-950/20 text-amber-200">Adaptive deception: <strong>{selectedEvent.adaptiveState}</strong>{selectedEvent.sessionRiskScore !== undefined && ` · Session risk ${selectedEvent.sessionRiskScore}/100`}{selectedEvent.adaptiveTransition && ' · Threshold crossed; state changed on this event.'}</div>}

            <div className="p-3 bg-[#111C35]/40 border border-slate-800 rounded-lg space-y-1">
              <span className="text-slate-400 block font-medium">Event Description</span>
              <p className="text-slate-200 leading-relaxed">
                {selectedEvent.details}
              </p>
            </div>

            {selectedEvent.rawPayloadSnippet && (
              <div className="space-y-1.5">
                <span className="text-slate-400 block font-mono text-[11px]">
                  Redacted request metadata:
                </span>
                <pre className="p-3 bg-[#0B0F19] border border-slate-800 rounded-lg font-mono text-[11px] text-cyan-300 overflow-x-auto leading-relaxed select-all">
                  {selectedEvent.rawPayloadSnippet}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
