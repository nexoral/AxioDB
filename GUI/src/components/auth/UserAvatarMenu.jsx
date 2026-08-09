import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import authApi from '../../api/authApi'
import { Badge } from '../ui/Feedback'

/**
 * Account menu in the header.
 *
 * Adds outside-click and Escape dismissal - previously the panel only closed on navigation
 * or on a second click of the trigger, so it could sit open over the page indefinitely.
 */
const UserAvatarMenu = ({ isOpen, onToggle, onClose }) => {
  const navigate = useNavigate()
  const { username, role, clearSession } = useAuthStore((state) => state)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) onClose()
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      clearSession()
      onClose()
      navigate('/login', { replace: true })
    }
  }

  const handleChangePassword = () => {
    onClose()
    navigate('/force-password-change')
  }

  const itemClass =
    'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors'

  return (
    <div className='relative' ref={containerRef}>
      <button
        onClick={onToggle}
        aria-haspopup='menu'
        aria-expanded={isOpen}
        className='flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-300 transition-colors hover:bg-white/10 hover:text-white'
      >
        <span className='flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold uppercase text-white'>
          {username ? username.charAt(0) : '?'}
        </span>
        <span className='hidden sm:inline'>{username}</span>
        <svg
          className={`hidden h-3.5 w-3.5 transition-transform duration-200 sm:block ${isOpen ? 'rotate-180' : ''}`}
          fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5} aria-hidden='true'
        >
          <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
        </svg>
      </button>

      {isOpen && (
        <div
          role='menu'
          className='animate-popIn absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-float'
        >
          <div className='border-b border-ink-100 px-4 py-3'>
            <p className='truncate text-sm font-semibold text-ink-900'>{username}</p>
            <Badge tone='brand' className='mt-1.5'>{role}</Badge>
          </div>

          <button onClick={handleChangePassword} role='menuitem' className={`${itemClass} text-ink-700 hover:bg-ink-50`}>
            <svg className='h-4 w-4 text-ink-400' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} aria-hidden='true'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' />
            </svg>
            Change password
          </button>

          <button onClick={handleLogout} role='menuitem' className={`${itemClass} border-t border-ink-100 text-danger-600 hover:bg-danger-50`}>
            <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2} aria-hidden='true'>
              <path strokeLinecap='round' strokeLinejoin='round' d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default UserAvatarMenu
