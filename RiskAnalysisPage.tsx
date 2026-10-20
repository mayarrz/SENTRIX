import React from 'react';
import { useDeception } from '../context/DeceptionContext';
import { RISK_POINTS } from '../services/risk';
import { RiskGauge } from '../components/risk/RiskGauge';
import { DemoNoticeBanner } from '../components/common/DemoNoticeBanner';
import { SeverityBadge } from '../components/common/SeverityBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { ShieldAlert, Info, TrendingUp, CheckCircle, Cpu } from 'lucide-react';

export const RiskAnalysisPage: React.FC = () => {
  const { riskScore, events, riskFactors } = useDeception();

  // Aggregate event risk contributions for chart
  const riskDistributionData = [
    { name: 'Admin Decoy', match: (type: string) => type.includes('ADMIN') || type.includes('LOGIN') },
    { name: 'DB Extraction', match: (type: string) => type.includes('DATABASE') || type.includes('EXPORT') },
    { name: 'Canary Key Trip', match: (type: string) => type.includes('CANARY') || type.includes('CONFIG') },
    { name: 'Traversal / Recon', match: (type: string) => type.includes('TRAVERSAL') || type.includes('READ') }
  ].map(category => {
    const matched = events.filter(event => category.match(event.eventType));
    return { name: category.name, score: matched.reduce((sum, event) => sum + RISK_POINTS[event.severity], 0), count: matched.length };
  });

  return (
    <div className="space-y-6">
      <DemoNoticeBanner />

      {/* Header */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Adaptive Risk Scoring Engine</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Heuristic threat quantification based on honey-token precision, access velocity, and asset criticality
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/40 border border-cyan-800/40 rounded-lg text-xs text-cyan-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ready for Backend ML/Heuristic Scoring Service</span>
          </div>
        </div>
      </div>

      {/* Top Split: Gauge and Contributing Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <RiskGauge score={riskScore} />
        </div>

        {/* Contributing Factors Explanation Panel */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Algorithmic Scoring Factors</h3>
                <p className="text-xs text-slate-400">Observed event counts by severity; weights match the score formula</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded">
                6 Active Demonstration Factors
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {riskFactors.map(factor => (
                <div
                  key={factor.id}
                  className="p-3 bg-[#0B0F19] border border-slate-800 rounded-lg space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {factor.factorName}
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                      +{factor.weight} pts
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {factor.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>{factor.category}</span>
                    <span className="text-cyan-400">{factor.occurrences} matches</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              <strong>Backend Integration Note:</strong> These weights represent the initial baseline heuristic formula. The backend team can connect an adaptive Markov decision process or Bayesian classifier to dynamically adjust weights based on sequence velocity.
            </p>
          </div>
        </div>
      </div>

      {/* Visual Risk Distribution Chart & Event Scoring Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart */}
        <div className="lg:col-span-1 bg-[#0F172A] border border-slate-800 rounded-xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-100">Category Risk Weights</h3>
            <p className="text-xs text-slate-400">Impact delta by attack vector</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  interval={0}
                  axisLine={{ stroke: '#1E293B' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1E293B' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B0F19',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="score" name="Base Risk Weight" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evaluated Events & Risk Delta Table */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-5 pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100">Evaluated Telemetry & Risk Deltas</h3>
            <p className="text-xs text-slate-400">Events factored into current score calculation</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111C35]/60 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Event ID</th>
                  <th className="py-2.5 px-4">Resource</th>
                  <th className="py-2.5 px-4">Event Classification</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4 text-right">Risk Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {events.slice(0, 6).map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-cyan-400">{ev.id}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-200 max-w-[200px] truncate">
                      {ev.resourceName}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                      {ev.eventType}
                    </td>
                    <td className="py-2.5 px-4">
                      <SeverityBadge severity={ev.severity} size="sm" />
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-400 tabular-nums">
                      +{ev.riskScoreDelta} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
