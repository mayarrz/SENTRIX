import React, { useState } from 'react';
import { Database, Download, Play, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { useDeception } from '../../context/DeceptionContext';
import { MOCK_DATABASE_ROWS } from '../../data/mockData';

export const MockDatabaseBrowser: React.FC = () => {
  const { triggerDecoyInteraction } = useDeception();
  const [selectedTable, setSelectedTable] = useState<string>('mock_payroll_2026');
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM mock_payroll_2026 WHERE salary > 180000;');
  const [rows, setRows] = useState(MOCK_DATABASE_ROWS);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExecuteQuery = async () => {
    setIsExecuting(true);
    setStatusMessage(null);

    await triggerDecoyInteraction(
      'AST-DEC-02',
      'DATABASE_QUERY_EXPLORATION',
      `Simulated SQL query inspection executed on Decoy Table "${selectedTable}"`,
      sqlQuery,
      'high'
    );

    setIsExecuting(false);
    setStatusMessage(`Query executed safely on synthetic honeypot schema. Event logged.`);
  };

  const handleExportDecoy = async () => {
    setIsExecuting(true);
    setStatusMessage(null);

    await triggerDecoyInteraction(
      'AST-DEC-02',
      'DATA_EXPORT_ATTEMPT',
      `Critical: Simulated batch dump attempt on decoy compensation vault "${selectedTable}"`,
      `COPY (SELECT * FROM ${selectedTable}) TO '/tmp/exfil.csv' WITH CSV HEADER;`,
      'critical'
    );

    // Provide safe mock CSV download
    const csvHeader = 'employee_id,name,department,salary,bonus,canary_marker\n';
    const csvBody = rows.map(r => `${r.employee_id},"${r.name}","${r.department}",${r.salary},${r.bonus},${r.canary_marker}`).join('\n');
    const blob = new Blob([csvHeader + csvBody], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentrix_decoy_payroll_dump_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setIsExecuting(false);
    setStatusMessage(`Critical decoy export lure triggered! File generated with embedded canary markers.`);
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 space-y-6">
      {/* Banner */}
      <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg flex items-center justify-between text-xs text-cyan-300">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400 shrink-0" />
          <span><strong>SYNTHETIC DATABASE DECOY:</strong> Safe sandbox seeded with canary compensation records.</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">Target ID: AST-DEC-02</span>
      </div>

      {/* Query Bar */}
      <div className="bg-[#0B0F19] p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Target Decoy Schema:</label>
            <select
              value={selectedTable}
              onChange={e => setSelectedTable(e.target.value)}
              className="bg-[#111C35] border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1 font-mono focus:outline-hidden focus:border-cyan-500"
            >
              <option value="mock_payroll_2026">mock_payroll_2026 (5 Records)</option>
              <option value="fake_customer_vault">fake_customer_vault (Honeypot PII)</option>
              <option value="synthetic_auth_tokens">synthetic_auth_tokens (Canary Keys)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSqlQuery(`SELECT * FROM ${selectedTable} LIMIT 10;`)}
              className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Default Query
            </button>
            <span className="text-slate-400">·</span>
            <button
              onClick={() => setSqlQuery(`SELECT table_name FROM information_schema.tables WHERE table_schema='public';`)}
              className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Schema Recon
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            value={sqlQuery}
            onChange={e => setSqlQuery(e.target.value)}
            rows={2}
            className="w-full bg-[#111C35] border border-slate-700 rounded-lg p-3 text-xs font-mono text-cyan-300 focus:outline-hidden focus:border-cyan-500 resize-none"
            placeholder="Type simulated SQL..."
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400 font-mono">
            Read-only sandbox with honeypot query interception
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExecuteQuery}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs rounded transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isExecuting ? 'Executing...' : 'Run Query Probe'}</span>
            </button>

            <button
              onClick={handleExportDecoy}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs rounded transition-colors"
              title="Triggers critical simulated export event"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simulate Bulk CSV Export</span>
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#111C35]/60 text-slate-400 font-mono border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Emp ID</th>
              <th className="py-2.5 px-3">Full Name</th>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3">Synthetic Base Salary</th>
              <th className="py-2.5 px-3">Bonus</th>
              <th className="py-2.5 px-3 text-right">Canary Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 bg-[#0B0F19]">
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2 px-3 font-mono text-cyan-400">{row.employee_id}</td>
                <td className="py-2 px-3 font-medium text-slate-200">{row.name}</td>
                <td className="py-2 px-3 text-slate-400">{row.department}</td>
                <td className="py-2 px-3 font-mono text-slate-300 tabular-nums">{row.salary}</td>
                <td className="py-2 px-3 font-mono text-slate-300 tabular-nums">{row.bonus}</td>
                <td className="py-2 px-3 text-right">
                  <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                    {row.canary_marker}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
