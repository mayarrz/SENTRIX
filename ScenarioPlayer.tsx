import React from 'react';
import { useDeception } from '../../context/DeceptionContext';
import { Play, Square, RotateCcw, Clock, ShieldAlert, CheckCircle2, Terminal } from 'lucide-react';
import { SeverityBadge } from '../common/SeverityBadge';

export const ScenarioPlayer: React.FC = () => {
  const {
    scenarios,
    activeScenario,
    isSimulating,
    simulationStepIndex,
    simulationProgress,
    startScenario,
    cancelScenario,
    resetToDefaultDemoData,
    simulationSpeed,
    setSimulationSpeed
  } = useDeception();

  return (
    <div className="space-y-6">
      {/* Simulation Controller Panel */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-semibold text-white">Scenario Orchestrator</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select an adversarial profile below and replay synthetic attack sequences into SENTRIX.
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
              <span>Speed:</span>
              <button
                onClick={() => setSimulationSpeed(1)}
                className={`px-1.5 py-0.5 rounded ${simulationSpeed === 1 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'hover:text-white'}`}
              >
                1x
              </button>
              <button
                onClick={() => setSimulationSpeed(2)}
                className={`px-1.5 py-0.5 rounded ${simulationSpeed === 2 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'hover:text-white'}`}
              >
                2x
              </button>
            </div>

            {isSimulating ? (
              <button
                onClick={cancelScenario}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Replay</span>
              </button>
            ) : null}

            <button
              onClick={resetToDefaultDemoData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>
          </div>
        </div>

        {/* Live Progress Bar if simulating */}
        {activeScenario && (
          <div className="pt-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-300">
                Running: {activeScenario.title}
              </span>
              <span className="font-mono text-slate-400 tabular-nums">
                Step {Math.max(1, simulationStepIndex + 1)} of {activeScenario.steps.length} ({simulationProgress}%)
              </span>
            </div>

            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${simulationProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map(sc => {
          const isSelected = activeScenario?.id === sc.id;
          return (
            <div
              key={sc.id}
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between gap-4 ${
                isSelected && isSimulating
                  ? 'bg-[#111C35] border-cyan-500 shadow-lg shadow-cyan-950/30'
                  : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white">
                    {sc.title}
                  </h4>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded shrink-0">
                    ~{sc.estimatedDurationSeconds}s
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {sc.description}
                </p>

                <div className="space-y-1 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Threat Profile:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[200px]">{sc.threatActorProfile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">MITRE ATT&CK:</span>
                    <span className="font-mono text-amber-300">{sc.expectedTTP}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Step Sequence:</span>
                    <span className="text-slate-300 font-mono">{sc.steps.length} Actions</span>
                  </div>
                </div>
              </div>

              {/* Execution Steps Timeline Preview */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                {sc.steps.map((st, i) => {
                  const isCurrentStep = isSelected && simulationStepIndex === i;
                  const isFinished = isSelected && simulationStepIndex > i;

                  return (
                    <div
                      key={st.stepNumber}
                      className={`p-2 rounded text-xs flex items-center justify-between gap-2 transition-colors ${
                        isCurrentStep
                          ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 font-medium'
                          : isFinished
                          ? 'bg-slate-900/40 text-slate-400 border border-transparent'
                          : 'bg-slate-900/70 text-slate-300 border border-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] text-slate-400">#{st.stepNumber}</span>
                        <span className="truncate">{st.actionName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isFinished ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <SeverityBadge severity={st.severity} size="sm" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => startScenario(sc.id)}
                  disabled={isSimulating && isSelected}
                  className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    isSelected && isSimulating
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-xs'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {isSelected && isSimulating ? 'Executing Scenario...' : 'Execute Simulation'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
