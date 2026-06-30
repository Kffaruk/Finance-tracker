require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// ── Security Middleware ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'অনেক বেশি request। কিছুক্ষণ পরে আবার চেষ্টা করুন।' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'অনেক বেশি login attempt। ১৫ মিনিট পরে চেষ্টা করুন।' },
});

app.use(globalLimiter);

// ── Body Parsers ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Files (uploaded receipts) ──
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_PATH || 'uploads')));

// ── Health Check ──
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Finance Tracker API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ── Routes ──
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const { catRouter, budgetRouter, reportRouter, exportRouter, backupRouter, accountRouter } = require('./routes/index');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', catRouter);
app.use('/api/budgets', budgetRouter);
app.use('/api/reports', reportRouter);
app.use('/api/export', exportRouter);
app.use('/api/backup', backupRouter);
app.use('/api/accounts', accountRouter);

// ── 404 Handler ──
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// ── Global Error Handler ──
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// ── Start Server ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Finance Tracker API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health\n`);
});

// ── Start Cron Jobs ──
if (process.env.NODE_ENV !== 'test') {
  require('./utils/cron');
}

module.exports = app;
