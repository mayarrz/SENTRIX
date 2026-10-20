import React, { useMemo } from 'react';
import { useDeception } from '../context/DeceptionContext';
import { scoreEventsBySession, RISK_POINTS } from '../services/risk';
import { API_CONFIG } from '../services/api';
import { DemoNoticeBanner } from '../components/common/DemoNoticeBanner';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { BarChart3, TrendingUp, ShieldAlert, Radio, Activity } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { assets, events, sessions, riskScore } = useDeception();

  // 1. Decoy access frequency (Top assets)
  const topAssetsData = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach(event => counts.set(event.resourceId, (counts.get(event.resourceId) || 0) + 1));
    return [...assets]
      .map(asset => ({ ...asset, observedTrips: counts.get(asset.id) || 0 }))
      .sort((a, b) => b.observedTrips - a.observedTrips)
      .slice(0, 5)
      .map(a => ({
        name: a.name.length > 22 ? a.name.slice(0, 20) + '...' : a.name,
        trips: a.observedTrips,
        risk: a.riskLevel
      }));
  }, [assets, events]);

  // 2. Severity distribution
  const severityData = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    events.forEach(e => {
      counts[e.severity] = (counts[e.severity] || 0) + 1;
    });
    return [
      { name: 'Critical', value: counts.critical, color: '#F43F5E' },
      { name: 'High', value: counts.high, color: '#F59E0B' },
      { name: 'Medium', value: counts.medium, color: '#06B6D4' },
      { name: 'Low', value: counts.low, color: '#64748B' }
    ].filter(d => d.value > 0);
  }, [events]);

  // 3. Events Timeline
  const timelineData = useMemo(() => {
    const now = Date.now();
    return [60, 45, 30, 15, 0].map(minutesAgo => {
      const cutoff = now - minutesAgo * 60_000;
      const visibleEvents = events.filter(event => Date.parse(event.timestamp) >= cutoff && Date.parse(event.timestamp) <= now);
      return { time: minutesAgo ? `T-${minutesAgo}m` : 'Now', events: visibleEvents.length, score: minutesAgo ? scoreEventsBySession(visibleEvents) : riskScore };
    });
  }, [events, riskScore]);

  // 4. Session risk scores
  const sessionRiskData = useMemo(() => {
    return sessions.map(s => ({
      name: s.id,
      score: API_CONFIG.useRealBackend ? s.cumulativeRiskScore : Math.min(100, events.filter(event => event.sessionId === s.id).reduce((sum, event) => sum + RISK_POINTS[event.severity], 0)),
      events: s.eventCount,
      ip: s.sourceIdentifier
    }));
  }, [sessions]);

  return (
    <div className="space-y-6">
      <DemoNoticeBanner />

      {/* Header */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Deception Analytics & Adversary Intelligence</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Longitudinal statistics tracking decoy effectiveness, attacker dwell time, and telemetry volume
            </p>
          </div>

          <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-lg">
            Reactive dataset synchronized
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Total Decoy Touches</span>
          <p className="text-2xl font-bold font-mono text-white tabular-nums mt-1">{events.length}</p>
          <span className="text-[11px] text-cyan-400">100% honeypot precision</span>
        </div>
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Aggregate Platform Risk</span>
          <p className="text-2xl font-bold font-mono text-amber-400 tabular-nums mt-1">{riskScore}/100</p>
          <span className="text-[11px] text-slate-400">Dynamic heuristic score</span>
        </div>
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Adversary Sessions</span>
          <p className="text-2xl font-bold font-mono text-cyan-300 tabular-nums mt-1">{sessions.length}</p>
          <span className="text-[11px] text-slate-400">Simulated source origins</span>
        </div>
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400">Active Decoy Traps</span>
          <p className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1">{assets.length}</p>
          <span className="text-[11px] text-slate-400">Honeypots in deployment</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events Over Time Area Chart */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-100">Telemetry Volume Over Time</h3>
            <p className="text-xs text-slate-400">Simulated honeypot events vs risk escalation</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} axisLine={{ stroke: '#1E293B' }} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={{ stroke: '#1E293B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F19',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="events" name="Total Events" stroke="#06B6D4" strokeWidth={2} fill="url(#analyticsGradient)" />
                <Area type="monotone" dataKey="score" name="Risk Score" stroke="#F59E0B" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Interacted Decoy Assets Horizontal Bar Chart */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-100">Most Frequently Accessed Decoys</h3>
            <p className="text-xs text-slate-400">Top honeynet assets receiving simulated traffic</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topAssetsData}
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} axisLine={{ stroke: '#1E293B' }} />
                <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} axisLine={{ stroke: '#1E293B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F19',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="trips" name="Interactions" fill="#14B8A6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Severity Distribution & Session Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-100">Severity Distribution</h3>
            <p className="text-xs text-slate-400">Classified proportion of honeypot triggers</p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityData} innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {severityData.map(entry => (
                    <Cell key={entry.name} fill={entry.color} stroke="#0F172A" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F19',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800 text-center text-xs">
            {severityData.map(s => (
              <div key={s.name}>
                <span className="block text-slate-400 text-[11px]">{s.name}</span>
                <span className="font-mono font-bold text-white tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Session Activity and Risk Distribution */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-100">Simulated Session Threat Scores</h3>
            <p className="text-xs text-slate-400">Cumulative risk scored per tracked origin session</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionRiskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} axisLine={{ stroke: '#1E293B' }} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={{ stroke: '#1E293B' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F19',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="score" name="Cumulative Risk" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
            <span>Evaluated by heuristic velocity</span>
            <span className="font-mono text-cyan-300">{sessions.length} Distinct Sessions</span>
          </div>
        </div>
      </div>
    </div>
  );
};
