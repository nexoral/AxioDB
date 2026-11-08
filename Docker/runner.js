const fs = require('fs');
const os = require('os');

function allottedCPUs() {
  try {
    const [quota, period] = fs.readFileSync('/sys/fs/cgroup/cpu.max', 'utf8').trim().split(' ');
    if (quota !== 'max') return Math.max(1, Math.ceil(Number(quota) / Number(period)));
  } catch {}
  try {
    const quota = Number(fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_quota_us', 'utf8').trim());
    const period = Number(fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_period_us', 'utf8').trim());
    if (quota > 0) return Math.max(1, Math.ceil(quota / period));
  } catch {}
  return os.cpus().length;
}

function allottedMemoryMB() {
  try {
    const quota = fs.readFileSync('/sys/fs/cgroup/memory.max', 'utf8').trim();
    if (quota !== 'max') return Math.floor(Number(quota) / (1024 * 1024));
  } catch {}
  try {
    const quota = Number(fs.readFileSync('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8').trim());
    if (quota > 0 && quota < 9e18) return Math.floor(quota / (1024 * 1024));
  } catch {}
  return Math.floor(os.totalmem() / (1024 * 1024));
}

if (!process.env.UV_THREADPOOL_SIZE) {
  process.env.UV_THREADPOOL_SIZE = String(Math.min(64, Math.max(4, allottedCPUs() * 4)));
}

if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
  const targetHeapMB = Math.max(512, Math.floor(allottedMemoryMB() * 0.75));
  process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS ? process.env.NODE_OPTIONS + ' ' : ''}--max-old-space-size=${targetHeapMB}`;
}

const { AxioDB } = require('./axiodb.js');

function parseBoolean(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes'].includes(String(value).trim().toLowerCase());
}

function parseNumber(value, fallback) {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const options = {
  HTTP: parseBoolean(process.env.AXIODB_HTTP, true),
  TCP: parseBoolean(process.env.AXIODB_TCP, true),
  TCPAuth: parseBoolean(process.env.AXIODB_TCP_AUTH_ENABLED, true),
  TLS: parseBoolean(process.env.AXIODB_TLS, false),
  Cache: parseBoolean(process.env.AXIODB_CACHE, true),
  minTTL: parseNumber(process.env.AXIODB_CACHE_MIN_TTL, undefined),
  maxTTL: parseNumber(process.env.AXIODB_CACHE_MAX_TTL, undefined),
  cacheClearUp: parseNumber(process.env.AXIODB_CACHE_CLEARUP, undefined),
  RootName: process.env.AXIODB_ROOT_NAME || "AxioDB",
  MCP: parseBoolean(process.env.AXIODB_MCP, false),
};

if (options.TCP && options.TCPAuth && !options.HTTP && !process.env.AXIODB_ADMIN_PASSWORD) {
  // Without the HTTP control server there is no way to change the seeded
  // admin/admin, and TCP rejects that account until it is changed - so the port
  // would come up with no account able to log in.
  console.error('Error: TCP authentication without AXIODB_HTTP requires AXIODB_ADMIN_PASSWORD.');
  console.error('The seeded admin/admin is rejected over TCP until its password is changed,');
  console.error('and that change is only possible through the HTTP API on port 27018.');
  console.error('Set -e AXIODB_ADMIN_PASSWORD=<password>, or enable AXIODB_HTTP to rotate it there.');
  process.exit(1);
}

if (process.env.AXIODB_ADMIN_PASSWORD) {
  options.AdminPassword = process.env.AXIODB_ADMIN_PASSWORD;
}

if (process.env.AXIODB_CUSTOM_PATH) {
  options.CustomPath = process.env.AXIODB_CUSTOM_PATH;
}

if (process.env.AXIODB_TLS_CERT_PATH) {
  options.TLSCertPath = process.env.AXIODB_TLS_CERT_PATH;
}
if (process.env.AXIODB_TLS_KEY_PATH) {
  options.TLSKeyPath = process.env.AXIODB_TLS_KEY_PATH;
}

const axioDBInstance = new AxioDB(options);

module.exports = axioDBInstance;
