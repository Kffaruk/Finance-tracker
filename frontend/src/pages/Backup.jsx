import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { backupAPI } from '../api/services'
import { PageHeader, Spinner, Confirm } from '../components/common'

export default function Backup() {
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [confirmFile, setConfirmFile] = useState(null)
  const fileRef = useRef()

  const handleExport = async () => {
    setExporting(true)
    try {
      const { data } = await backupAPI.export()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('ব্যাকআপ ডাউনলোড হয়েছে।')
    } catch {} finally { setExporting(false) }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) setConfirmFile(file)
  }

  const handleRestore = async () => {
    if (!confirmFile) return
    setRestoring(true)
    try {
      const text = await confirmFile.text()
      const json = JSON.parse(text)
      await backupAPI.restore(json)
      toast.success('ডেটা সফলভাবে পুনরুদ্ধার হয়েছে। পেজ রিলোড হচ্ছে...')
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      toast.error('অবৈধ ব্যাকআপ ফাইল।')
    } finally { setRestoring(false); setConfirmFile(null) }
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="ব্যাকআপ ও রিস্টোর" desc="আপনার ডেটা নিরাপদ রাখুন" />

      <div className="card p-5 mb-6 bg-success-50/50 dark:bg-success-900/10 border-success-100 dark:border-success-900/30">
        <div className="flex items-start gap-3">
          <span className="text-2xl">☁️</span>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Cloud Database সক্রিয়</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">আপনার সব ডেটা Supabase PostgreSQL এ নিরাপদে সংরক্ষিত। কম্পিউটার নষ্ট হলেও ডেটা হারাবে না — যেকোনো ডিভাইস থেকে লগইন করলেই সব তথ্য পাবেন।</p>
          </div>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-1">ম্যানুয়াল ব্যাকআপ ডাউনলোড</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">আপনার সব লেনদেন, ক্যাটাগরি, বাজেট JSON ফাইলে ডাউনলোড করুন</p>
        <button onClick={handleExport} disabled={exporting} className="btn-primary">
          {exporting ? <Spinner size="sm" /> : <>⬇ ব্যাকআপ ডাউনলোড করুন</>}
        </button>
      </div>

      <div className="card p-5">
        <h3 className="font-medium text-gray-900 dark:text-white mb-1">ব্যাকআপ থেকে পুনরুদ্ধার</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">আগে ডাউনলোড করা JSON ফাইল আপলোড করে ডেটা ফিরিয়ে আনুন</p>
        <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
        <button onClick={() => fileRef.current.click()} className="btn-secondary">📤 ফাইল বেছে নিন</button>
        <p className="text-xs text-warning-600 dark:text-warning-400 mt-3">⚠️ সতর্কতা: পুনরুদ্ধার করলে বর্তমান কাস্টম ক্যাটাগরি ও লেনদেন প্রতিস্থাপিত হবে।</p>
      </div>

      <Confirm
        open={!!confirmFile}
        onClose={() => setConfirmFile(null)}
        onConfirm={handleRestore}
        loading={restoring}
        title="ব্যাকআপ পুনরুদ্ধার করবেন?"
        desc={`"${confirmFile?.name}" থেকে ডেটা পুনরুদ্ধার করা হবে। বর্তমান ডেটা প্রতিস্থাপিত হবে। এগিয়ে যেতে চান?`}
      />
    </div>
  )
}
