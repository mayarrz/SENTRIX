/**
 * SENTRIX — Adaptive Cyber Deception Platform
 * Core TypeScript Data Models
 * 
 * These interfaces form the shared contract between this frontend application
 * and the backend services developed by the security & backend team members.
 */

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type DecoyType = 
  | 'admin_portal' 
  | 'database_record' 
  | 'config_file' 
  | 'document_repository' 
  | 'api_endpoint' 
  | 'ssh_service';

export type DecoyStatus = 
  | 'active_decoy' 
  | 'canary_token' 
  | 'lure_file' 
  | 'shadow_service' 
  | 'dormant';

export type SessionStatus = 'active' | 'isolated' | 'monitored' | 'terminated';

export type AlertStatus = 'new' | 'investigating' | 'reviewed' | 'resolved';

/**
 * Fictional protected corporate asset / decoy honeypot resource
 */
export interface Asset {
  id: string;
  name: string;
  type: DecoyType;
  decoyStatus: DecoyStatus;
  riskLevel: SeverityLevel;
  lastSimulatedInteraction: string; // ISO date string
  interactionCount: number;
  deployedEnvironment: string; // e.g. "DMZ-VLAN-10", "Internal-Core-02"
  description: string;
  canaryPayload?: string;
  deceptionStrategy: string;
  fakeResourcePath: string; // e.g. "/api/v2/admin/payroll"
}

/**
 * Security Event triggered by interactions with decoys
 */
export interface SecurityEvent {
  id: string;
  timestamp: string; // ISO date string
  sessionId: string;
  sourceIp: string;
  sourceHost: string;
  resourceId: string;
  resourceName: string;
  eventType: 
    | 'DECOY_LOGIN_ATTEMPT'
    | 'SENSITIVE_FILE_READ'
    | 'DATABASE_QUERY_EXPLORATION'
    | 'DATA_EXPORT_ATTEMPT'
    | 'CANARY_TOKEN_TRIGGERED'
    | 'DIRECTORY_TRAVERSAL'
    | 'ADMIN_PANEL_DISCOVERY'
    | 'CONFIGURATION_DOWNLOAD';
  severity: SeverityLevel;
  riskScoreDelta: number;
  details: string;
  rawPayloadSnippet?: string;
  isSimulatedDemo: boolean; // False only for requests received by the honeypot listener
  classification?: 'simulated' | 'honeypot';
  sessionRiskScore?: number;
  adaptiveState?: 'standard' | 'enhanced';
  adaptiveTransition?: boolean;
  requestMethod?: string;
  requestResource?: string;
  userAgent?: string;
}

/**
 * Simulated suspicious attacker session
 */
export interface Session {
  id: string;
  sourceIdentifier: string; // Fictional IP / Hostname
  sourceSubnet: string;
  startedAt: string;
  lastActiveAt: string;
  accessedResources: string[]; // List of asset IDs
  eventCount: number;
  cumulativeRiskScore: number; // 0 - 100
  severity: SeverityLevel;
  status: SessionStatus;
  userAgent: string;
  attributedTactic: string; // e.g. "Credential Access", "Discovery", "Exfiltration"
  adaptiveState?: 'standard' | 'enhanced';
}

/**
 * High-priority security alert generated when high-risk decoy thresholds are exceeded
 */
export interface Alert {
  id: string;
  title: string;
  severity: SeverityLevel;
  relatedResourceId: string;
  relatedResourceName: string;
  sessionId: string;
  timestamp: string;
  status: AlertStatus;
  summary: string;
  recommendedAction: string;
  triggerFactor: string;
}

/**
 * Contributing factor to the algorithmic risk score
 */
export interface RiskFactor {
  id: string;
  factorName: string;
  weight: number; // e.g. +35 points
  description: string;
  category: 'Resource Sensitivity' | 'Action Velocity' | 'Payload Intent' | 'Decoy Precision' | 'Severity Contribution';
  occurrences: number;
}

/**
 * Risk analysis snapshot
 */
export interface RiskScoreAnalysis {
  overallScore: number; // 0 - 100
  severityBand: SeverityLevel;
  baselineComparison: string; // e.g. "+18% above nominal baseline"
  activeFactors: RiskFactor[];
  lastCalculated: string;
  totalEvaluatedEvents: number;
}

/**
 * Simulation scenario for controlled demonstrations
 */
export interface SimulationScenario {
  id: string;
  title: string;
  description: string;
  threatActorProfile: string;
  expectedTTP: string; // MITRE ATT&CK reference (e.g. "T1078, T1005")
  estimatedDurationSeconds: number;
  steps: {
    stepNumber: number;
    actionName: string;
    resourceName: string;
    resourceId: string;
    eventType: SecurityEvent['eventType'];
    severity: SeverityLevel;
    riskDelta: number;
    description: string;
    delayMs: number;
  }[];
}
