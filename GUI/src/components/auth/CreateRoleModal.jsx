import { useEffect, useState } from 'react'
import authApi from '../../api/authApi'

const CreateRoleModal = ({ isOpen, onClose, onRoleCreated }) => {
  const [roleName, setRoleName] = useState('')
  const [permissionCatalogue, setPermissionCatalogue] = useState([])
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return

    setIsLoadingPermissions(true)
    authApi
      .listPermissions()
      .then((response) => setPermissionCatalogue(response.data.data || []))
      .catch(() => setError('Failed to load permission catalogue'))
      .finally(() => setIsLoadingPermissions(false))
  }, [isOpen])

  const handleClose = () => {
    setRoleName('')
    setSelectedPermissions([])
    setError('')
    setIsSubmitting(false)
    onClose()
  }

  const togglePermission = (key) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    )
  }

  const toggleGroup = (groupKeys, allSelected) => {
    setSelectedPermissions((prev) => {
      if (allSelected) {
        return prev.filter((p) => !groupKeys.includes(p))
      }
      return [...new Set([...prev, ...groupKeys])]
    })
  }

  const groupedPermissions = permissionCatalogue.reduce((acc, perm) => {
    acc[perm.group] = acc[perm.group] || []
    acc[perm.group].push(perm)
    return acc
  }, {})

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!roleName.trim()) {
      setError('Role name is required')
      return
    }
    if (selectedPermissions.length === 0) {
      setError('Select at least one permission')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await authApi.createRole(roleName, selectedPermissions)
      onRoleCreated()
      handleClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create role. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn'>
      <div className='bg-white rounded-lg max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto'>
        <h3 className='text-xl font-bold text-gray-900 mb-4'>Create New Role</h3>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label htmlFor='roleName' className='block text-sm font-medium text-gray-700 mb-1'>
              Role Name
            </label>
            <input
              type='text'
              id='roleName'
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              placeholder='e.g. Auditor'
              disabled={isSubmitting}
            />
          </div>

          <div className='mb-4'>
            <span className='block text-sm font-medium text-gray-700 mb-2'>Permissions</span>
            {isLoadingPermissions
              ? (
                <div className='animate-pulse space-y-2'>
                  <div className='h-4 bg-gray-200 rounded w-3/4' />
                  <div className='h-4 bg-gray-200 rounded w-2/3' />
                </div>
                )
              : (
                <div className='space-y-3'>
                  {Object.entries(groupedPermissions).map(([group, perms]) => {
                    const groupKeys = perms.map((p) => p.key)
                    const allSelected = groupKeys.every((key) => selectedPermissions.includes(key))
                    return (
                      <div key={group} className='border border-gray-200 rounded-md p-3'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-sm font-semibold text-gray-800'>{group}</span>
                          <button
                            type='button'
                            onClick={() => toggleGroup(groupKeys, allSelected)}
                            className='text-xs text-blue-600 hover:text-blue-800'
                          >
                            {allSelected ? 'Clear all' : 'Select all'}
                          </button>
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-1'>
                          {perms.map((perm) => (
                            <label
                              key={perm.key}
                              className='flex items-center space-x-2 text-sm text-gray-700'
                              title={perm.description}
                            >
                              <input
                                type='checkbox'
                                checked={selectedPermissions.includes(perm.key)}
                                onChange={() => togglePermission(perm.key)}
                                className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                              />
                              <span>{perm.key}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
                )}
          </div>

          {error && <p className='mt-2 text-sm text-red-600'>{error}</p>}

          <div className='flex justify-end space-x-4 mt-6'>
            <button
              type='button'
              onClick={handleClose}
              className='px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors'
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type='submit'
              className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors ${
                isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRoleModal
