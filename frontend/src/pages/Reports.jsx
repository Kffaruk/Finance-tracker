import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js'
import { reportAPI, exportAPI } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { useDownload } from '../hooks/useApi'
import { formatCurrency, currentMonth, monthName } from '../utils/helpers'
import { PageHeader, Spinner } from '../components/common'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const PERIODS = [
  { key: 'daily',   label: 'দৈনিক' },
  { key: 'weekly',  label: 'সাপ্তাহিক' },
  { key: 'monthly', label: 'মাসিক' },
  { key: 'yearly',  label: 'বার্ষিক' },
]

export default function Reports() {
  const { user } = useAuth()
  const { month, year } = currentMonth()
  const [period, setPeriod] = useState('monthly')
  const [summary, setSummary] = useState(null)
  const [yearly, setYearly]   = useState([])
  const [loading, setLoading] = useState(true)
  const { download, loading: downloading } = useDownload()
  const currency = user?.currency || 'BDT'
  const isDark = document.documentElement.classList.contains('dark')
  const textColor = isDark ? '#9ca3af' : '#6b7280'
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'

  useEffect(() => {
    setLoading(true)
    Promise.all([
      reportAPI.getSummary({ period, month, year }),
      reportAPI.getYearly({ year }),
    ]).then(([s, y]) => { setSummary(s.data.data); setYearly(y.data.data) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [period])

  const lineData = {
    labels: yearly.map(r => monthName(r.month).slice(0, 3)),
    datasets: [
      { label: 'আয়',  data: yearly.map(r => r.income),  borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)', tension: 0.3, fill: true },
      { label: 'খরচ', data: yearly.map(r => r.expense), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', tension: 0.3, fill: true },
    ],
  }
  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: textColor, font: { size: 11 } }, grid: { display: false } },
      y: { ticks: { color: textColor, font: { size: 11 }, callback: v => formatCurrency(v, currency) }, grid: { color: gridColor } },
    },
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="রিপোর্ট" desc="আপনার আর্থিক বিশ্লেষণ দেখুন ও ডাউনলোড করুন" />

      <div className="flex flex-wrap gap-2 mb-6">
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${period === p.key ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card p-4"><p className="text-xs text-gray-400">মোট আয়</p><p className="text-lg font-bold text-success-600">{formatCurrency(summary?.total_income, currency)}</p></div>
            <div className="card p-4"><p className="text-xs text-gray-400">মোট খরচ</p><p className="text-lg font-bold text-danger-600">{formatCurrency(summary?.total_expense, currency)}</p></div>
            <div className="card p-4"><p className="text-xs text-gray-400">নিট সঞ্চয়</p><p className="text-lg font-bold text-primary-600">{formatCurrency(summary?.net_savings, currency)}</p></div>
            <div className="card p-4"><p className="text-xs text-gray-400">মোট লেনদেন</p><p className="text-lg font-bold text-gray-900 dark:text-white">{(summary?.income_count || 0) + (summary?.expense_count || 0)}</p></div>
          </div>

          <div className="card p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">মাসিক আয় বনাম খরচ ({year})</h3>
            <div className="h-64"><Line data={lineData} options={lineOpts} /></div>
          </div>

          {summary?.by_category?.length > 0 && (
            <div className="card mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 p-5 pb-3">ক্যাটাগরি অনুযায়ী বিভাজন</h3>
              {summary.by_category.map((c, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 border-t border-gray-50 dark:border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{c.name_bn || c.name}</span>
                  </div>
                  <span className={`text-sm font-medium ${c.type === 'income' ? 'text-success-600' : 'text-danger-600'}`}>{formatCurrency(c.total, currency)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Export */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">রিপোর্ট ডাউনলোড করুন</h3>
            <div className="flex flex-wrap gap-3">
              <button disabled={downloading} onClick={() => download(exportAPI.pdf, { period, month, year }, `report-${year}-${month}.pdf`)} className="btn-secondary">
                {downloading ? <Spinner size="sm" /> : <>📄 PDF ডাউনলোড</>}
              </button>
              <button disabled={downloading} onClick={() => download(exportAPI.excel, { period, month, year }, `report-${year}-${month}.xlsx`)} className="btn-secondary">
                {downloading ? <Spinner size="sm" /> : <>📊 Excel ডাউনলোড</>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
