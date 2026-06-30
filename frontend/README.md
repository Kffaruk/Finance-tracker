# 💰 Finance Tracker — Frontend (React)

## 📁 Structure
```
frontend/
├── src/
│   ├── api/
│   │   ├── axios.js          # Axios instance + token refresh interceptor
│   │   └── services.js       # All API call functions
│   ├── components/
│   │   ├── common/index.jsx  # Spinner, Modal, Empty, Field, ProgressBar...
│   │   ├── layout/            # Sidebar, Layout, ProtectedRoute
│   │   └── transactions/      # TransactionForm, TransactionList
│   ├── context/
│   │   ├── AuthContext.jsx   # Login/Register/Logout/User state
│   │   └── ThemeContext.jsx  # Dark mode
│   ├── hooks/
│   │   └── useApi.js         # useApi, useDownload hooks
│   ├── pages/                 # Login, Register, Dashboard, Income, Expense,
│   │                          # Categories, Budget, Reports, Search, Backup, Settings
│   ├── utils/helpers.js      # formatCurrency, formatDate, etc.
│   ├── App.jsx                # Routing
│   ├── main.jsx                # Entry point
│   └── index.css              # Tailwind + custom styles
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## 🚀 Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if backend isn't on localhost:5000

npm run dev
```
Open http://localhost:3000

## ✨ Features Implemented
- **Auth**: Login, Register, Forgot/Reset Password, Email Verification
- **Dashboard**: Balance, income/expense stats, Bar + Doughnut charts, recent transactions
- **Income/Expense**: Full CRUD with receipt upload (expense)
- **Categories**: Custom category creation with colors
- **Budget**: Set category budgets, progress bars, over-limit warnings
- **Reports**: Daily/Weekly/Monthly/Yearly views, PDF + Excel export
- **Search**: Multi-filter search (date range, category, amount, keyword)
- **Backup**: JSON export/import
- **Settings**: Profile, currency, password change
- **Dark Mode**: Persisted via localStorage + Tailwind `dark:` classes
- **Responsive**: Mobile sidebar drawer, responsive grid layouts

## 🌐 Deploy to Vercel
```bash
npm run build
# Push to GitHub, then import repo in vercel.com
# Set environment variable: VITE_API_URL = https://your-backend.onrender.com/api
```
