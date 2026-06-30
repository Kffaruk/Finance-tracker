import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-primary-600">404</p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">পেজটি খুঁজে পাওয়া যায়নি।</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">হোমে ফিরে যান</Link>
      </div>
    </div>
  )
}
