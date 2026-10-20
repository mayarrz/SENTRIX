import React from 'react';
import {
  LayoutDashboard,
  Shield,
  Radio,
  Box,
  Activity,
  PlayCircle,
  Bell,
  ScrollText,
  BarChart3,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useDeception } from '../../context/DeceptionContext';

export type PageId =
  | 'overview'
  | 'assets'
  | 'threats'
  | 'decoys'
  | 'risk'
  | 'simulation'
  | 'alerts'
  | 'logs'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: 'alerts' | 'threats' | 'simulating';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
  { id: 'assets', label: 'Protected Assets', icon: Shield },
  { id: 'threats', label: 'Threat Monitoring', icon: Radio, badgeKey: 'threats' },
  { id: 'decoys', label: 'Decoy Environment', icon: Box },
  { id: 'risk', label: 'Risk Analysis', icon: Activity },
  { id: 'simulation', label: 'Simulation Center', icon: PlayCircle, badgeKey: 'simulating' },
  { id: 'alerts', label: 'Alerts', icon: Bell, badgeKey: 'alerts' },
  { id: 'logs', label: 'Event Logs', icon: ScrollText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Sliders }
];

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  isCollapsed,
  onToggleCollapse
}) => {
  const { alerts, sessions, isSimulating } = useDeception();

  const newAlertsCount = alerts.filter(a => a.status === 'new').length;
  const activeSessionsCount = sessions.filter(s => s.status === 'active' || s.status === 'monitored').length;

  return (
    <aside
      className={`relative flex flex-col bg-[#0D1424] border-r border-slate-800/80 transition-all duration-200 select-none z-30 shrink-0 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-700 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-950/40 shrink-0">
            <ShieldCheck className="w-5 h-5 text-slate-950" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="text-base font-bold tracking-tight text-white block leading-tight">
                SENTRIX
              </span>
              <span className="text-[10px] font-medium tracking-wide text-cyan-400 block truncate">
                Adaptive Deception
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          let badgeValue: number | string | null = null;
          if (item.badgeKey === 'alerts' && newAlertsCount > 0) {
            badgeValue = newAlertsCount;
          } else if (item.badgeKey === 'threats' && activeSessionsCount > 0) {
            badgeValue = activeSessionsCount;
          } else if (item.badgeKey === 'simulating' && isSimulating) {
            badgeValue = 'RUN';
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              {/* Active left indicator strip */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyan-400 rounded-r" />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-400'
                }`}
              />

              {!isCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!isCollapsed && badgeValue !== null && (
                <span
                  className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                    item.badgeKey === 'simulating'
                      ? 'bg-amber-500/20 text-amber-300'
                      : item.badgeKey === 'alerts'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {badgeValue}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse / Expand Toggle at Bottom */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <div className="text-[11px] text-slate-400 font-mono">
            <span>SOC v1.0 (Demo)</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
