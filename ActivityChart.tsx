import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { SecurityEvent } from '../../types';

interface ActivityChartProps {
  events: SecurityEvent[];
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ events }) => {
  // Aggregate events by relative time brackets (e.g. past 60 mins / 10-minute buckets)
  const chartData = useMemo(() => {
    const buckets: Record<string, { time: string; total: number; critical: number; high: number }> = {
      '-50m': { time: '50m ago', total: 2, critical: 0, high: 1 },
      '-40m': { time: '40m ago', total: 5, critical: 1, high: 2 },
      '-30m': { time: '30m ago', total: 4, critical: 1, high: 1 },
      '-20m': { time: '20m ago', total: 8, critical: 2, high: 3 },
      '-10m': { time: '10m ago', total: 11, critical: 4, high: 4 },
      'now': { time: 'Recent', total: Math.max(6, events.length), critical: events.filter(e => e.severity === 'critical').length, high: events.filter(e => e.severity === 'high').length }
    };
    return Object.values(buckets);
  }, [events]);

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Security Activity Timeline</h3>
          <p className="text-xs text-slate-400">Simulated decoy telemetry over time</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-xs bg-cyan-500" />
            <span>Total Events</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
            <span>Critical / High</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="critGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
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
              itemStyle={{ color: '#E2E8F0' }}
            />
            <Area
              type="monotone"
              dataKey="total"
              name="Total Events"
              stroke="#06B6D4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#totalGradient)"
            />
            <Area
              type="monotone"
              dataKey="critical"
              name="Critical Alerts"
              stroke="#F43F5E"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#critGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
