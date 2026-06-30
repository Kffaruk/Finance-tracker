import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authAPI } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { CURRENCIES } from '../utils/helpers'
import { PageHeader, Spinner } from '../components/common'

export default function Settings() {
  const { user, updateUser } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  const profileForm = useForm({ defaultValues: { name: user?.name, currency: user?.currency || 'BDT' } })
  const pwForm = useForm()

  const onProfileSubmit = async (data) => {
    setSavingProfile(true)
    try {
      const { data: res } = await authAPI.updateProfile(data)
      updateUser(res.data)
      toast.success('প্রোফাইল আপডেট হয়েছে।')
    } catch {} finally { setSavingProfile(false) }
  }

  const onPwSubmit = async (data) => {
    setSavingPw(true)
    try {
      await authAPI.changePassword(data)
      toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে।')
      pwForm.reset()
    } catch {} finally { setSavingPw(false) }
  }

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <PageHeader title="সেটিংস" desc="অ্যাকাউন্ট ও পছন্দ পরিচালনা করুন" />

      {/* Appearance */}
      <div className="card p-5">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">প্রদর্শন</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">ডার্ক মোড</p>
            <p className="text-xs text-gray-400">চোখের আরামের জন্য থিম পরিবর্তন করুন</p>
          </div>
          <button onClick={toggleTheme} className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className="card p-5">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">প্রোফাইল তথ্য</h3>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <label className="label">নাম</label>
            <input className="input" {...profileForm.register('name')} />
          </div>
          <div>
            <label className="label">ইমেইল</label>
            <input className="input bg-gray-50 dark:bg-gray-800" value={user?.email} disabled />
          </div>
          <div>
            <label className="label">মুদ্রা</label>
            <select className="input" {...profileForm.register('currency')}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? <Spinner size="sm" /> : 'সংরক্ষণ করুন'}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="card p-5">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">পাসওয়ার্ড পরিবর্তন</h3>
        <form onSubmit={pwForm.handleSubmit(onPwSubmit)} className="space-y-4">
          <div>
            <label className="label">বর্তমান পাসওয়ার্ড</label>
            <input className="input" type="password" {...pwForm.register('currentPassword', { required: true })} />
          </div>
          <div>
            <label className="label">নতুন পাসওয়ার্ড</label>
            <input className="input" type="password" {...pwForm.register('newPassword', { required: true, minLength: 6 })} />
          </div>
          <button type="submit" disabled={savingPw} className="btn-secondary">
            {savingPw ? <Spinner size="sm" /> : 'পাসওয়ার্ড পরিবর্তন করুন'}
          </button>
        </form>
      </div>
    </div>
  )
}
