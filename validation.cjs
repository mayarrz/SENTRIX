'use strict';

const EVENT_TYPES = new Set(['DECOY_LOGIN_ATTEMPT','SENSITIVE_FILE_READ','DATABASE_QUERY_EXPLORATION','DATA_EXPORT_ATTEMPT','CANARY_TOKEN_TRIGGERED','DIRECTORY_TRAVERSAL','ADMIN_PANEL_DISCOVERY','CONFIGURATION_DOWNLOAD']);
const SEVERITIES = new Set(['low','medium','high','critical']);
const ALERT_STATUSES = new Set(['new','investigating','reviewed','resolved']);
const SESSION_STATUSES = new Set(['active','isolated','monitored','terminated']);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/;
const REDACT_KEYS = /password|passwd|token|secret|authorization|cookie|credential|api.?key|username|email|phone|ssn|first.?name|last.?name/i;

function safeText(value, max = 500) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';
}
function redactText(value, max = 500) {
  const text = safeText(value, max);
  try {
    const parsed = JSON.parse(text);
    if (parsed?.received === true && Array.isArray(parsed.fields) && parsed.fields.every((field) => field && typeof field.name === 'string' && ['[REDACTED]', '[OMITTED]'].includes(field.value))) return JSON.stringify(parsed);
    if (parsed && typeof parsed === 'object') return JSON.stringify(redactPayload(parsed));
  } catch { /* Treat snippets and log text as bounded plain text below. */ }
  return text.replace(/(password|passwd|token|secret|authorization|cookie|credential|api.?key|username|email|phone|ssn|first.?name|last.?name)(["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\r\n,;&}]+)/gi, '$1$2[REDACTED]');
}
function safeHost(value) {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9.-]{0,98}$/.test(value) ? value : 'unknown';
}
function validId(value) { return typeof value === 'string' && ID_PATTERN.test(value); }
function redactPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { received: true, fields: [] };
  return { received: true, fields: Object.keys(payload).slice(0, 20).map((key) => ({ name: safeText(key, 60), value: REDACT_KEYS.test(key) ? '[REDACTED]' : '[OMITTED]' })) };
}
function clientIp(req) {
  const raw = req.socket?.remoteAddress || 'unknown'; // Deliberately ignore X-Forwarded-For.
  return raw === '::1' ? '127.0.0.1' : raw.startsWith('::ffff:') ? raw.slice(7) : raw;
}
module.exports = { EVENT_TYPES, SEVERITIES, ALERT_STATUSES, SESSION_STATUSES, safeText, redactText, safeHost, validId, redactPayload, clientIp };
