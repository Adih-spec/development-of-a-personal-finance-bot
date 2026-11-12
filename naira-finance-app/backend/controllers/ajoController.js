/**
 * controllers/ajoController.js
 * Ajo and Esusu contribution tracking
 */
const { pool } = require('../config/database');
const { success, created, error, notFound } = require('../utils/response');

// ── List all Ajo/Esusu contributions ─────────────────────────
const getAll = async (req, res) => {
  const userId = req.user.id;
  const { type, start_date, end_date, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let where = 'user_id = ?';
    const params = [userId];

    if (type)       { where += ' AND type = ?';                params.push(type); }
    if (start_date) { where += ' AND contribution_date >= ?';  params.push(start_date); }
    if (end_date)   { where += ' AND contribution_date <= ?';  params.push(end_date); }

    const [rows] = await pool.query(
      `SELECT * FROM ajo_esusu_contributions WHERE ${where}
        ORDER BY contribution_date DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM ajo_esusu_contributions WHERE ${where}`, params
    );

    // Summary totals
    const [[summary]] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type='ajo'   THEN amount ELSE 0 END), 0) AS total_ajo,
         COALESCE(SUM(CASE WHEN type='esusu' THEN amount ELSE 0 END), 0) AS total_esusu,
         COALESCE(SUM(amount), 0) AS total
       FROM ajo_esusu_contributions WHERE user_id = ?`,
      [userId]
    );

    return success(res, {
      contributions: rows,
      summary,
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    });
  } catch (err) {
    console.error('ajo getAll:', err);
    return error(res);
  }
};

// ── Single record ─────────────────────────────────────────────
const getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ajo_esusu_contributions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return notFound(res, 'Record not found.');
    return success(res, { contribution: rows[0] });
  } catch (err) {
    console.error('ajo getOne:', err);
    return error(res);
  }
};

// ── Create ────────────────────────────────────────────────────
const create = async (req, res) => {
  const { type, group_name, amount, contribution_date, description, cycle, status, local_id } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO ajo_esusu_contributions
         (user_id, type, group_name, amount, contribution_date, description, cycle, status, sync_status, local_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
      [req.user.id, type, group_name || null, amount, contribution_date,
       description || null, cycle || 'monthly', status || 'paid', local_id || null]
    );
    return created(res, { id: result.insertId }, `${type === 'ajo' ? 'Ajo' : 'Esusu'} contribution recorded.`);
  } catch (err) {
    console.error('ajo create:', err);
    return error(res);
  }
};

// ── Update ────────────────────────────────────────────────────
const update = async (req, res) => {
  const { group_name, amount, contribution_date, description, cycle, status } = req.body;
  try {
    const [existing] = await pool.query(
      'SELECT id FROM ajo_esusu_contributions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return notFound(res, 'Record not found.');

    await pool.query(
      `UPDATE ajo_esusu_contributions
          SET group_name = ?, amount = ?, contribution_date = ?,
              description = ?, cycle = ?, status = ?
        WHERE id = ? AND user_id = ?`,
      [group_name || null, amount, contribution_date, description || null,
       cycle || 'monthly', status || 'paid', req.params.id, req.user.id]
    );
    return success(res, {}, 'Record updated successfully.');
  } catch (err) {
    console.error('ajo update:', err);
    return error(res);
  }
};

// ── Delete ────────────────────────────────────────────────────
const remove = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM ajo_esusu_contributions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return notFound(res, 'Record not found.');
    return success(res, {}, 'Record deleted.');
  } catch (err) {
    console.error('ajo remove:', err);
    return error(res);
  }
};

module.exports = { getAll, getOne, create, update, remove };
