-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMPTZ,
  currency VARCHAR(10) DEFAULT 'BDT',
  language VARCHAR(10) DEFAULT 'bn',
  theme VARCHAR(10) DEFAULT 'light',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) DEFAULT 'general',
  balance DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'BDT',
  color VARCHAR(20) DEFAULT '#3B82F6',
  icon VARCHAR(50) DEFAULT 'wallet',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_bn VARCHAR(100),
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  icon VARCHAR(50) DEFAULT 'tag',
  color VARCHAR(20) DEFAULT '#6B7280',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  note TEXT,
  payment_method VARCHAR(50) DEFAULT 'cash',
  receipt_url VARCHAR(500),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_interval VARCHAR(20),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  spent DECIMAL(15,2) DEFAULT 0,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  alert_threshold INT DEFAULT 80,
  alert_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

-- Savings Goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  deadline DATE,
  color VARCHAR(20) DEFAULT '#10B981',
  icon VARCHAR(50) DEFAULT 'target',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

-- Default Categories (will be copied per user on signup)
INSERT INTO categories (user_id, name, name_bn, type, icon, color, is_default) VALUES
  (NULL, 'Salary', 'বেতন', 'income', 'briefcase', '#10B981', TRUE),
  (NULL, 'Freelance', 'ফ্রিল্যান্স', 'income', 'laptop', '#3B82F6', TRUE),
  (NULL, 'Business', 'ব্যবসা', 'income', 'store', '#8B5CF6', TRUE),
  (NULL, 'Investment', 'বিনিয়োগ', 'income', 'trending-up', '#F59E0B', TRUE),
  (NULL, 'Gift', 'উপহার', 'income', 'gift', '#EC4899', TRUE),
  (NULL, 'Other Income', 'অন্যান্য আয়', 'income', 'plus-circle', '#6B7280', TRUE),
  (NULL, 'Food', 'খাদ্য', 'expense', 'utensils', '#EF4444', TRUE),
  (NULL, 'Housing', 'আবাসন', 'expense', 'home', '#F97316', TRUE),
  (NULL, 'Transport', 'পরিবহন', 'expense', 'car', '#EAB308', TRUE),
  (NULL, 'Health', 'স্বাস্থ্য', 'expense', 'heart', '#22C55E', TRUE),
  (NULL, 'Education', 'শিক্ষা', 'expense', 'book', '#14B8A6', TRUE),
  (NULL, 'Shopping', 'কেনাকাটা', 'expense', 'shopping-cart', '#6366F1', TRUE),
  (NULL, 'Entertainment', 'বিনোদন', 'expense', 'film', '#EC4899', TRUE),
  (NULL, 'Utilities', 'ইউটিলিটি', 'expense', 'zap', '#F59E0B', TRUE),
  (NULL, 'Internet', 'ইন্টারনেট', 'expense', 'wifi', '#3B82F6', TRUE),
  (NULL, 'Other Expense', 'অন্যান্য খরচ', 'expense', 'minus-circle', '#6B7280', TRUE)
ON CONFLICT DO NOTHING;

-- Function to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
