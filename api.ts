/**
 * SENTRIX — Centralized Service & API Integration Layer
 * 
 * BACKEND TEAM INTEGRATION INSTRUCTIONS:
 * ----------------------------------------------------------------------------
 * 1. Base URL:
 *    When your backend server (e.g., Express, FastAPI, Django, Spring Boot) is ready,
 *    set `VITE_API_BASE_URL` in your environment or update `DEFAULT_API_BASE_URL` below.
 * 
 * 2. Connecting Real Endpoints:
 *    Set `USE_REAL_BACKEND = true` or provide the `VITE_USE_REAL_BACKEND=true` env var.
 *    Each function in this file is structured to perform a standard fetch() request
 *    to the local REST API and return typed promises matching the models
 *    in `src/types/index.ts`.
 * 
 * 3. Mock Data Decoupling:
 *    Currently, all calls resolve against safe, simulated in-memory state.
 *    No UI component directly imports mock data; they all invoke this service layer.
 * ----------------------------------------------------------------------------
 */

import { 
  Asset, 
  SecurityEvent, 
  Session, 
  Alert, 
  RiskScoreAnalysis, 
  SimulationScenario,
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
import { riskFactorsForEvents, scoreEventsBySession, riskBand, normalizeDemoEvents, normalizeScenarioWeights } from './risk';

// Configuration
export const API_CONFIG = {
  baseUrl: (import.meta as any).env?.VITE_API_BASE_URL || '/api/v1',
  useRealBackend: (import.meta as any).env?.VITE_USE_REAL_BACKEND === 'true',
  endpoints: {
    assets: '/assets',
    events: '/events',
    sessions: '/sessions',
    alerts: '/alerts',
    riskAnalysis: '/risk/analysis',
    scenarios: '/simulation/scenarios',
    triggerSimulatedEvent: '/simulation/trigger-event',
    updateAlertStatus: '/alerts/:id/status',
    updateSessionStatus: '/sessions/:id/status',
    health: '/health'
  }
};

/**
 * Service Layer Object
 */
export const sentrixApi = {
  /**
   * Fetches all registered corporate decoy assets
   * Backend endpoint: GET /api/v1/assets
   */
  async resetSimulatedData(): Promise<void> {
    if (API_CONFIG.useRealBackend) throw new Error('Remote reset is disabled in the UI; use the protected local administration API.');
  },

  async getAssets(): Promise<Asset[]> {
    if (API_CONFIG.useRealBackend) {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.assets}`);
      if (!response.ok) throw new Error(`HTTP error fetching assets: ${response.status}`);
      return response.json();
    }
    // Simulated in-memory fallback
    return JSON.parse(JSON.stringify(INITIAL_ASSETS));
  },

  async getHealth(): Promise<{ok: boolean; mode: string}> {
    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.health}`);
    if (!response.ok) throw new Error(`Backend unavailable: ${response.status}`);
    return response.json();
  },

  /**
   * Fetches single asset details by ID
   * Backend endpoint: GET /api/v1/assets/:id
   */
  async getAssetById(assetId: string): Promise<Asset | null> {
    if (API_CONFIG.useRealBackend) {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.assets}/${assetId}`);
      if (!response.ok) return null;
      return response.json();
    }
    const found = INITIAL_ASSETS.find(a => a.id === assetId);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  },

  /**
   * Fetches simulated security events
   * Backend endpoint: GET /api/v1/events?limit=100
   */
  async getEvents(): Promise<SecurityEvent[]> {
    if (API_CONFIG.useRealBackend) {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.events}?limit=1000`);
      if (!response.ok) throw new Error(`HTTP error fetching events: ${response.status}`);
      return response.json();
    }
    return normalizeDemoEvents(JSON.parse(JSON.stringify(INITIAL_EVENTS)));
  },

  /**
   * Fetches active and recorded simulated sessions
   * Backend endpoint: GET /api/v1/sessions
   */
  async getSessions(): Promise<Session[]> {
    if (API_CONFIG.useRealBackend) {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.sessions}`);
      if (!response.ok) throw new Error(`HTTP error fetching sessions: ${response.status}`);
      return response.json();
    }
    return JSON.parse(JSON.stringify(INITIAL_SESSIONS));
  },

  /**
   * Fetches security alerts
   * Backend endpoint: GET /api/v1/alerts
   */
  async getAlerts(): Promise<Alert[]> {
    if (API_CONFIG.useRealBackend) {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.alerts}`);
      if (!response.ok) throw new Error(`HTTP error fetching alerts: ${response.status}`);
      return response.json();
    }
    return JSON.parse(JSON.stringify(INITIAL_ALERTS));
  },

  /**
   * Updates status of an alert (e.g. marked as 'reviewed' or 'resolved')
   * Backend endpoint: PATCH /api/v1/alerts/:id/status
   */
  async updateAlertStatus(alertId: string, status: AlertStatus): Promise<{ success: boolean; alertId: string; status: AlertStatus }> {
    if (API_CONFIG.useRealBackend) {
      throw new Error('Alert status changes are disabled in the browser when using the backend. Use the protected localhost administration API with a Bearer token.');
    }
    return { success: true, alertId, status };
  },

  /**
   * Updates session mitigation status (e.g. 'isolated', 'monitored')
   * Backend endpoint: PATCH /api/v1/sessions/:id/status
   */
  async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<{ success: boolean; sessionId: string; status: SessionStatus }> {
    if (API_CONFIG.useRealBackend) {
      throw new Error('Session status changes are disabled in the browser when using the backend. Use the protected localhost administration API with a Bearer token.');
    }
    return { success: true, sessionId, status };
  },

  /**
   * Fetches algorithmic risk analysis from the risk-scoring backend service
   * Backend endpoint: GET /api/v1/risk/analysis
   */
  async getRiskAnalysis(): Promise<RiskScoreAnalysis> {
    if (API_CONFIG.useRealBackend) {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.riskAnalysis}`);
      if (!response.ok) throw new Error(`Failed to fetch risk analysis: ${response.status}`);
      return response.json();
    }
    return {
      overallScore: scoreEventsBySession(INITIAL_EVENTS),
      severityBand: riskBand(scoreEventsBySession(INITIAL_EVENTS)),
      baselineComparison: 'Deterministic per-session additive score',
      activeFactors: riskFactorsForEvents(INITIAL_EVENTS),
      lastCalculated: new Date().toISOString(),
      totalEvaluatedEvents: INITIAL_EVENTS.length
    };
  },

  /**
   * Fetches predefined simulation scenarios
   * Backend endpoint: GET /api/v1/simulation/scenarios
   */
  async getScenarios(): Promise<SimulationScenario[]> {
    if (API_CONFIG.useRealBackend) {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.scenarios}`);
      if (!response.ok) throw new Error(`Failed to fetch scenarios: ${response.status}`);
      return response.json();
    }
    return normalizeScenarioWeights(JSON.parse(JSON.stringify(SIMULATION_SCENARIOS)));
  },

  /**
   * Submits a newly triggered simulated decoy interaction event
   * Backend endpoint: POST /api/v1/simulation/trigger-event
   */
  async postSimulatedEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'isSimulatedDemo'>): Promise<SecurityEvent> {
    if (API_CONFIG.useRealBackend) {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.triggerSimulatedEvent}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (!response.ok) throw new Error(`Failed to transmit simulated event`);
      return response.json();
    }
    // In-memory demo simulation constructor
    const newEvent: SecurityEvent = {
      ...event,
      id: `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      isSimulatedDemo: true
    };
    // Push to in-memory events store so all UI components & Events Logs reflect it immediately 
    INITIAL_EVENTS.unshift(newEvent);

    return newEvent;
  }
};
