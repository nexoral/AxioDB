import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import axios from 'axios'
import { DBInfoStore } from '../store/store'
import { useAuthStore } from '../store/authStore'
import { BASE_API_URL } from '../config/key'
import UserAvatarMenu from '../components/auth/UserAvatarMenu'

/**
 * App chrome. Slate bar, emerald active state.
 *
 * The previous version had `hidden md:block` navigation with no mobile alternative, so on a
 * phone every destination except the logo was unreachable. This adds a real drawer.
 */
const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/operations', label: 'Operations' },
  { to: '/import', label: 'Import DB' },
  { to: '/users', label: 'Users', permission: 'user:view' },
  { to: '/support', label: 'Support' },
  { to: '/status', label: 'Status' }
]

const Header = () => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { Rootname, setRootname } = DBInfoStore((state) => state)
  const { isAuthenticated, permissions } = useAuthStore((state) => state)
  const location = useLocation()

  useEffect(() => {
    axios
      .get(`${BASE_API_URL}/api/db/databases`)
      .then((response) => {
        if (response.status === 200) {
          setRootname(response.data.data.RootName ?? 'AxioDB')
        }
      })
      .catch(() => {
        // Session may not be ready yet or the caller lacks db:view - ignore here,
        // ProtectedRoute/page-level error handling covers the user-facing message.
      })
    // eslint-disable-next-line
  }, [])

  // Any navigation closes whatever was open.
  useEffect(() => {
    setIsUserDropdownOpen(false)
    setIsMobileOpen(false)
  }, [location.pathname])

  const visibleNav = NAV.filter((item) => !item.permission || permissions.includes(item.permission))

  const linkClass = ({ isActive }) =>
    `relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-white/10 text-white'
        : 'text-ink-300 hover:bg-white/5 hover:text-white'
    }`

  return (
    <header className='sticky top-0 z-40 border-b border-white/10 bg-ink-900/95 backdrop-blur supports-[backdrop-filter]:bg-ink-900/80'>
      <nav className='mx-auto w-full max-w-[120rem] px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between gap-4'>
          <div className='flex min-w-0 items-center gap-8'>
            <Link to='/' className='flex shrink-0 items-center gap-2.5'>
              <img src='/AXioDB.png' alt='' className='h-8 w-8 rounded-lg' />
              <span className='truncate text-base font-bold tracking-tight text-white'>
                {Rootname}
                <span className='ml-1.5 font-normal text-ink-400'>Control Hub</span>
              </span>
            </Link>

            <div className='hidden items-center gap-1 md:flex'>
              {visibleNav.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && (
                        <span className='absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-400' />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {isAuthenticated && (
              <UserAvatarMenu
                isOpen={isUserDropdownOpen}
                onToggle={() => setIsUserDropdownOpen((open) => !open)}
                onClose={() => setIsUserDropdownOpen(false)}
              />
            )}

            <button
              type='button'
              onClick={() => setIsMobileOpen((open) => !open)}
              aria-label={isMobileOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={isMobileOpen}
              className='rounded-lg p-2 text-ink-300 transition-colors hover:bg-white/10 hover:text-white md:hidden'
            >
              <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d={isMobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>

        {isMobileOpen && (
          <div className='animate-fadeIn border-t border-white/10 py-3 md:hidden'>
            <div className='stagger flex flex-col gap-1'>
              {visibleNav.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
