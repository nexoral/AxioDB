export function formatBytes(bytes, decimals = 2) {
  if (!Number.isFinite(bytes) || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(
    Math.floor(Math.log(Math.abs(bytes)) / Math.log(k)),
    sizes.length - 1
  );
  if (i < 0) return "0 B";
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const UNIT_MULTIPLIERS = {
  B: 1,
  BYTES: 1,
  BYTE: 1,
  KB: 1024,
  KIB: 1024,
  MB: 1024 * 1024,
  MIB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  GIB: 1024 * 1024 * 1024,
  TB: 1024 * 1024 * 1024 * 1024,
  TIB: 1024 * 1024 * 1024 * 1024,
  PB: 1024 * 1024 * 1024 * 1024 * 1024,
  PIB: 1024 * 1024 * 1024 * 1024 * 1024,
};

export function formatStorage(val, unit = "MB", decimals = 2) {
  if (val === undefined || val === null) return "0 B";
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
  if (!Number.isFinite(num) || num === 0) return "0 B";

  const cleanUnit = typeof unit === "string" ? unit.trim().toUpperCase() : "MB";
  const multiplier = UNIT_MULTIPLIERS[cleanUnit] ?? (1024 * 1024);
  const bytes = num * multiplier;

  return formatBytes(bytes, decimals);
}

export function formatUptime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return String(dateString);
  }
}
