import { TCPResponse, TCPRequest } from '../../types/protocol.types';
import { StatusCode, ErrorMessage, SuccessMessage } from '../../config/keys';
import { ConnectionManager } from '../../connection/ConnectionManager';
import AuthService from '../../../Services/Auth/AuthService.service';
import LoginRateLimiter from '../../../Services/Auth/LoginRateLimiter.service';
import { AuthenticatedUser } from '../../../config/Interfaces/Auth/auth.interface';
import { PERMISSION_CATALOGUE } from '../../../config/Keys/Permissions';
import PermissionChecker from '../../../Services/Auth/PermissionChecker.helper';

type Params = TCPRequest['params'];

/**
 * Auth Handler - Handles the AUTHENTICATE TCP command
 * Reuses the same `AuthService`/`config` DB RBAC system as the HTTP Control Server,
 * so HTTP and TCP share one set of credentials, including the same per-IP login
 * rate limiter (LoginRateLimiter).
 */
export default class AuthHandler {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Handle AUTHENTICATE command
   */
  async handleAuthenticate(
    requestId: string,
    params: Params,
    connectionId: string,
    remoteIp: string,
    connectionManager: ConnectionManager,
  ): Promise<TCPResponse> {
    const { username, password } = params;

    if (!username || !password) {
      return {
        id: requestId,
        statusCode: StatusCode.BAD_REQUEST,
        message: `${ErrorMessage.MISSING_REQUIRED_PARAMS}: username, password`,
        error: `${ErrorMessage.MISSING_REQUIRED_PARAMS}: username, password`,
      };
    }

    const cooldownRemaining = LoginRateLimiter.getCooldownRemaining(remoteIp, username);
    if (cooldownRemaining > 0) {
      return {
        id: requestId,
        statusCode: StatusCode.TOO_MANY_REQUESTS,
        message: `${ErrorMessage.TOO_MANY_LOGIN_ATTEMPTS} Try again in ${Math.ceil(cooldownRemaining / 1000)}s.`,
        error: ErrorMessage.TOO_MANY_LOGIN_ATTEMPTS,
      };
    }

    const result = await this.authService.login(username, password);
    if (!result.success || !result.user) {
      LoginRateLimiter.recordFailure(remoteIp, username);
      return {
        id: requestId,
        statusCode: StatusCode.UNAUTHORIZED,
        message: ErrorMessage.INVALID_CREDENTIALS,
        error: ErrorMessage.INVALID_CREDENTIALS,
      };
    }
    LoginRateLimiter.recordSuccess(remoteIp, username);

    const permissions = PermissionChecker.getPermissionsForRole(result.user.role);
    const authUser: AuthenticatedUser = {
      username: result.user.username,
      role: result.user.role,
      permissions,
      mustChangePassword: result.user.mustChangePassword,
    };

    // Correct credentials, but this account still needs its forced first/reset
    // password change - which can only be completed via the HTTP API / Desktop GUI today
    // (no TCP change-password command exists). Reject rather than silently allow, so a
    // never-rotated default admin/admin can't be used over TCP indefinitely.
    if (authUser.mustChangePassword) {
      return {
        id: requestId,
        statusCode: StatusCode.FORBIDDEN,
        message: ErrorMessage.PASSWORD_CHANGE_REQUIRED,
        error: ErrorMessage.PASSWORD_CHANGE_REQUIRED,
        data: {
          username: authUser.username,
          role: authUser.role,
          permissions,
          mustChangePassword: true,
        },
      };
    }

    connectionManager.setAuthUser(connectionId, authUser);

    return {
      id: requestId,
      statusCode: StatusCode.OK,
      message: SuccessMessage.AUTHENTICATED,
      data: authUser,
    };
  }

  /**
   * Handle LIST_USERS command
   */
  async handleListUsers(requestId: string): Promise<TCPResponse> {
    const users = await this.authService.listUsers();
    return {
      id: requestId,
      statusCode: StatusCode.OK,
      message: 'List of Users',
      data: users,
    };
  }

