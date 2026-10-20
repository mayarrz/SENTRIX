import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SecurityEvent } from '../../types';

interface SeverityPieChartProps {
  events: SecurityEvent[];
}

const COLORS: Record<string, string> = {
  critical: '#F43F5E',
  high: '#F59E0B',
  medium: '#06B6D4',
  low: '#64748B'
};

export const SeverityPieChart: React.FC<SeverityPieChartProps> = ({ events }) => {
  const data = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    events.forEach(e => {
      counts[e.severity] = (counts[e.severity] || 0) + 1;
    });

    return [
      { name: 'Critical', value: counts.critical, key: 'critical' },
      { name: 'High', value: counts.high, key: 'high' },
      { name: 'Medium', value: counts.medium, key: 'medium' },
      { name: 'Low', value: counts.low, key: 'low' }
    ].filter(item => item.value > 0);
  }, [events]);

  const total = events.length;

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-slate-100">Event Severity Breakdown</h3>
        <p className="text-xs text-slate-400">Classified by deception risk impact</p>
      </div>

      <div className="h-48 w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.key]} stroke="#0F172A" strokeWidth={2} />
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
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold font-mono text-white tabular-nums">{total}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Events</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80">
        {data.map(item => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[item.key] }}
              />
              <span className="text-slate-400">{item.name}</span>
            </div>
            <span className="font-mono font-medium text-slate-200 tabular-nums">
              {item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
