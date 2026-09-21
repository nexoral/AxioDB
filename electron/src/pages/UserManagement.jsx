import React, { useEffect, useState } from "react";
import authApi from "../api/authApi";
import { useAuthStore } from "../store/authStore";
import CreateUserModal from "../components/auth/CreateUserModal";
import CreateRoleModal from "../components/auth/CreateRoleModal";
import ResetPasswordModal from "../components/auth/ResetPasswordModal";

const UserManagement = () => {
  const permissions = useAuthStore((state) => state.permissions);
  const currentUsername = useAuthStore((state) => state.username);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null);

  const canCreateUser = permissions.includes("user:create");
  const canDeleteUser = permissions.includes("user:delete");
  const canUpdateUserRole = permissions.includes("user:update-role");
  const canResetPassword = permissions.includes("user:reset-password");
  const canCreateRole = permissions.includes("role:create");

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [usersRes, rolesRes] = await Promise.all([authApi.listUsers(), authApi.listRoles()]);
      setUsers(usersRes.data.data || []);
      setRoles(rolesRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users and roles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (username, newRole) => {
    try {
      await authApi.updateUserRole(username, newRole);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await authApi.deleteUser(username);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">User & Access Control</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage database users, RBAC roles, and operational permissions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canCreateUser && (
              <button
                type="button"
                onClick={() => setIsCreateUserOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New User
              </button>
            )}
            {canCreateRole && (
              <button
                type="button"
                onClick={() => setIsCreateRoleOpen(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                New Role
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Registered Users</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                {users.length}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="px-5 py-3">Username</th>
                    <th className="px-5 py-3">Assigned Role</th>
                    <th className="px-5 py-3">Account Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.username} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {u.username.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="font-mono">{u.username}</span>
                        {u.username === currentUsername && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {canUpdateUserRole ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.username, e.target.value)}
                            className="border border-slate-300 rounded-md px-2.5 py-1 text-xs bg-white text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                          >
                            {roles.map((r) => (
                              <option key={r.roleName} value={r.roleName}>
                                {r.roleName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {u.mustChangePassword ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Must Change Password
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        {canResetPassword && (
                          <button
                            type="button"
                            onClick={() => setResetPasswordTarget(u.username)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          >
                            Reset Password
                          </button>
                        )}
                        {canDeleteUser && u.username !== currentUsername && (
                          <button
                            type="button"
                            onClick={() => handleDelete(u.username)}
                            className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
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

        {/* Roles Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Security Roles & Permissions</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                {roles.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-5 py-3">Role Name</th>
                  <th className="px-5 py-3">Granted Permissions</th>
                  <th className="px-5 py-3">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roles.map((r) => (
                  <tr key={r.roleName} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{r.roleName}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">
                      {r.permissions.length} capabilities
                      <div className="flex flex-wrap gap-1 mt-1 max-w-xl">
                        {r.permissions.slice(0, 6).map((p) => (
                          <span key={p} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">
                            {p}
                          </span>
                        ))}
                        {r.permissions.length > 6 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px]">
                            +{r.permissions.length - 6} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.isSystemRole ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] font-medium">
                          System Role
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-medium">
                          Custom Role
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
    </div>
  );
};

export default UserManagement;
