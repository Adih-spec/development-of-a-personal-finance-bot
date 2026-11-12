/**
 * utils/helpers.js
 * General utility functions
 */

/**
 * Format a number as Nigerian Naira string
 * @param {number} amount
 * @returns {string}  e.g. "₦1,500.00"
 */
const formatNaira = (amount) => {
  return `₦${parseFloat(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Return the first and last date of a given month/year
 */
const getMonthRange = (year, month) => {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end   = new Date(year, month, 0).toISOString().split('T')[0];
  return { start, end };
};

/**
 * Safely parse a decimal value
 */
const parseDecimal = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
};

/**
 * Current year and month as numbers
 */
const currentPeriod = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

module.exports = { formatNaira, getMonthRange, parseDecimal, currentPeriod };
