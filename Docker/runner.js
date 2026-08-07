const fs = require('fs');
const os = require('os');

// libuv's threadpool (fs I/O, crypto, zlib) sizes itself once, on the first async call any
// of those make - so it has to be set before requiring DB.js below, which is exactly that
// first call. `os.cpus().length` reports the HOST's core count, not what Docker's `--cpus`
// or Kubernetes `resources.limits.cpu` actually granted this container (a classic containers
// gotcha - Node has no stdlib API for the real allotment), so read the cgroup quota directly:
// cgroup v2 first, then v1, falling back to the host count only on bare metal / no quota set.
function allottedCPUs() {
  try {
    const [quota, period] = fs.readFileSync('/sys/fs/cgroup/cpu.max', 'utf8').trim().split(' ');
    if (quota !== 'max') return Math.max(1, Math.ceil(Number(quota) / Number(period)));
  } catch {
    // Not cgroup v2 (or not containerized) - fall through to the v1 check below.
  }
  try {
    const quota = Number(fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_quota_us', 'utf8').trim());
    const period = Number(fs.readFileSync('/sys/fs/cgroup/cpu/cpu.cfs_period_us', 'utf8').trim());
    if (quota > 0) return Math.max(1, Math.ceil(quota / period));
  } catch {
    // Not cgroup v1 either - fall back to the host's core count.
  }
  return os.cpus().length;
}

// Respects an explicit `-e UV_THREADPOOL_SIZE=...` override; only computed when the operator
// hasn't set one. Clamped to [4, 64] - 4 is libuv's own default (a sane floor), 64 guards
// against an unreasonably large pool on a big, quota-less host (libuv's actual hard ceiling
// is 1024 - UV_THREADPOOL_SIZE_MAX - but going anywhere near that just adds thread overhead
// without more real disk/CPU parallelism behind it).
if (!process.env.UV_THREADPOOL_SIZE) {
  process.env.UV_THREADPOOL_SIZE = String(Math.min(64, Math.max(4, allottedCPUs() * 4)));
}

const { AxioDB } = require('./lib/config/DB.js')

// Every option below has a hardcoded default (matching the image's previous fixed
// behavior) but can be overridden per-container with `docker run -e VAR=value ...`
// or in docker-compose's `environment:` block - no rebuild required.
function parseBoolean(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes'].includes(String(value).trim().toLowerCase());
}

const options = {
  GUI: parseBoolean(process.env.AXIODB_GUI, true),
  TCP: parseBoolean(process.env.AXIODB_TCP, true),
  TCPAuth: parseBoolean(process.env.AXIODB_TCP_AUTH, true),
  TLS: parseBoolean(process.env.AXIODB_TLS, false),
  RootName: process.env.AXIODB_ROOT_NAME || "AxioDB",
};

// Only set if provided - otherwise AxioDB falls back to its own default (cwd, i.e. /app in this image).
if (process.env.AXIODB_CUSTOM_PATH) {
  options.CustomPath = process.env.AXIODB_CUSTOM_PATH;
}

// Required when AXIODB_TLS=true (the cert/key files themselves must be mounted into the
// container, e.g. via `docker run -v`) - AxioDB itself fails fast at startup if TLS is on
// but either path is missing, rather than silently falling back to plaintext.
if (process.env.AXIODB_TLS_CERT_PATH) {
  options.TLSCertPath = process.env.AXIODB_TLS_CERT_PATH;
}
if (process.env.AXIODB_TLS_KEY_PATH) {
  options.TLSKeyPath = process.env.AXIODB_TLS_KEY_PATH;
}

const axioDBInstance = new AxioDB(options);

// Opt-in MCP server (Model Context Protocol) - runs in this same process against this same
// AxioDB instance, on its own port. Requires real login (default admin/admin, same as the
// GUI) and enforces the same RBAC permissions per tool call; see mcpServer.js.
if (parseBoolean(process.env.AXIODB_MCP, false)) {
  require('./mcpServer.js')(axioDBInstance);
}

module.exports = axioDBInstance;