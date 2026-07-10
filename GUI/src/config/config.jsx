import { useEffect } from 'react'
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'
import Footer from '../layout/Footer'
import Header from '../layout/Header'
import Dashboard from '../pages/Dashboard'
import Databases from '../pages/Databases'
import Collections from '../pages/Collections'

import Documents from '../pages/Documents'
import ApiReference from '../pages/ApiReference'
import Support from '../pages/Support'
import Status from '../pages/Status'
import Import from '../pages/Import'
import Login from '../pages/Login'
import ForcePasswordChange from '../pages/ForcePasswordChange'
import UserManagement from '../pages/UserManagement'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import authApi from '../api/authApi'
import { useAuthStore } from '../store/authStore'

const AUTH_FREE_LAYOUT_PATHS = ['/login', '/force-password-change']

/**
 * Main application configuration component
 * Sets up routing and overall layout structure
 */
function MainConfig () {
  const location = useLocation()
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)
  const showLayout = !AUTH_FREE_LAYOUT_PATHS.includes(location.pathname)

  useEffect(() => {
    authApi
      .fetchMe()
      .then((response) => {
        const { username, role, permissions, mustChangePassword } = response.data.data
        setSession({ username, role, permissions, mustChangePassword })
      })
      .catch(() => {
        clearSession()
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      {showLayout && <Header />}
      <main className='flex-grow'>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/force-password-change' element={<ForcePasswordChange />} />
          <Route path='/' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path='/operations' element={<ProtectedRoute><Databases /></ProtectedRoute>} />
          <Route path='/collections' element={<ProtectedRoute><Collections /></ProtectedRoute>} />
          <Route path='/documents' element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path='/api' element={<ProtectedRoute><ApiReference /></ProtectedRoute>} />
          <Route path='/support' element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path='/status' element={<ProtectedRoute><Status /></ProtectedRoute>} />
          <Route path='/import' element={<ProtectedRoute><Import /></ProtectedRoute>} />
          <Route
            path='/collections/documents'
            element={<ProtectedRoute><Documents /></ProtectedRoute>}
          />
          <Route
            path='/users'
            element={
              <ProtectedRoute requiredPermission='user:view'>
                <UserManagement />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {showLayout && <Footer />}
    </div>
  )
}

function AppRoot () {
  return (
    <Router>
      <MainConfig />
    </Router>
  )
}

export default AppRoot
