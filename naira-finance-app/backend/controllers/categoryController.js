/**
 * controllers/categoryController.js
 * Handles both income and expense categories
 */
const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');

// ── Income Categories ─────────────────────────────────────────
const getIncomeCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM income_categories
        WHERE user_id IS NULL OR user_id = ?
        ORDER BY is_default DESC, name ASC`,
      [req.user.id]
    );
    return success(res, { categories: rows });
  } catch (err) {
    console.error('getIncomeCategories:', err);
    return error(res);
  }
};

const createIncomeCategory = async (req, res) => {
  const { name, icon, color } = req.body;
  try {
    const [dup] = await pool.query(
      'SELECT id FROM income_categories WHERE LOWER(name)=LOWER(?) AND (user_id=? OR user_id IS NULL)',
      [name, req.user.id]
    );
    if (dup.length > 0) return badRequest(res, 'Category with this name already exists.');

    const [result] = await pool.query(
      'INSERT INTO income_categories (user_id, name, icon, color) VALUES (?, ?, ?, ?)',
      [req.user.id, name.trim(), icon || 'tag', color || '#4CAF50']
    );
    return created(res, { id: result.insertId }, 'Income category created.');
  } catch (err) {
    console.error('createIncomeCategory:', err);
    return error(res);
  }
};

const deleteIncomeCategory = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, is_default FROM income_categories WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return notFound(res, 'Category not found or cannot be deleted.');
    if (rows[0].is_default) return badRequest(res, 'Default categories cannot be deleted.');

    await pool.query('DELETE FROM income_categories WHERE id = ?', [req.params.id]);
    return success(res, {}, 'Income category deleted.');
  } catch (err) {
    console.error('deleteIncomeCategory:', err);
    return error(res);
  }
};

// ── Expense Categories ────────────────────────────────────────
const getExpenseCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM expense_categories
        WHERE user_id IS NULL OR user_id = ?
        ORDER BY is_default DESC, name ASC`,
      [req.user.id]
    );
    return success(res, { categories: rows });
  } catch (err) {
    console.error('getExpenseCategories:', err);
    return error(res);
  }
};

const createExpenseCategory = async (req, res) => {
  const { name, icon, color } = req.body;
  try {
    const [dup] = await pool.query(
      'SELECT id FROM expense_categories WHERE LOWER(name)=LOWER(?) AND (user_id=? OR user_id IS NULL)',
      [name, req.user.id]
    );
    if (dup.length > 0) return badRequest(res, 'Category with this name already exists.');

    const [result] = await pool.query(
      'INSERT INTO expense_categories (user_id, name, icon, color) VALUES (?, ?, ?, ?)',
      [req.user.id, name.trim(), icon || 'tag', color || '#F44336']
    );
    return created(res, { id: result.insertId }, 'Expense category created.');
  } catch (err) {
    console.error('createExpenseCategory:', err);
    return error(res);
  }
};

const deleteExpenseCategory = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, is_default FROM expense_categories WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return notFound(res, 'Category not found or cannot be deleted.');
    if (rows[0].is_default) return badRequest(res, 'Default categories cannot be deleted.');

    await pool.query('DELETE FROM expense_categories WHERE id = ?', [req.params.id]);
    return success(res, {}, 'Expense category deleted.');
  } catch (err) {
    console.error('deleteExpenseCategory:', err);
    return error(res);
  }
};

module.exports = {
  getIncomeCategories, createIncomeCategory, deleteIncomeCategory,
  getExpenseCategories, createExpenseCategory, deleteExpenseCategory,
};
