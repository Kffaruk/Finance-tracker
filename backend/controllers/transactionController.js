const { query, getClient } = require('../config/db');
const { sendBudgetAlertEmail } = require('../utils/email');

// GET /api/transactions
exports.getTransactions = async (req, res) => {
  try {
    const { type, category_id, account_id, start_date, end_date, keyword, min_amount, max_amount, page = 1, limit = 20, sort = 'date', order = 'DESC' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;
    const conditions = ['t.user_id = $1'];
    const params = [req.user.id];
    let idx = 2;

    if (type) { conditions.push(`t.type = $${idx++}`); params.push(type); }
    if (category_id) { conditions.push(`t.category_id = $${idx++}`); params.push(category_id); }
    if (account_id) { conditions.push(`t.account_id = $${idx++}`); params.push(account_id); }
    if (start_date) { conditions.push(`t.date >= $${idx++}`); params.push(start_date); }
    if (end_date) { conditions.push(`t.date <= $${idx++}`); params.push(end_date); }
    if (keyword) { conditions.push(`(t.note ILIKE $${idx++})`); params.push(`%${keyword}%`); }
    if (min_amount) { conditions.push(`t.amount >= $${idx++}`); params.push(parseFloat(min_amount)); }
    if (max_amount) { conditions.push(`t.amount <= $${idx++}`); params.push(parseFloat(max_amount)); }

    const allowedSort = ['date', 'amount', 'created_at'];
    const sortCol = allowedSort.includes(sort) ? sort : 'date';
    const orderDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const whereClause = conditions.join(' AND ');

    const countResult = await query(`SELECT COUNT(*) FROM transactions t WHERE ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await query(
      `SELECT t.*, c.name AS category_name, c.name_bn AS category_name_bn, c.icon AS category_icon, c.color AS category_color,
              a.name AS account_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE ${whereClause}
       ORDER BY t.${sortCol} ${orderDir}
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limitNum, offset]
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'লেনদেন লোড করতে সমস্যা হয়েছে।' });
  }
};

// GET /api/transactions/:id
exports.getTransaction = async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, c.name AS category_name, c.icon AS category_icon, a.name AS account_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'লেনদেন পাওয়া যায়নি।' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে।' });
  }
};

// POST /api/transactions
exports.createTransaction = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { account_id, category_id, type, amount, date, note, payment_method, tags } = req.body;
    const receipt_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Verify account belongs to user
    const accountCheck = await client.query('SELECT id, balance FROM accounts WHERE id = $1 AND user_id = $2', [account_id, req.user.id]);
    if (accountCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'অ্যাকাউন্ট পাওয়া যায়নি।' });
    }

    const txnResult = await client.query(
      `INSERT INTO transactions (user_id, account_id, category_id, type, amount, date, note, payment_method, receipt_url, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.user.id, account_id, category_id, type, parseFloat(amount), date, note, payment_method || 'cash', receipt_url, tags || []]
    );
    const txn = txnResult.rows[0];

    // Update account balance
    const balanceChange = type === 'income' ? parseFloat(amount) : -parseFloat(amount);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [balanceChange, account_id]);

    // Update budget spent if expense
    if (type === 'expense' && category_id) {
      const txnDate = new Date(date);
      const month = txnDate.getMonth() + 1;
      const year = txnDate.getFullYear();
      await client.query(
        `UPDATE budgets SET spent = spent + $1 WHERE user_id = $2 AND category_id = $3 AND month = $4 AND year = $5`,
        [parseFloat(amount), req.user.id, category_id, month, year]
      );
      // Check budget alert
      const budget = await client.query(
        `SELECT b.amount, b.spent, b.alert_threshold, b.alert_sent, c.name AS cat_name
         FROM budgets b JOIN categories c ON b.category_id = c.id
         WHERE b.user_id = $1 AND b.category_id = $2 AND b.month = $3 AND b.year = $4`,
        [req.user.id, category_id, month, year]
      );
      if (budget.rows.length > 0) {
        const b = budget.rows[0];
        const pct = (parseFloat(b.spent) / parseFloat(b.amount)) * 100;
        if (pct >= b.alert_threshold && !b.alert_sent) {
          await client.query(`UPDATE budgets SET alert_sent = TRUE WHERE user_id = $1 AND category_id = $2 AND month = $3 AND year = $4`, [req.user.id, category_id, month, year]);
          const userResult = await client.query('SELECT email, name FROM users WHERE id = $1', [req.user.id]);
          sendBudgetAlertEmail(userResult.rows[0].email, userResult.rows[0].name, b.cat_name, parseFloat(b.spent), parseFloat(b.amount)).catch(console.error);
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'লেনদেন যোগ হয়েছে।', data: txn });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create transaction error:', error);
    res.status(500).json({ success: false, message: 'লেনদেন যোগ করতে সমস্যা হয়েছে।' });
  } finally {
    client.release();
  }
};

// PUT /api/transactions/:id
exports.updateTransaction = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { category_id, amount, date, note, payment_method, tags } = req.body;

    const existing = await client.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'লেনদেন পাওয়া যায়নি।' });
    }
    const old = existing.rows[0];
    const oldBalanceChange = old.type === 'income' ? -parseFloat(old.amount) : parseFloat(old.amount);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [oldBalanceChange, old.account_id]);

    const newAmount = parseFloat(amount) || parseFloat(old.amount);
    const newBalanceChange = old.type === 'income' ? newAmount : -newAmount;
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [newBalanceChange, old.account_id]);

    const result = await client.query(
      `UPDATE transactions SET category_id = COALESCE($1, category_id), amount = $2, date = COALESCE($3, date),
       note = COALESCE($4, note), payment_method = COALESCE($5, payment_method), tags = COALESCE($6, tags)
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [category_id, newAmount, date, note, payment_method, tags, req.params.id, req.user.id]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'লেনদেন আপডেট হয়েছে।', data: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'আপডেট করতে সমস্যা হয়েছে।' });
  } finally {
    client.release();
  }
};

// DELETE /api/transactions/:id
exports.deleteTransaction = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'লেনদেন পাওয়া যায়নি।' });
    }
    const txn = existing.rows[0];
    const balanceChange = txn.type === 'income' ? -parseFloat(txn.amount) : parseFloat(txn.amount);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [balanceChange, txn.account_id]);
    await client.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'লেনদেন মুছে গেছে।' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'মুছতে সমস্যা হয়েছে।' });
  } finally {
    client.release();
  }
};

// GET /api/transactions/summary/dashboard
exports.getDashboardSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const [summary, monthly, categoryExpenses, recentTxns, accountBalance] = await Promise.all([
      query(
        `SELECT
           SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
           SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
         FROM transactions WHERE user_id = $1 AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3`,
        [req.user.id, m, y]
      ),
      query(
        `SELECT EXTRACT(MONTH FROM date) AS month, EXTRACT(YEAR FROM date) AS year,
                SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
                SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
         FROM transactions WHERE user_id = $1 AND date >= NOW() - INTERVAL '6 months'
         GROUP BY EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date) ORDER BY year, month`,
        [req.user.id]
      ),
      query(
        `SELECT c.name, c.name_bn, c.icon, c.color, SUM(t.amount) AS total
         FROM transactions t JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 AND t.type = 'expense' AND EXTRACT(MONTH FROM t.date) = $2 AND EXTRACT(YEAR FROM t.date) = $3
         GROUP BY c.id ORDER BY total DESC LIMIT 6`,
        [req.user.id, m, y]
      ),
      query(
        `SELECT t.*, c.name AS category_name, c.name_bn AS category_name_bn, c.icon AS category_icon, c.color AS category_color
         FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = $1 ORDER BY t.created_at DESC LIMIT 10`,
        [req.user.id]
      ),
      query(
        `SELECT SUM(balance) AS total_balance FROM accounts WHERE user_id = $1`,
        [req.user.id]
      ),
    ]);

    const s = summary.rows[0];
    res.json({
      success: true,
      data: {
        total_balance: parseFloat(accountBalance.rows[0].total_balance) || 0,
        total_income: parseFloat(s.total_income) || 0,
        total_expense: parseFloat(s.total_expense) || 0,
        net_savings: (parseFloat(s.total_income) || 0) - (parseFloat(s.total_expense) || 0),
        monthly_chart: monthly.rows,
        category_expenses: categoryExpenses.rows,
        recent_transactions: recentTxns.rows,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'ড্যাশবোর্ড লোড করতে সমস্যা হয়েছে।' });
  }
};
