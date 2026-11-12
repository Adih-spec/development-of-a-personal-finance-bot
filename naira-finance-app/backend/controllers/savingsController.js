/**
 * controllers/savingsController.js
 */
const { pool } = require('../config/database');
const { success, created, error, notFound, badRequest } = require('../utils/response');

// ── List savings goals ────────────────────────────────────────
const getGoals = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    const enriched = rows.map(r => ({
      ...r,
      target_amount:   parseFloat(r.target_amount),
      current_amount:  parseFloat(r.current_amount),
      percentage:      Math.min(100, Math.round((parseFloat(r.current_amount) / parseFloat(r.target_amount)) * 100)),
      remaining:       Math.max(0, parseFloat(r.target_amount) - parseFloat(r.current_amount)),
    }));
    return success(res, { goals: enriched });
  } catch (err) {
    console.error('getGoals:', err);
    return error(res);
  }
};

// ── Single goal ───────────────────────────────────────────────
const getGoal = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM savings_goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return notFound(res, 'Savings goal not found.');
    const r = rows[0];
    return success(res, {
      goal: {
        ...r,
        target_amount:  parseFloat(r.target_amount),
        current_amount: parseFloat(r.current_amount),
        percentage:     Math.min(100, Math.round((parseFloat(r.current_amount) / parseFloat(r.target_amount)) * 100)),
        remaining:      Math.max(0, parseFloat(r.target_amount) - parseFloat(r.current_amount)),
      },
    });
  } catch (err) {
    console.error('getGoal:', err);
    return error(res);
  }
};

// ── Create goal ───────────────────────────────────────────────
const createGoal = async (req, res) => {
  const { title, target_amount, target_date, description, icon, color } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO savings_goals (user_id, title, target_amount, target_date, description, icon, color)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title.trim(), target_amount, target_date || null,
       description || null, icon || 'piggy-bank', color || '#9C27B0']
    );
    return created(res, { id: result.insertId }, 'Savings goal created successfully.');
  } catch (err) {
    console.error('createGoal:', err);
    return error(res);
  }
};

// ── Update goal ───────────────────────────────────────────────
const updateGoal = async (req, res) => {
  const { title, target_amount, target_date, description, status } = req.body;
  try {
    const [existing] = await pool.query(
      'SELECT id FROM savings_goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return notFound(res, 'Savings goal not found.');

    await pool.query(
      `UPDATE savings_goals SET title = ?, target_amount = ?, target_date = ?,
              description = ?, status = ? WHERE id = ? AND user_id = ?`,
      [title.trim(), target_amount, target_date || null,
       description || null, status || 'active', req.params.id, req.user.id]
    );
    return success(res, {}, 'Savings goal updated.');
  } catch (err) {
    console.error('updateGoal:', err);
    return error(res);
  }
};

// ── Delete goal ───────────────────────────────────────────────
const deleteGoal = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM savings_goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return notFound(res, 'Savings goal not found.');
    return success(res, {}, 'Savings goal deleted.');
  } catch (err) {
    console.error('deleteGoal:', err);
    return error(res);
  }
};

// ── Add contribution ──────────────────────────────────────────
const addContribution = async (req, res) => {
  const { amount, type, note, contribution_date, local_id } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Verify goal ownership
    const [goals] = await conn.query(
      'SELECT id, current_amount, target_amount, status FROM savings_goals WHERE id = ? AND user_id = ? FOR UPDATE',
      [req.params.id, req.user.id]
    );
    if (goals.length === 0) {
      await conn.rollback();
      return notFound(res, 'Savings goal not found.');
    }

    const goal = goals[0];
    if (goal.status === 'completed' || goal.status === 'cancelled') {
      await conn.rollback();
      return badRequest(res, `Cannot add contribution to a ${goal.status} goal.`);
    }

    const parsedAmount = parseFloat(amount);
    let newAmount = parseFloat(goal.current_amount);

    if (type === 'deposit') {
      newAmount += parsedAmount;
    } else if (type === 'withdrawal') {
      if (parsedAmount > newAmount) {
        await conn.rollback();
        return badRequest(res, 'Withdrawal amount exceeds current savings.');
      }
      newAmount -= parsedAmount;
    }

    const newStatus = newAmount >= parseFloat(goal.target_amount) ? 'completed' : goal.status;

    // Insert contribution
    const [result] = await conn.query(
      `INSERT INTO savings_contributions (goal_id, user_id, amount, type, note, contribution_date, sync_status, local_id)
       VALUES (?, ?, ?, ?, ?, ?, 'synced', ?)`,
      [req.params.id, req.user.id, parsedAmount, type, note || null, contribution_date, local_id || null]
    );

    // Update goal balance
    await conn.query(
      'UPDATE savings_goals SET current_amount = ?, status = ? WHERE id = ?',
      [newAmount, newStatus, req.params.id]
    );

    await conn.commit();
    return created(res, { id: result.insertId, new_balance: newAmount, status: newStatus },
      'Contribution recorded successfully.');
  } catch (err) {
    await conn.rollback();
    console.error('addContribution:', err);
    return error(res);
  } finally {
    conn.release();
  }
};

// ── Get contribution history ──────────────────────────────────
const getContributions = async (req, res) => {
  try {
    const [goal] = await pool.query(
      'SELECT id FROM savings_goals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (goal.length === 0) return notFound(res, 'Savings goal not found.');

    const [rows] = await pool.query(
      `SELECT * FROM savings_contributions WHERE goal_id = ? ORDER BY contribution_date DESC`,
      [req.params.id]
    );
    return success(res, { contributions: rows });
  } catch (err) {
    console.error('getContributions:', err);
    return error(res);
  }
};

module.exports = { getGoals, getGoal, createGoal, updateGoal, deleteGoal, addContribution, getContributions };
