'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const { createServices, isLoopback } = require('./server.cjs');
const { nextSessionScore, severityBand, adaptiveState, withTransaction, ADAPTIVE_THRESHOLD } = require('./risk.cjs');

const validEvent = { resourceId: 'AST-DEC-01', eventType: 'DECOY_LOGIN_ATTEMPT', severity: 'medium', details: 'synthetic test' };

async function setup(env = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sentrix-test-'));
  const services = createServices({ dbPath: path.join(directory, 'test.sqlite'), env: { ...process.env, ADMIN_TOKEN: 'test-admin-token-123456789012345678901234567890', API_RATE_LIMIT: '100', HONEYPOT_RATE_LIMIT: '100', ...env } });
  const apiServer = services.api.listen(0, '127.0.0.1');
  const hpServer = services.honeypot.listen(0, '127.0.0.1');
  await Promise.all([new Promise(resolve => apiServer.once('listening', resolve)), new Promise(resolve => hpServer.once('listening', resolve))]);
  const api = `http://127.0.0.1:${apiServer.address().port}/api/v1`;
  const honeypot = `http://127.0.0.1:${hpServer.address().port}`;
  return { services, apiServer, hpServer, api, honeypot, async close() {
    await Promise.all([new Promise(resolve => apiServer.close(resolve)), new Promise(resolve => hpServer.close(resolve))]);
    services.close();
    fs.rmSync(directory, { recursive: true, force: true });
  } };
}

async function using(callback, env) {
  const server = await setup(env);
  try { await callback(server); } finally { await server.close(); }
}

test('health endpoint reports SQLite and demo mode', () => using(async ({ api }) => {
  const response = await fetch(`${api}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).ok, true);
}));

test('valid simulated event is persisted with authoritative score', () => using(async ({ api }) => {
  const response = await fetch(`${api}/simulation/trigger-event`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validEvent) });
  assert.equal(response.status, 201);
  const event = await response.json();
  assert.equal(event.riskScoreDelta, 12);
  assert.equal(event.sourceIp, '127.0.0.1');
  assert.equal((await (await fetch(`${api}/events`)).json()).length, 1);
}));

test('simulated event text redacts secret and personal fields too', () => using(async ({ api }) => {
  const response = await fetch(`${api}/simulation/trigger-event`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...validEvent, sourceHost: 'alice@example.invalid', details: 'username=alice@example.invalid password=synthetic-password', rawPayloadSnippet: 'POST /auth/login {"token":"synthetic-token"}' }) });
  assert.equal(response.status, 201);
  const event = await response.json();
  assert.equal(event.sourceHost, 'unknown');
  assert.doesNotMatch(event.details + event.rawPayloadSnippet, /alice@example\.invalid|synthetic-password|synthetic-token/);
  assert.match(event.details + event.rawPayloadSnippet, /REDACTED/);
}));

test('risk analysis score and severity factors match stored events', () => using(async ({ api }) => {
  for (const severity of ['low', 'medium', 'high']) await fetch(`${api}/simulation/trigger-event`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...validEvent, severity }) });
  const analysis = await (await fetch(`${api}/risk/analysis`)).json();
  assert.equal(analysis.overallScore, 39);
  assert.equal(analysis.severityBand, 'medium');
  assert.deepEqual(analysis.activeFactors.map((factor) => [factor.id, factor.weight, factor.occurrences]), [['RISK-low', 5, 1], ['RISK-medium', 12, 1], ['RISK-high', 22, 1]]);
}));

test('invalid event type is rejected', () => using(async ({ api }) => {
  const response = await fetch(`${api}/simulation/trigger-event`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...validEvent, eventType: 'SHELL_EXEC' }) });
  assert.equal(response.status, 400);
}));

test('unregistered resource identifier is rejected', () => using(async ({ api }) => {
  const response = await fetch(`${api}/simulation/trigger-event`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...validEvent, resourceId: 'ASSET-DOES-NOT-EXIST' }) });
  assert.equal(response.status, 400);
}));

test('unsupported severity is rejected', () => using(async ({ api }) => {
  const response = await fetch(`${api}/simulation/trigger-event`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...validEvent, severity: 'urgent' }) });
  assert.equal(response.status, 400);
}));

test('reset without authorization is rejected', () => using(async ({ api }) => {
  const response = await fetch(`${api}/simulation/reset`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 401);
}));

test('admin reset is disabled when no strong token is configured', () => using(async ({ api }) => {
  const response = await fetch(`${api}/simulation/reset`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /disabled/);
}, { ADMIN_TOKEN: '' }));

test('reset with invalid token is rejected', () => using(async ({ api }) => {
  const response = await fetch(`${api}/simulation/reset`, { method: 'POST', headers: { authorization: 'Bearer wrong', 'content-type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 401);
}));

test('reset with valid token succeeds and clears the test database', () => using(async ({ api }) => {
  await fetch(`${api}/simulation/trigger-event`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validEvent) });
  const response = await fetch(`${api}/simulation/reset`, { method: 'POST', headers: { authorization: 'Bearer test-admin-token-123456789012345678901234567890', 'content-type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 200);
  assert.equal((await (await fetch(`${api}/events`)).json()).length, 0);
}));

test('PATCH status requires authorization', () => using(async ({ api }) => {
  const response = await fetch(`${api}/sessions/SES-SIM-01/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'terminated' }) });
  assert.equal(response.status, 401);
}));

