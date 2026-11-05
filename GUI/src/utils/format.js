/**
 * Display helpers shared across the dashboard.
 */

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
  PIB: 1024 * 1024 * 1024 * 1024 * 1024
}

/**
 * Formats a raw byte count with a unit that suits its magnitude (B, KB, MB, GB, TB, PB).
 *
 * @param {number} bytes
 * @param {number} [decimals=2]
 * @returns {string} e.g. "0 B", "1.2 KB", "48.6 MB", "2.1 GB"
 */
export function formatBytes (bytes, decimals = 2) {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  const k = 1024
  const exponent = Math.min(
    Math.floor(Math.log(Math.abs(value)) / Math.log(k)),
    units.length - 1
  )
  if (exponent < 0) return '0 B'

  const scaled = value / Math.pow(k, exponent)
  const dm = decimals < 0 ? 0 : decimals
  const formatted = parseFloat(scaled.toFixed(dm))
  return `${formatted.toLocaleString(undefined, { maximumFractionDigits: dm })} ${units[exponent]}`
}

/**
 * Formats a storage figure by dynamically scaling to the appropriate unit (B, KB, MB, GB, TB, PB).
 * Never outputs dual units with slashes.
 *
 * @param {number} val
 * @param {string} [unit='MB'] - the input unit; defaults to 'MB'
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatStorage (val, unit = 'MB', decimals = 2) {
  if (val === undefined || val === null) return '0 MB'
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''))
  const cleanUnit = typeof unit === 'string' ? unit.trim().toUpperCase() : 'MB'
  if (!Number.isFinite(num) || num === 0) {
    return cleanUnit === 'B' || cleanUnit === 'BYTES' ? '0 B' : `0 ${cleanUnit || 'MB'}`
  }

  const multiplier = UNIT_MULTIPLIERS[cleanUnit] ?? (1024 * 1024)
  const bytes = num * multiplier

  return formatBytes(bytes, decimals)
}
