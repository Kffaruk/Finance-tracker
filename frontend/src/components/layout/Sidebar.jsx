import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const NAV = [
  { to: '/',            icon: '⊞', label: 'ড্যাশবোর্ড' },
  { to: '/income',      icon: '↑', label: 'আয়' },
  { to: '/expense',     icon: '↓', label: 'খরচ' },
  { to: '/categories',  icon: '⊕', label: 'ক্যাটাগরি' },
  { to: '/budget',      icon: '◎', label: 'বাজেট' },
  { to: '/reports',     icon: '⊟', label: 'রিপোর্ট' },
  { to: '/search',      icon: '⊙', label: 'খুঁজুন' },
  { to: '/backup',      icon: '⊛', label: 'ব্যাকআপ' },
  { to: '/settings',    icon: '⊗', label: 'সেটিংস' },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <>
      {/* Overlay (mobile) */}
      {open && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={onClose} />}

      <aside className={`fixed inset-y-0 left-0 z-30 w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>

        {/* Brand */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">₳</div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm leading-none">Finance Tracker</p>
              <p className="text-xs text-gray-400 mt-0.5">অর্থ ব্যবস্থাপনা</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="w-5 text-center text-base">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          {/* Dark mode toggle */}
          <button onClick={toggleTheme} className="w-full nav-link justify-between">
            <span className="flex items-center gap-3">
              <span className="w-5 text-center">{theme === 'dark' ? '☀' : '☽'}</span>
              <span>{theme === 'dark' ? 'লাইট মোড' : 'ডার্ক মোড'}</span>
            </span>
            <span className={`w-9 h-5 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200'} relative flex-shrink-0`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </span>
          </button>

          {/* User */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full nav-link text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20">
            <span className="w-5 text-center">⏻</span>
            <span>লগআউট</span>
          </button>
        </div>
      </aside>
    </>
  )
}
