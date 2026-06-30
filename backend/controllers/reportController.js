const { query } = require('../config/db');

// GET /api/reports/summary?period=monthly&month=&year=
exports.getSummary = async (req, res) => {
  try {
    const { period = 'monthly', month, year, start_date, end_date } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    let dateFilter = '';
    const params = [req.user.id];

    if (period === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      dateFilter = `AND date = $2`;
      params.push(today);
    } else if (period === 'weekly') {
      dateFilter = `AND date >= DATE_TRUNC('week', NOW()) AND date <= NOW()`;
    } else if (period === 'monthly') {
      dateFilter = `AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`;
      params.push(m, y);
    } else if (period === 'yearly') {
      dateFilter = `AND EXTRACT(YEAR FROM date) = $2`;
      params.push(y);
    } else if (period === 'custom' && start_date && end_date) {
      dateFilter = `AND date BETWEEN $2 AND $3`;
      params.push(start_date, end_date);
    }

    const [totals, byCategory, byDay] = await Promise.all([
      query(
        `SELECT
           SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS total_income,
           SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS total_expense,
           COUNT(CASE WHEN type='income' THEN 1 END) AS income_count,
           COUNT(CASE WHEN type='expense' THEN 1 END) AS expense_count
         FROM transactions WHERE user_id=$1 ${dateFilter}`,
        params
      ),
      query(
        `SELECT c.name, c.name_bn, c.icon, c.color, t.type,
                SUM(t.amount) AS total, COUNT(*) AS count
         FROM transactions t LEFT JOIN categories c ON t.category_id=c.id
         WHERE t.user_id=$1 ${dateFilter}
         GROUP BY c.id, c.name, c.name_bn, c.icon, c.color, t.type
         ORDER BY total DESC`,
        params
      ),
      query(
        `SELECT date, 
                SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
                SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
         FROM transactions WHERE user_id=$1 ${dateFilter}
         GROUP BY date ORDER BY date ASC`,
        params
      ),
    ]);

    const t = totals.rows[0];
    res.json({
      success: true,
      data: {
        total_income: parseFloat(t.total_income) || 0,
        total_expense: parseFloat(t.total_expense) || 0,
        net_savings: (parseFloat(t.total_income) || 0) - (parseFloat(t.total_expense) || 0),
        income_count: parseInt(t.income_count) || 0,
        expense_count: parseInt(t.expense_count) || 0,
        by_category: byCategory.rows,
        by_day: byDay.rows,
      },
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ success: false, message: 'রিপোর্ট লোড করতে সমস্যা হয়েছে।' });
  }
};

// GET /api/reports/yearly-overview?year=
exports.getYearlyOverview = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const result = await query(
      `SELECT
         EXTRACT(MONTH FROM date) AS month,
         SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
       FROM transactions WHERE user_id=$1 AND EXTRACT(YEAR FROM date)=$2
       GROUP BY EXTRACT(MONTH FROM date) ORDER BY month`,
      [req.user.id, year]
    );
    // Fill missing months with 0
    const months = Array.from({ length: 12 }, (_, i) => {
      const found = result.rows.find(r => parseInt(r.month) === i + 1);
      return { month: i + 1, income: parseFloat(found?.income) || 0, expense: parseFloat(found?.expense) || 0 };
    });
    res.json({ success: true, data: months });
  } catch (error) {
    res.status(500).json({ success: false, message: 'বার্ষিক রিপোর্ট লোড করতে সমস্যা হয়েছে।' });
  }
};
