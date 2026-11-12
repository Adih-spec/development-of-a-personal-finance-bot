/**
 * controllers/expenseController.js
 */
const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');

// ── List expenses ─────────────────────────────────────────────
const getAll = async (req, res) => {
  const userId = req.user.id;
  const { start_date, end_date, category_id, search, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let where = 'e.user_id = ?';
    const params = [userId];

    if (start_date)  { where += ' AND e.transaction_date >= ?'; params.push(start_date); }
    if (end_date)    { where += ' AND e.transaction_date <= ?'; params.push(end_date);   }
    if (category_id) { where += ' AND e.category_id = ?';       params.push(category_id);}
    if (search)      { where += ' AND e.description LIKE ?';    params.push(`%${search}%`);}

    const [rows] = await pool.query(
      `SELECT e.*, ec.name AS category_name, ec.icon, ec.color
         FROM expenses e
         JOIN expense_categories ec ON ec.id = e.category_id
        WHERE ${where}
        ORDER BY e.transaction_date DESC, e.created_at DESC
        LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM expenses e WHERE ${where}`, params
    );

    return success(res, {
      expenses: rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (err) {
    console.error('expense getAll:', err);
    return error(res);
  }
};

// ── Single expense ────────────────────────────────────────────
const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, ec.name AS category_name, ec.icon, ec.color
         FROM expenses e
         JOIN expense_categories ec ON ec.id = e.category_id
        WHERE e.id = ? AND e.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return notFound(res, 'Expense record not found.');
    return success(res, { expense: rows[0] });
  } catch (err) {
    console.error('expense getOne:', err);
    return error(res);
  }
};

// ── Create expense ────────────────────────────────────────────
const create = async (req, res) => {
  const { category_id, amount, description, transaction_date, payment_method, is_recurring, local_id } = req.body;
  try {
    const [cat] = await pool.query(
      'SELECT id FROM expense_categories WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
      [category_id, req.user.id]
    );
    if (cat.length === 0) return badRequest(res, 'Invalid expense category.');

    const [result] = await pool.query(
      `INSERT INTO expenses
         (user_id, category_id, amount, description, transaction_date, payment_method, is_recurring, sync_status, local_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
      [req.user.id, category_id, amount, description || null, transaction_date,
       payment_method || 'cash', is_recurring ? 1 : 0, local_id || null]
    );

    // Check budget alerts after expense creation
    await checkBudgetAlerts(req.user.id, category_id, transaction_date);

    return created(res, { id: result.insertId }, 'Expense added successfully.');
  } catch (err) {
    console.error('expense create:', err);
    return error(res);
  }
};

// ── Update expense ────────────────────────────────────────────
const update = async (req, res) => {
  const { category_id, amount, description, transaction_date, payment_method, is_recurring } = req.body;
  try {
    const [existing] = await pool.query(
      'SELECT id FROM expenses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    );
    if (existing.length === 0) return notFound(res, 'Expense record not found.');

    await pool.query(
      `UPDATE expenses SET category_id = ?, amount = ?, description = ?, transaction_date = ?,
              payment_method = ?, is_recurring = ? WHERE id = ? AND user_id = ?`,
      [category_id, amount, description || null, transaction_date,
       payment_method || 'cash', is_recurring ? 1 : 0, req.params.id, req.user.id]
    );

    return success(res, {}, 'Expense updated successfully.');
  } catch (err) {
    console.error('expense update:', err);
    return error(res);
  }
};

// ── Delete expense ────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return notFound(res, 'Expense record not found.');
    return success(res, {}, 'Expense deleted successfully.');
  } catch (err) {
    console.error('expense remove:', err);
    return error(res);
  }
};

// ── Internal: evaluate budget alerts after a new expense ──────
const checkBudgetAlerts = async (userId, categoryId, transactionDate) => {
  try {
    const d     = new Date(transactionDate);
    const month = d.getMonth() + 1;
    const year  = d.getFullYear();

    const [budgets] = await pool.query(
      `SELECT id, amount_limit, notified_75, notified_90, notified_100
         FROM budgets
        WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?`,
      [userId, categoryId, month, year]
    );
    if (budgets.length === 0) return;

    const budget = budgets[0];
    const [[{ spent }]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS spent
         FROM expenses
        WHERE user_id = ? AND category_id = ?
          AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
      [userId, categoryId, month, year]
    );

    const pct = (parseFloat(spent) / parseFloat(budget.amount_limit)) * 100;

    let notify75  = budget.notified_75;
    let notify90  = budget.notified_90;
    let notify100 = budget.notified_100;

    if (pct >= 100 && !budget.notified_100) { notify100 = 1; }
    else if (pct >= 90  && !budget.notified_90)  { notify90  = 1; }
    else if (pct >= 75  && !budget.notified_75)  { notify75  = 1; }

    await pool.query(
      'UPDATE budgets SET notified_75 = ?, notified_90 = ?, notified_100 = ? WHERE id = ?',
      [notify75, notify90, notify100, budget.id]
    );
  } catch (e) {
    console.error('checkBudgetAlerts error:', e);
  }
};

module.exports = { getAll, getOne, create, update, remove };
