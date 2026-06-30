# 💰 Finance Tracker — Backend

## 📁 Project Structure

```
backend/
├── config/
│   ├── db.js              # PostgreSQL connection
│   └── schema.sql         # Database tables & seed data
├── controllers/
│   ├── authController.js       # Register, Login, Forgot Password
│   ├── transactionController.js # Income & Expense CRUD + Dashboard
│   ├── categoryController.js   # Category CRUD
│   ├── budgetController.js     # Budget CRUD + Overview
│   ├── reportController.js     # Reports (daily/weekly/monthly/yearly)
│   ├── pdfController.js        # PDF Export
│   ├── excelController.js      # Excel Export
│   └── backupController.js     # JSON Backup & Restore
├── middleware/
│   ├── auth.js            # JWT protect middleware
│   ├── errorHandler.js    # Global error + validation
│   └── upload.js          # Multer file upload
├── routes/
│   ├── auth.js            # /api/auth/*
│   ├── transactions.js    # /api/transactions/*
│   └── index.js           # All other routes
├── utils/
│   ├── email.js           # Nodemailer email utility
│   └── cron.js            # Daily budget alerts cron
├── uploads/               # Uploaded receipts (auto-created)
├── .env.example           # Environment variables template
├── package.json
└── server.js              # Main entry point
```

## 🚀 Setup Instructions

### Step 1: Install Node.js
Download from https://nodejs.org (v20 LTS recommended)

### Step 2: Setup Supabase Database
1. Go to https://supabase.com → Create account
2. New Project → Name: `finance-tracker`, Region: Singapore
3. Go to SQL Editor → Paste content of `config/schema.sql` → Run
4. Go to Settings → Database → Copy "Connection string (URI)"

### Step 3: Install dependencies
```bash
cd backend
npm install
```

### Step 4: Configure environment
```bash
cp .env.example .env
```
Edit `.env` file:
- `DATABASE_URL` → paste Supabase connection string
- `JWT_SECRET` → any long random string (e.g. use https://passwordsgenerator.net)
- `EMAIL_USER` → your Gmail address
- `EMAIL_PASS` → Gmail App Password (not your regular password!)

**Gmail App Password বানানোর উপায়:**
1. Google Account → Security → 2-Step Verification চালু করো
2. App passwords → Select app: Mail → Generate
3. সেই 16-digit password টি .env এর EMAIL_PASS এ বসাও

### Step 5: Run the server
```bash
npm run dev
```
দেখবে: `🚀 Finance Tracker API running on port 5000`

### Step 6: Test the API
```
GET  http://localhost:5000/health
POST http://localhost:5000/api/auth/register
POST http://localhost:5000/api/auth/login
```

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | নতুন অ্যাকাউন্ট |
| POST | /api/auth/login | লগইন |
| POST | /api/auth/refresh | Token refresh |
| GET  | /api/auth/verify-email | ইমেইল যাচাই |
| POST | /api/auth/forgot-password | পাসওয়ার্ড রিসেট |
| POST | /api/auth/reset-password | নতুন পাসওয়ার্ড |
| GET  | /api/auth/me | প্রোফাইল |
| PUT  | /api/auth/update-profile | প্রোফাইল আপডেট |
| PUT  | /api/auth/change-password | পাসওয়ার্ড পরিবর্তন |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | /api/transactions | সব লেনদেন (filter/search) |
| POST | /api/transactions | নতুন লেনদেন + receipt upload |
| PUT  | /api/transactions/:id | আপডেট |
| DELETE | /api/transactions/:id | মুছো |
| GET  | /api/transactions/summary/dashboard | Dashboard data |

### Other Routes
| Prefix | Description |
|--------|-------------|
| /api/categories | Category CRUD |
| /api/accounts | Account CRUD |
| /api/budgets | Budget CRUD + overview |
| /api/reports | Summary + yearly chart |
| /api/export/pdf | PDF download |
| /api/export/excel | Excel download |
| /api/backup/export | JSON backup download |
| /api/backup/restore | Restore from JSON |

## 🌐 Deployment (Render)
1. GitHub এ code push করো
2. render.com → New Web Service → GitHub repo connect
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Environment Variables → সব .env values যোগ করো
6. Deploy!
