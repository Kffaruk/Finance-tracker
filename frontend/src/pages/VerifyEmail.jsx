import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authAPI } from '../api/services'
import { Spinner } from '../components/common'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    if (!token) { setStatus('error'); return }
    authAPI.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="card p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Spinner size="lg" />
            <p className="text-gray-600 dark:text-gray-400 mt-4">যাচাই করা হচ্ছে...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">ইমেইল যাচাই হয়েছে!</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">আপনার অ্যাকাউন্ট সক্রিয় হয়ে গেছে।</p>
            <Link to="/login" className="btn-primary mt-6 inline-flex">লগইন করুন</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">যাচাই ব্যর্থ হয়েছে</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">লিঙ্কটি অবৈধ বা মেয়াদোত্তীর্ণ।</p>
            <Link to="/login" className="btn-secondary mt-6 inline-flex">লগইনে ফিরে যান</Link>
          </>
        )}
      </div>
    </div>
  )
}
