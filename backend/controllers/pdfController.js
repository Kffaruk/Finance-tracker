const PDFDocument = require('pdfkit');
const { query } = require('../config/db');

exports.exportPDF = async (req, res) => {
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

    const [userResult, txnResult, summaryResult] = await Promise.all([
      query('SELECT name, email, currency FROM users WHERE id=$1', [req.user.id]),
      query(
        `SELECT t.type, t.amount, t.date, t.note, t.payment_method,
                c.name AS category_name
         FROM transactions t
         LEFT JOIN categories c ON t.category_id=c.id
         WHERE t.user_id=$1 ${dateFilter}
         ORDER BY t.date DESC`,
        params
      ),
      query(
        `SELECT
           SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS total_income,
           SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS total_expense
         FROM transactions WHERE user_id=$1 ${dateFilter}`,
        params
      ),
    ]);

    const user = userResult.rows[0];
    const transactions = txnResult.rows;
    const summary = summaryResult.rows[0];
    const currency = user.currency || 'BDT';

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="finance-report-${y}-${m}.pdf"`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 80).fill('#3B82F6');
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('Finance Tracker', 50, 25);
    doc.fontSize(11).font('Helvetica').text(`Report — ${user.name} | ${user.email}`, 50, 52);
    doc.moveDown(3);

    // Period label
    doc.fillColor('#1F2937').fontSize(14).font('Helvetica-Bold');
    const periodLabel = period === 'monthly'
      ? `Monthly Report: ${new Date(y, m - 1).toLocaleString('default', { month: 'long' })} ${y}`
      : period === 'yearly' ? `Yearly Report: ${y}` : `Custom Report: ${start_date} to ${end_date}`;
    doc.text(periodLabel, 50, 100);

    // Summary boxes
    const boxY = 125;
    const totalIncome = parseFloat(summary.total_income) || 0;
    const totalExpense = parseFloat(summary.total_expense) || 0;
    const netSavings = totalIncome - totalExpense;

    const drawBox = (x, y, w, h, label, value, color) => {
      doc.rect(x, y, w, h).fillAndStroke(color, color);
      doc.fillColor('white').fontSize(10).font('Helvetica').text(label, x + 10, y + 10);
      doc.fontSize(16).font('Helvetica-Bold').text(`${currency} ${value.toLocaleString()}`, x + 10, y + 28);
    };

    drawBox(50, boxY, 155, 60, 'Total Income', totalIncome, '#10B981');
    drawBox(215, boxY, 155, 60, 'Total Expense', totalExpense, '#EF4444');
    drawBox(380, boxY, 155, 60, 'Net Savings', netSavings, netSavings >= 0 ? '#3B82F6' : '#F59E0B');

    // Transactions table
    const tableY = boxY + 80;
    doc.fillColor('#1F2937').fontSize(12).font('Helvetica-Bold').text('Transactions', 50, tableY);

    // Table header
    const hY = tableY + 20;
    doc.rect(50, hY, 495, 22).fill('#F3F4F6');
    doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold');
    doc.text('Date', 55, hY + 6);
    doc.text('Category', 120, hY + 6);
    doc.text('Note', 230, hY + 6);
    doc.text('Method', 340, hY + 6);
    doc.text('Type', 410, hY + 6);
    doc.text('Amount', 455, hY + 6, { width: 85, align: 'right' });

    let rowY = hY + 22;
    const rowH = 20;
    doc.fontSize(8).font('Helvetica');

    for (const txn of transactions) {
      if (rowY > doc.page.height - 80) {
        doc.addPage();
        rowY = 50;
      }
      const isIncome = txn.type === 'income';
      if (transactions.indexOf(txn) % 2 === 0) {
        doc.rect(50, rowY, 495, rowH).fill('#F9FAFB');
      }
      doc.fillColor('#374151');
      doc.text(new Date(txn.date).toLocaleDateString(), 55, rowY + 5);
      doc.text((txn.category_name || 'N/A').substring(0, 16), 120, rowY + 5);
      doc.text((txn.note || '—').substring(0, 18), 230, rowY + 5);
      doc.text((txn.payment_method || 'cash').substring(0, 10), 340, rowY + 5);
      doc.fillColor(isIncome ? '#10B981' : '#EF4444').text(txn.type.toUpperCase(), 410, rowY + 5);
      doc.fillColor(isIncome ? '#10B981' : '#EF4444').text(
        `${isIncome ? '+' : '-'} ${currency} ${parseFloat(txn.amount).toLocaleString()}`,
        455, rowY + 5, { width: 85, align: 'right' }
      );
      doc.rect(50, rowY, 495, rowH).stroke('#E5E7EB');
      rowY += rowH;
    }

    // Footer
    doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill('#F3F4F6');
    doc.fillColor('#9CA3AF').fontSize(9).font('Helvetica')
      .text(`Generated by Finance Tracker • ${new Date().toLocaleString()}`, 50, doc.page.height - 25);

    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'PDF তৈরি করতে সমস্যা হয়েছে।' });
    }
  }
};
