import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { budgetAPI, categoryAPI } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, currentMonth, monthName, pct } from '../utils/helpers'
import { PageHeader, Modal, Spinner, Empty, ProgressBar } from '../components/common'

export default function Budget() {
  const { user } = useAuth()
  const { month, year } = currentMonth()
  const [budgets, setBudgets]     = useState([])
  const [overview, setOverview]   = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      budgetAPI.getAll({ month, year }),
      budgetAPI.getOverview({ month, year }),
      categoryAPI.getAll({ type: 'expense' }),
    ]).then(([b, o, c]) => {
      setBudgets(b.data.data)
      setOverview(o.data.data)
      setCategories(c.data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => { reset({ month, year, alert_threshold: 80 }); setModalOpen(true) }

  const submit = async (data) => {
    setSaving(true)
    try {
      await budgetAPI.create({ ...data, month, year })
      toast.success('বাজেট সেট হয়েছে।')
      setModalOpen(false)
      load()
    } catch {} finally { setSaving(false) }
  }

  const currency = user?.currency || 'BDT'

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="বাজেট ট্র্যাকার"
        desc={`${monthName(month)} ${year} এর বাজেট পরিকল্পনা`}
        action={<button onClick={openNew} className="btn-primary"><span>+</span> বাজেট সেট করুন</button>}
      />

      {/* Overview */}
      {overview && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="stat-card">
            <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center text-xl">◎</div>
            <div><p className="text-xs text-gray-400">মোট বাজেট</p><p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(overview.total_budget, currency)}</p></div>
          </div>
          <div className="stat-card">
            <div className="w-11 h-11 rounded-xl bg-danger-50 dark:bg-danger-900/20 text-danger-600 flex items-center justify-center text-xl">↓</div>
            <div><p className="text-xs text-gray-400">খরচ হয়েছে</p><p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(overview.total_spent, currency)}</p></div>
          </div>
          <div className="stat-card">
            <div className="w-11 h-11 rounded-xl bg-success-50 dark:bg-success-900/20 text-success-600 flex items-center justify-center text-xl">✓</div>
            <div><p className="text-xs text-gray-400">অবশিষ্ট</p><p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(overview.remaining, currency)}</p></div>
          </div>
        </div>
      )}

      {loading
        ? <div className="h-48 flex items-center justify-center"><Spinner size="lg" /></div>
        : budgets.length === 0
          ? <Empty icon="◎" title="কোনো বাজেট সেট নেই" desc="ক্যাটাগরি অনুযায়ী বাজেট সেট করুন" />
          : (
            <div className="space-y-3">
              {budgets.map(b => {
                const spent = parseFloat(b.spent)
                const amount = parseFloat(b.amount)
                const p = pct(spent, amount)
                const over = spent > amount
                return (
                  <div key={b.id} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{b.category_name_bn || b.category_name}</span>
                        {over && <span className="text-xs px-2 py-0.5 rounded-full bg-danger-50 dark:bg-danger-900/20 text-danger-600">⚠ সীমা ছাড়িয়েছে</span>}
                        {!over && p >= 80 && <span className="text-xs px-2 py-0.5 rounded-full bg-warning-50 dark:bg-warning-900/20 text-warning-600">কাছাকাছি</span>}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(spent, currency)} / {formatCurrency(amount, currency)}</span>
                    </div>
                    <ProgressBar value={spent} max={amount} />
                  </div>
                )
              })}
            </div>
          )
      }

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="নতুন বাজেট">
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div>
            <label className="label">ক্যাটাগরি *</label>
            <select className="input" {...register('category_id', { required: 'ক্যাটাগরি বেছে নিন' })}>
              <option value="">— বেছে নিন —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name_bn || c.name}</option>)}
            </select>
            {errors.category_id && <p className="form-error">{errors.category_id.message}</p>}
          </div>
          <div>
            <label className="label">বাজেট পরিমাণ *</label>
            <input className="input" type="number" step="0.01" placeholder="যেমন: 8000" {...register('amount', { required: 'পরিমাণ দিন', min: 1 })} />
            {errors.amount && <p className="form-error">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="label">সতর্কতা সীমা (%)</label>
            <input className="input" type="number" min="1" max="100" {...register('alert_threshold')} />
            <p className="text-xs text-gray-400 mt-1">এই শতাংশ খরচ হলে ইমেইল পাবেন</p>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full py-3">
            {saving ? <Spinner size="sm" /> : 'বাজেট সেট করুন'}
          </button>
        </form>
      </Modal>
    </div>
  )
}