  /**
   * Handle CREATE_USER command
   */
  async handleCreateUser(requestId: string, params: Params, actorUsername?: string): Promise<TCPResponse> {
    const { username, password, role } = params as { username: string; password: string; role: string };
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: 'Username is required', error: 'Username is required' };
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: 'Password must be at least 8 characters', error: 'Password must be at least 8 characters' };
    }
    if (!role || typeof role !== 'string') {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: 'Role is required', error: 'Role is required' };
    }

    const result = await this.authService.createUser(username.trim(), password, role, actorUsername);
    if (!result.success) {
      const statusCode = result.conflict ? StatusCode.CONFLICT : StatusCode.BAD_REQUEST;
      return { id: requestId, statusCode, message: result.message, error: result.message };
    }

    return {
      id: requestId,
      statusCode: StatusCode.CREATED,
      message: result.message,
      data: { username, role },
    };
  }

  /**
   * Handle UPDATE_USER_ROLE command
   */
  async handleUpdateUserRole(requestId: string, params: Params, actorUsername?: string): Promise<TCPResponse> {
    const { username, role } = params as { username: string; role: string };
    const result = await this.authService.updateUserRole(username, role, actorUsername);
    if (!result.success) {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: result.message, error: result.message };
    }
    return { id: requestId, statusCode: StatusCode.OK, message: result.message };
  }

  /**
   * Handle RESET_USER_PASSWORD command
   */
  async handleResetUserPassword(requestId: string, params: Params, actorUsername?: string): Promise<TCPResponse> {
    const { username, newPassword } = params as { username: string; newPassword: string };
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: 'Password must be at least 8 characters', error: 'Password must be at least 8 characters' };
    }
    const result = await this.authService.resetUserPassword(username, newPassword, actorUsername);
    if (!result.success) {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: result.message, error: result.message };
    }
    return { id: requestId, statusCode: StatusCode.OK, message: result.message };
  }

  /**
   * Handle CHANGE_PASSWORD command
   */
  async handleChangePassword(requestId: string, params: Params, authUser?: AuthenticatedUser): Promise<TCPResponse> {
    const { currentPassword, newPassword } = params as { currentPassword: string; newPassword: string };
    const username = (params as { username?: string }).username || authUser?.username;
    if (!username) {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: 'Username is required', error: 'Username is required' };
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: 'Password must be at least 8 characters', error: 'Password must be at least 8 characters' };
    }
    const result = await this.authService.changeOwnPassword(username, currentPassword, newPassword);
    if (!result.success) {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: result.message, error: result.message };
    }
    return { id: requestId, statusCode: StatusCode.OK, message: result.message };
  }

  /**
   * Handle DELETE_USER command
   */
  async handleDeleteUser(requestId: string, params: Params, actorUsername?: string): Promise<TCPResponse> {
    const { username } = params as { username: string };
    const actor = actorUsername || '';
    const result = await this.authService.deleteUser(username, actor);
    if (!result.success) {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: result.message, error: result.message };
    }
    return { id: requestId, statusCode: StatusCode.OK, message: result.message };
  }

  /**
   * Handle LIST_ROLES command
   */
  async handleListRoles(requestId: string): Promise<TCPResponse> {
    const roles = await this.authService.listRoles();
    return { id: requestId, statusCode: StatusCode.OK, message: 'List of Roles', data: roles };
  }

  /**
   * Handle CREATE_ROLE command
   */
  async handleCreateRole(requestId: string, params: Params): Promise<TCPResponse> {
    const { roleName, permissions } = params as { roleName: string; permissions: string[] };
    if (!roleName || typeof roleName !== 'string' || roleName.trim() === '') {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: 'Role name is required', error: 'Role name is required' };
    }
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: 'At least one permission is required', error: 'At least one permission is required' };
    }
    const result = await this.authService.createRole(roleName, permissions);
    if (!result.success) {
      const statusCode = result.conflict ? StatusCode.CONFLICT : StatusCode.BAD_REQUEST;
      return { id: requestId, statusCode, message: result.message, error: result.message };
    }
    return { id: requestId, statusCode: StatusCode.CREATED, message: result.message, data: { roleName, permissions } };
  }

  /**
   * Handle DELETE_ROLE command
   */
  async handleDeleteRole(requestId: string, params: Params): Promise<TCPResponse> {
    const { roleName } = params as { roleName: string };
    const result = await this.authService.deleteRole(roleName);
    if (!result.success) {
      return { id: requestId, statusCode: StatusCode.BAD_REQUEST, message: result.message, error: result.message };
    }
    return { id: requestId, statusCode: StatusCode.OK, message: result.message };
  }

  /**
   * Handle LIST_PERMISSIONS command
   */
  handleListPermissions(requestId: string): TCPResponse {
    return { id: requestId, statusCode: StatusCode.OK, message: 'Available permissions', data: PERMISSION_CATALOGUE };
  }
}
