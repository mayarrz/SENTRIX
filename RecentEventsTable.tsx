import React from 'react';
import { SecurityEvent } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { ArrowUpRight } from 'lucide-react';

interface RecentEventsTableProps {
  events: SecurityEvent[];
  onViewAll?: () => void;
  onSelectEvent?: (event: SecurityEvent) => void;
}

export const RecentEventsTable: React.FC<RecentEventsTableProps> = ({
  events,
  onViewAll,
  onSelectEvent
}) => {
  const displayEvents = events.slice(0, 6);

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-5 pb-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Recent Security Events</h3>
          <p className="text-xs text-slate-400">Live feed from simulated decoy honeypots</p>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Logs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#111C35]/50 text-slate-400 font-mono border-b border-slate-800/80">
            <tr>
              <th className="py-2.5 px-4 font-normal">Timestamp</th>
              <th className="py-2.5 px-4 font-normal">Source IP</th>
              <th className="py-2.5 px-4 font-normal">Decoy Target</th>
              <th className="py-2.5 px-4 font-normal">Event Type</th>
              <th className="py-2.5 px-4 font-normal text-right">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {displayEvents.map((evt) => {
              const timeString = new Date(evt.timestamp).toLocaleTimeString();
              return (
                <tr
                  key={evt.id}
                  onClick={() => onSelectEvent?.(evt)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-4 font-mono text-slate-400 tabular-nums whitespace-nowrap">
                    {timeString}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                    {evt.sourceIp}
                  </td>
                  <td className="py-2.5 px-4 text-slate-200 font-medium truncate max-w-xs">
                    {evt.resourceName}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {evt.eventType}
                  </td>
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <SeverityBadge severity={evt.severity} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
