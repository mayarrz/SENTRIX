/**
 * SENTRIX — Fictional Cyber Deception Initial Dataset
 * 
 * All data in this file is strictly fictional and intended for educational
 * demonstration purposes. No real IP addresses, sensitive files, or credentials exist.
 */

import { Asset, SecurityEvent, Session, Alert, SimulationScenario } from '../types';
import sharedSeed from './backendSeed.json';

export const INITIAL_ASSETS = sharedSeed.assets as unknown as Asset[];
export const SIMULATION_SCENARIOS = sharedSeed.scenarios as unknown as SimulationScenario[];



export const INITIAL_SESSIONS: Session[] = [
  {
    id: 'SES-9041',
    sourceIdentifier: '10.240.14.88',
    sourceSubnet: 'VLAN-Guest-WiFi',
    startedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    accessedResources: ['AST-DEC-01', 'AST-DEC-04'],
    eventCount: 7,
    cumulativeRiskScore: 89,
    severity: 'critical',
    status: 'monitored',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Python-urllib/3.10',
    attributedTactic: 'Credential Access & Privilege Escalation'
  },
  {
    id: 'SES-9038',
    sourceIdentifier: '192.168.100.42',
    sourceSubnet: 'VPN-Contractor-Pool',
    startedAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    accessedResources: ['AST-DEC-02', 'AST-DEC-03'],
    eventCount: 12,
    cumulativeRiskScore: 78,
    severity: 'high',
    status: 'isolated',
    userAgent: 'sqlmap/1.7#stable (http://sqlmap.org)',
    attributedTactic: 'Automated Database Exploitation'
  },
  {
    id: 'SES-9022',
    sourceIdentifier: '10.10.5.210',
    sourceSubnet: 'Internal-Workstations-ZoneC',
    startedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    accessedResources: ['AST-DEC-05', 'AST-DEC-06'],
    eventCount: 4,
    cumulativeRiskScore: 48,
    severity: 'medium',
    status: 'active',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0',
    attributedTactic: 'Internal Network Discovery'
  },
  {
    id: 'SES-9005',
    sourceIdentifier: '172.16.88.19',
    sourceSubnet: 'Build-Server-Staging',
    startedAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    accessedResources: ['AST-DEC-07'],
    eventCount: 2,
    cumulativeRiskScore: 22,
    severity: 'low',
    status: 'terminated',
    userAgent: 'curl/7.88.1',
    attributedTactic: 'Passive Port & Service Probing'
  }
];

