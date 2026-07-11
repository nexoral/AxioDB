import PasswordHasher from "./PasswordHasher.helper";
import ConfigDatabase from "./ConfigDatabase.service";
import PermissionChecker from "./PermissionChecker.helper";
import SessionStore from "./SessionStore.service";
import AuthEvents from "./AuthEvents.service";
import {
  UserDocument,
  RoleDocument,
} from "../../config/Interfaces/Auth/auth.interface";
import { ALL_PERMISSION_KEYS, SUPER_ADMIN_ROLE } from "../../config/Keys/Permissions";

export interface AuthResult {
  success: boolean;
  message: string;
  user?: UserDocument;
}

export interface MutationResult {
  success: boolean;
  message: string;
  /** True when the failure means "this already exists" (HTTP 409) rather than a validation failure (HTTP 400). */
  conflict?: boolean;
}

export interface SafeUser {
  username: string;
  role: string;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: string;
}

/**
 * Business logic for login, password management, and user/role administration.
 * Backed entirely by AxioDB's own Collection API against the `config` database
 * (see ConfigDatabase.service.ts) - no separate storage mechanism.
 */
export default class AuthService {
  public async login(username: string, password: string): Promise<AuthResult> {
    const user = await this.findUserByUsername(username);
    if (!user || user.isActive === false) {
      return { success: false, message: "Invalid username or password" };
    }

    const passwordMatches = await PasswordHasher.verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return { success: false, message: "Invalid username or password" };
    }

