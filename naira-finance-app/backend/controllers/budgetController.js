/**
 * controllers/budgetController.js
 */
const { pool }   = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');

// ── List budgets for a month/year ──────────────────────────────
const getAll = async (req, res) => {
  const userId = req.user.id;
  const now    = new Date();
  const month  = parseInt(req.query.month || now.getMonth() + 1);
  const year   = parseInt(req.query.year  || now.getFullYear());

  try {
    const [rows] = await pool.query(
      `SELECT b.*, ec.name AS category_name, ec.icon, ec.color,
              COALESCE((
                SELECT SUM(e.amount)
                  FROM expenses e
                 WHERE e.user_id = b.user_id
                   AND e.category_id = b.category_id
                   AND MONTH(e.transaction_date) = b.month
                   AND YEAR(e.transaction_date)  = b.year
              ), 0) AS amount_spent
         FROM budgets b
         JOIN expense_categories ec ON ec.id = b.category_id
        WHERE b.user_id = ? AND b.month = ? AND b.year = ?
        ORDER BY ec.name`,
      [userId, month, year]
    );

    // Compute derived fields
    const enriched = rows.map(r => ({
      ...r,
      amount_spent:     parseFloat(r.amount_spent),
      amount_limit:     parseFloat(r.amount_limit),
      remaining:        parseFloat(r.amount_limit) - parseFloat(r.amount_spent),
      percentage_used:  Math.min(
        100,
        Math.round((parseFloat(r.amount_spent) / parseFloat(r.amount_limit)) * 100)
      ),
    }));

    return success(res, { budgets: enriched, month, year });
  } catch (err) {
    console.error('budget getAll:', err);
    return error(res);
  }
};

// ── Create budget ─────────────────────────────────────────────
const create = async (req, res) => {
  const { category_id, amount_limit, month, year, alert_75, alert_90, alert_100 } = req.body;
  try {
    const [cat] = await pool.query(
      'SELECT id FROM expense_categories WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
      [category_id, req.user.id]
    );
    if (cat.length === 0) return badRequest(res, 'Invalid expense category.');

    const [result] = await pool.query(
      `INSERT INTO budgets (user_id, category_id, amount_limit, month, year, alert_75, alert_90, alert_100)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, category_id, amount_limit,
       month, year,
       alert_75  !== undefined ? alert_75  : 1,
       alert_90  !== undefined ? alert_90  : 1,
       alert_100 !== undefined ? alert_100 : 1]
    );
    return created(res, { id: result.insertId }, 'Budget created successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return badRequest(res, 'A budget for this category and month already exists.');
    }
    console.error('budget create:', err);
    return error(res);
  }
};

// ── Update budget ─────────────────────────────────────────────
const update = async (req, res) => {
  const { amount_limit, alert_75, alert_90, alert_100 } = req.body;
  try {
    const [existing] = await pool.query(
      'SELECT id FROM budgets WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    );
    if (existing.length === 0) return notFound(res, 'Budget not found.');

    await pool.query(
      `UPDATE budgets SET amount_limit = ?,
              alert_75 = ?, alert_90 = ?, alert_100 = ?,
              notified_75 = 0, notified_90 = 0, notified_100 = 0
        WHERE id = ? AND user_id = ?`,
      [amount_limit,
       alert_75  !== undefined ? alert_75  : 1,
       alert_90  !== undefined ? alert_90  : 1,
       alert_100 !== undefined ? alert_100 : 1,
       req.params.id, req.user.id]
    );
    return success(res, {}, 'Budget updated successfully.');
  } catch (err) {
    console.error('budget update:', err);
    return error(res);
  }
};

// ── Delete budget ─────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return notFound(res, 'Budget not found.');
    return success(res, {}, 'Budget deleted successfully.');
  } catch (err) {
    console.error('budget remove:', err);
    return error(res);
  }
};

// ── Get budget alerts for current month ───────────────────────
const getAlerts = async (req, res) => {
  const userId = req.user.id;
  const now    = new Date();
  const month  = now.getMonth() + 1;
  const year   = now.getFullYear();

  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.amount_limit, b.notified_75, b.notified_90, b.notified_100,
              ec.name AS category_name, ec.icon, ec.color,
              COALESCE((
                SELECT SUM(e.amount) FROM expenses e
                 WHERE e.user_id = b.user_id AND e.category_id = b.category_id
                   AND MONTH(e.transaction_date)=? AND YEAR(e.transaction_date)=?
              ), 0) AS amount_spent
         FROM budgets b
         JOIN expense_categories ec ON ec.id = b.category_id
        WHERE b.user_id = ? AND b.month = ? AND b.year = ?`,
      [month, year, userId, month, year]
    );

    const alerts = rows
      .map(r => {
        const pct = Math.round((parseFloat(r.amount_spent) / parseFloat(r.amount_limit)) * 100);
        let level = null;
        if (pct >= 100 && r.notified_100) level = 'exceeded';
        else if (pct >= 90 && r.notified_90)  level = 'warning';
        else if (pct >= 75 && r.notified_75)  level = 'caution';
        return level ? { ...r, percentage_used: pct, alert_level: level } : null;
      })
      .filter(Boolean);

    return success(res, { alerts });
  } catch (err) {
    console.error('budget getAlerts:', err);
    return error(res);
  }
};

module.exports = { getAll, create, update, remove, getAlerts };