export const INITIAL_EVENTS: SecurityEvent[] = [
  {
    id: 'EVT-8820',
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    sessionId: 'SES-9041',
    sourceIp: '10.240.14.88',
    sourceHost: 'host-guest-dhcp-88.internal',
    resourceId: 'AST-DEC-04',
    resourceName: 'Backup Configuration & Cloud Keys',
    eventType: 'CONFIGURATION_DOWNLOAD',
    severity: 'critical',
    riskScoreDelta: 35,
    details: 'Downloaded fake .env.production.bak containing embedded canary AWS access keys.',
    rawPayloadSnippet: 'GET /var/backups/.env.production.bak HTTP/1.1\nHost: backup-stage.corp\nUser-Agent: Python-urllib/3.10',
    isSimulatedDemo: true
  },
  {
    id: 'EVT-8819',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    sessionId: 'SES-9041',
    sourceIp: '10.240.14.88',
    sourceHost: 'host-guest-dhcp-88.internal',
    resourceId: 'AST-DEC-01',
    resourceName: 'Internal Admin Portal',
    eventType: 'DECOY_LOGIN_ATTEMPT',
    severity: 'high',
    riskScoreDelta: 25,
    details: 'Simulated brute-force login attempted using username "admin" and leaked dictionary password.',
    rawPayloadSnippet: 'POST /api/v1/auth/login HTTP/1.1\n{"username": "admin", "token": "********"}',
    isSimulatedDemo: true
  },
  {
    id: 'EVT-8818',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    sessionId: 'SES-9038',
    sourceIp: '192.168.100.42',
    sourceHost: 'vpn-client-pool-42.vpn.corp',
    resourceId: 'AST-DEC-02',
    resourceName: 'Finance Database (Payroll 2026)',
    eventType: 'DATA_EXPORT_ATTEMPT',
    severity: 'critical',
    riskScoreDelta: 40,
    details: 'Initiated simulated batch export on synthetic table "mock_payroll_2026" (1,500 records target).',
    rawPayloadSnippet: 'COPY (SELECT * FROM mock_payroll_2026) TO \'/tmp/export.csv\' WITH CSV HEADER;',
    isSimulatedDemo: true
  },
  {
    id: 'EVT-8817',
    timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
    sessionId: 'SES-9038',
    sourceIp: '192.168.100.42',
    sourceHost: 'vpn-client-pool-42.vpn.corp',
    resourceId: 'AST-DEC-02',
    resourceName: 'Finance Database (Payroll 2026)',
    eventType: 'DATABASE_QUERY_EXPLORATION',
    severity: 'high',
    riskScoreDelta: 20,
    details: 'Enumerated information_schema tables searching for compensation and executive tables.',
    rawPayloadSnippet: 'SELECT table_name FROM information_schema.tables WHERE table_schema=\'public\';',
    isSimulatedDemo: true
  },
  {
    id: 'EVT-8816',
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    sessionId: 'SES-9022',
    sourceIp: '10.10.5.210',
    sourceHost: 'ws-eng-c210.internal',
    resourceId: 'AST-DEC-05',
    resourceName: 'Internal API Documentation (Swagger)',
    eventType: 'DIRECTORY_TRAVERSAL',
    severity: 'medium',
    riskScoreDelta: 15,
    details: 'Path traversal probes detected against decoy documentation microservice endpoint.',
    rawPayloadSnippet: 'GET /docs/v3/../../etc/passwd HTTP/1.1\nHost: api-internal.corp.local',
    isSimulatedDemo: true
  },
  {
    id: 'EVT-8815',
    timestamp: new Date(Date.now() - 1000 * 60 * 78).toISOString(),
    sessionId: 'SES-9022',
    sourceIp: '10.10.5.210',
    sourceHost: 'ws-eng-c210.internal',
    resourceId: 'AST-DEC-06',
    resourceName: 'Customer Records Archive (Historical)',
    eventType: 'SENSITIVE_FILE_READ',
    severity: 'medium',
    riskScoreDelta: 12,
    details: 'Decoy ZIP container previewed via mock SMB file-share reader.',
    rawPayloadSnippet: 'SMB2_CREATE "enterprise_contracts.zip" [DESIRED_ACCESS: FILE_READ_DATA]',
    isSimulatedDemo: true
  },
  {
    id: 'EVT-8814',
    timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    sessionId: 'SES-9041',
    sourceIp: '10.240.14.88',
    sourceHost: 'host-guest-dhcp-88.internal',
    resourceId: 'AST-DEC-01',
    resourceName: 'Internal Admin Portal',
    eventType: 'ADMIN_PANEL_DISCOVERY',
    severity: 'low',
    riskScoreDelta: 10,
    details: 'Port scan discovered hidden HTTP honeypot listening on port 8089.',
    rawPayloadSnippet: 'SYN probe on port 8089 -> Handshake accepted by SENTRIX Deception Daemon',
    isSimulatedDemo: true
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'ALT-1049',
    title: 'Critical Decoy Configuration Exfiltrated',
    severity: 'critical',
    relatedResourceId: 'AST-DEC-04',
    relatedResourceName: 'Backup Configuration & Cloud Keys',
    sessionId: 'SES-9041',
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    status: 'new',
    summary: 'Adversary successfully retrieved honeypot file containing synthetic canary AWS credentials.',
    recommendedAction: 'Keep session isolated; monitor honeypot AWS Canary token for external activation calls.',
    triggerFactor: 'Access to designated decoy endpoint with canary payload'
  },
  {
    id: 'ALT-1048',
    title: 'Bulk Data Exfiltration Attempt on Database Decoy',
    severity: 'critical',
    relatedResourceId: 'AST-DEC-02',
    relatedResourceName: 'Finance Database (Payroll 2026)',
    sessionId: 'SES-9038',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    status: 'investigating',
    summary: 'Automated SQL extraction query executed against decoy compensation vault.',
    recommendedAction: 'Engage adaptive tar-pit response to feed synthetic delay buffers to the client.',
    triggerFactor: 'Attempted simulated database export'
  },
  {
    id: 'ALT-1047',
    title: 'Repeated Decoy Authentication Failures',
    severity: 'high',
    relatedResourceId: 'AST-DEC-01',
    relatedResourceName: 'Internal Admin Portal',
    sessionId: 'SES-9041',
    timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    status: 'reviewed',
    summary: 'Velocity-based credential stuffing detected against decoy SSO gateway.',
    recommendedAction: 'Maintain honey-token response headers to record subsequent payload trials.',
    triggerFactor: 'Repeated access to the same sensitive-looking resource'
  },
  {
    id: 'ALT-1046',
    title: 'Reconnaissance Against Legacy Documentation Decoy',
    severity: 'medium',
    relatedResourceId: 'AST-DEC-05',
    relatedResourceName: 'Internal API Documentation (Swagger)',
    sessionId: 'SES-9022',
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    status: 'resolved',
    summary: 'Directory traversal parameters tested against public decoy OpenAPI endpoint.',
    recommendedAction: 'No immediate mitigation required; automated telemetry archived.',
    triggerFactor: 'Access to a designated decoy endpoint'
  }
];



