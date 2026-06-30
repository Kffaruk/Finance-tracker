const ExcelJS = require('exceljs');
const { query } = require('../config/db');

exports.exportExcel = async (req, res) => {
  try {
    const { month, year, period = 'monthly', start_date, end_date } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    let dateFilter = '';
    const params = [req.user.id];
    if (period === 'monthly') {
      dateFilter = `AND EXTRACT(MONTH FROM t.date)=$2 AND EXTRACT(YEAR FROM t.date)=$3`;
      params.push(m, y);
    } else if (period === 'yearly') {
      dateFilter = `AND EXTRACT(YEAR FROM t.date)=$2`;
      params.push(y);
    } else if (period === 'custom' && start_date && end_date) {
      dateFilter = `AND t.date BETWEEN $2 AND $3`;
      params.push(start_date, end_date);
    }

    const [userResult, txnResult, summaryResult, catResult] = await Promise.all([
      query('SELECT name, email, currency FROM users WHERE id=$1', [req.user.id]),
      query(
        `SELECT t.type, t.amount, t.date, t.note, t.payment_method, c.name AS category_name, a.name AS account_name
         FROM transactions t
         LEFT JOIN categories c ON t.category_id=c.id
         LEFT JOIN accounts a ON t.account_id=a.id
         WHERE t.user_id=$1 ${dateFilter} ORDER BY t.date DESC`,
        params
      ),
      query(
        `SELECT SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS total_income,
                SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS total_expense
         FROM transactions WHERE user_id=$1 ${dateFilter}`,
        params
      ),
      query(
        `SELECT c.name AS category_name, t.type,
                SUM(t.amount) AS total, COUNT(*) AS count
         FROM transactions t LEFT JOIN categories c ON t.category_id=c.id
         WHERE t.user_id=$1 ${dateFilter}
         GROUP BY c.name, t.type ORDER BY total DESC`,
        params
      ),
    ]);

    const user = userResult.rows[0];
    const currency = user.currency || 'BDT';
    const totalIncome = parseFloat(summaryResult.rows[0].total_income) || 0;
    const totalExpense = parseFloat(summaryResult.rows[0].total_expense) || 0;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Finance Tracker';
    workbook.created = new Date();

    // ── Sheet 1: Transactions ──
    const txnSheet = workbook.addWorksheet('লেনদেন', { properties: { tabColor: { argb: 'FF3B82F6' } } });

    // Title row
    txnSheet.mergeCells('A1:G1');
    txnSheet.getCell('A1').value = `Finance Tracker Report — ${user.name}`;
    txnSheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF1F2937' } };
    txnSheet.getCell('A1').alignment = { horizontal: 'center' };
    txnSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };

    txnSheet.addRow([]);

    // Summary row
    txnSheet.addRow(['মোট আয়', `${currency} ${totalIncome.toLocaleString()}`, '', 'মোট খরচ', `${currency} ${totalExpense.toLocaleString()}`, '', `সঞ্চয়: ${currency} ${(totalIncome - totalExpense).toLocaleString()}`]);
    const summaryRow = txnSheet.lastRow;
    summaryRow.getCell(1).font = { bold: true };
    summaryRow.getCell(2).font = { bold: true, color: { argb: 'FF10B981' } };
    summaryRow.getCell(4).font = { bold: true };
    summaryRow.getCell(5).font = { bold: true, color: { argb: 'FFEF4444' } };
    summaryRow.getCell(7).font = { bold: true, color: { argb: 'FF3B82F6' } };

    txnSheet.addRow([]);

    // Header
    const headers = ['তারিখ', 'ধরন', 'ক্যাটাগরি', 'অ্যাকাউন্ট', 'পেমেন্ট পদ্ধতি', 'নোট', 'পরিমাণ'];
    txnSheet.addRow(headers);
    const headerRow = txnSheet.lastRow;
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      cell.alignment = { horizontal: 'center' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF1D4ED8' } } };
    });

    // Column widths
    txnSheet.columns = [
      { key: 'date', width: 14 },
      { key: 'type', width: 10 },
      { key: 'category', width: 18 },
      { key: 'account', width: 18 },
      { key: 'method', width: 16 },
      { key: 'note', width: 25 },
      { key: 'amount', width: 16 },
    ];

    txnResult.rows.forEach((txn, i) => {
      const isIncome = txn.type === 'income';
      const row = txnSheet.addRow([
        new Date(txn.date).toLocaleDateString('bn-BD'),
        isIncome ? 'আয়' : 'খরচ',
        txn.category_name || 'N/A',
        txn.account_name || 'N/A',
        txn.payment_method || 'cash',
        txn.note || '',
        parseFloat(txn.amount),
      ]);
      if (i % 2 === 0) {
        row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; });
      }
      row.getCell(7).numFmt = `"${currency} "#,##0.00`;
      row.getCell(7).font = { color: { argb: isIncome ? 'FF10B981' : 'FFEF4444' }, bold: true };
      row.getCell(2).font = { color: { argb: isIncome ? 'FF10B981' : 'FFEF4444' } };
    });

    // Freeze top rows
    txnSheet.views = [{ state: 'frozen', ySplit: 5 }];

    // ── Sheet 2: Category Summary ──
    const catSheet = workbook.addWorksheet('ক্যাটাগরি সারাংশ', { properties: { tabColor: { argb: 'FF10B981' } } });
    catSheet.addRow(['ক্যাটাগরি', 'ধরন', 'মোট পরিমাণ', 'লেনদেন সংখ্যা']);
    catSheet.lastRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
    });
    catSheet.columns = [{ width: 22 }, { width: 12 }, { width: 18 }, { width: 18 }];
    catResult.rows.forEach(cat => {
      const row = catSheet.addRow([cat.category_name || 'N/A', cat.type === 'income' ? 'আয়' : 'খরচ', parseFloat(cat.total), parseInt(cat.count)]);
      row.getCell(3).numFmt = `"${currency} "#,##0.00`;
      row.getCell(3).font = { color: { argb: cat.type === 'income' ? 'FF10B981' : 'FFEF4444' } };
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="finance-report-${y}-${String(m).padStart(2,'0')}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export error:', error);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Excel তৈরি করতে সমস্যা হয়েছে।' });
  }
};
