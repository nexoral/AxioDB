import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import authApi from '../../api/authApi'

const UserAvatarMenu = ({ isOpen, onToggle, onClose }) => {
  const navigate = useNavigate()
  const { username, role, clearSession } = useAuthStore((state) => state)

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

  return (
    <div className='relative'>
      <button
        onClick={onToggle}
        className='flex items-center space-x-2 text-blue-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors'
      >
        <span className='w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white uppercase'>
          {username ? username.charAt(0) : '?'}
        </span>
        <span className='hidden sm:inline'>{username}</span>
      </button>

      {isOpen && (
        <div className='absolute right-0 mt-2 w-52 bg-white rounded-md shadow-lg py-1 z-50 animate-fadeIn'>
          <div className='px-4 py-2 border-b border-gray-100'>
            <p className='text-sm font-medium text-gray-900 truncate'>{username}</p>
            <p className='text-xs text-gray-500'>{role}</p>
          </div>
          <button
            onClick={handleChangePassword}
            className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
          >
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100'
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default UserAvatarMenu
