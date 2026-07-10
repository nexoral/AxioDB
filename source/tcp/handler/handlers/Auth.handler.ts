import { TCPResponse } from '../../types/protocol.types';
import { StatusCode, ErrorMessage, SuccessMessage } from '../../config/keys';
import { ConnectionManager } from '../../connection/ConnectionManager';
import AuthService from '../../../Services/Auth/AuthService.service';
import LoginRateLimiter from '../../../Services/Auth/LoginRateLimiter.service';
import { AuthenticatedUser } from '../../../config/Interfaces/Auth/auth.interface';

/**
 * Auth Handler - Handles the AUTHENTICATE TCP command
 * Reuses the same `AuthService`/`config` DB RBAC system as the HTTP Control Server,
 * so GUI and TCP share one set of credentials, including the same per-IP login
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
    params: any,
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

    const cooldownRemaining = LoginRateLimiter.getCooldownRemaining(remoteIp);
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
      LoginRateLimiter.recordFailure(remoteIp);
      return {
        id: requestId,
        statusCode: StatusCode.UNAUTHORIZED,
        message: ErrorMessage.INVALID_CREDENTIALS,
        error: ErrorMessage.INVALID_CREDENTIALS,
      };
    }
    LoginRateLimiter.recordSuccess(remoteIp);

    const authUser: AuthenticatedUser = {
      username: result.user.username,
      role: result.user.role,
      mustChangePassword: result.user.mustChangePassword,
    };

    // Correct credentials, but this account still needs its forced first/reset
    // password change - which can only be completed via the GUI today (no TCP
    // change-password command exists). Reject rather than silently allow, so a
    // never-rotated default admin/admin can't be used over TCP indefinitely.
    if (authUser.mustChangePassword) {
      return {
        id: requestId,
        statusCode: StatusCode.FORBIDDEN,
        message: ErrorMessage.PASSWORD_CHANGE_REQUIRED,
        error: ErrorMessage.PASSWORD_CHANGE_REQUIRED,
        data: { mustChangePassword: true },
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
}
