const cron = require('node-cron');
const { query } = require('../config/db');
const { sendEmail } = require('./email');

// Daily budget check — runs every day at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('⏰ Running daily budget check...');
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budgets = await query(
      `SELECT b.*, u.email, u.name AS user_name, c.name AS category_name
       FROM budgets b
       JOIN users u ON b.user_id = u.id
       JOIN categories c ON b.category_id = c.id
       WHERE b.month=$1 AND b.year=$2 AND b.alert_sent=FALSE`,
      [month, year]
    );

    for (const budget of budgets.rows) {
      const spent = await query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions
         WHERE user_id=$1 AND category_id=$2 AND type='expense'
         AND EXTRACT(MONTH FROM date)=$3 AND EXTRACT(YEAR FROM date)=$4`,
        [budget.user_id, budget.category_id, month, year]
      );
      const spentAmt = parseFloat(spent.rows[0].total);
      const pct = (spentAmt / parseFloat(budget.amount)) * 100;

      if (pct >= budget.alert_threshold) {
        try {
          await sendEmail({
            to: budget.email,
            subject: `⚠️ বাজেট সতর্কতা: ${budget.category_name}`,
            html: `<p>প্রিয় ${budget.user_name}, <b>${budget.category_name}</b> এ বাজেটের ${Math.round(pct)}% খরচ হয়ে গেছে।</p>
                   <p>বাজেট: ৳${parseFloat(budget.amount).toLocaleString()} | খরচ: ৳${spentAmt.toLocaleString()}</p>`,
          });
          await query('UPDATE budgets SET alert_sent=TRUE WHERE id=$1', [budget.id]);
        } catch (emailErr) {
          console.error('Budget alert email failed:', emailErr.message);
        }
      }
    }
  } catch (err) {
    console.error('Budget cron error:', err.message);
  }
});

// Monthly budget reset — runs on 1st of every month at midnight
cron.schedule('0 0 1 * *', async () => {
  console.log('⏰ Resetting monthly budget alert flags...');
  try {
    await query('UPDATE budgets SET alert_sent=FALSE');
    console.log('✅ Budget alerts reset for new month.');
  } catch (err) {
    console.error('Budget reset cron error:', err.message);
  }
});

console.log('✅ Cron jobs scheduled.');
