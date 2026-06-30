import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/common'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try { await login(data); navigate('/') }
    catch {} finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl text-white text-2xl font-bold mb-4">₳</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance Tracker</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">আপনার অ্যাকাউন্টে লগইন করুন</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">ইমেইল</label>
              <input className="input" type="email" placeholder="আপনার ইমেইল" autoComplete="email"
                {...register('email', { required: 'ইমেইল দিন', pattern: { value: /\S+@\S+\.\S+/, message: 'সঠিক ইমেইল দিন' } })} />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">পাসওয়ার্ড</label>
              <div className="relative">
                <input className="input pr-10" type={showPw ? 'text' : 'password'} placeholder="পাসওয়ার্ড" autoComplete="current-password"
                  {...register('password', { required: 'পাসওয়ার্ড দিন' })} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline dark:text-primary-400">পাসওয়ার্ড ভুলে গেছেন?</Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Spinner size="sm" /> : 'লগইন'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            অ্যাকাউন্ট নেই?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">নিবন্ধন করুন</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
