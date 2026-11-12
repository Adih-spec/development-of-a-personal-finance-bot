/**
 * controllers/dashboardController.js
 */
const { pool } = require('../config/database');
const { success, error } = require('../utils/response');

const getSummary = async (req, res) => {
  const userId = req.user.id;
  const now    = new Date();
  const month  = now.getMonth() + 1;
  const year   = now.getFullYear();

  // First day of current month
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  // Last day
  const monthEnd   = new Date(year, month, 0).toISOString().split('T')[0];

  try {
    // --- Overall totals ---
    const [[incomeTotals]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_income FROM income WHERE user_id = ?`,
      [userId]
    );
    const [[expenseTotals]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses WHERE user_id = ?`,
      [userId]
    );

    // --- Monthly totals ---
    const [[monthlyIncome]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS monthly_income FROM income
        WHERE user_id = ? AND transaction_date BETWEEN ? AND ?`,
      [userId, monthStart, monthEnd]
    );
    const [[monthlyExpense]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS monthly_expenses FROM expenses
        WHERE user_id = ? AND transaction_date BETWEEN ? AND ?`,
      [userId, monthStart, monthEnd]
    );

    // --- Savings total ---
    const [[savingsTotals]] = await pool.query(
      `SELECT COALESCE(SUM(current_amount), 0) AS total_savings FROM savings_goals WHERE user_id = ?`,
      [userId]
    );

    // --- Budget utilisation this month ---
    const [[budgetStats]] = await pool.query(
      `SELECT
         COALESCE(SUM(b.amount_limit), 0) AS total_budget_limit,
         COALESCE(SUM(
           (SELECT COALESCE(SUM(e.amount),0) FROM expenses e
            WHERE e.user_id = b.user_id AND e.category_id = b.category_id
              AND MONTH(e.transaction_date)=b.month AND YEAR(e.transaction_date)=b.year)
         ), 0) AS total_budget_spent
       FROM budgets b WHERE b.user_id = ? AND b.month = ? AND b.year = ?`,
      [userId, month, year]
    );

    // --- Recent 5 transactions (income + expense combined) ---
    const [recentTransactions] = await pool.query(
      `(SELECT 'income' AS tx_type, i.id, i.amount, i.transaction_date, i.description,
               ic.name AS category_name, ic.icon, ic.color
          FROM income i JOIN income_categories ic ON ic.id = i.category_id
         WHERE i.user_id = ?
         ORDER BY i.transaction_date DESC, i.created_at DESC LIMIT 5)
        UNION ALL
        (SELECT 'expense' AS tx_type, e.id, e.amount, e.transaction_date, e.description,
                ec.name AS category_name, ec.icon, ec.color
           FROM expenses e JOIN expense_categories ec ON ec.id = e.category_id
          WHERE e.user_id = ?
          ORDER BY e.transaction_date DESC, e.created_at DESC LIMIT 5)
        ORDER BY transaction_date DESC, id DESC LIMIT 5`,
      [userId, userId]
    );

    // --- Savings goals progress ---
    const [savingsGoals] = await pool.query(
      `SELECT id, title, target_amount, current_amount, target_date, status, color, icon
         FROM savings_goals WHERE user_id = ? AND status = 'active'
         ORDER BY created_at DESC LIMIT 3`,
      [userId]
    );

    // --- Expense by category (current month) ---
    const [expenseByCategory] = await pool.query(
      `SELECT ec.name, ec.color, ec.icon, SUM(e.amount) AS total
         FROM expenses e
         JOIN expense_categories ec ON ec.id = e.category_id
        WHERE e.user_id = ? AND e.transaction_date BETWEEN ? AND ?
        GROUP BY ec.id, ec.name, ec.color, ec.icon
        ORDER BY total DESC LIMIT 6`,
      [userId, monthStart, monthEnd]
    );

    const totalIncome   = parseFloat(incomeTotals.total_income);
    const totalExpenses = parseFloat(expenseTotals.total_expenses);
    const balance       = totalIncome - totalExpenses;

    return success(res, {
      overview: {
        total_income:    totalIncome,
        total_expenses:  totalExpenses,
        balance,
        total_savings:   parseFloat(savingsTotals.total_savings),
      },
      monthly: {
        income:   parseFloat(monthlyIncome.monthly_income),
        expenses: parseFloat(monthlyExpense.monthly_expenses),
        net:      parseFloat(monthlyIncome.monthly_income) - parseFloat(monthlyExpense.monthly_expenses),
      },
      budget: {
        total_limit:   parseFloat(budgetStats.total_budget_limit),
        total_spent:   parseFloat(budgetStats.total_budget_spent),
        percentage_used: budgetStats.total_budget_limit > 0
          ? Math.round((parseFloat(budgetStats.total_budget_spent) / parseFloat(budgetStats.total_budget_limit)) * 100)
          : 0,
      },
      recent_transactions: recentTransactions,
      savings_goals:        savingsGoals.map(g => ({
        ...g,
        target_amount:  parseFloat(g.target_amount),
        current_amount: parseFloat(g.current_amount),
        percentage:     Math.min(100, Math.round((parseFloat(g.current_amount) / parseFloat(g.target_amount)) * 100)),
      })),
      expense_by_category: expenseByCategory.map(c => ({
        ...c, total: parseFloat(c.total),
      })),
    });
  } catch (err) {
    console.error('dashboard getSummary:', err);
    return error(res);
  }
};

module.exports = { getSummary };
