'use strict';

require('dotenv').config({ quiet: true });
const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const { createHash, timingSafeEqual, randomUUID } = require('node:crypto');
const seed = require('../src/data/backendSeed.json');
const { nextSessionScore, scoreForSeverity, severityBand, adaptiveState, riskFactorsForEvents, ADAPTIVE_THRESHOLD, withTransaction } = require('./risk.cjs');
const { EVENT_TYPES, SEVERITIES, ALERT_STATUSES, SESSION_STATUSES, safeText, redactText, safeHost, validId, redactPayload, clientIp } = require('./validation.cjs');

const API_PREFIX = '/api/v1';
const MAX_EVENTS = 10000;
const MAX_SESSIONS = 5000;

function createRateLimiter({ windowMs, max }) {
  const hits = new Map();
  return (req, res, next) => {
    const key = clientIp(req);
    const now = Date.now();
    let item = hits.get(key);
    if (!item || item.until <= now) item = { count: 0, until: now + windowMs };
    item.count += 1;
    hits.set(key, item);
    if (hits.size > 2000) for (const [ip, entry] of hits) if (entry.until <= now) hits.delete(ip);
    if (hits.size > 5000) hits.delete(hits.keys().next().value);
    res.set('RateLimit-Limit', String(max));
    res.set('RateLimit-Remaining', String(Math.max(0, max - item.count)));
    if (item.count > max) return res.status(429).json({ error: 'Rate limit exceeded' });
    next();
  };
}

function constantTimeTokenMatch(actual, expected) {
  if (!actual || !expected) return false;
  const left = createHash('sha256').update(actual).digest();
  const right = createHash('sha256').update(expected).digest();
  return timingSafeEqual(left, right);
}

function createServices({ dbPath = process.env.SENTRIX_DB_PATH || path.join(__dirname, 'sentrix.sqlite'), env = process.env } = {}) {
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode=WAL;
    PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, timestamp TEXT NOT NULL, sourceIp TEXT NOT NULL, resourceId TEXT, resourceName TEXT NOT NULL, eventType TEXT NOT NULL, severity TEXT NOT NULL, payload TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS events_time_idx ON events(timestamp DESC);
    CREATE TABLE IF NOT EXISTS alerts (id TEXT PRIMARY KEY, timestamp TEXT NOT NULL, status TEXT NOT NULL, payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, payload TEXT NOT NULL);`);
  const candidateAdminToken = env.ADMIN_TOKEN || '';
  const adminToken = candidateAdminToken.length >= 32 && candidateAdminToken !== 'generate-with-node-crypto-before-running' ? candidateAdminToken : '';
  const expectedOrigin = env.CORS_ORIGIN || 'http://127.0.0.1:3000';

  const api = express();
  api.disable('x-powered-by');
  api.use((req, res, next) => {
    const origin = req.get('Origin');
    if (origin && origin !== expectedOrigin) return res.status(403).json({ error: 'Origin not allowed' });
    if (origin === expectedOrigin) {
      res.set('Access-Control-Allow-Origin', expectedOrigin);
      res.set('Vary', 'Origin');
      res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(origin === expectedOrigin ? 204 : 403);
    next();
  });
  api.use(createRateLimiter({ windowMs: Number(env.API_RATE_WINDOW_MS) || 60000, max: Number(env.API_RATE_LIMIT) || 120 }));
  api.use(express.json({ limit: '16kb', strict: true }));
  api.use((req, res, next) => {
    if (['POST', 'PATCH', 'PUT'].includes(req.method) && !req.is('application/json')) return res.status(415).json({ error: 'Content-Type must be application/json' });
    next();
  });

  function requireAdmin(req, res, next) {
    const value = req.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!constantTimeTokenMatch(value, adminToken)) return res.status(adminToken ? 401 : 403).json({ error: adminToken ? 'Unauthorized' : 'Administrative actions are disabled: ADMIN_TOKEN is not configured' });
    next();
  }
  function payloadRows(table, limit = 500) { return db.prepare(`SELECT payload FROM ${table} ORDER BY timestamp DESC LIMIT ?`).all(limit).map((row) => JSON.parse(row.payload)); }
  function currentAssets() {
    const counts = db.prepare('SELECT resourceId, COUNT(*) AS count, MAX(timestamp) AS lastSeen FROM events GROUP BY resourceId').all();
    const byId = new Map(counts.map((item) => [item.resourceId, item]));
    return seed.assets.map((asset) => {
      const observed = byId.get(asset.id);
      return observed ? { ...asset, interactionCount: Number(observed.count), lastSimulatedInteraction: observed.lastSeen } : asset;
    });
  }

  api.get(`${API_PREFIX}/health`, (_req, res) => res.json({ ok: true, database: 'sqlite', mode: 'demo', timestamp: new Date().toISOString() }));
  api.get(`${API_PREFIX}/assets`, (_req, res) => res.json(currentAssets()));
  api.get(`${API_PREFIX}/assets/:id`, (req, res) => res.json(currentAssets().find((asset) => asset.id === req.params.id) || null));
  api.get(`${API_PREFIX}/simulation/scenarios`, (_req, res) => res.json(seed.scenarios.map((scenario) => ({ ...scenario, steps: scenario.steps.map((step) => ({ ...step, riskDelta: scoreForSeverity(step.severity) })) }))));
  api.get(`${API_PREFIX}/events`, (req, res) => {
    const requested = Number(req.query.limit || 500);
    const limit = Number.isInteger(requested) ? Math.max(1, Math.min(1000, requested)) : 500;
    res.json(payloadRows('events', limit));
  });
  api.get(`${API_PREFIX}/alerts`, (_req, res) => res.json(payloadRows('alerts', 1000)));
  api.get(`${API_PREFIX}/sessions`, (_req, res) => res.json(db.prepare('SELECT payload FROM sessions').all().map((row) => JSON.parse(row.payload))));
  api.get(`${API_PREFIX}/risk/analysis`, (_req, res) => {
    const sessions = db.prepare('SELECT payload FROM sessions').all().map((row) => JSON.parse(row.payload));
    const score = Math.max(0, Math.min(100, sessions.reduce((max, session) => Math.max(max, session.cumulativeRiskScore || 0), 0)));
    const eventRows = payloadRows('events', MAX_EVENTS);
    res.json({ overallScore: score, severityBand: severityBand(score), baselineComparison: 'Deterministic per-session additive score', activeFactors: riskFactorsForEvents(eventRows), lastCalculated: new Date().toISOString(), totalEvaluatedEvents: Number(db.prepare('SELECT COUNT(*) AS count FROM events').get().count), formula: 'low +5, medium +12, high +22, critical +35 per session event; capped at 100', adaptiveThreshold: ADAPTIVE_THRESHOLD });
  });

  function recordEvent(input) {
    const now = new Date().toISOString();
    const ip = input.sourceIp;
    const sessionId = input.sessionId;
    const asset = seed.assets.find((item) => item.id === input.resourceId);
    const event = {
      id: `EVT-${randomUUID()}`, timestamp: now, sessionId, sourceIp: ip,
      sourceHost: safeHost(input.sourceHost), resourceId: asset?.id || input.resourceId,
      resourceName: asset?.name || input.resourceName, eventType: input.eventType,
      severity: input.severity, riskScoreDelta: input.riskScoreDelta,
      details: redactText(input.details), rawPayloadSnippet: redactText(input.rawPayloadSnippet),
      isSimulatedDemo: input.isSimulatedDemo, classification: input.isSimulatedDemo ? 'simulated' : 'honeypot',
      requestMethod: input.requestMethod || 'POST', requestResource: input.requestResource || input.resourceId,
      userAgent: input.userAgent || 'Not provided'
    };
    let alert = null;
    withTransaction(db, () => {
      const old = db.prepare('SELECT payload FROM sessions WHERE id=?').get(sessionId);
      const session = old ? JSON.parse(old.payload) : { id: sessionId, sourceIdentifier: ip, sourceSubnet: 'Not collected', startedAt: now, lastActiveAt: now, accessedResources: [], eventCount: 0, cumulativeRiskScore: 0, severity: 'low', status: 'active', userAgent: input.userAgent || 'Not provided', attributedTactic: 'Honeypot interaction', adaptiveState: 'standard' };
      const previousState = adaptiveState(session.cumulativeRiskScore);
      session.eventCount += 1;
      session.lastActiveAt = now;
      session.cumulativeRiskScore = nextSessionScore(session.cumulativeRiskScore, input.severity);
      session.severity = severityBand(session.cumulativeRiskScore);
      session.accessedResources = [...new Set([...session.accessedResources, event.resourceId])];
      session.adaptiveState = adaptiveState(session.cumulativeRiskScore);
      event.sessionRiskScore = session.cumulativeRiskScore;
      event.adaptiveState = session.adaptiveState;
      event.adaptiveTransition = previousState !== session.adaptiveState;
      if (event.adaptiveTransition) event.details += ` Adaptive deception changed to ${session.adaptiveState} at risk ${session.cumulativeRiskScore}/100.`;
      db.prepare('INSERT INTO events VALUES (?,?,?,?,?,?,?,?)').run(event.id, now, event.sourceIp, event.resourceId, event.resourceName, event.eventType, event.severity, JSON.stringify(event));
      db.prepare('INSERT INTO sessions(id,payload) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').run(session.id, JSON.stringify(session));
      if (['high', 'critical'].includes(input.severity)) {
        alert = { id: `ALT-${randomUUID()}`, title: `${event.classification === 'honeypot' ? 'Honeypot' : 'Simulated'} interaction: ${event.resourceName}`, severity: input.severity, relatedResourceId: event.resourceId, relatedResourceName: event.resourceName, sessionId, timestamp: now, status: 'new', summary: event.details, recommendedAction: 'Review the recorded synthetic deception event.', triggerFactor: event.eventType };
        db.prepare('INSERT INTO alerts VALUES (?,?,?,?)').run(alert.id, now, alert.status, JSON.stringify(alert));
      }
      db.prepare('DELETE FROM events WHERE id NOT IN (SELECT id FROM events ORDER BY timestamp DESC LIMIT ?)').run(MAX_EVENTS);
      db.prepare('DELETE FROM alerts WHERE id NOT IN (SELECT id FROM alerts ORDER BY timestamp DESC LIMIT ?)').run(MAX_EVENTS);
      db.prepare("DELETE FROM sessions WHERE id NOT IN (SELECT id FROM sessions ORDER BY json_extract(payload, '$.lastActiveAt') DESC LIMIT ?)").run(MAX_SESSIONS);
    });
    return { event, alert };
  }

  api.post(`${API_PREFIX}/simulation/trigger-event`, (req, res) => {
    const body = req.body || {};
    const asset = seed.assets.find((item) => item.id === body.resourceId);
    if (!EVENT_TYPES.has(body.eventType) || !SEVERITIES.has(body.severity) || !validId(body.resourceId) || !asset) return res.status(400).json({ error: 'Invalid event type, severity, or resource identifier' });
    const result = recordEvent({ sessionId: validId(body.sessionId) ? body.sessionId : 'SES-SIM-01', sourceIp: clientIp(req), sourceHost: safeHost(body.sourceHost), resourceId: body.resourceId, resourceName: asset?.name || safeText(body.resourceName, 120) || 'Synthetic decoy', eventType: body.eventType, severity: body.severity, riskScoreDelta: scoreForSeverity(body.severity), details: redactText(body.details), rawPayloadSnippet: redactText(body.rawPayloadSnippet), userAgent: safeText(req.get('User-Agent'), 300), isSimulatedDemo: true, requestMethod: req.method, requestResource: safeText(req.path, 180) });
    res.status(201).json(result.event);
  });

  api.post(`${API_PREFIX}/simulation/reset`, requireAdmin, (_req, res) => {
    withTransaction(db, () => db.exec('DELETE FROM alerts; DELETE FROM sessions; DELETE FROM events;'));
    res.json({ success: true, events: 0, alerts: 0, sessions: 0 });
  });
  api.patch(`${API_PREFIX}/alerts/:id/status`, requireAdmin, (req, res) => {
    if (!validId(req.params.id) || !ALERT_STATUSES.has(req.body?.status)) return res.status(400).json({ error: 'Invalid alert identifier or status' });
    const old = db.prepare('SELECT payload FROM alerts WHERE id=?').get(req.params.id);
    if (!old) return res.status(404).json({ error: 'Alert not found' });
    const item = { ...JSON.parse(old.payload), status: req.body.status };
    db.prepare('UPDATE alerts SET status=?,payload=? WHERE id=?').run(item.status, JSON.stringify(item), req.params.id);
    res.json({ success: true, alertId: item.id, status: item.status });
  });
  api.patch(`${API_PREFIX}/sessions/:id/status`, requireAdmin, (req, res) => {
    if (!validId(req.params.id) || !SESSION_STATUSES.has(req.body?.status)) return res.status(400).json({ error: 'Invalid session identifier or status' });
    const old = db.prepare('SELECT payload FROM sessions WHERE id=?').get(req.params.id);
    if (!old) return res.status(404).json({ error: 'Session not found' });
    const item = { ...JSON.parse(old.payload), status: req.body.status };
    db.prepare('UPDATE sessions SET payload=? WHERE id=?').run(JSON.stringify(item), req.params.id);
    res.json({ success: true, sessionId: item.id, status: item.status });
  });
  api.use((err, _req, res, _next) => {
    const status = err?.type === 'entity.too.large' ? 413 : err instanceof SyntaxError ? 400 : 500;
    res.status(status).json({ error: status === 413 ? 'Request body too large' : status === 400 ? 'Invalid request body' : 'Internal server error' });
  });

  const honeypot = express();
  honeypot.disable('x-powered-by');
  honeypot.use(createRateLimiter({ windowMs: Number(env.HONEYPOT_RATE_WINDOW_MS) || 60000, max: Number(env.HONEYPOT_RATE_LIMIT) || 30 }));
  honeypot.use(express.json({ limit: '4kb', strict: false }));
  honeypot.use(express.urlencoded({ extended: false, limit: '4kb', parameterLimit: 20 }));
  honeypot.all(['/login', '/auth/login', '/'], (req, res) => {
    if (!['POST', 'GET'].includes(req.method)) return res.status(405).json({ error: 'Method not supported' });
    const now = new Date().toISOString();
    const ip = clientIp(req);
    const sessionId = `HP-${createHash('sha256').update(ip).digest('hex').slice(0, 20)}`;
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const payload = redactPayload(body);
    const result = recordEvent({
      sessionId, sourceIp: ip, sourceHost: '', resourceId: 'HP-LOGIN', resourceName: 'Synthetic Login Honeypot',
      eventType: 'DECOY_LOGIN_ATTEMPT', severity: 'high', riskScoreDelta: 22,
      details: `${req.method} ${safeText(req.path, 180)} received; payload values omitted or redacted.`,
      rawPayloadSnippet: JSON.stringify(payload), userAgent: safeText(req.get('User-Agent'), 300), isSimulatedDemo: false,
      requestMethod: req.method, requestResource: safeText(req.path, 180)
    });
    const enhanced = result.event.adaptiveState === 'enhanced';
    res.status(401).json({
      error: enhanced ? 'Additional verification required' : 'Invalid credentials',
      deceptionProfile: enhanced ? 'enhanced-verification' : 'standard-login',
      requestId: result.event.id, recordedAt: now, adaptiveState: result.event.adaptiveState
    });
  });
  honeypot.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  honeypot.use((err, _req, res, _next) => {
    const status = err?.type === 'entity.too.large' ? 413 : err instanceof SyntaxError ? 400 : 500;
    res.status(status).json({ error: status === 413 ? 'Request body too large' : status === 400 ? 'Invalid request body' : 'Internal server error' });
  });
  return { api, honeypot, db, close: () => db.close() };
}

function isLoopback(host) { return ['127.0.0.1', '::1', 'localhost'].includes(host); }
function start() {
  const managementHost = process.env.API_HOST || '127.0.0.1';
  if (!isLoopback(managementHost)) throw new Error('API_HOST must be localhost, 127.0.0.1, or ::1; management API cannot bind to LAN interfaces.');
  const services = createServices();
  const apiServer = services.api.listen(Number(process.env.API_PORT || process.env.PORT || 5000), managementHost, () => console.log(`SENTRIX management API listening on http://${managementHost}:${apiServer.address().port}${API_PREFIX}`));
  const honeypotHost = process.env.HONEYPOT_HOST || '127.0.0.1';
  const honeypotServer = services.honeypot.listen(Number(process.env.HONEYPOT_PORT || 5001), honeypotHost, () => console.log(`SENTRIX honeypot listening on http://${honeypotHost}:${honeypotServer.address().port}/login`));
  const shutdown = () => { apiServer.close(); honeypotServer.close(); services.close(); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  return { ...services, apiServer, honeypotServer };
}

if (require.main === module) start();
module.exports = { createServices, createRateLimiter, start, isLoopback, API_PREFIX, MAX_EVENTS, MAX_SESSIONS };
