import { useEffect, useState } from 'react'
import authApi from '../api/authApi'
import { useAuthStore } from '../store/authStore'
import CreateUserModal from '../components/auth/CreateUserModal'
import CreateRoleModal from '../components/auth/CreateRoleModal'
import ResetPasswordModal from '../components/auth/ResetPasswordModal'

const UserManagement = () => {
  const permissions = useAuthStore((state) => state.permissions)
  const currentUsername = useAuthStore((state) => state.username)
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
    <div className='mx-auto w-full max-w-[120rem] px-4 py-8 sm:px-6 lg:px-8'>
      <h1 className='text-2xl font-bold text-ink-900 mb-6'>User & Role Management</h1>

      {error && <p className='mb-4 text-sm text-danger-600'>{error}</p>}

      <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-ink-900'>Users</h2>
          {canCreateUser && (
            <button
              onClick={() => setIsCreateUserOpen(true)}
              className='px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 transition-colors text-sm'
            >
              + Create User
            </button>
          )}
        </div>

        {isLoading
          ? (
            <div className='animate-pulse space-y-3'>
              <div className='h-10 bg-ink-200 rounded' />
              <div className='h-10 bg-ink-200 rounded' />
            </div>
            )
          : (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-ink-200'>
                <thead>
                  <tr>
                    <th className='px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase'>
                      Username
                    </th>
                    <th className='px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase'>
                      Role
                    </th>
                    <th className='px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase'>
                      Status
                    </th>
                    <th className='px-4 py-2 text-right text-xs font-medium text-ink-500 uppercase'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-ink-100'>
                  {users.map((u) => (
                    <tr key={u.username}>
                      <td className='px-4 py-3 text-sm text-ink-900'>{u.username}</td>
                      <td className='px-4 py-3 text-sm'>
                        {canUpdateUserRole
                          ? (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.username, e.target.value)}
                              className='border border-ink-300 rounded-md px-2 py-1 text-sm'
                            >
                              {roles.map((r) => (
                                <option key={r.roleName} value={r.roleName}>
                                  {r.roleName}
                                </option>
                              ))}
                            </select>
                            )
                          : (
                            <span className='inline-block px-2 py-1 text-xs font-medium bg-info-50 text-info-700 rounded'>
                              {u.role}
                            </span>
                            )}
                      </td>
                      <td className='px-4 py-3 text-sm'>
                        {u.mustChangePassword
                          ? (
                            <span className='inline-block px-2 py-1 text-xs font-medium bg-warn-50 text-warn-700 rounded'>
                              Must change password
                            </span>
                            )
                          : (
                            <span className='inline-block px-2 py-1 text-xs font-medium bg-brand-100 text-brand-800 rounded'>
                              Active
                            </span>
                            )}
                      </td>
                      <td className='px-4 py-3 text-sm text-right space-x-3 whitespace-nowrap'>
                        {canResetPassword && (
                          <button
                            onClick={() => setResetPasswordTarget(u.username)}
                            className='text-brand-700 hover:text-brand-800'
                          >
                            Reset Password
                          </button>
                        )}
                        {canDeleteUser && u.username !== currentUsername && (
                          <button
                            onClick={() => handleDelete(u.username)}
                            className='text-danger-600 hover:text-danger-700'
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
          <h2 className='text-lg font-semibold text-ink-900'>Roles</h2>
          {canCreateRole && (
            <button
              onClick={() => setIsCreateRoleOpen(true)}
              className='px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 transition-colors text-sm'
            >
              + Create Role
            </button>
          )}
        </div>

        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-ink-200'>
            <thead>
              <tr>
                <th className='px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase'>
                  Role Name
                </th>
                <th className='px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase'>
                  Permissions
                </th>
                <th className='px-4 py-2 text-left text-xs font-medium text-ink-500 uppercase'>
                  Type
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-ink-100'>
              {roles.map((r) => (
                <tr key={r.roleName}>
                  <td className='px-4 py-3 text-sm text-ink-900 font-medium'>{r.roleName}</td>
                  <td className='px-4 py-3 text-sm text-ink-600'>
                    {r.permissions.length} permissions
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    {r.isSystemRole
                      ? (
                        <span className='inline-block px-2 py-1 text-xs font-medium bg-ink-100 text-ink-700 rounded'>
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
