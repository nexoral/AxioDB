// Interfaces for the Control Server RBAC + Authentication feature.

/** Document shape stored in the `config.users` collection. */
export interface UserDocument {
  documentId?: string;
  username: string;
  passwordHash: string;
  role: string;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/** Document shape stored in the `config.roles` collection. */
export interface RoleDocument {
  documentId?: string;
  roleName: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
}

/** Document shape stored in the `config.permissions` collection. */
export interface PermissionDocument {
  documentId?: string;
  key: string;
  group: string;
  description: string;
}

/** In-memory session record kept only for the lifetime of the server process. */
export interface SessionRecord {
  sid: string;
  username: string;
  role: string;
  mustChangePassword: boolean;
  createdAt: number;
  lastSeenAt: number;
  expiresAt: number;
}

/** Payload embedded (base64url-encoded) inside the session cookie. Never trust `username`/`role` from this - it only carries the lookup key. */
export interface CookiePayload {
  sid: string;
  iat: number;
}

/** Public shape returned to the frontend describing the authenticated caller. */
export interface AuthenticatedUser {
  username: string;
  role: string;
  mustChangePassword: boolean;
}

export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface ChangePasswordRequestBody {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserRequestBody {
  username: string;
  password: string;
  role: string;
}

export interface ResetPasswordRequestBody {
  newPassword: string;
}

export interface UpdateUserRoleRequestBody {
  role: string;
}

export interface CreateRoleRequestBody {
  roleName: string;
  permissions: string[];
}
