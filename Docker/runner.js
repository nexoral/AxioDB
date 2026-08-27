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

const options = {
  GUI: parseBoolean(process.env.AXIODB_GUI, true),
  HTTP: parseBoolean(process.env.AXIODB_HTTP, parseBoolean(process.env.AXIODB_GUI, true)),
  TCP: parseBoolean(process.env.AXIODB_TCP, true),
  TCPAuth: parseBoolean(process.env.AXIODB_TCP_AUTH_ENABLED, true),
  TLS: parseBoolean(process.env.AXIODB_TLS, false),
  RootName: process.env.AXIODB_ROOT_NAME || "AxioDB",
};

if (options.GUI && process.env.AXIODB_HTTP !== undefined && !options.HTTP) {
  console.error('Error: AXIODB_GUI=true requires AXIODB_HTTP to be enabled.');
  console.error('Set AXIODB_HTTP=true or remove the explicit AXIODB_HTTP=false.');
  process.exit(1);
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
