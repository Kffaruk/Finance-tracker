const { query } = require('../config/db');

// GET /api/budgets?month=&year=
exports.getBudgets = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const result = await query(
      `SELECT b.*, c.name AS category_name, c.name_bn AS category_name_bn, c.icon, c.color,
              COALESCE(
                (SELECT SUM(amount) FROM transactions
                 WHERE user_id=$1 AND category_id=b.category_id AND type='expense'
                 AND EXTRACT(MONTH FROM date)=$2 AND EXTRACT(YEAR FROM date)=$3), 0
              ) AS spent
       FROM budgets b JOIN categories c ON b.category_id=c.id
       WHERE b.user_id=$1 AND b.month=$2 AND b.year=$3
       ORDER BY c.name`,
      [req.user.id, month, year]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'বাজেট লোড করতে সমস্যা হয়েছে।' });
  }
};

// POST /api/budgets
exports.createBudget = async (req, res) => {
  try {
    const { category_id, amount, month, year, alert_threshold } = req.body;
    const result = await query(
      `INSERT INTO budgets (user_id, category_id, amount, month, year, alert_threshold)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (user_id, category_id, month, year)
       DO UPDATE SET amount=EXCLUDED.amount, alert_threshold=EXCLUDED.alert_threshold, alert_sent=FALSE
       RETURNING *`,
      [req.user.id, category_id, parseFloat(amount), month, year, alert_threshold || 80]
    );
    res.status(201).json({ success: true, message: 'বাজেট সেট হয়েছে।', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'বাজেট সেট করতে সমস্যা হয়েছে।' });
  }
};

// PUT /api/budgets/:id
exports.updateBudget = async (req, res) => {
  try {
    const { amount, alert_threshold } = req.body;
    const result = await query(
      `UPDATE budgets SET amount=COALESCE($1,amount), alert_threshold=COALESCE($2,alert_threshold), alert_sent=FALSE
       WHERE id=$3 AND user_id=$4 RETURNING *`,
      [amount ? parseFloat(amount) : null, alert_threshold, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'বাজেট পাওয়া যায়নি।' });
    res.json({ success: true, message: 'বাজেট আপডেট হয়েছে।', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'আপডেট করতে সমস্যা হয়েছে।' });
  }
};

// DELETE /api/budgets/:id
exports.deleteBudget = async (req, res) => {
  try {
    const result = await query('DELETE FROM budgets WHERE id=$1 AND user_id=$2 RETURNING id', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'বাজেট পাওয়া যায়নি।' });
    res.json({ success: true, message: 'বাজেট মুছে গেছে।' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'মুছতে সমস্যা হয়েছে।' });
  }
};

// GET /api/budgets/overview
exports.getBudgetOverview = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const result = await query(
      `SELECT
         SUM(b.amount) AS total_budget,
         SUM(COALESCE(
           (SELECT SUM(t.amount) FROM transactions t
            WHERE t.user_id=b.user_id AND t.category_id=b.category_id AND t.type='expense'
            AND EXTRACT(MONTH FROM t.date)=$2 AND EXTRACT(YEAR FROM t.date)=$3), 0
         )) AS total_spent
       FROM budgets b WHERE b.user_id=$1 AND b.month=$2 AND b.year=$3`,
      [req.user.id, month, year]
    );
    const row = result.rows[0];
    const total_budget = parseFloat(row.total_budget) || 0;
    const total_spent = parseFloat(row.total_spent) || 0;
    res.json({
      success: true,
      data: {
        total_budget,
        total_spent,
        remaining: total_budget - total_spent,
        percentage: total_budget > 0 ? Math.round((total_spent / total_budget) * 100) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে।' });
  }
};
