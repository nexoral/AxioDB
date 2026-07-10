import { create } from 'zustand'

const useAuthStore = create((set) => ({
  username: null,
  role: null,
  permissions: [],
  mustChangePassword: false,
  isAuthenticated: false,
  isLoading: true,
  setSession: ({ username, role, permissions, mustChangePassword }) =>
    set({
      username,
      role,
      permissions: permissions || [],
      mustChangePassword: !!mustChangePassword,
      isAuthenticated: true,
      isLoading: false
    }),
  clearSession: () =>
    set({
      username: null,
      role: null,
      permissions: [],
      mustChangePassword: false,
      isAuthenticated: false,
      isLoading: false
    })
}))

export { useAuthStore }
