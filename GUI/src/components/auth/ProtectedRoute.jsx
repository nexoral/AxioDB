import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const ForbiddenNotice = () => (
  <div className='max-w-3xl mx-auto px-4 py-16 text-center'>
    <h1 className='text-2xl font-bold text-gray-900 mb-2'>Access Denied</h1>
    <p className='text-gray-600'>
      Your role does not have permission to view this page.
    </p>
  </div>
)

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { isAuthenticated, isLoading, mustChangePassword, permissions } = useAuthStore(
    (state) => state
  )
  const location = useLocation()

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full' />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  if (mustChangePassword && location.pathname !== '/force-password-change') {
    return <Navigate to='/force-password-change' replace />
  }

  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return <ForbiddenNotice />
  }

  return children
}

export default ProtectedRoute
