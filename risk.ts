import { RiskFactor, SecurityEvent, Session, SeverityLevel, SimulationScenario } from '../types';

// Keep this contract in sync with backend/risk.cjs: additive severity weights,
// independently accumulated per session, capped at 100. Reset is the only decrease.
export const RISK_POINTS: Record<SeverityLevel, number> = { low: 5, medium: 12, high: 22, critical: 35 };
export const ADAPTIVE_THRESHOLD = 60;

export function scoreEventsBySession(events: SecurityEvent[]): number {
  const scores = new Map<string, number>();
  for (const event of events) {
    const id = event.sessionId || 'unknown';
    scores.set(id, Math.min(100, (scores.get(id) || 0) + RISK_POINTS[event.severity]));
  }
  return Math.max(0, ...scores.values());
}

export function scoreEventsForSession(events: SecurityEvent[], sessionId: string): number {
  return Math.min(100, events.filter(event => event.sessionId === sessionId).reduce((sum, event) => sum + RISK_POINTS[event.severity], 0));
}

export function normalizeDemoEvents(events: SecurityEvent[]): SecurityEvent[] {
  return events.map(event => ({ ...event, riskScoreDelta: RISK_POINTS[event.severity], isSimulatedDemo: true, classification: 'simulated' }));
}

export function normalizeScenarioWeights(scenarios: SimulationScenario[]): SimulationScenario[] {
  return scenarios.map(scenario => ({ ...scenario, steps: scenario.steps.map(step => ({ ...step, riskDelta: RISK_POINTS[step.severity] })) }));
}

export function normalizeDemoSessions(sessions: Session[], events: SecurityEvent[]): Session[] {
  return sessions.map(session => {
    const sessionEvents = events.filter(event => event.sessionId === session.id);
    const cumulativeRiskScore = scoreEventsForSession(events, session.id);
    const lastActiveAt = sessionEvents.reduce((latest, event) => Date.parse(event.timestamp) > Date.parse(latest) ? event.timestamp : latest, session.startedAt);
    return { ...session, eventCount: sessionEvents.length, lastActiveAt, cumulativeRiskScore, severity: riskBand(cumulativeRiskScore), adaptiveState: adaptiveMode(cumulativeRiskScore) };
  });
}

export function scoreSessions(sessions: Session[]): number {
  return Math.max(0, ...sessions.map(session => Math.min(100, Math.max(0, session.cumulativeRiskScore || 0))));
}

export function riskBand(score: number): SeverityLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function adaptiveMode(score: number): 'standard' | 'enhanced' {
  return score >= ADAPTIVE_THRESHOLD ? 'enhanced' : 'standard';
}

export function riskFactorsForEvents(events: SecurityEvent[]): RiskFactor[] {
  return (Object.entries(RISK_POINTS) as [SeverityLevel, number][]).flatMap(([severity, weight]) => {
    const occurrences = events.filter(event => event.severity === severity).length;
    return occurrences ? [{ id: `RISK-${severity}`, factorName: `${severity[0].toUpperCase()}${severity.slice(1)} severity events`, weight, category: 'Severity Contribution' as const, occurrences, description: `Each event adds ${weight} points to its own session; that session score is capped at 100.` }] : [];
  });
}
