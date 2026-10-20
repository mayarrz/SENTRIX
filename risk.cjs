'use strict';

// Shared contract: low +5, medium +12, high +22, critical +35 per session event.
// Scores are additive, capped at 100, and only decrease on an authorized reset.
const SEVERITY_POINTS = Object.freeze({ low: 5, medium: 12, high: 22, critical: 35 });
const ADAPTIVE_THRESHOLD = 60;

function scoreForSeverity(severity) {
  const value = SEVERITY_POINTS[severity];
  if (!value) throw new TypeError('Unsupported severity');
  return value;
}

function nextSessionScore(current, severity) {
  return Math.max(0, Math.min(100, Number(current || 0) + scoreForSeverity(severity)));
}

function severityBand(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return score > 0 ? 'low' : 'low';
}

function adaptiveState(score) {
  return score >= ADAPTIVE_THRESHOLD ? 'enhanced' : 'standard';
}

function riskFactorsForEvents(events) {
  return Object.entries(SEVERITY_POINTS).flatMap(([severity, weight]) => {
    const occurrences = events.filter((event) => event.severity === severity).length;
    return occurrences ? [{ id: `RISK-${severity}`, factorName: `${severity[0].toUpperCase()}${severity.slice(1)} severity events`, weight, category: 'Severity Contribution', occurrences, description: `Each event adds ${weight} points to its own session; that session score is capped at 100.` }] : [];
  });
}

function withTransaction(db, callback) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = callback();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch { /* preserve the original failure */ }
    throw error;
  }
}

module.exports = { SEVERITY_POINTS, ADAPTIVE_THRESHOLD, scoreForSeverity, nextSessionScore, severityBand, adaptiveState, riskFactorsForEvents, withTransaction };
