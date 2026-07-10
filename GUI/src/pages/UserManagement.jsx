import { useEffect, useState } from 'react'
import authApi from '../api/authApi'
import { useAuthStore } from '../store/authStore'
import CreateUserModal from '../components/auth/CreateUserModal'
import CreateRoleModal from '../components/auth/CreateRoleModal'
import ResetPasswordModal from '../components/auth/ResetPasswordModal'

const UserManagement = () => {
  const permissions = useAuthStore((state) => state.permissions)
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null)

  const canCreateUser = permissions.includes('user:create')
  const canDeleteUser = permissions.includes('user:delete')
  const canUpdateUserRole = permissions.includes('user:update-role')
  const canResetPassword = permissions.includes('user:reset-password')
  const canCreateRole = permissions.includes('role:create')

  const loadData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [usersRes, rolesRes] = await Promise.all([authApi.listUsers(), authApi.listRoles()])
      setUsers(usersRes.data.data || [])
      setRoles(rolesRes.data.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users and roles')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRoleChange = async (username, newRole) => {
    try {
      await authApi.updateUserRole(username, newRole)
      loadData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role')
    }
  }

  const handleDelete = async (username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return
    try {
      await authApi.deleteUser(username)
      loadData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user')
    }
  }

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      <h1 className='text-2xl font-bold text-gray-900 mb-6'>User & Role Management</h1>

      {error && <p className='mb-4 text-sm text-red-600'>{error}</p>}

      <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-gray-900'>Users</h2>
          {canCreateUser && (
            <button
              onClick={() => setIsCreateUserOpen(true)}
              className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm'
            >
              + Create User
            </button>
          )}
        </div>

        {isLoading
          ? (
            <div className='animate-pulse space-y-3'>
              <div className='h-10 bg-gray-200 rounded' />
              <div className='h-10 bg-gray-200 rounded' />
            </div>
            )
          : (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead>
                  <tr>
                    <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>
                      Username
                    </th>
                    <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>
                      Role
                    </th>
                    <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>
                      Status
                    </th>
                    <th className='px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {users.map((u) => (
                    <tr key={u.username}>
                      <td className='px-4 py-3 text-sm text-gray-900'>{u.username}</td>
                      <td className='px-4 py-3 text-sm'>
                        {canUpdateUserRole
                          ? (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.username, e.target.value)}
                              className='border border-gray-300 rounded-md px-2 py-1 text-sm'
                            >
                              {roles.map((r) => (
                                <option key={r.roleName} value={r.roleName}>
                                  {r.roleName}
                                </option>
                              ))}
                            </select>
                            )
                          : (
                            <span className='inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded'>
                              {u.role}
                            </span>
                            )}
                      </td>
                      <td className='px-4 py-3 text-sm'>
                        {u.mustChangePassword
                          ? (
                            <span className='inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded'>
                              Must change password
                            </span>
                            )
                          : (
                            <span className='inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded'>
                              Active
                            </span>
                            )}
                      </td>
                      <td className='px-4 py-3 text-sm text-right space-x-3 whitespace-nowrap'>
                        {canResetPassword && (
                          <button
                            onClick={() => setResetPasswordTarget(u.username)}
                            className='text-blue-600 hover:text-blue-800'
                          >
                            Reset Password
                          </button>
                        )}
                        {canDeleteUser && (
                          <button
                            onClick={() => handleDelete(u.username)}
                            className='text-red-600 hover:text-red-800'
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
      </div>

      <div className='bg-white rounded-lg shadow-md p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-gray-900'>Roles</h2>
          {canCreateRole && (
            <button
              onClick={() => setIsCreateRoleOpen(true)}
              className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm'
            >
              + Create Role
            </button>
          )}
        </div>

        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-gray-200'>
            <thead>
              <tr>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>
                  Role Name
                </th>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>
                  Permissions
                </th>
                <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>
                  Type
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {roles.map((r) => (
                <tr key={r.roleName}>
                  <td className='px-4 py-3 text-sm text-gray-900 font-medium'>{r.roleName}</td>
                  <td className='px-4 py-3 text-sm text-gray-600'>
                    {r.permissions.length} permissions
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    {r.isSystemRole
                      ? (
                        <span className='inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded'>
                          System
                        </span>
                        )
                      : (
                        <span className='inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded'>
                          Custom
                        </span>
                        )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        onUserCreated={loadData}
        roles={roles}
      />
      <CreateRoleModal
        isOpen={isCreateRoleOpen}
        onClose={() => setIsCreateRoleOpen(false)}
        onRoleCreated={loadData}
      />
      <ResetPasswordModal
        isOpen={!!resetPasswordTarget}
        username={resetPasswordTarget}
        onClose={() => setResetPasswordTarget(null)}
        onPasswordReset={loadData}
      />
    </div>
  )
}

export default UserManagement
