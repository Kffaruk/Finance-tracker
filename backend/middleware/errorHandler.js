const { validationResult } = require('express-validator');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  console.error('Error:', err.message);

  // PostgreSQL unique violation
  if (err.code === '23505') {
    const field = err.detail?.match(/\(([^)]+)\)/)?.[1] || 'field';
    return res.status(400).json({ success: false, message: `${field} already exists.` });
  }
  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Referenced record not found.' });
  }
  // PostgreSQL check violation
  if (err.code === '23514') {
    return res.status(400).json({ success: false, message: 'Invalid data value.' });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
  });
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { errorHandler, validate };
