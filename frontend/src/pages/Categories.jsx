import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { categoryAPI } from '../api/services'
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../utils/helpers'
import { PageHeader, Modal, Spinner, Empty, Confirm } from '../components/common'

export default function Categories() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('expense')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { color: CATEGORY_COLORS[0], icon: CATEGORY_ICONS[0] },
  })
  const selectedColor = watch('color')
  const selectedIcon = watch('icon')

  const load = useCallback(() => {
    setLoading(true)
    categoryAPI.getAll().then(r => setItems(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const openNew = () => { reset({ type: tab, color: CATEGORY_COLORS[0], icon: CATEGORY_ICONS[0] }); setModalOpen(true) }

  const submit = async (data) => {
    setSaving(true)
    try {
      await categoryAPI.create(data)
      toast.success('ক্যাটাগরি তৈরি হয়েছে।')
      setModalOpen(false)
      load()
    } catch {} finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try { await categoryAPI.delete(deleteId); toast.success('ক্যাটাগরি মুছে গেছে।'); load() }
    catch {} finally { setDeleteId(null) }
  }

  const filtered = items.filter(c => c.type === tab)

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="ক্যাটাগরি"
        desc="আয়/খরচের জন্য ক্যাটাগরি পরিচালনা করুন"
        action={<button onClick={openNew} className="btn-primary"><span>+</span> নতুন ক্যাটাগরি</button>}
      />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('expense')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'expense' ? 'bg-danger-50 dark:bg-danger-900/20 text-danger-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>খরচ ক্যাটাগরি</button>
        <button onClick={() => setTab('income')} className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'income' ? 'bg-success-50 dark:bg-success-900/20 text-success-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>আয় ক্যাটাগরি</button>
      </div>

      {loading
        ? <div className="h-48 flex items-center justify-center"><Spinner size="lg" /></div>
        : filtered.length === 0
          ? <Empty icon="🏷️" title="কোনো ক্যাটাগরি নেই" />
          : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(cat => (
                <div key={cat.id} className="card p-4 flex items-center gap-3 group relative">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0" style={{ backgroundColor: cat.color }}>
                    {cat.name?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{cat.name_bn || cat.name}</p>
                    {cat.is_default && <span className="text-xs text-gray-400">ডিফল্ট</span>}
                  </div>
                  {!cat.is_default && (
                    <button onClick={() => setDeleteId(cat.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-danger-600 transition">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
      }

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="নতুন ক্যাটাগরি">
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div>
            <label className="label">নাম (ইংরেজি) *</label>
            <input className="input" placeholder="e.g. Groceries" {...register('name', { required: 'নাম দিন' })} />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">নাম (বাংলা)</label>
            <input className="input" placeholder="যেমন: মুদি বাজার" {...register('name_bn')} />
          </div>
          <div>
            <label className="label">ধরন *</label>
            <select className="input" {...register('type', { required: true })}>
              <option value="expense">খরচ</option>
              <option value="income">আয়</option>
            </select>
          </div>
          <div>
            <label className="label">রং</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setValue('color', c)}
                  className="w-8 h-8 rounded-full border-2 transition"
                  style={{ backgroundColor: c, borderColor: selectedColor === c ? '#000' : 'transparent' }} />
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full py-3">
            {saving ? <Spinner size="sm" /> : 'তৈরি করুন'}
          </button>
        </form>
      </Modal>

      <Confirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="ক্যাটাগরি মুছবেন?" desc="এই ক্যাটাগরি স্থায়ীভাবে মুছে যাবে।" />
    </div>
  )
}