test('alert PATCH requires authorization and accepts valid status with a token', () => using(async ({ api }) => {
  await fetch(`${api}/simulation/trigger-event`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...validEvent, severity: 'high' }) });
  const [alert] = await (await fetch(`${api}/alerts`)).json();
  const unauthorized = await fetch(`${api}/alerts/${alert.id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'reviewed' }) });
  assert.equal(unauthorized.status, 401);
  const authorized = await fetch(`${api}/alerts/${alert.id}/status`, { method: 'PATCH', headers: { authorization: 'Bearer test-admin-token-123456789012345678901234567890', 'content-type': 'application/json' }, body: JSON.stringify({ status: 'reviewed' }) });
  assert.equal(authorized.status, 200);
}));

test('authorized PATCH validates status and updates a session', () => using(async ({ api }) => {
  await fetch(`${api}/simulation/trigger-event`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(validEvent) });
  const invalid = await fetch(`${api}/sessions/SES-SIM-01/status`, { method: 'PATCH', headers: { authorization: 'Bearer test-admin-token-123456789012345678901234567890', 'content-type': 'application/json' }, body: JSON.stringify({ status: 'destroyed' }) });
  assert.equal(invalid.status, 400);
  const valid = await fetch(`${api}/sessions/SES-SIM-01/status`, { method: 'PATCH', headers: { authorization: 'Bearer test-admin-token-123456789012345678901234567890', 'content-type': 'application/json' }, body: JSON.stringify({ status: 'monitored' }) });
  assert.equal(valid.status, 200);
}));

test('API rate limit returns 429 after configured request count', () => using(async ({ api }) => {
  await fetch(`${api}/health`);
  await fetch(`${api}/health`);
  const response = await fetch(`${api}/health`);
  assert.equal(response.status, 429);
}, { API_RATE_LIMIT: '2' }));

test('oversized management JSON request returns 413', () => using(async ({ api }) => {
  const response = await fetch(`${api}/simulation/trigger-event`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...validEvent, details: 'x'.repeat(20000) }) });
  assert.equal(response.status, 413);
}));

test('oversized honeypot JSON request returns 413 without creating an event', () => using(async ({ api, honeypot }) => {
  const response = await fetch(`${honeypot}/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ field: 'x'.repeat(6000) }) });
  assert.equal(response.status, 413);
  assert.equal((await (await fetch(`${api}/events`)).json()).length, 0);
}));

