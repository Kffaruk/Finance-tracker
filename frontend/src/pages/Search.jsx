import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { transactionAPI, categoryAPI } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { PageHeader, Spinner } from '../components/common'
import TransactionList from '../components/transactions/TransactionList'
import { useEffect } from 'react'

export default function Search() {
  const { user } = useAuth()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => { categoryAPI.getAll().then(r => setCategories(r.data.data)).catch(() => {}) }, [])

  const onSearch = async (data) => {
    setLoading(true)
    const params = {}
    if (data.start_date) params.start_date = data.start_date
    if (data.end_date) params.end_date = data.end_date
    if (data.category_id) params.category_id = data.category_id
    if (data.type) params.type = data.type
    if (data.keyword) params.keyword = data.keyword
    if (data.min_amount) params.min_amount = data.min_amount
    if (data.max_amount) params.max_amount = data.max_amount
    try {
      const r = await transactionAPI.getAll(params)
      setResults(r.data.data)
    } catch {} finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    try { await transactionAPI.delete(id); setResults(prev => prev.filter(t => t.id !== id)) } catch {}
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="অনুসন্ধান ও ফিল্টার" desc="তারিখ, ক্যাটাগরি বা পরিমাণ অনুযায়ী খুঁজুন" />

      <form onSubmit={handleSubmit(onSearch)} className="card p-5 mb-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">শুরুর তারিখ</label><input className="input" type="date" {...register('start_date')} /></div>
          <div><label className="label">শেষের তারিখ</label><input className="input" type="date" {...register('end_date')} /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">ক্যাটাগরি</label>
            <select className="input" {...register('category_id')}>
              <option value="">সব</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name_bn || c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">ধরন</label>
            <select className="input" {...register('type')}>
              <option value="">সব</option>
              <option value="income">আয়</option>
              <option value="expense">খরচ</option>
            </select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="label">সর্বনিম্ন পরিমাণ</label><input className="input" type="number" placeholder="0" {...register('min_amount')} /></div>
          <div><label className="label">সর্বোচ্চ পরিমাণ</label><input className="input" type="number" placeholder="যেকোনো" {...register('max_amount')} /></div>
        </div>
        <div>
          <label className="label">কীওয়ার্ড</label>
          <input className="input" placeholder="নোটে অনুসন্ধান করুন..." {...register('keyword')} />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? <Spinner size="sm" /> : '🔍 খুঁজুন'}
          </button>
          <button type="button" onClick={() => { reset(); setResults(null) }} className="btn-secondary">রিসেট</button>
        </div>
      </form>

      {results && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{results.length} টি ফলাফল পাওয়া গেছে</p>
          <TransactionList items={results} currency={user?.currency} onEdit={() => {}} onDelete={handleDelete} />
        </>
      )}
    </div>
  )
}
