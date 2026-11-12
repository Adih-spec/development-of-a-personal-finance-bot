/**
 * controllers/incomeController.js
 */
const { pool }   = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');

// ── List income (with filters) ────────────────────────────────
const getAll = async (req, res) => {
  const userId = req.user.id;
  const { start_date, end_date, category_id, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let where = 'i.user_id = ?';
    const params = [userId];

    if (start_date) { where += ' AND i.transaction_date >= ?'; params.push(start_date); }
    if (end_date)   { where += ' AND i.transaction_date <= ?'; params.push(end_date);   }
    if (category_id){ where += ' AND i.category_id = ?';       params.push(category_id);}

    const [rows] = await pool.query(
      `SELECT i.*, ic.name AS category_name, ic.icon, ic.color
         FROM income i
         JOIN income_categories ic ON ic.id = i.category_id
        WHERE ${where}
        ORDER BY i.transaction_date DESC, i.created_at DESC
        LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM income i WHERE ${where}`, params
    );

    return success(res, {
      income: rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (err) {
    console.error('income getAll:', err);
    return error(res);
  }
};

// ── Single income record ──────────────────────────────────────
const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT i.*, ic.name AS category_name, ic.icon, ic.color
         FROM income i
         JOIN income_categories ic ON ic.id = i.category_id
        WHERE i.id = ? AND i.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return notFound(res, 'Income record not found.');
    return success(res, { income: rows[0] });
  } catch (err) {
    console.error('income getOne:', err);
    return error(res);
  }
};

// ── Create income ─────────────────────────────────────────────
const create = async (req, res) => {
  const { category_id, amount, description, transaction_date, source, is_recurring, local_id } = req.body;
  try {
    // Verify category belongs to user or is global
    const [cat] = await pool.query(
      'SELECT id FROM income_categories WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
      [category_id, req.user.id]
    );
    if (cat.length === 0) return badRequest(res, 'Invalid income category.');

    const [result] = await pool.query(
      `INSERT INTO income (user_id, category_id, amount, description, transaction_date, source, is_recurring, sync_status, local_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
      [req.user.id, category_id, amount, description || null, transaction_date,
       source || null, is_recurring ? 1 : 0, local_id || null]
    );

    return created(res, { id: result.insertId }, 'Income added successfully.');
  } catch (err) {
    console.error('income create:', err);
    return error(res);
  }
};

// ── Update income ─────────────────────────────────────────────
const update = async (req, res) => {
  const { category_id, amount, description, transaction_date, source, is_recurring } = req.body;
  try {
    const [existing] = await pool.query(
      'SELECT id FROM income WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    );
    if (existing.length === 0) return notFound(res, 'Income record not found.');

    await pool.query(
      `UPDATE income SET category_id = ?, amount = ?, description = ?, transaction_date = ?,
              source = ?, is_recurring = ? WHERE id = ? AND user_id = ?`,
      [category_id, amount, description || null, transaction_date,
       source || null, is_recurring ? 1 : 0, req.params.id, req.user.id]
    );

    return success(res, {}, 'Income updated successfully.');
  } catch (err) {
    console.error('income update:', err);
    return error(res);
  }
};

// ── Delete income ─────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM income WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return notFound(res, 'Income record not found.');
    return success(res, {}, 'Income deleted successfully.');
  } catch (err) {
    console.error('income remove:', err);
    return error(res);
  }
};

module.exports = { getAll, getOne, create, update, remove };
