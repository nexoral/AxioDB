import axios from 'axios'
import { BASE_API_URL } from '../config/key'

const AUTH_URL = `${BASE_API_URL}/api/auth`

const authApi = {
  login: (username, password) => axios.post(`${AUTH_URL}/login`, { username, password }),
  logout: () => axios.post(`${AUTH_URL}/logout`),
  fetchMe: () => axios.get(`${AUTH_URL}/me`),
  changePassword: (currentPassword, newPassword) =>
    axios.patch(`${AUTH_URL}/change-password`, { currentPassword, newPassword }),

  listUsers: () => axios.get(`${AUTH_URL}/users`),
  createUser: (username, password, role) =>
    axios.post(`${AUTH_URL}/users`, { username, password, role }),
  updateUserRole: (username, role) =>
    axios.patch(`${AUTH_URL}/users/${encodeURIComponent(username)}/role`, { role }),
  resetUserPassword: (username, newPassword) =>
    axios.patch(`${AUTH_URL}/users/${encodeURIComponent(username)}/reset-password`, { newPassword }),
  deleteUser: (username) => axios.delete(`${AUTH_URL}/users/${encodeURIComponent(username)}`),

  listRoles: () => axios.get(`${AUTH_URL}/roles`),
  createRole: (roleName, permissions) =>
    axios.post(`${AUTH_URL}/roles`, { roleName, permissions }),
  listPermissions: () => axios.get(`${AUTH_URL}/roles/permissions`)
}

export default authApi
