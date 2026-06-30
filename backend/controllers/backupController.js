const { query, getClient } = require('../config/db');

// GET /api/backup/export — full data backup as JSON
exports.exportBackup = async (req, res) => {
  try {
    const [accounts, categories, transactions, budgets] = await Promise.all([
      query('SELECT * FROM accounts WHERE user_id=$1', [req.user.id]),
      query('SELECT * FROM categories WHERE user_id=$1', [req.user.id]),
      query('SELECT * FROM transactions WHERE user_id=$1 ORDER BY date DESC', [req.user.id]),
      query('SELECT * FROM budgets WHERE user_id=$1', [req.user.id]),
    ]);
    const backup = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      user_id: req.user.id,
      data: {
        accounts: accounts.rows,
        categories: categories.rows,
        transactions: transactions.rows,
        budgets: budgets.rows,
      },
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="finance-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(backup);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Backup তৈরি করতে সমস্যা হয়েছে।' });
  }
};

// POST /api/backup/restore — restore from JSON backup
exports.restoreBackup = async (req, res) => {
  const client = await getClient();
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ success: false, message: 'Backup data প্রয়োজন।' });

    await client.query('BEGIN');
    // Clear existing data
    await client.query('DELETE FROM transactions WHERE user_id=$1', [req.user.id]);
    await client.query('DELETE FROM budgets WHERE user_id=$1', [req.user.id]);
    await client.query('DELETE FROM categories WHERE user_id=$1 AND is_default=FALSE', [req.user.id]);

    // Restore categories
    for (const cat of (data.categories || [])) {
      await client.query(
        `INSERT INTO categories (id, user_id, name, name_bn, type, icon, color, is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
        [cat.id, req.user.id, cat.name, cat.name_bn, cat.type, cat.icon, cat.color, cat.is_default]
      );
    }
    // Restore accounts
    for (const acc of (data.accounts || [])) {
      await client.query(
        `INSERT INTO accounts (id, user_id, name, type, balance, currency, is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET balance=EXCLUDED.balance`,
        [acc.id, req.user.id, acc.name, acc.type, acc.balance, acc.currency, acc.is_default]
      );
    }
    // Restore transactions
    for (const txn of (data.transactions || [])) {
      await client.query(
        `INSERT INTO transactions (id, user_id, account_id, category_id, type, amount, date, note, payment_method)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
        [txn.id, req.user.id, txn.account_id, txn.category_id, txn.type, txn.amount, txn.date, txn.note, txn.payment_method]
      );
    }
    // Restore budgets
    for (const b of (data.budgets || [])) {
      await client.query(
        `INSERT INTO budgets (id, user_id, category_id, amount, month, year, alert_threshold)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (user_id, category_id, month, year) DO UPDATE SET amount=EXCLUDED.amount`,
        [b.id, req.user.id, b.category_id, b.amount, b.month, b.year, b.alert_threshold]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true, message: 'Backup সফলভাবে পুনরুদ্ধার হয়েছে।' });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Restore error:', error);
    res.status(500).json({ success: false, message: 'Restore করতে সমস্যা হয়েছে।' });
  } finally {
    if (client) client.release();
  }
};
