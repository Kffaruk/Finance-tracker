const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/errorHandler');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/transactionController');

router.use(protect);

router.get('/summary/dashboard', ctrl.getDashboardSummary);
router.get('/', ctrl.getTransactions);
router.get('/:id', ctrl.getTransaction);

router.post('/',
  upload.single('receipt'),
  [
    body('account_id').notEmpty().withMessage('অ্যাকাউন্ট নির্বাচন করুন।'),
    body('type').isIn(['income', 'expense']).withMessage('ধরন সঠিক নয়।'),
    body('amount').isFloat({ min: 0.01 }).withMessage('পরিমাণ সঠিক নয়।'),
    body('date').isDate().withMessage('তারিখ সঠিক নয়।'),
  ],
  validate,
  ctrl.createTransaction
);

router.put('/:id',
  upload.single('receipt'),
  [
    body('amount').optional().isFloat({ min: 0.01 }),
    body('date').optional().isDate(),
  ],
  validate,
  ctrl.updateTransaction
);

router.delete('/:id', ctrl.deleteTransaction);

module.exports = router;
