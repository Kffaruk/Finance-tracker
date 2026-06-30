// ─── routes/auth.js ───
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/errorHandler');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('নাম দিন।'),
    body('email').isEmail().withMessage('সঠিক ইমেইল দিন।'),
    body('password').isLength({ min: 6 }).withMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'),
  ],
  validate,
  ctrl.register
);
router.post('/login',
  [
    body('email').isEmail().withMessage('সঠিক ইমেইল দিন।'),
    body('password').notEmpty().withMessage('পাসওয়ার্ড দিন।'),
  ],
  validate,
  ctrl.login
);
router.post('/refresh', ctrl.refreshToken);
router.get('/verify-email', ctrl.verifyEmail);
router.post('/forgot-password', body('email').isEmail(), validate, ctrl.forgotPassword);
router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 }),
  ],
  validate,
  ctrl.resetPassword
);
router.get('/me', protect, ctrl.getMe);
router.put('/update-profile', protect, ctrl.updateProfile);
router.put('/change-password', protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  validate,
  ctrl.changePassword
);

module.exports = router;
