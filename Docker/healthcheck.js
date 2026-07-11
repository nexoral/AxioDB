const http = require('http');

// Mirrors runner.js's own boolean parsing so this script agrees with whatever
// surfaces the container actually started (GUI and/or TCP can each be disabled).
function parseBoolean(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes'].includes(String(value).trim().toLowerCase());
}

const guiEnabled = parseBoolean(process.env.AXIODB_GUI, true);
const tcpEnabled = parseBoolean(process.env.AXIODB_TCP, true);
const CHECK_TIMEOUT_MS = 4000;

function checkGui() {
  return new Promise((resolve, reject) => {
    const request = http.get(
      { host: 'localhost', port: 27018, path: '/health', timeout: CHECK_TIMEOUT_MS },
      (response) => {
        response.resume(); // drain body, we only care about the status code
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`GUI /health returned status ${response.statusCode}`));
        }
      },
    );
    request.on('timeout', () => request.destroy(new Error('GUI /health request timed out')));
    request.on('error', reject);
  });
}

function checkTcp() {
  // Reuses the exact heartbeat mechanism (PING -> PONG) the AxioDBCloud client already
  // uses internally to monitor its own connection - PING is exempt from TCPAuth, so this
  // works regardless of whether the container was started with AXIODB_TCP_AUTH=true.
  const { AxioDBCloud } = require('./lib/config/DB.js');
  // maxPoolSize: 1 - a liveness probe only needs one connection; the client's default pool
  // size of 10 would otherwise open (and immediately tear down) 10 TCP handshakes every
  // HEALTHCHECK interval for no benefit.
  const client = new AxioDBCloud('axiodb://localhost:27019', { timeout: CHECK_TIMEOUT_MS, maxPoolSize: 1 });

  // AxioDBCloud is an EventEmitter that re-emits socket errors as 'error' - without a
  // listener here, an unexpected disconnect would crash this healthcheck process instead
  // of just resolving to an "unhealthy" exit code.
  client.on('error', () => {});

  return client
    .connect()
    .then(() => client.sendCommand('PING', {}))
    .finally(() => client.disconnect().catch(() => {}));
}

async function main() {
  const checks = [];
  if (guiEnabled) checks.push(checkGui());
  if (tcpEnabled) checks.push(checkTcp());

  if (checks.length === 0) {
    // Neither surface is enabled - nothing meaningful to probe, so the container is
    // "healthy" as long as this script itself can run.
    return;
  }

  await Promise.all(checks);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[AxioDB Healthcheck] Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
