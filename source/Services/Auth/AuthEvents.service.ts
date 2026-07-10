import { EventEmitter } from "events";

/**
 * Process-wide event bus for auth state changes that need to propagate beyond the
 * HTTP SessionStore - namely, TCP connections holding a cached `AuthenticatedUser`
 * (see ConnectionManager) for a user whose role, password, or account was just
 * changed via AuthService.
 *
 * Services/Auth owns this abstraction; tcp/ subscribes to it (see tcp/config/server.ts).
 * Dependency direction stays tcp -> Services/Auth, same as everywhere else in the
 * codebase - Services/Auth never imports from tcp/, avoiding a layering violation.
 */
class AuthEvents extends EventEmitter {}

export default new AuthEvents();
