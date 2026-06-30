// ─── routes/categories.js ───
const express = require('express');
const catRouter = express.Router();
const { protect } = require('../middleware/auth');
const catCtrl = require('../controllers/categoryController');
catRouter.use(protect);
catRouter.get('/', catCtrl.getCategories);
catRouter.post('/', catCtrl.createCategory);
catRouter.put('/:id', catCtrl.updateCategory);
catRouter.delete('/:id', catCtrl.deleteCategory);

// ─── routes/budgets.js ───
const budgetRouter = express.Router();
const budgetCtrl = require('../controllers/budgetController');
budgetRouter.use(protect);
budgetRouter.get('/overview', budgetCtrl.getBudgetOverview);
budgetRouter.get('/', budgetCtrl.getBudgets);
budgetRouter.post('/', budgetCtrl.createBudget);
budgetRouter.put('/:id', budgetCtrl.updateBudget);
budgetRouter.delete('/:id', budgetCtrl.deleteBudget);

// ─── routes/reports.js ───
const reportRouter = express.Router();
const reportCtrl = require('../controllers/reportController');
reportRouter.use(protect);
reportRouter.get('/summary', reportCtrl.getSummary);
reportRouter.get('/yearly', reportCtrl.getYearlyOverview);

// ─── routes/export.js ───
const exportRouter = express.Router();
const pdfCtrl = require('../controllers/pdfController');
const excelCtrl = require('../controllers/excelController');
exportRouter.use(protect);
exportRouter.get('/pdf', pdfCtrl.exportPDF);
exportRouter.get('/excel', excelCtrl.exportExcel);

// ─── routes/backup.js ───
const backupRouter = express.Router();
const backupCtrl = require('../controllers/backupController');
backupRouter.use(protect);
backupRouter.get('/export', backupCtrl.exportBackup);
backupRouter.post('/restore', backupCtrl.restoreBackup);

// ─── routes/accounts.js ───
const accountRouter = express.Router();
const { query } = require('../config/db');
accountRouter.use(protect);

accountRouter.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM accounts WHERE user_id=$1 ORDER BY is_default DESC, name', [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (e) { res.status(500).json({ success: false, message: 'সমস্যা হয়েছে।' }); }
});

accountRouter.post('/', async (req, res) => {
  try {
    const { name, type, balance, currency, color, icon } = req.body;
    const result = await query(
      `INSERT INTO accounts (user_id, name, type, balance, currency, color, icon) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, name, type || 'general', parseFloat(balance) || 0, currency || 'BDT', color || '#3B82F6', icon || 'wallet']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: 'সমস্যা হয়েছে।' }); }
});

accountRouter.put('/:id', async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    const result = await query(
      `UPDATE accounts SET name=COALESCE($1,name), color=COALESCE($2,color), icon=COALESCE($3,icon)
       WHERE id=$4 AND user_id=$5 RETURNING *`,
      [name, color, icon, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'অ্যাকাউন্ট পাওয়া যায়নি।' });
    res.json({ success: true, data: result.rows[0] });
  } catch (e) { res.status(500).json({ success: false, message: 'সমস্যা হয়েছে।' }); }
});

accountRouter.delete('/:id', async (req, res) => {
  try {
    const check = await query('SELECT is_default FROM accounts WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'অ্যাকাউন্ট পাওয়া যায়নি।' });
    if (check.rows[0].is_default) return res.status(400).json({ success: false, message: 'প্রধান অ্যাকাউন্ট মুছা যাবে না।' });
    await query('DELETE FROM accounts WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'অ্যাকাউন্ট মুছে গেছে।' });
  } catch (e) { res.status(500).json({ success: false, message: 'সমস্যা হয়েছে।' }); }
});

module.exports = { catRouter, budgetRouter, reportRouter, exportRouter, backupRouter, accountRouter };
