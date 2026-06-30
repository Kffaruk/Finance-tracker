const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query, getClient } = require('../config/db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });
  return { accessToken, refreshToken };
};

// POST /api/auth/register
exports.register = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { name, email, password } = req.body;

    const exists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'এই ইমেইলটি ইতিমধ্যে নিবন্ধিত।' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = uuidv4();

    const userResult = await client.query(
      `INSERT INTO users (name, email, password, verification_token) VALUES ($1, $2, $3, $4) RETURNING id, name, email`,
      [name, email, hashedPassword, verificationToken]
    );
    const user = userResult.rows[0];

    // Create default account
    await client.query(
      `INSERT INTO accounts (user_id, name, type, balance, is_default) VALUES ($1, $2, $3, $4, $5)`,
      [user.id, 'প্রধান অ্যাকাউন্ট', 'general', 0, true]
    );

    // Copy default categories for user
    await client.query(
      `INSERT INTO categories (user_id, name, name_bn, type, icon, color, is_default)
       SELECT $1, name, name_bn, type, icon, color, TRUE FROM categories WHERE user_id IS NULL`,
      [user.id]
    );

    await client.query('COMMIT');

    // Send verification email
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    res.status(201).json({
      success: true,
      message: 'অ্যাকাউন্ট তৈরি হয়েছে! ইমেইল যাচাই করুন।',
      data: { user: { id: user.id, name: user.name, email: user.email }, accessToken, refreshToken },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।' });
  } finally {
    client.release();
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।' });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।' });
    }
    const { accessToken, refreshToken } = generateTokens(user.id);
    res.json({
      success: true,
      message: 'সফলভাবে লগইন হয়েছে।',
      data: {
        user: { id: user.id, name: user.name, email: user.email, currency: user.currency, language: user.language, theme: user.theme, is_verified: user.is_verified },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'লগইন করতে সমস্যা হয়েছে।' });
  }
};

// POST /api/auth/refresh
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required.' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.id);
    res.json({ success: true, data: { accessToken, refreshToken: newRefresh } });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid refresh token.' });
  }
};

// GET /api/auth/verify-email?token=
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const result = await query(
      `UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE verification_token = $1 RETURNING id`,
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'অবৈধ বা মেয়াদোত্তীর্ণ যাচাই টোকেন।' });
    }
    res.json({ success: true, message: 'ইমেইল সফলভাবে যাচাই হয়েছে!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'যাচাই করতে সমস্যা হয়েছে।' });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await query('SELECT id, name FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.json({ success: true, message: 'যদি ইমেইলটি নিবন্ধিত থাকে, রিসেট লিঙ্ক পাঠানো হবে।' });
    }
    const user = result.rows[0];
    const resetToken = uuidv4();
    const expires = new Date(Date.now() + 3600000); // 1 hour
    await query(
      `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3`,
      [resetToken, expires, user.id]
    );
    await sendPasswordResetEmail(email, user.name, resetToken);
    res.json({ success: true, message: 'পাসওয়ার্ড রিসেট লিঙ্ক ইমেইলে পাঠানো হয়েছে।' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে।' });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const result = await query(
      `SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()`,
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'অবৈধ বা মেয়াদোত্তীর্ণ রিসেট টোকেন।' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    await query(
      `UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2`,
      [hashedPassword, result.rows[0].id]
    );
    res.json({ success: true, message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে।' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, currency, language, theme, is_verified, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'সমস্যা হয়েছে।' });
  }
};

// PUT /api/auth/update-profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, currency, language, theme } = req.body;
    const result = await query(
      `UPDATE users SET name = COALESCE($1, name), currency = COALESCE($2, currency), language = COALESCE($3, language), theme = COALESCE($4, theme) WHERE id = $5 RETURNING id, name, email, currency, language, theme`,
      [name, currency, language, theme, req.user.id]
    );
    res.json({ success: true, message: 'প্রোফাইল আপডেট হয়েছে।', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'আপডেট করতে সমস্যা হয়েছে।' });
  }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);
    res.json({ success: true, message: 'পাসওয়ার্ড পরিবর্তন হয়েছে।' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে।' });
  }
};
