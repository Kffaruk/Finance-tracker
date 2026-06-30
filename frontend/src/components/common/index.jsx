// ── Spinner ──
export const Spinner = ({ size = 'md' }) => {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size]
  return <div className={`${s} border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
}

// ── Empty State ──
export const Empty = ({ icon = '📭', title = 'কোনো তথ্য নেই', desc = '' }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-5xl mb-4">{icon}</div>
    <p className="font-medium text-gray-700 dark:text-gray-300">{title}</p>
    {desc && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{desc}</p>}
  </div>
)

// ── Modal ──
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null
  const w = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${w} bg-white dark:bg-gray-900 rounded-2xl shadow-xl animate-slide-up max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ── Confirm Dialog ──
export const Confirm = ({ open, onClose, onConfirm, title, desc, loading }) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">{desc}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onClose} className="btn-secondary">বাতিল</button>
      <button onClick={onConfirm} disabled={loading} className="btn-danger">
        {loading ? <Spinner size="sm" /> : 'হ্যাঁ, মুছুন'}
      </button>
    </div>
  </Modal>
)

// ── Select ──
export const Select = ({ label, error, ...props }) => (
  <div>
    {label && <label className="label">{label}</label>}
    <select className="input" {...props} />
    {error && <p className="form-error">{error}</p>}
  </div>
)

// ── Input Field ──
export const Field = ({ label, error, ...props }) => (
  <div>
    {label && <label className="label">{label}</label>}
    <input className="input" {...props} />
    {error && <p className="form-error">{error}</p>}
  </div>
)

// ── Progress Bar ──
export const ProgressBar = ({ value, max, color = 'bg-primary-500' }) => {
  const p = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const barColor = p >= 100 ? 'bg-danger-500' : p >= 80 ? 'bg-warning-500' : color
  return (
    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${p}%` }} />
    </div>
  )
}

// ── Amount Badge ──
export const AmountBadge = ({ type, amount, currency = 'BDT' }) => {
  const fmt = `${currency === 'BDT' ? '৳' : '$'}${parseFloat(amount).toLocaleString()}`
  return type === 'income'
    ? <span className="font-semibold text-success-600 dark:text-success-400">+{fmt}</span>
    : <span className="font-semibold text-danger-600 dark:text-danger-400">−{fmt}</span>
}

// ── Page Header ──
export const PageHeader = ({ title, desc, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
      {desc && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>}
    </div>
    {action}
  </div>
)
