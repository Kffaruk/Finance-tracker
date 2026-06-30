import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { categoryAPI, accountAPI } from '../../api/services'
import { PAYMENT_METHODS } from '../../utils/helpers'
import { Spinner, Field } from '../common'

export default function TransactionForm({ type, initial, onSubmit, loading }) {
  const [categories, setCategories] = useState([])
  const [accounts,   setAccounts]   = useState([])
  const [receipt,    setReceipt]    = useState(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: initial || { date: new Date().toISOString().split('T')[0], payment_method: 'নগদ' },
  })

  useEffect(() => {
    categoryAPI.getAll({ type }).then(r => setCategories(r.data.data)).catch(() => {})
    accountAPI.getAll().then(r => setAccounts(r.data.data)).catch(() => {})
    if (initial) reset({ ...initial, date: initial.date?.split('T')[0] })
  }, [initial, type])

  const submit = (data) => {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => v != null && fd.append(k, v))
    fd.set('type', type)
    if (receipt) fd.append('receipt', receipt)
    onSubmit(fd)
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      {/* Amount */}
      <div>
        <label className="label">পরিমাণ (টাকা) *</label>
        <input className="input text-lg font-semibold" type="number" step="0.01" min="0.01" placeholder="0.00"
          {...register('amount', { required: 'পরিমাণ দিন', min: { value: 0.01, message: 'পরিমাণ ০ এর বেশি হতে হবে' } })} />
        {errors.amount && <p className="form-error">{errors.amount.message}</p>}
      </div>

      {/* Account */}
      <div>
        <label className="label">অ্যাকাউন্ট *</label>
        <select className="input" {...register('account_id', { required: 'অ্যাকাউন্ট বেছে নিন' })}>
          <option value="">— বেছে নিন —</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {errors.account_id && <p className="form-error">{errors.account_id.message}</p>}
      </div>

      {/* Category */}
      <div>
        <label className="label">ক্যাটাগরি</label>
        <select className="input" {...register('category_id')}>
          <option value="">— বেছে নিন —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name_bn || c.name}</option>)}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="label">তারিখ *</label>
        <input className="input" type="date" {...register('date', { required: 'তারিখ দিন' })} />
        {errors.date && <p className="form-error">{errors.date.message}</p>}
      </div>

      {/* Payment method (expense only) */}
      {type === 'expense' && (
        <div>
          <label className="label">পেমেন্ট পদ্ধতি</label>
          <select className="input" {...register('payment_method')}>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {/* Note */}
      <div>
        <label className="label">নোট</label>
        <textarea className="input resize-none h-20" placeholder="অতিরিক্ত তথ্য (ঐচ্ছিক)" {...register('note')} />
      </div>

      {/* Receipt (expense only) */}
      {type === 'expense' && (
        <div>
          <label className="label">রিসিট আপলোড (ঐচ্ছিক)</label>
          <input className="input py-2" type="file" accept="image/*,.pdf"
            onChange={e => setReceipt(e.target.files[0])} />
          <p className="text-xs text-gray-400 mt-1">সর্বোচ্চ ৫ MB — jpg, png, pdf</p>
        </div>
      )}

      <div className="pt-2">
        <button type="submit" disabled={loading} className={`btn w-full py-3 ${type === 'income' ? 'bg-success-600 hover:bg-success-700 text-white' : 'btn-danger'}`}>
          {loading ? <Spinner size="sm" /> : (initial ? 'আপডেট করুন' : `${type === 'income' ? 'আয়' : 'খরচ'} যোগ করুন`)}
        </button>
      </div>
    </form>
  )
}
