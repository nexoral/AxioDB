import { useEffect, useState } from 'react'
import authApi from '../../api/authApi'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Input } from '../ui/Field'
import { Alert, Badge, Skeleton } from '../ui/Feedback'

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

  const ShieldIcon = (
    <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
      <path strokeLinecap='round' strokeLinejoin='round' d='M9 12l2 2 4-4M12 3l7 4v5c0 4.42-3.05 8.56-7 9.75C8.05 20.56 5 16.42 5 12V7l7-4z' />
    </svg>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title='Create role'
      subtitle={`${selectedPermissions.length} permission${selectedPermissions.length === 1 ? '' : 's'} selected`}
      icon={ShieldIcon}
      size='lg'
      footer={
        <>
          <Button variant='secondary' onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!roleName.trim() || selectedPermissions.length === 0}
          >
            Create role
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className='space-y-5'>
        <Input
          label='Role name'
          value={roleName}
          onChange={(event) => setRoleName(event.target.value)}
          placeholder='Auditor'
          autoFocus
          autoComplete='off'
          hint='Shown wherever roles are assigned. Choose something that describes the job, not the person.'
        />

        <div>
          <p className='mb-2 text-sm font-medium text-ink-700'>Permissions</p>

          {isLoadingPermissions
            ? (
              <div className='space-y-2'>
                {[0, 1, 2].map((i) => <Skeleton key={i} className='h-20 w-full' />)}
              </div>
              )
            : (
              <div className='space-y-3'>
                {Object.entries(groupedPermissions).map(([group, permissions]) => {
                  const groupKeys = permissions.map((permission) => permission.key)
                  const allSelected = groupKeys.every((key) => selectedPermissions.includes(key))

                  return (
                    <div key={group} className='rounded-lg border border-ink-200 bg-white'>
                      <div className='flex items-center justify-between border-b border-ink-100 px-4 py-2.5'>
                        <span className='text-sm font-semibold text-ink-900'>{group}</span>
                        <button
                          type='button'
                          onClick={() => toggleGroup(groupKeys, allSelected)}
                          className='text-xs font-medium text-brand-700 transition-colors hover:text-brand-800'
                        >
                          {allSelected ? 'Clear all' : 'Select all'}
                        </button>
                      </div>
                      <div className='grid gap-1 p-2 sm:grid-cols-2'>
                        {permissions.map((permission) => (
                          <label
                            key={permission.key}
                            className='flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-ink-50'
                          >
                            <input
                              type='checkbox'
                              checked={selectedPermissions.includes(permission.key)}
                              onChange={() => togglePermission(permission.key)}
                              className='mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-brand-600 focus:ring-brand-500'
                            />
                            <span className='min-w-0'>
                              <span className='block truncate text-sm text-ink-800'>
                                {permission.description}
                              </span>
                              <span className='block truncate font-mono text-[11px] text-ink-400'>
                                {permission.key}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              )}
        </div>

        {selectedPermissions.length > 0 && (
          <Badge tone='brand'>{selectedPermissions.length} selected</Badge>
        )}

        {error && <Alert tone='danger'>{error}</Alert>}
        <button type='submit' className='hidden' aria-hidden='true' tabIndex={-1} />
      </form>
    </Modal>
  )
}

export default CreateRoleModal