export const MOCK_DATABASE_ROWS = [
  { id: 'REC-101', employee_id: 'EMP-9021', name: 'Alexander Vance', department: 'Executive Management', salary: '$240,000', bonus: '$55,000', canary_marker: 'ACTIVE_HONEY_RECORD' },
  { id: 'REC-102', employee_id: 'EMP-9022', name: 'Elena Rostova', department: 'Corporate Treasury', salary: '$185,000', bonus: '$32,000', canary_marker: 'ACTIVE_HONEY_RECORD' },
  { id: 'REC-103', employee_id: 'EMP-9023', name: 'Marcus Chen', department: 'Core Engineering', salary: '$195,000', bonus: '$28,000', canary_marker: 'ACTIVE_HONEY_RECORD' },
  { id: 'REC-104', employee_id: 'EMP-9024', name: 'Sophia Sterling', department: 'Global Legal & IP', salary: '$210,000', bonus: '$40,000', canary_marker: 'ACTIVE_HONEY_RECORD' },
  { id: 'REC-105', employee_id: 'EMP-9025', name: 'David K. O\'Connor', department: 'Infrastructure Ops', salary: '$165,000', bonus: '$18,000', canary_marker: 'ACTIVE_HONEY_RECORD' }
];

export const MOCK_CONFIG_FILES = [
  {
    filename: '.env.production.bak',
    path: '/var/backups/.env.production.bak',
    updated: '2026-09-14 03:22 UTC',
    content: `# SENTRIX Honey-Token Test Deployment
NODE_ENV=production
PORT=8080
DATABASE_URL=postgres://honey_adm:CANARY_PASS_8819@fin-db-decoy.corp.local:5432/payroll_vault
AWS_ACCESS_KEY_ID=AKIA_MOCK_CANARY_HONEY_KEY_88
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
STRIPE_WEBHOOK_SECRET=whsec_mock_decoy_canary_secret_9941
SENTRIX_TRAP_BEACON=https://sentrix-canary.internal.corp/ping/token-8819`
  },
  {
    filename: 'k8s-cluster-credentials.yaml',
    path: '/home/ubuntu/.kube/config.decoy',
    updated: '2026-10-02 11:45 UTC',
    content: `apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTi...MOCK_CANARY_CERT
    server: https://10.240.0.10:6443
  name: prod-corp-cluster
contexts:
- context:
    cluster: prod-corp-cluster
    user: honey-deployer-sa
  name: prod-context
current-context: prod-context
users:
- user:
    token: eyJhbGciOiJSUzI1NiIsImtpZCI6IkNBTkFSWS1UT0tFTiJ9.MOCK_PAYLOAD
  name: honey-deployer-sa`
  },
  {
    filename: 'aws-s3-creds.conf',
    path: '/opt/storage/credentials/aws-s3-creds.conf',
    updated: '2026-08-20 18:02 UTC',
    content: `[default]
aws_access_key_id = AKIA_S3_ARCHIVE_CANARY_TRAP_22
aws_secret_access_key = vZ09aG+HONEY_KEY_TOKEN_DO_NOT_DEPLOY
region = us-east-1
s3_bucket = corp-historical-contracts-archive-decoy`
  }
];

export const MOCK_DOCUMENTS = [
  {
    id: 'DOC-01',
    title: 'Q3_Acquisition_Confidential.pdf',
    category: 'M&A Strategy',
    size: '4.2 MB',
    author: 'Office of the CEO',
    classification: 'STRICTLY CONFIDENTIAL (FICTIONAL LURE)',
    decoyPayloadId: 'PDF-DNS-CANARY-RESOLVER-552',
    description: 'High-value executive bait document. Simulates internal strategic acquisition terms.'
  },
  {
    id: 'DOC-02',
    title: 'Employee_Salary_Bands_2026.xlsx',
    category: 'Human Resources',
    size: '1.8 MB',
    author: 'HR Compensation Committee',
    classification: 'CONFIDENTIAL INTERNAL',
    decoyPayloadId: 'EXCEL-MACRO-CANARY-449',
    description: 'Tabular bait with synthetic salary quartiles and embedded canary macro telemetry.'
  },
  {
    id: 'DOC-03',
    title: 'Core_Network_Architecture_Topology.vsdx',
    category: 'Infrastructure',
    size: '8.7 MB',
    author: 'Principal Network Architect',
    classification: 'INTERNAL ONLY',
    decoyPayloadId: 'VISIO-WEBHOOK-TRAP-901',
    description: 'Decoy network diagram pointing to honeypot subnets and synthetic jump boxes.'
  }
];
