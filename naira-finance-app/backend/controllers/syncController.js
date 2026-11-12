/**
 * controllers/syncController.js
 * Handles offline-to-cloud synchronisation
 */
const { pool } = require('../config/database');
const { success, error } = require('../utils/response');

/**
 * POST /api/sync
 * Body: { transactions: [ { local_id, entity_type, data } ] }
 *
 * entity_type: 'income' | 'expense' | 'savings_contribution' | 'ajo_esusu'
 */
const syncData = async (req, res) => {
  const userId       = req.user.id;
  const { transactions } = req.body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return success(res, { synced: [], failed: [] }, 'Nothing to sync.');
  }

  const synced  = [];
  const failed  = [];

  for (const tx of transactions) {
    const { local_id, entity_type, data } = tx;

    // --- Duplicate check ---
    const [existing] = await pool.query(
      'SELECT server_id FROM sync_records WHERE user_id = ? AND local_id = ? AND entity_type = ?',
      [userId, local_id, entity_type]
    );
    if (existing.length > 0 && existing[0].server_id) {
      synced.push({ local_id, server_id: existing[0].server_id, status: 'already_synced' });
      continue;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      let serverId = null;

      if (entity_type === 'income') {
        const [r] = await conn.query(
          `INSERT INTO income
             (user_id, category_id, amount, description, transaction_date, source, is_recurring, sync_status, local_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
          [userId, data.category_id, data.amount, data.description || null,
           data.transaction_date, data.source || null, data.is_recurring ? 1 : 0, local_id]
        );
        serverId = r.insertId;

      } else if (entity_type === 'expense') {
        const [r] = await conn.query(
          `INSERT INTO expenses
             (user_id, category_id, amount, description, transaction_date, payment_method, is_recurring, sync_status, local_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
          [userId, data.category_id, data.amount, data.description || null,
           data.transaction_date, data.payment_method || 'cash', data.is_recurring ? 1 : 0, local_id]
        );
        serverId = r.insertId;

      } else if (entity_type === 'savings_contribution') {
        const [r] = await conn.query(
          `INSERT INTO savings_contributions
             (goal_id, user_id, amount, type, note, contribution_date, sync_status, local_id)
           VALUES (?, ?, ?, ?, ?, ?, 'synced', ?)`,
          [data.goal_id, userId, data.amount, data.type, data.note || null,
           data.contribution_date, local_id]
        );
        serverId = r.insertId;

        // Update goal balance
        const sign = data.type === 'deposit' ? '+' : '-';
        await conn.query(
          `UPDATE savings_goals SET current_amount = current_amount ${sign} ? WHERE id = ? AND user_id = ?`,
          [data.amount, data.goal_id, userId]
        );

      } else if (entity_type === 'ajo_esusu') {
        const [r] = await conn.query(
          `INSERT INTO ajo_esusu_contributions
             (user_id, type, group_name, amount, contribution_date, description, cycle, status, sync_status, local_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
          [userId, data.type, data.group_name || null, data.amount,
           data.contribution_date, data.description || null,
           data.cycle || 'monthly', data.status || 'paid', local_id]
        );
        serverId = r.insertId;
      }

      // Record sync success
      await conn.query(
        `INSERT INTO sync_records (user_id, local_id, entity_type, server_id, status)
         VALUES (?, ?, ?, ?, 'synced')
         ON DUPLICATE KEY UPDATE server_id = ?, status = 'synced', retry_count = retry_count + 1`,
        [userId, local_id, entity_type, serverId, serverId]
      );

      await conn.commit();
      synced.push({ local_id, server_id: serverId, status: 'synced' });

    } catch (syncErr) {
      await conn.rollback();
      console.error(`Sync failed for local_id=${local_id}:`, syncErr.message);

      // Record failure
      await pool.query(
        `INSERT INTO sync_records (user_id, local_id, entity_type, status, error_message)
         VALUES (?, ?, ?, 'failed', ?)
         ON DUPLICATE KEY UPDATE status = 'failed', error_message = ?, retry_count = retry_count + 1`,
        [userId, local_id, entity_type, syncErr.message, syncErr.message]
      );

      failed.push({ local_id, status: 'failed', error: syncErr.message });
    } finally {
      conn.release();
    }
  }

  return success(res, { synced, failed },
    `Sync complete. ${synced.length} succeeded, ${failed.length} failed.`);
};

/**
 * GET /api/sync/status
 * Returns list of locally-known sync records for this user
 */
const getSyncStatus = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT local_id, entity_type, server_id, status, retry_count, synced_at
         FROM sync_records WHERE user_id = ? ORDER BY synced_at DESC LIMIT 100`,
      [req.user.id]
    );
    return success(res, { records: rows });
  } catch (err) {
    console.error('getSyncStatus:', err);
    return error(res);
  }
};

module.exports = { syncData, getSyncStatus };
