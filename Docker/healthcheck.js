const http = require('http');

function parseBoolean(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['true', '1', 'yes'].includes(String(value).trim().toLowerCase());
};

const httpEnabled = parseBoolean(process.env.AXIODB_HTTP, true);
const tcpEnabled = parseBoolean(process.env.AXIODB_TCP, true);
const tlsEnabled = parseBoolean(process.env.AXIODB_TLS, false);
const mcpEnabled = parseBoolean(process.env.AXIODB_MCP, false);
const mcpPort = parseInt(process.env.AXIODB_MCP_PORT || '27020', 10);
const CHECK_TIMEOUT_MS = 4000;

function checkHttp() {
  return new Promise((resolve, reject) => {
    const request = http.get(
      { host: 'localhost', port: 27018, path: '/api/health', timeout: CHECK_TIMEOUT_MS },
      (response) => {
        response.resume();
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP /api/health returned status ${response.statusCode}`));
        }
      },
    );
    request.on('timeout', () => request.destroy(new Error('HTTP /api/health request timed out')));
    request.on('error', reject);
  });
}

function checkTcp() {
  const { AxioDBCloud } = require('./lib/config/DB.js');
  const client = new AxioDBCloud('axiodb://localhost:27019', {
    timeout: CHECK_TIMEOUT_MS,
    maxPoolSize: 1,
    tls: tlsEnabled,
    tlsRejectUnauthorized: false,
  });

  client.on('error', () => {});

  return client
    .connect()
    .then(() => client.sendCommand('PING', {}))
    .finally(() => client.disconnect().catch(() => {}));
}

function checkMcp() {
  return new Promise((resolve, reject) => {
    const request = http.get(
      { host: 'localhost', port: mcpPort, path: '/mcp', timeout: CHECK_TIMEOUT_MS },
      (response) => {
        response.resume();
        resolve();
      },
    );
    request.on('timeout', () => request.destroy(new Error('MCP /mcp request timed out')));
    request.on('error', reject);
  });
}

async function main() {
  const checks = [];
  if (httpEnabled) checks.push(checkHttp());
  if (tcpEnabled) checks.push(checkTcp());
  if (mcpEnabled) checks.push(checkMcp());

  if (checks.length === 0) return;

  await Promise.all(checks);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[AxioDB Healthcheck] Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