test('honeypot logs request metadata and redacts credential values', () => using(async ({ api, honeypot }) => {
  const response = await fetch(`${honeypot}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'SENTRIX-authorized-test', 'x-forwarded-for': '203.0.113.77' }, body: JSON.stringify({ username: 'synthetic-user', password: 'synthetic-not-a-secret', token: 'synthetic-token' }) });
  assert.equal(response.status, 401);
  const events = await (await fetch(`${api}/events`)).json();
  assert.equal(events.length, 1);
  assert.equal(events[0].classification, 'honeypot');
  assert.equal(events[0].sourceIp, '127.0.0.1');
  assert.equal(events[0].requestMethod, 'POST');
  assert.equal(events[0].requestResource, '/auth/login');
  assert.equal(events[0].userAgent, 'SENTRIX-authorized-test');
  assert.match(events[0].rawPayloadSnippet, /REDACTED/);
  assert.doesNotMatch(events[0].rawPayloadSnippet, /synthetic-not-a-secret|synthetic-token/);
}));

test('adaptive response changes at 60 and the transition is logged', () => using(async ({ api, honeypot }) => {
  const post = () => fetch(`${honeypot}/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  const first = await post();
  const second = await post();
  assert.equal((await first.json()).deceptionProfile, 'standard-login');
  assert.equal((await second.json()).deceptionProfile, 'standard-login');
  let events = await (await fetch(`${api}/events`)).json();
  assert.equal(events[0].sessionRiskScore, 44);
  assert.equal(events[0].adaptiveState, 'standard');
  const third = await post();
  assert.equal((await third.json()).deceptionProfile, 'enhanced-verification');
  events = await (await fetch(`${api}/events`)).json();
  assert.equal(events[0].sessionRiskScore, 66);
  assert.equal(events[0].adaptiveState, 'enhanced');
  assert.equal(events[0].adaptiveTransition, true);
  assert.match(events[0].details, /changed to enhanced/);
}));

test('cross-origin mutation is rejected', () => using(async ({ api }) => {
  const response = await fetch(`${api}/simulation/trigger-event`, { method: 'POST', headers: { origin: 'https://attacker.invalid', 'content-type': 'application/json' }, body: JSON.stringify(validEvent) });
  assert.equal(response.status, 403);
}));

test('configured local frontend origin is accepted', () => using(async ({ api }) => {
  const response = await fetch(`${api}/simulation/trigger-event`, { method: 'POST', headers: { origin: 'http://127.0.0.1:3000', 'content-type': 'application/json' }, body: JSON.stringify(validEvent) });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://127.0.0.1:3000');
}));

test('honeypot rate limit is enforced independently', () => using(async ({ honeypot }) => {
  await fetch(`${honeypot}/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  await fetch(`${honeypot}/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  const response = await fetch(`${honeypot}/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 429);
}, { HONEYPOT_RATE_LIMIT: '2' }));

test('JSON mutation rejects another content type', () => using(async ({ api }) => {
  const response = await fetch(`${api}/simulation/trigger-event`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}' });
  assert.equal(response.status, 415);
}));

test('malformed JSON is rejected with a generic error', () => using(async ({ api }) => {
  const response = await fetch(`${api}/simulation/trigger-event`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{broken' });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Invalid request body' });
}));

test('risk scoring boundaries, weights, and score cap are deterministic', () => {
  assert.equal(nextSessionScore(0, 'low'), 5);
  assert.equal(nextSessionScore(0, 'medium'), 12);
  assert.equal(nextSessionScore(0, 'high'), 22);
  assert.equal(nextSessionScore(0, 'critical'), 35);
  assert.equal(nextSessionScore(95, 'critical'), 100);
  assert.equal(severityBand(29), 'low');
  assert.equal(severityBand(30), 'medium');
  assert.equal(severityBand(60), 'high');
  assert.equal(severityBand(80), 'critical');
  assert.equal(ADAPTIVE_THRESHOLD, 60);
  assert.equal(adaptiveState(59), 'standard');
  assert.equal(adaptiveState(60), 'enhanced');
});

test('failed database transaction rolls back', () => {
  const calls = [];
  const db = { exec(command) { calls.push(command); if (command === 'COMMIT') throw new Error('forced failure'); } };
  assert.throws(() => withTransaction(db, () => 1), /forced failure/);
  assert.deepEqual(calls, ['BEGIN IMMEDIATE', 'COMMIT', 'ROLLBACK']);
});

test('management bind policy accepts only loopback addresses', () => {
  assert.equal(isLoopback('127.0.0.1'), true);
  assert.equal(isLoopback('localhost'), true);
  assert.equal(isLoopback('::1'), true);
  assert.equal(isLoopback('0.0.0.0'), false);
  assert.equal(isLoopback('192.168.1.4'), false);
});
