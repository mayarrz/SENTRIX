import React from 'react';
import { Asset } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';

interface TopDecoysListProps {
  assets: Asset[];
  onSelectAsset?: (asset: Asset) => void;
}

export const TopDecoysList: React.FC<TopDecoysListProps> = ({ assets, onSelectAsset }) => {
  const sorted = [...assets].sort((a, b) => b.interactionCount - a.interactionCount).slice(0, 5);

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-100">Most Interacted Decoys</h3>
        <p className="text-xs text-slate-400">Honey-tokens & traps receiving highest adversary velocity</p>
      </div>

      <div className="space-y-3">
        {sorted.map((asset, index) => {
          return (
            <div
              key={asset.id}
              onClick={() => onSelectAsset?.(asset)}
              className="p-3 bg-[#111C35]/30 hover:bg-[#111C35]/70 border border-slate-800/80 rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs text-slate-400 w-4 tabular-nums">
                  {index + 1}.
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">
                    {asset.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {asset.fakeResourcePath}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-cyan-300 tabular-nums">
                    {asset.interactionCount}
                  </span>
                  <span className="text-[10px] text-slate-400 block">trips</span>
                </div>
                <SeverityBadge severity={asset.riskLevel} size="sm" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
