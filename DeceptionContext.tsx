import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Asset,
  SecurityEvent,
  Session,
  Alert,
  RiskFactor,
  SimulationScenario,
  SeverityLevel,
  AlertStatus,
  SessionStatus
} from '../types';
import {
  INITIAL_ASSETS,
  INITIAL_EVENTS,
  INITIAL_SESSIONS,
  INITIAL_ALERTS,
  SIMULATION_SCENARIOS
} from '../data/mockData';
import { sentrixApi } from '../services/api';
import { API_CONFIG } from '../services/api';
import { scoreEventsBySession, scoreEventsForSession, riskBand, adaptiveMode, riskFactorsForEvents, normalizeDemoEvents, normalizeDemoSessions, normalizeScenarioWeights, RISK_POINTS } from '../services/risk';

export interface SOCNotification {
  id: string;
  title: string;
  message: string;
  severity: SeverityLevel;
  timestamp: string;
  resourceName?: string;
}

interface DeceptionContextType {
  backendHealthy: boolean | null;
  assets: Asset[];
  events: SecurityEvent[];
  sessions: Session[];
  alerts: Alert[];
  riskFactors: RiskFactor[];
  riskScore: number;
  scenarios: SimulationScenario[];
  
  // Simulation Runner State
  activeScenario: SimulationScenario | null;
  isSimulating: boolean;
  simulationStepIndex: number;
  simulationProgress: number; // 0 - 100
  
  // Notifications & UI Preferences
  notifications: SOCNotification[];
  dismissNotification: (id: string) => void;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;

  // Actions
  triggerDecoyInteraction: (
    resourceId: string,
    eventType: SecurityEvent['eventType'],
    details: string,
    rawPayloadSnippet?: string,
    severityOverride?: SeverityLevel
  ) => Promise<SecurityEvent>;
  startScenario: (scenarioId: string) => void;
  cancelScenario: () => void;
  updateAlertStatus: (alertId: string, status: AlertStatus) => Promise<void>;
  updateSessionStatus: (sessionId: string, status: SessionStatus) => Promise<void>;
  resetToDefaultDemoData: () => Promise<void>;
  exportEventsAsCsv: (filteredEvents?: SecurityEvent[]) => void;
  exportEventsAsJson: (filteredEvents?: SecurityEvent[]) => void;
}

const STORAGE_KEY = 'sentrix_deception_state_v1';

const DeceptionContext = createContext<DeceptionContextType | null>(null);

