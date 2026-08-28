/**
 * Shared formatting utilities for dates, numbers, currency, and text.
 */

/**
 * Format a date string or Date object to standard short date (e.g., 'Oct 24, 2026').
 */
export function formatDate(date: string | Date | null | undefined, fallback = '-'): string {
  if (!date) return fallback;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : fallback;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string or Date object to compact month/day (e.g., 'Oct 24').
 */
export function formatDateShort(date: string | Date | null | undefined, fallback = '-'): string {
  if (!date) return fallback;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return typeof date === 'string' ? date : fallback;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Replace underscore with space in status strings (e.g. 'IN_PROGRESS' -> 'IN PROGRESS').
 */
export function formatStatus(status: string | null | undefined): string {
  if (!status) return '';
  return status.replace(/_/g, ' ');
}

/**
 * Extract up to 2 uppercase initials from a person's name (e.g. 'Jane Doe' -> 'JD').
 */
export function getInitials(name: string | null | undefined, fallback = 'U'): string {
  if (!name) return fallback;
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Format a numeric percentage with bounds (0–100%).
 */
export function formatPercent(value: number | string | null | undefined, fallback = '0%'): string {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  if (isNaN(num)) return fallback;
  return `${Math.min(100, Math.max(0, Math.round(num)))}%`;
}

/**
 * Format a numeric value to at most N decimal places without trailing zeroes.
 * e.g., 61.01000000000005 -> 61.01, 15.000000000000002 -> 15, 50 -> 50, 50.5 -> 50.5.
 */
export function formatNumber(
  val: number | string | null | undefined,
  fallback = 0,
  maxDecimals = 2,
): number {
  if (val === null || val === undefined || val === '') return fallback;
  const num = Number(val);
  if (isNaN(num)) return fallback;
  const factor = Math.pow(10, maxDecimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Format hours with 'h' suffix, rounding to at most 2 decimal places and stripping trailing zeros.
 * e.g., 61.01000000000005 -> '61.01h', 50 -> '50h', 15.000000000000002 -> '15h', 50.5 -> '50.5h', 0 -> '0h'.
 */
export function formatHours(hours: number | string | null | undefined, fallback = '0h'): string {
  if (hours === null || hours === undefined || hours === '') return fallback;
  const num = Number(hours);
  if (isNaN(num)) return fallback;
  const rounded = formatNumber(num, 0, 2);
  return `${rounded}h`;
}
