import React, { useState, useMemo } from 'react';
import { useDeception } from '../context/DeceptionContext';
import { Asset, SeverityLevel, DecoyType, DecoyStatus } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { AssetDetailsModal } from '../components/assets/AssetDetailsModal';
import { DemoNoticeBanner } from '../components/common/DemoNoticeBanner';
import {
  Search,
  Filter,
  Eye,
  Zap,
  ArrowUpDown,
  Shield,
  Layers,
  FileCode,
  Database,
  Lock
} from 'lucide-react';

export const AssetsPage: React.FC = () => {
  const { assets, triggerDecoyInteraction } = useDeception();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'interactions' | 'risk'>('interactions');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.fakeResourcePath.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.deployedEnvironment.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || asset.type === typeFilter;
      const matchesSeverity = severityFilter === 'all' || asset.riskLevel === severityFilter;

      return matchesSearch && matchesType && matchesSeverity;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'interactions') {
        comparison = a.interactionCount - b.interactionCount;
      } else if (sortField === 'risk') {
        const order = { critical: 4, high: 3, medium: 2, low: 1 };
        comparison = order[a.riskLevel] - order[b.riskLevel];
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [assets, searchQuery, typeFilter, severityFilter, sortField, sortOrder]);

  const handleSort = (field: 'name' | 'interactions' | 'risk') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getAssetIcon = (type: DecoyType) => {
    switch (type) {
      case 'admin_portal': return Lock;
      case 'database_record': return Database;
      case 'config_file': return FileCode;
      default: return Layers;
    }
  };

  return (
    <div className="space-y-6">
      <DemoNoticeBanner />

      {/* Header and Controls */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Protected Corporate Resources & Decoys</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inventory of synthetic administrative portals, honeypot schemas, and canary config tokens
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Showing <strong className="text-cyan-300 font-mono">{filteredAssets.length}</strong> of {assets.length} assets
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by asset name, ID, subnet, or path..."
              className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
            >
              <option value="all">All Asset Types</option>
              <option value="admin_portal">Admin Portal</option>
              <option value="database_record">Database Record</option>
              <option value="config_file">Configuration File</option>
              <option value="document_repository">Document Repo</option>
              <option value="api_endpoint">API Endpoint</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical Risk</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111C35]/60 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-normal">Asset ID</th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 font-normal cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Resource Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-normal">Type & Environment</th>
                <th className="py-3 px-4 font-normal">Decoy Mode</th>
                <th
                  onClick={() => handleSort('risk')}
                  className="py-3 px-4 font-normal cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Risk Level</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('interactions')}
                  className="py-3 px-4 font-normal text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Simulated Trips</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-normal">Last Interaction</th>
                <th className="py-3 px-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No decoy assets match the current search or filters.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => {
                  const Icon = getAssetIcon(asset.type);
                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono text-cyan-400 whitespace-nowrap">
                        {asset.id}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-200 block">
                              {asset.name}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 truncate block max-w-xs">
                              {asset.fakeResourcePath}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-300 capitalize block">
                          {asset.type.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {asset.deployedEnvironment}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusIndicator status={asset.decoyStatus} />
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <SeverityBadge severity={asset.riskLevel} />
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-200 tabular-nums">
                        {asset.interactionCount}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap tabular-nums">
                        {new Date(asset.lastSimulatedInteraction).toLocaleTimeString()}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Details Modal */}
      <AssetDetailsModal
        asset={selectedAsset}
        isOpen={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  );
};
