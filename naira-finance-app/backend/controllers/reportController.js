/**
 * controllers/reportController.js
 */
const { pool } = require('../config/database');
const { success, error } = require('../utils/response');

// ── Monthly income vs expense summary ────────────────────────
const monthlySummary = async (req, res) => {
  const userId = req.user.id;
  const months = parseInt(req.query.months || 6);   // last N months

  try {
    const [incomeRows] = await pool.query(
      `SELECT YEAR(transaction_date) AS yr, MONTH(transaction_date) AS mo,
              SUM(amount) AS total
         FROM income WHERE user_id = ?
         GROUP BY yr, mo ORDER BY yr DESC, mo DESC LIMIT ?`,
      [userId, months]
    );

    const [expenseRows] = await pool.query(
      `SELECT YEAR(transaction_date) AS yr, MONTH(transaction_date) AS mo,
              SUM(amount) AS total
         FROM expenses WHERE user_id = ?
         GROUP BY yr, mo ORDER BY yr DESC, mo DESC LIMIT ?`,
      [userId, months]
    );

    return success(res, { income_by_month: incomeRows, expense_by_month: expenseRows });
  } catch (err) {
    console.error('monthlySummary:', err);
    return error(res);
  }
};

// ── Category spending report ──────────────────────────────────
const categoryReport = async (req, res) => {
  const userId = req.user.id;
  const { start_date, end_date } = req.query;

  try {
    let where = 'e.user_id = ?';
    const params = [userId];
    if (start_date) { where += ' AND e.transaction_date >= ?'; params.push(start_date); }
    if (end_date)   { where += ' AND e.transaction_date <= ?'; params.push(end_date); }

    const [rows] = await pool.query(
      `SELECT ec.id, ec.name, ec.icon, ec.color,
              SUM(e.amount) AS total,
              COUNT(e.id)   AS transaction_count
         FROM expenses e
         JOIN expense_categories ec ON ec.id = e.category_id
        WHERE ${where}
        GROUP BY ec.id, ec.name, ec.icon, ec.color
        ORDER BY total DESC`,
      params
    );

    const [[{ grand_total }]] = await pool.query(
      `SELECT COALESCE(SUM(e.amount), 0) AS grand_total
         FROM expenses e WHERE ${where}`, params
    );

    const result = rows.map(r => ({
      ...r,
      total:      parseFloat(r.total),
      percentage: grand_total > 0
        ? Math.round((parseFloat(r.total) / parseFloat(grand_total)) * 100)
        : 0,
    }));

    return success(res, { categories: result, grand_total: parseFloat(grand_total) });
  } catch (err) {
    console.error('categoryReport:', err);
    return error(res);
  }
};

// ── Income category report ────────────────────────────────────
const incomeCategoryReport = async (req, res) => {
  const userId = req.user.id;
  const { start_date, end_date } = req.query;

  try {
    let where = 'i.user_id = ?';
    const params = [userId];
    if (start_date) { where += ' AND i.transaction_date >= ?'; params.push(start_date); }
    if (end_date)   { where += ' AND i.transaction_date <= ?'; params.push(end_date); }

    const [rows] = await pool.query(
      `SELECT ic.id, ic.name, ic.icon, ic.color,
              SUM(i.amount) AS total, COUNT(i.id) AS count
         FROM income i
         JOIN income_categories ic ON ic.id = i.category_id
        WHERE ${where}
        GROUP BY ic.id, ic.name, ic.icon, ic.color
        ORDER BY total DESC`,
      params
    );

    return success(res, { categories: rows.map(r => ({ ...r, total: parseFloat(r.total) })) });
  } catch (err) {
    console.error('incomeCategoryReport:', err);
    return error(res);
  }
};

