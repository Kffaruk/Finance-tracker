import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authAPI } from '../api/services'
import { Spinner } from '../components/common'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try { await authAPI.forgotPassword(data); setSent(true) }
    catch {} finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl text-white text-2xl font-bold mb-4">₳</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">পাসওয়ার্ড ভুলে গেছেন?</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">ইমেইল দিন, রিসেট লিঙ্ক পাঠাবো</p>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📧</div>
              <p className="font-medium text-gray-900 dark:text-white">ইমেইল পাঠানো হয়েছে!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">আপনার ইনবক্স চেক করুন এবং রিসেট লিঙ্কে ক্লিক করুন।</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">ইমেইল</label>
                <input className="input" type="email" placeholder="আপনার ইমেইল"
                  {...register('email', { required: 'ইমেইল দিন', pattern: { value: /\S+@\S+\.\S+/, message: 'সঠিক ইমেইল দিন' } })} />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? <Spinner size="sm" /> : 'রিসেট লিঙ্ক পাঠান'}
              </button>
            </form>
          )}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">← লগইনে ফিরে যান</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
