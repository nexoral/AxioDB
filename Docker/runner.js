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

if (!process.env.UV_THREADPOOL_SIZE) {
  process.env.UV_THREADPOOL_SIZE = String(Math.min(64, Math.max(4, allottedCPUs() * 4)));
}

const { AxioDB } = require('./lib/config/DB.js')

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
  GUI: parseBoolean(process.env.AXIODB_GUI, true),
  HTTP: parseBoolean(process.env.AXIODB_HTTP, parseBoolean(process.env.AXIODB_GUI, true)),
  TCP: parseBoolean(process.env.AXIODB_TCP, true),
  TCPAuth: parseBoolean(process.env.AXIODB_TCP_AUTH_ENABLED, true),
  TLS: parseBoolean(process.env.AXIODB_TLS, false),
  Cache: parseBoolean(process.env.AXIODB_CACHE, true),
  minTTL: parseNumber(process.env.AXIODB_CACHE_MIN_TTL, undefined),
  maxTTL: parseNumber(process.env.AXIODB_CACHE_MAX_TTL, undefined),
  cacheClearUp: parseNumber(process.env.AXIODB_CACHE_CLEARUP, undefined),
  RootName: process.env.AXIODB_ROOT_NAME || "AxioDB",
};

if (options.GUI && process.env.AXIODB_HTTP !== undefined && !options.HTTP) {
  console.error('Error: AXIODB_GUI=true requires AXIODB_HTTP to be enabled.');
  console.error('Set AXIODB_HTTP=true or remove the explicit AXIODB_HTTP=false.');
  process.exit(1);
}

if (options.TCP && options.TCPAuth && !options.HTTP && !process.env.AXIODB_ADMIN_PASSWORD) {
  // Without the HTTP control server there is no way to change the seeded
  // admin/admin, and TCP rejects that account until it is changed - so the port
  // would come up with no account able to log in. AXIODB_HTTP defaults to
  // AXIODB_GUI, so AXIODB_GUI=false alone lands here.
  console.error('Error: TCP authentication without AXIODB_HTTP requires AXIODB_ADMIN_PASSWORD.');
  console.error('The seeded admin/admin is rejected over TCP until its password is changed,');
  console.error('and that change is only possible through the HTTP API/GUI on port 27018.');
  console.error('Set -e AXIODB_ADMIN_PASSWORD=<password>, or enable AXIODB_HTTP/GUI to rotate it there.');
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

if (parseBoolean(process.env.AXIODB_MCP, false)) {
  require('./mcpServer.js')(axioDBInstance);
}

module.exports = axioDBInstance;
