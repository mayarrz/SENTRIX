import React, { useState } from 'react';
import { useDeception } from '../context/DeceptionContext';
import { StatCard } from '../components/dashboard/StatCard';
import { ActivityChart } from '../components/dashboard/ActivityChart';
import { SeverityPieChart } from '../components/dashboard/SeverityPieChart';
import { RecentEventsTable } from '../components/dashboard/RecentEventsTable';
import { TopDecoysList } from '../components/dashboard/TopDecoysList';
import { DemoNoticeBanner } from '../components/common/DemoNoticeBanner';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { AssetDetailsModal } from '../components/assets/AssetDetailsModal';
import { SessionDetailsModal } from '../components/monitoring/SessionDetailsModal';
import { PageId } from '../components/layout/Sidebar';
import { Asset, SecurityEvent, Session } from '../types';
import {
  Shield,
  Activity,
  Radio,
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface OverviewPageProps {
  onNavigate: (page: PageId) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const { assets, events, sessions, alerts } = useDeception();

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const totalAssets = assets.length;
  const totalEvents = events.length;
  const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'monitored').length;
  const highAndCritEvents = events.filter(e => e.severity === 'critical' || e.severity === 'high').length;

  const recentAlerts = alerts.slice(0, 4);

  const handleEventClick = (event: SecurityEvent) => {
    // If event has session, open session details
    const session = sessions.find(s => s.id === event.sessionId);
    if (session) {
      setSelectedSession(session);
    } else {
      const asset = assets.find(a => a.id === event.resourceId);
      if (asset) setSelectedAsset(asset);
    }
  };

  return (
    <div className="space-y-6">
      {/* Prominent Simulated Demo Notice */}
      <DemoNoticeBanner onOpenSimulation={() => onNavigate('simulation')} />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monitored Demo Decoys"
          value={totalAssets}
          icon={Shield}
          subtext="High-interaction traps & canary nodes"
          accentColor="cyan"
        />
        <StatCard
          label="Simulated Events"
          value={totalEvents}
          icon={Activity}
          subtext="Adversary honeypot interactions"
          accentColor="teal"
        />
        <StatCard
          label="Active Threat Sessions"
          value={activeSessions}
          icon={Radio}
          subtext="Synthetic adversary sessions tracked"
          accentColor="slate"
        />
        <StatCard
          label="High & Critical Events"
          value={highAndCritEvents}
          icon={AlertTriangle}
          subtext="Exfiltration or canary trip alerts"
          accentColor="rose"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart events={events} />
        </div>
        <div className="lg:col-span-1">
          <SeverityPieChart events={events} />
        </div>
      </div>

      {/* Tables and Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentEventsTable
            events={events}
            onViewAll={() => onNavigate('logs')}
            onSelectEvent={handleEventClick}
          />
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Top Decoys */}
          <TopDecoysList
            assets={assets}
            onSelectAsset={asset => setSelectedAsset(asset)}
          />

          {/* Recent Alerts Card */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Recent Security Alerts</h3>
                <p className="text-xs text-slate-400">High priority honeynet incidents</p>
              </div>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentAlerts.map(alert => (
                <div
                  key={alert.id}
                  onClick={() => onNavigate('alerts')}
                  className="p-3 bg-[#111C35]/30 hover:bg-[#111C35]/70 border border-slate-800/80 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {alert.title}
                    </h4>
                    <SeverityBadge severity={alert.severity} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {alert.summary}
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>{alert.relatedResourceName}</span>
                    <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Asset Details Modal */}
      <AssetDetailsModal
        asset={selectedAsset}
        isOpen={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
      />

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSession}
        isOpen={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
      />
    </div>
  );
};
