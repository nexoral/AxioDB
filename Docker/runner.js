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
  RootName: process.env.AXIODB_ROOT_NAME || "AxioDB",
};

// Only set if provided - otherwise AxioDB falls back to its own default (cwd, i.e. /app in this image).
if (process.env.AXIODB_CUSTOM_PATH) {
  options.CustomPath = process.env.AXIODB_CUSTOM_PATH;
}

new AxioDB(options);