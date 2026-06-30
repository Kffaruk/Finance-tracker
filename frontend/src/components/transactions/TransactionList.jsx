import { useState } from 'react'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { Empty, AmountBadge, Confirm } from '../common'

export default function TransactionList({ items, currency = 'BDT', onEdit, onDelete, loading }) {
  const [confirmId, setConfirmId] = useState(null)

  if (!loading && (!items || items.length === 0)) {
    return <Empty icon="🧾" title="কোনো লেনদেন নেই" desc="নতুন লেনদেন যোগ করে শুরু করুন" />
  }

  return (
    <div className="card overflow-hidden">
      <div className="hidden sm:grid grid-cols-[1fr_140px_110px_110px_70px] gap-3 px-5 py-3 border-b border-gray-100 dark:border-gray-800 text-xs font-medium text-gray-400">
        <span>বিবরণ</span><span>ক্যাটাগরি</span><span>তারিখ</span><span className="text-right">পরিমাণ</span><span></span>
      </div>
      {items.map(txn => (
        <div key={txn.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_110px_110px_70px] gap-3 items-center px-5 py-3.5 border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${txn.type === 'income' ? 'bg-success-50 dark:bg-success-900/20' : 'bg-danger-50 dark:bg-danger-900/20'}`}>
              {txn.type === 'income' ? '↑' : '↓'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{txn.note || txn.category_name_bn || txn.category_name || '—'}</p>
              <p className="text-xs text-gray-400 sm:hidden">{txn.category_name_bn || txn.category_name} · {formatDate(txn.date)}</p>
            </div>
          </div>
          <span className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 truncate">{txn.category_name_bn || txn.category_name || '—'}</span>
          <span className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">{formatDate(txn.date)}</span>
          <div className="text-right"><AmountBadge type={txn.type} amount={txn.amount} currency={currency} /></div>
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => onEdit(txn)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-600 transition" title="সম্পাদনা">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={() => setConfirmId(txn.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-danger-600 transition" title="মুছুন">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
            </button>
          </div>
        </div>
      ))}

      <Confirm
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => { onDelete(confirmId); setConfirmId(null) }}
        title="লেনদেন মুছবেন?"
        desc="এই লেনদেনটি স্থায়ীভাবে মুছে যাবে। এই কাজটি ফিরিয়ে আনা যাবে না।"
      />
    </div>
  )
}
