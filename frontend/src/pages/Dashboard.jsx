import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { transactionAPI } from '../api/services'
import { formatCurrency, formatDate, currentMonth, monthName } from '../utils/helpers'
import { Spinner, AmountBadge, PageHeader } from '../components/common'
import { useAuth } from '../context/AuthContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="stat-card">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${color}`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5 truncate">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
)

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const { month, year } = currentMonth()
  const isDark = document.documentElement.classList.contains('dark')
  const textColor = isDark ? '#9ca3af' : '#6b7280'
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'

  useEffect(() => {
    transactionAPI.getDashboard({ month, year })
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-96 flex items-center justify-center"><Spinner size="lg" /></div>
  if (!data)   return <div className="text-center py-20 text-gray-400">ড্যাশবোর্ড লোড হয়নি।</div>

  const currency = user?.currency || 'BDT'
  const fmt = (v) => formatCurrency(v, currency)

  const barData = {
    labels: (data.monthly_chart || []).map(r => `${monthName(r.month)}`),
    datasets: [
      { label: 'আয়',   data: data.monthly_chart?.map(r => parseFloat(r.income) || 0),  backgroundColor: '#22c55e', borderRadius: 6 },
      { label: 'খরচ',  data: data.monthly_chart?.map(r => parseFloat(r.expense) || 0), backgroundColor: '#ef4444', borderRadius: 6 },
    ],
  }
  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: textColor, font: { size: 11 } }, grid: { display: false } },
      y: { ticks: { color: textColor, font: { size: 11 }, callback: v => fmt(v) }, grid: { color: gridColor } },
    },
  }

  const catExpenses = data.category_expenses || []
  const pieData = {
    labels: catExpenses.map(c => c.name_bn || c.name),
    datasets: [{ data: catExpenses.map(c => parseFloat(c.total)), backgroundColor: ['#ef4444','#f97316','#f59e0b','#22c55e','#3b82f6','#8b5cf6'], borderWidth: 0, hoverOffset: 4 }],
  }
  const pieOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { size: 11 }, padding: 12, boxWidth: 10 } } } }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`স্বাগতম, ${user?.name?.split(' ')[0]}! 👋`}
        desc={`${monthName(month)} ${year} — আর্থিক সারাংশ`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="মোট ব্যালেন্স" value={fmt(data.total_balance)} icon="💰" color="bg-primary-50 dark:bg-primary-900/20 text-primary-600" />
        <StatCard label="মাসিক আয়"    value={fmt(data.total_income)}  icon="📈" color="bg-success-50 dark:bg-success-900/20 text-success-600" sub={`${data.income_count || 0} টি লেনদেন`} />
        <StatCard label="মাসিক খরচ"   value={fmt(data.total_expense)} icon="📉" color="bg-danger-50 dark:bg-danger-900/20 text-danger-600"   sub={`${data.expense_count || 0} টি লেনদেন`} />
        <StatCard label="সঞ্চয়"        value={fmt(data.net_savings)}   icon="🏦" color="bg-warning-50 dark:bg-warning-900/20 text-warning-600" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-5 gap-4 mb-6">
        <div className="card p-5 lg:col-span-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">মাসিক আয় বনাম খরচ</h3>
          <div className="h-52"><Bar data={barData} options={barOpts} /></div>
        </div>
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">ক্যাটাগরি অনুযায়ী খরচ</h3>
          {catExpenses.length > 0
            ? <div className="h-52"><Doughnut data={pieData} options={pieOpts} /></div>
            : <div className="h-52 flex items-center justify-center text-gray-400 text-sm">এই মাসে খরচের তথ্য নেই</div>
          }
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">সাম্প্রতিক লেনদেন</h3>
          <Link to="/search" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">সব দেখুন →</Link>
        </div>
        {(data.recent_transactions || []).length === 0
          ? <div className="py-12 text-center text-gray-400 text-sm">কোনো লেনদেন নেই</div>
          : (data.recent_transactions || []).map(txn => (
            <div key={txn.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${txn.type === 'income' ? 'bg-success-50 dark:bg-success-900/20' : 'bg-danger-50 dark:bg-danger-900/20'}`}>
                {txn.type === 'income' ? '↑' : '↓'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{txn.note || txn.category_name_bn || txn.category_name || 'লেনদেন'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{txn.category_name_bn || txn.category_name} · {formatDate(txn.date)}</p>
              </div>
              <AmountBadge type={txn.type} amount={txn.amount} currency={currency} />
            </div>
          ))
        }
      </div>
    </div>
  )
}
