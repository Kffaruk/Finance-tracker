import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authAPI } from '../api/services'
import { Spinner } from '../components/common'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const pw = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authAPI.resetPassword({ token, password: data.password })
      toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে! এখন লগইন করুন।')
      navigate('/login')
    } catch {} finally { setLoading(false) }
  }

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">অবৈধ রিসেট লিঙ্ক।</p>
        <Link to="/forgot-password" className="text-primary-600 hover:underline text-sm mt-2 inline-block">আবার চেষ্টা করুন</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl text-white text-2xl font-bold mb-4">₳</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">নতুন পাসওয়ার্ড সেট করুন</h1>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">নতুন পাসওয়ার্ড</label>
              <input className="input" type="password" placeholder="কমপক্ষে ৬ অক্ষর"
                {...register('password', { required: 'পাসওয়ার্ড দিন', minLength: { value: 6, message: 'কমপক্ষে ৬ অক্ষর' } })} />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">নিশ্চিত করুন</label>
              <input className="input" type="password" placeholder="আবার লিখুন"
                {...register('confirm', { validate: v => v === pw || 'মিলছে না' })} />
              {errors.confirm && <p className="form-error">{errors.confirm.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <Spinner size="sm" /> : 'পাসওয়ার্ড পরিবর্তন করুন'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
