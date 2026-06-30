import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { transactionAPI } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { PageHeader, Modal, Spinner } from '../components/common'
import TransactionForm from '../components/transactions/TransactionForm'
import TransactionList from '../components/transactions/TransactionList'

export default function Income() {
  const { user } = useAuth()
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    transactionAPI.getAll({ type: 'income', limit: 50 })
      .then(r => setItems(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => { setEditing(null); setModalOpen(true) }
  const openEdit = (txn) => { setEditing(txn); setModalOpen(true) }

  const handleSubmit = async (formData) => {
    setSaving(true)
    try {
      if (editing) await transactionAPI.update(editing.id, formData)
      else await transactionAPI.create(formData)
      toast.success(editing ? 'আয় আপডেট হয়েছে।' : 'আয় যোগ হয়েছে।')
      setModalOpen(false)
      load()
    } catch {} finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await transactionAPI.delete(id); toast.success('আয় মুছে গেছে।'); load() } catch {}
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="আয় ব্যবস্থাপনা"
        desc="আপনার সকল আয়ের উৎস ট্র্যাক করুন"
        action={
          <button onClick={openNew} className="btn bg-success-600 hover:bg-success-700 text-white">
            <span>+</span> নতুন আয়
          </button>
        }
      />

      {loading
        ? <div className="h-64 flex items-center justify-center"><Spinner size="lg" /></div>
        : <TransactionList items={items} currency={user?.currency} onEdit={openEdit} onDelete={handleDelete} />
      }

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'আয় সম্পাদনা' : 'নতুন আয় যোগ করুন'}>
        <TransactionForm type="income" initial={editing} onSubmit={handleSubmit} loading={saving} />
      </Modal>
    </div>
  )
}
