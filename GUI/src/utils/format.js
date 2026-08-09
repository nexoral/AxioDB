/**
 * Display helpers shared across the dashboard.
 *
 * The API reports storage in megabytes, which stops being readable somewhere around a
 * five-digit figure - "479,118.92 MB" is a number you have to do arithmetic on before it
 * means anything. Every storage figure therefore shows both units.
 */

/** 1024, not 1000: these figures come from `statfs` block counts, which are binary. */
const MB_PER_GB = 1024
const MB_PER_TB = 1024 * 1024

/**
 * Formats a megabyte figure as `"<MB> MB / <GB> GB"`, stepping up to TB once the value
 * passes a terabyte.
 *
 * Precision scales with magnitude - two decimals below 10 so small readings don't collapse
 * to "0", and none above 100 where they would be noise.
 *
 * @param {number} megabytes
 * @param {string} [unit] - the unit the caller's figure is already in; anything other than
 *   MB is passed through untouched rather than silently mis-converted.
 * @returns {string}
 */
export function formatStorage (megabytes, unit = 'MB') {
  const value = Number(megabytes)
  if (!Number.isFinite(value)) return `0 ${unit}`
  if (unit !== 'MB') return `${value.toLocaleString()} ${unit}`

  const decimals = (n) => (n === 0 ? 0 : n < 10 ? 2 : n < 100 ? 1 : 0)
  const show = (n) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: decimals(n),
      maximumFractionDigits: decimals(n)
    })

  const large =
    value >= MB_PER_TB
      ? `${show(value / MB_PER_TB)} TB`
      : `${show(value / MB_PER_GB)} GB`

  return `${show(value)} MB / ${large}`
}
