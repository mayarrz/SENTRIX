import React from 'react';
import { useDeception } from '../../context/DeceptionContext';
import { X, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

export const NotificationToastContainer: React.FC = () => {
  const { notifications, dismissNotification } = useDeception();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map(n => {
        let borderClass = 'border-slate-700 bg-slate-900';
        let icon = <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;

        if (n.severity === 'critical') {
          borderClass = 'border-rose-500/40 bg-[#160B12]';
          icon = <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />;
        } else if (n.severity === 'high') {
          borderClass = 'border-amber-500/40 bg-[#171208]';
          icon = <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
        } else if (n.severity === 'medium') {
          borderClass = 'border-cyan-500/40 bg-[#0B151E]';
          icon = <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />;
        }

        return (
          <div
            key={n.id}
            className={`pointer-events-auto p-3 rounded-lg border shadow-xl flex items-start gap-3 transition-all animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
          >
            {icon}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-slate-100 truncate">
                  {n.title}
                </h4>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {n.timestamp}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                {n.message}
              </p>
            </div>
            <button
              onClick={() => dismissNotification(n.id)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
