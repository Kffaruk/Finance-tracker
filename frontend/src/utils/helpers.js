import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'

export const formatCurrency = (amount, currency = 'BDT') => {
  const num = parseFloat(amount) || 0
  if (currency === 'BDT') return `৳${num.toLocaleString('bn-BD')}`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num)
}

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—'
  try { return format(typeof date === 'string' ? parseISO(date) : date, fmt) }
  catch { return date }
}

export const monthName = (month) => {
  const names = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর']
  return names[(month - 1)] || ''
}

export const currentMonth = () => ({
  month: new Date().getMonth() + 1,
  year:  new Date().getFullYear(),
})

export const getMonthRange = (month, year) => ({
  start: format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd'),
  end:   format(endOfMonth(new Date(year, month - 1)),   'yyyy-MM-dd'),
})

export const pct = (val, total) => total > 0 ? Math.min(Math.round((val / total) * 100), 100) : 0

export const PAYMENT_METHODS = ['নগদ','বিকাশ','নগদ (app)','রকেট','ডেবিট কার্ড','ক্রেডিট কার্ড','ব্যাংক ট্রান্সফার']

export const CURRENCIES = [
  { code: 'BDT', label: 'বাংলাদেশী টাকা (৳)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'INR', label: 'Indian Rupee (₹)' },
]

export const CATEGORY_ICONS = ['briefcase','laptop','home','car','heart','book','shopping-cart','utensils','film','zap','wifi','gift','target','trending-up','tag','piggy-bank']
export const CATEGORY_COLORS = ['#EF4444','#F97316','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EC4899','#14B8A6','#6366F1','#84CC16']