export const DeceptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from localStorage or mockData
  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_assets`);
      return import.meta.env.VITE_USE_REAL_BACKEND === "true" ? INITIAL_ASSETS : (saved ? JSON.parse(saved) : INITIAL_ASSETS);
    } catch {
      return INITIAL_ASSETS;
    }
  });

  const [events, setEvents] = useState<SecurityEvent[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_events`);
      return import.meta.env.VITE_USE_REAL_BACKEND === "true" ? [] : normalizeDemoEvents(saved ? JSON.parse(saved) : INITIAL_EVENTS);
    } catch {
      return normalizeDemoEvents(INITIAL_EVENTS);
    }
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_sessions`);
      return import.meta.env.VITE_USE_REAL_BACKEND === "true" ? [] : normalizeDemoSessions(saved ? JSON.parse(saved) : INITIAL_SESSIONS, events);
    } catch {
      return normalizeDemoSessions(INITIAL_SESSIONS, events);
    }
  });

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_alerts`);
      return import.meta.env.VITE_USE_REAL_BACKEND === "true" ? [] : (saved ? JSON.parse(saved) : INITIAL_ALERTS);
    } catch {
      return INITIAL_ALERTS;
    }
  });

  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(API_CONFIG.useRealBackend ? null : false);
  // null means use the local demo formula; a number means the backend supplied the score.
  const [backendRiskScore, setBackendRiskScore] = useState<number | null>(null);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>(normalizeScenarioWeights(SIMULATION_SCENARIOS));

  // Simulation Runner state
  const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStepIndex, setSimulationStepIndex] = useState<number>(-1);
  const [simulationProgress, setSimulationProgress] = useState<number>(0);
  const simulationTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Notifications & Preferences
  const [notifications, setNotifications] = useState<SOCNotification[]>([]);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);

  // Server is the source of truth for logged events and alerts when enabled.
  useEffect(() => {
    if (!import.meta.env.VITE_USE_REAL_BACKEND || import.meta.env.VITE_USE_REAL_BACKEND !== 'true') return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    sentrixApi.getScenarios().then(remoteScenarios => { if (alive) setScenarios(remoteScenarios); }).catch(error => console.error('Backend scenarios unavailable:', error));
    const refresh = async () => {
      try {
        const [health, remoteAssets, remoteEvents, remoteAlerts, remoteSessions, analysis] = await Promise.all([
          sentrixApi.getHealth(), sentrixApi.getAssets(), sentrixApi.getEvents(), sentrixApi.getAlerts(), sentrixApi.getSessions(), sentrixApi.getRiskAnalysis()
        ]);
        if (!alive) return;
        setBackendHealthy(health.ok);
        setAssets(remoteAssets);
        setEvents(remoteEvents);
        setAlerts(remoteAlerts);
        setSessions(remoteSessions);

        setBackendRiskScore(analysis.overallScore);
        setRiskFactors(analysis.activeFactors);
      } catch (error) { if (alive) setBackendHealthy(false); console.error('Backend sync failed; mock data is not substituted:', error); }
      finally { if (alive) timer = setTimeout(refresh, 2000); }
    };
    refresh();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_assets`, JSON.stringify(assets));
      localStorage.setItem(`${STORAGE_KEY}_events`, JSON.stringify(events));
      localStorage.setItem(`${STORAGE_KEY}_sessions`, JSON.stringify(sessions));
      localStorage.setItem(`${STORAGE_KEY}_alerts`, JSON.stringify(alerts));
    } catch (e) {
      console.warn('Could not persist to localStorage:', e);
    }
  }, [assets, events, sessions, alerts]);

  // Dynamic Risk Score calculation based on event severity weights
  const locallyCalculatedRiskScore = React.useMemo(() => scoreEventsBySession(events), [events]);

  const riskScore = API_CONFIG.useRealBackend ? (backendRiskScore ?? 0) : locallyCalculatedRiskScore;
  const currentRiskFactors = API_CONFIG.useRealBackend ? riskFactors : riskFactorsForEvents(events);

  const addNotification = useCallback((notification: Omit<SOCNotification, 'id' | 'timestamp'>) => {
    const id = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newNotif: SOCNotification = {
      ...notification,
      id,
      timestamp: new Date().toLocaleTimeString()
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 4)]);

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /**
   * Triggers an interactive simulated interaction with a decoy resource
   */
  const triggerDecoyInteraction = useCallback(async (
    resourceId: string,
    eventType: SecurityEvent['eventType'],
    details: string,
    rawPayloadSnippet?: string,
    severityOverride?: SeverityLevel
  ): Promise<SecurityEvent> => {
    const asset = assets.find(a => a.id === resourceId) || {
      id: resourceId,
      name: 'Unregistered Honey-Node',
      type: 'admin_portal' as const,
      riskLevel: 'high' as const
    };

    const severity: SeverityLevel = severityOverride || 
      (eventType === 'CANARY_TOKEN_TRIGGERED' || eventType === 'DATA_EXPORT_ATTEMPT' ? 'critical' :
       eventType === 'DECOY_LOGIN_ATTEMPT' || eventType === 'CONFIGURATION_DOWNLOAD' ? 'high' :
       eventType === 'DATABASE_QUERY_EXPLORATION' || eventType === 'DIRECTORY_TRAVERSAL' ? 'medium' : 'low');

    const riskDelta = RISK_POINTS[severity];

    // Pick or create session
    const activeSession = sessions.find(s => s.status === 'active' || s.status === 'monitored') || sessions[0];
    const sessionId = activeSession ? activeSession.id : 'SES-SIM-01';

    let newEvent: SecurityEvent = await sentrixApi.postSimulatedEvent({
      sessionId,
      sourceIp: activeSession ? activeSession.sourceIdentifier : '10.240.14.88',
      sourceHost: 'demo-adversary.internal',
      resourceId: asset.id,
      resourceName: asset.name,
      eventType,
      severity,
      riskScoreDelta: riskDelta,
      details,
      rawPayloadSnippet: rawPayloadSnippet || `[SIMULATED EVENT: ${eventType}] on ${asset.name}`
    });

    if (!API_CONFIG.useRealBackend) {
      const previousScore = scoreEventsForSession(events, sessionId);
      const nextScore = Math.min(100, previousScore + riskDelta);
      newEvent = { ...newEvent, sessionRiskScore: nextScore, adaptiveState: adaptiveMode(nextScore), adaptiveTransition: previousScore < 60 && nextScore >= 60, classification: 'simulated' };
      if (newEvent.adaptiveTransition) newEvent.details += ` Adaptive deception changed to enhanced at risk ${nextScore}/100.`;
    }

    // Recalculate immediately from local events, then accept the backend score on next refresh.
    if (import.meta.env.VITE_USE_REAL_BACKEND === 'true') setBackendRiskScore(null);

    // Update Events
    setEvents(prev => [newEvent, ...prev]);

    // Update Asset Interaction Count & Timestamp
    setAssets(prev => prev.map(a => {
      if (a.id === resourceId) {
        return {
          ...a,
          interactionCount: a.interactionCount + 1,
          lastSimulatedInteraction: newEvent.timestamp
        };
      }
      return a;
    }));

    // Update Session
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          eventCount: s.eventCount + 1,
          lastActiveAt: newEvent.timestamp,
          cumulativeRiskScore: scoreEventsForSession([newEvent, ...events], sessionId),
          severity: riskBand(scoreEventsForSession([newEvent, ...events], sessionId)),
          adaptiveState: adaptiveMode(scoreEventsForSession([newEvent, ...events], sessionId))
        };
      }
      return s;
    }));

    // If critical/high severity, generate an alert
    if (!import.meta.env.VITE_USE_REAL_BACKEND && (severity === 'critical' || severity === 'high')) {
      const newAlert: Alert = {
        id: `ALT-${Math.floor(2000 + Math.random() * 8000)}`,
        title: `Simulated Deception Trip: ${asset.name}`,
        severity,
        relatedResourceId: asset.id,
        relatedResourceName: asset.name,
        sessionId,
        timestamp: newEvent.timestamp,
        status: 'new',
        summary: details,
        recommendedAction: 'Engage adaptive tar-pit response to feed synthetic delay buffers to the client.',
        triggerFactor: 'Access to designated decoy endpoint with canary payload'
      };
      setAlerts(prev => [newAlert, ...prev]);
    }

    // Add toast notification
    addNotification({
      title: `Decoy Tripped: ${asset.name}`,
      message: details,
      severity,
      resourceName: asset.name
    });

    return newEvent;
  }, [assets, sessions, addNotification]);

  /**
   * Cancels active scenario execution
   */
  const cancelScenario = useCallback(() => {
    simulationTimerRef.current.forEach(t => clearTimeout(t));
    simulationTimerRef.current = [];
    setIsSimulating(false);
    setActiveScenario(null);
    setSimulationStepIndex(-1);
    setSimulationProgress(0);
  }, []);

  /**
   * Starts a controlled simulation scenario with step-by-step timed execution
   */
  const startScenario = useCallback((scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    cancelScenario();
    setActiveScenario(scenario);
    setIsSimulating(true);
    setSimulationStepIndex(0);
    setSimulationProgress(5);

    let cumulativeDelay = 0;
    const speedMultiplier = simulationSpeed > 0 ? simulationSpeed : 1;

    scenario.steps.forEach((step, idx) => {
      cumulativeDelay += (step.delayMs / speedMultiplier);
      const timer = setTimeout(async () => {
        setSimulationStepIndex(idx);
        const progress = Math.round(((idx + 1) / scenario.steps.length) * 100);
        setSimulationProgress(progress);

        try {
        await triggerDecoyInteraction(
          step.resourceId,
          step.eventType,
          `[Scenario: ${scenario.title}] ${step.description}`,
          `// Simulation Step ${step.stepNumber}: ${step.actionName}\nTarget: ${step.resourceName}`,
          step.severity
        );
        } catch (error) {
          console.error('Simulation event was not saved:', error);
          simulationTimerRef.current.forEach(t => clearTimeout(t));
          simulationTimerRef.current = [];
          setIsSimulating(false);
          addNotification({title:'Simulation Save Failed',message:'Backend did not save the event. Check the server terminal and /api/v1/health.',severity:'high'});
          return;
        }

        if (idx === scenario.steps.length - 1) {
          // Finished
          const finishTimer = setTimeout(() => {
            setIsSimulating(false);
            addNotification({
              title: `Simulation Completed: ${scenario.title}`,
              message: `All ${scenario.steps.length} scenario steps executed successfully. Telemetry recorded.`,
              severity: 'low'
            });
          }, 800);
          simulationTimerRef.current.push(finishTimer);
        }
      }, cumulativeDelay);

      simulationTimerRef.current.push(timer);
    });
  }, [scenarios, simulationSpeed, cancelScenario, triggerDecoyInteraction, addNotification]);

  const updateAlertStatus = useCallback(async (alertId: string, status: AlertStatus) => {
    await sentrixApi.updateAlertStatus(alertId, status);
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status } : a));
    addNotification({
      title: 'Alert Status Updated',
      message: `Alert ${alertId} updated to status "${status}"`,
      severity: 'low'
    });
  }, [addNotification]);

  const updateSessionStatus = useCallback(async (sessionId: string, status: SessionStatus) => {
    await sentrixApi.updateSessionStatus(sessionId, status);
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status } : s));
    addNotification({
      title: 'Session Status Updated',
      message: `Session ${sessionId} set to "${status}"`,
      severity: 'low'
    });
  }, [addNotification]);

  const resetToDefaultDemoData = useCallback(async () => {
    if (!window.confirm('Reset demo? This will permanently delete all saved simulated events, alerts and sessions in the local SQLite database.')) return;
    cancelScenario();
    try {
      await sentrixApi.resetSimulatedData();
    } catch (error) {
      console.error('Database reset failed', error);
      addNotification({title: 'Reset Failed', message: 'Could not reset the backend database; no local data was cleared.', severity: 'high'});
      return;
    }
    localStorage.removeItem(`${STORAGE_KEY}_assets`);
    localStorage.removeItem(`${STORAGE_KEY}_events`);
    localStorage.removeItem(`${STORAGE_KEY}_sessions`);
    localStorage.removeItem(`${STORAGE_KEY}_alerts`);
    setAssets(INITIAL_ASSETS);
    const backendEnabled = import.meta.env.VITE_USE_REAL_BACKEND === 'true';
    const resetEvents = backendEnabled ? [] : normalizeDemoEvents(INITIAL_EVENTS);
    setEvents(resetEvents);
    setSessions(backendEnabled ? [] : normalizeDemoSessions(INITIAL_SESSIONS, resetEvents));
    setAlerts(backendEnabled ? [] : INITIAL_ALERTS);
    setRiskFactors([]);
    setBackendRiskScore(null);
    addNotification({
      title: 'Demo State Reset',
      message: backendEnabled ? 'Cleared local simulated event database.' : 'Restored local demo baseline dataset.', 
      severity: 'low'
    });
  }, [cancelScenario, addNotification]);

  const exportEventsAsCsv = useCallback((filteredEvents?: SecurityEvent[]) => {
    const list = filteredEvents || events;
    if (list.length === 0) return;

    const headers = ['Event ID', 'Timestamp', 'Session ID', 'Source IP', 'Resource Name', 'Event Type', 'Severity', 'Risk Delta', 'Details'];
    const rows = list.map(e => [
      e.id,
      e.timestamp,
      e.sessionId,
      e.sourceIp,
      `"${e.resourceName.replace(/"/g, '""')}"`,
      e.eventType,
      e.severity,
      e.riskScoreDelta,
      `"${e.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sentrix_events_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [events]);

  const exportEventsAsJson = useCallback((filteredEvents?: SecurityEvent[]) => {
    const list = filteredEvents || events;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(list, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sentrix_events_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  }, [events]);

  return (
    <DeceptionContext.Provider
      value={{
        backendHealthy,
        assets,
        events,
        sessions,
        alerts,
        riskFactors: currentRiskFactors,
        riskScore,
        scenarios,
        activeScenario,
        isSimulating,
        simulationStepIndex,
        simulationProgress,
        notifications,
        dismissNotification,
        autoRefresh,
        setAutoRefresh,
        simulationSpeed,
        setSimulationSpeed,
        triggerDecoyInteraction,
        startScenario,
        cancelScenario,
        updateAlertStatus,
        updateSessionStatus,
        resetToDefaultDemoData,
        exportEventsAsCsv,
        exportEventsAsJson
      }}
    >
      {children}
    </DeceptionContext.Provider>
  );
};

export const useDeception = (): DeceptionContextType => {
  const context = useContext(DeceptionContext);
  if (!context) {
    throw new Error('useDeception must be used within a DeceptionProvider');
  }
  return context;
};
