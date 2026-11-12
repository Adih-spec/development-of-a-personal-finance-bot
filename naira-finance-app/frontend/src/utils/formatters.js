/**
 * src/utils/formatters.js
 */

/**
 * Format number as ₦ with commas
 */
export const formatNaira = (amount) => {
  const n = parseFloat(amount) || 0;
  return '₦' + n.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Format a date string or Date object
 */
export const formatDate = (dateStr, style = 'medium') => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

/**
 * Get month name from number
 */
export const monthName = (m) => {
  return new Date(2024, m - 1, 1).toLocaleString('en-NG', { month: 'long' });
};

/**
 * Today as YYYY-MM-DD
 */
export const todayString = () => new Date().toISOString().split('T')[0];

/**
 * Abbreviate large naira values: ₦1.5M, ₦300K
 */
export const abbreviateNaira = (amount) => {
  const n = parseFloat(amount) || 0;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(1)}K`;
  return formatNaira(n);
};
