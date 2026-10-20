import React, { useState } from 'react';
import { FileText, Download, ShieldAlert, CheckCircle, Info, Eye } from 'lucide-react';
import { useDeception } from '../../context/DeceptionContext';
import { MOCK_DOCUMENTS } from '../../data/mockData';

export const MockDocRepository: React.FC = () => {
  const { triggerDecoyInteraction } = useDeception();
  const [activeDoc, setActiveDoc] = useState(MOCK_DOCUMENTS[0]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleDownloadDoc = async (doc: typeof MOCK_DOCUMENTS[0]) => {
    setStatusMessage(null);
    await triggerDecoyInteraction(
      'AST-DEC-08',
      'SENSITIVE_FILE_READ',
      `Simulated retrieval of bait executive document "${doc.title}"`,
      `GET /share/executives/${doc.title} HTTP/1.1\nUser-Agent: Simulated-Crawler/2.0`,
      'high'
    );

    // Provide safe mock text file representing the bait doc
    const content = `SENTRIX EDUCATIONAL HONEYPOT DOCUMENT
=========================================
DOCUMENT TITLE: ${doc.title}
CLASSIFICATION: ${doc.classification}
EMBEDDED CANARY TOKEN: ${doc.decoyPayloadId}
DISCLAIMER: This is a synthetic lure document for a cybersecurity graduation project demonstration.
No actual corporate or sensitive data exists here.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.title.replace(/\.[^/.]+$/, "") + ".txt";
    a.click();
    URL.revokeObjectURL(url);

    setStatusMessage(`Bait document "${doc.title}" downloaded. Deception event recorded with DNS canary token.`);
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 space-y-6">
      {/* Banner */}
      <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-lg flex items-center justify-between text-xs text-cyan-300">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
          <span><strong>HONEY-DOCUMENT SHARE:</strong> High-value confidential bait designed to attract targeted espionage.</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">Target ID: AST-DEC-08</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MOCK_DOCUMENTS.map(doc => {
          const isSelected = activeDoc.id === doc.id;
          return (
            <div
              key={doc.id}
              onClick={() => setActiveDoc(doc)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                isSelected
                  ? 'bg-[#111C35] border-cyan-500/50 shadow-md shadow-cyan-950/20'
                  : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                    {doc.classification}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-white leading-snug">
                  {doc.title}
                </h4>

                <p className="text-[11px] text-slate-400">
                  {doc.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] space-y-2">
                <div className="flex justify-between text-slate-400 font-mono">
                  <span>Size: {doc.size}</span>
                  <span>{doc.category}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadDoc(doc);
                  }}
                  className="w-full py-1.5 bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-slate-200 border border-slate-700 font-semibold rounded text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Bait Lure</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
};