// ── Daily summary for a date range ───────────────────────────
const dailySummary = async (req, res) => {
  const userId = req.user.id;
  const { start_date, end_date } = req.query;

  try {
    const incWhere  = start_date && end_date
      ? 'AND transaction_date BETWEEN ? AND ?' : '';
    const expWhere  = incWhere;
    const p         = start_date && end_date ? [userId, start_date, end_date] : [userId];

    const [incRows] = await pool.query(
      `SELECT transaction_date AS date, SUM(amount) AS income
         FROM income WHERE user_id = ? ${incWhere}
         GROUP BY transaction_date ORDER BY transaction_date`, p
    );

    const [expRows] = await pool.query(
      `SELECT transaction_date AS date, SUM(amount) AS expenses
         FROM expenses WHERE user_id = ? ${expWhere}
         GROUP BY transaction_date ORDER BY transaction_date`, p
    );

    // Merge by date
    const map = {};
    incRows.forEach(r => { map[r.date] = { date: r.date, income: parseFloat(r.income), expenses: 0 }; });
    expRows.forEach(r => {
      if (!map[r.date]) map[r.date] = { date: r.date, income: 0, expenses: 0 };
      map[r.date].expenses = parseFloat(r.expenses);
    });

    const daily = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    return success(res, { daily });
  } catch (err) {
    console.error('dailySummary:', err);
    return error(res);
  }
};

// ── Savings report ────────────────────────────────────────────
const savingsReport = async (req, res) => {
  const userId = req.user.id;
  try {
    const [goals] = await pool.query(
      `SELECT g.id, g.title, g.target_amount, g.current_amount, g.status, g.target_date,
              COUNT(sc.id) AS contribution_count,
              COALESCE(SUM(CASE WHEN sc.type='deposit' THEN sc.amount ELSE 0 END), 0) AS total_deposited,
              COALESCE(SUM(CASE WHEN sc.type='withdrawal' THEN sc.amount ELSE 0 END), 0) AS total_withdrawn
         FROM savings_goals g
         LEFT JOIN savings_contributions sc ON sc.goal_id = g.id
        WHERE g.user_id = ?
        GROUP BY g.id
        ORDER BY g.created_at DESC`,
      [userId]
    );

    return success(res, {
      goals: goals.map(g => ({
        ...g,
        target_amount:    parseFloat(g.target_amount),
        current_amount:   parseFloat(g.current_amount),
        total_deposited:  parseFloat(g.total_deposited),
        total_withdrawn:  parseFloat(g.total_withdrawn),
        percentage:       Math.min(100, Math.round(
          (parseFloat(g.current_amount) / parseFloat(g.target_amount)) * 100
        )),
      })),
    });
  } catch (err) {
    console.error('savingsReport:', err);
    return error(res);
  }
};

// ── Weekly summary ────────────────────────────────────────────
const weeklySummary = async (req, res) => {
  const userId = req.user.id;
  const weeks  = parseInt(req.query.weeks || 8);

  try {
    const [incRows] = await pool.query(
      `SELECT YEARWEEK(transaction_date, 1) AS week_key,
              MIN(transaction_date) AS week_start,
              SUM(amount) AS income
         FROM income WHERE user_id = ?
         GROUP BY week_key ORDER BY week_key DESC LIMIT ?`,
      [userId, weeks]
    );

    const [expRows] = await pool.query(
      `SELECT YEARWEEK(transaction_date, 1) AS week_key,
              MIN(transaction_date) AS week_start,
              SUM(amount) AS expenses
         FROM expenses WHERE user_id = ?
         GROUP BY week_key ORDER BY week_key DESC LIMIT ?`,
      [userId, weeks]
    );

    return success(res, {
      income_by_week:  incRows.map(r => ({ ...r, income:   parseFloat(r.income) })),
      expense_by_week: expRows.map(r => ({ ...r, expenses: parseFloat(r.expenses) })),
    });
  } catch (err) {
    console.error('weeklySummary:', err);
    return error(res);
  }
};

module.exports = { monthlySummary, categoryReport, incomeCategoryReport, dailySummary, savingsReport, weeklySummary };