    return { success: true, message: "Login successful", user };
  }

  public async findUserByUsername(username: string): Promise<UserDocument | null> {
    const result = await ConfigDatabase.getUsersCollection()
      .query({ username })
      .findOne(true)
      .exec();
    if ("data" in result && result.data && result.data.documents) {
      return result.data.documents as UserDocument;
    }
    return null;
  }

  public async listUsers(): Promise<SafeUser[]> {
    const result = await ConfigDatabase.getUsersCollection().query({}).Limit(1000).exec();
    if (!("data" in result) || !result.data?.documents) {
      return [];
    }
    const users = result.data.documents as UserDocument[];
    return users.map((user) => ({
      username: user.username,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));
  }

  public async createUser(
    username: string,
    password: string,
    role: string,
  ): Promise<MutationResult> {
    if (!PermissionChecker.roleExists(role)) {
      return { success: false, message: `Role "${role}" does not exist` };
    }

    const existingUser = await this.findUserByUsername(username);
    if (existingUser) {
      return { success: false, message: "Username already exists", conflict: true };
    }

    const passwordHash = await PasswordHasher.hashPassword(password);
    const document: UserDocument = {
      username,
      passwordHash,
      role,
      mustChangePassword: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await ConfigDatabase.getUsersCollection().insert(document);
    return { success: true, message: "User created successfully" };
  }

  public async changeOwnPassword(
    username: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.findUserByUsername(username);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const currentPasswordMatches = await PasswordHasher.verifyPassword(
      currentPassword,
      user.passwordHash,
    );
    if (!currentPasswordMatches) {
      return { success: false, message: "Current password is incorrect" };
    }

    const passwordHash = await PasswordHasher.hashPassword(newPassword);
    await ConfigDatabase.getUsersCollection()
      .update({ username })
      .UpdateOne({ passwordHash, mustChangePassword: false });

    return { success: true, message: "Password changed successfully" };
  }

  public async resetUserPassword(
    username: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.findUserByUsername(username);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const passwordHash = await PasswordHasher.hashPassword(newPassword);
    await ConfigDatabase.getUsersCollection()
      .update({ username })
      .UpdateOne({ passwordHash, mustChangePassword: true });

    SessionStore.revokeSessionsForUser(username);
    AuthEvents.emit("user-revoked", username);
    return { success: true, message: "Password reset successfully" };
  }

  public async updateUserRole(
    username: string,
    newRole: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!PermissionChecker.roleExists(newRole)) {
      return { success: false, message: `Role "${newRole}" does not exist` };
    }

    const user = await this.findUserByUsername(username);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.role === SUPER_ADMIN_ROLE && newRole !== SUPER_ADMIN_ROLE) {
      const lastAdminGuard = await this.assertNotLastSuperAdmin(username);
      if (!lastAdminGuard.success) {
        return lastAdminGuard;
      }
    }

    await ConfigDatabase.getUsersCollection()
      .update({ username })
      .UpdateOne({ role: newRole });

    SessionStore.revokeSessionsForUser(username);
    AuthEvents.emit("user-revoked", username);
    return { success: true, message: "Role updated successfully" };
  }

  public async deleteUser(username: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findUserByUsername(username);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.role === SUPER_ADMIN_ROLE) {
      const lastAdminGuard = await this.assertNotLastSuperAdmin(username);
      if (!lastAdminGuard.success) {
        return lastAdminGuard;
      }
    }

    await ConfigDatabase.getUsersCollection().delete({ username }).deleteOne();
    SessionStore.revokeSessionsForUser(username);
    AuthEvents.emit("user-revoked", username);
    return { success: true, message: "User deleted successfully" };
  }

  public async createRole(
    roleName: string,
    permissions: string[],
  ): Promise<MutationResult> {
    if (PermissionChecker.roleExists(roleName)) {
      return { success: false, message: "Role already exists", conflict: true };
    }

    const invalidPermissions = permissions.filter((key) => !ALL_PERMISSION_KEYS.includes(key));
    if (invalidPermissions.length > 0) {
      return {
        success: false,
        message: `Unknown permission key(s): ${invalidPermissions.join(", ")}`,
      };
    }

    const document: RoleDocument = {
      roleName,
      permissions,
      isSystemRole: false,
      createdAt: new Date().toISOString(),
    };
    await ConfigDatabase.getRolesCollection().insert(document);
    PermissionChecker.setRolePermissions(roleName, permissions);

    return { success: true, message: "Role created successfully" };
  }

  public async listRoles(): Promise<RoleDocument[]> {
    const result = await ConfigDatabase.getRolesCollection().query({}).Limit(1000).exec();
    if (!("data" in result) || !result.data?.documents) {
      return [];
    }
    return result.data.documents as RoleDocument[];
  }

  public async deleteRole(roleName: string): Promise<MutationResult> {
    const roles = await this.listRoles();
    const role = roles.find((entry) => entry.roleName === roleName);
    if (!role) {
      return { success: false, message: "Role not found" };
    }
    if (role.isSystemRole) {
      return { success: false, message: "Cannot delete a predefined system role" };
    }

    const usersWithRole = await ConfigDatabase.getUsersCollection()
      .query({ role: roleName })
      .Limit(1)
      .exec();
    const hasUsers =
      "data" in usersWithRole &&
      Array.isArray(usersWithRole.data?.documents) &&
      usersWithRole.data.documents.length > 0;
    if (hasUsers) {
      return {
        success: false,
        message: `Cannot delete role "${roleName}" - it is still assigned to one or more users`,
      };
    }

    await ConfigDatabase.getRolesCollection().delete({ roleName }).deleteOne();
    PermissionChecker.deleteRole(roleName);

    return { success: true, message: "Role deleted successfully" };
  }

  /**
   * Rejects an operation that would leave zero active Super Admin users behind,
   * preventing a permanent RBAC lockout.
   */
  private async assertNotLastSuperAdmin(
    excludingUsername: string,
  ): Promise<{ success: boolean; message: string }> {
    const result = await ConfigDatabase.getUsersCollection()
      .query({ role: SUPER_ADMIN_ROLE })
      .Limit(1000)
      .exec();

    const superAdmins = "data" in result && result.data?.documents ? (result.data.documents as UserDocument[]) : [];
    const remaining = superAdmins.filter(
      (user) => user.username !== excludingUsername && user.isActive !== false,
    );

    if (remaining.length === 0) {
      return {
        success: false,
        message: "Cannot remove the last remaining Super Admin",
      };
    }
    return { success: true, message: "OK" };
  }
}
