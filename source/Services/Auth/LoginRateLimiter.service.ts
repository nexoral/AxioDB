import {
  LOGIN_RATE_LIMIT_COOLDOWN_MS,
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  LOGIN_RATE_LIMIT_SWEEP_INTERVAL_MS,
  LOGIN_RATE_LIMIT_WINDOW_MS,
} from "../../config/Keys/Permissions";

interface AttemptRecord {
  /** Timestamps of failures within the current sliding window, oldest first. */
  failureTimestamps: number[];
  lockedUntil?: number;
}

/**
 * In-memory, per-IP login rate limiter shared by the GUI's /auth/login route and the
 * TCP AUTHENTICATE command - one failure counter per client IP regardless of which
 * transport the attempt came in on. Never persisted to disk, reset on process restart,
 * same lifecycle as SessionStore.
 *
 * True sliding window (not fixed): each failure is timestamped, and a lockout triggers
 * once LOGIN_RATE_LIMIT_MAX_ATTEMPTS failures fall within the trailing
 * LOGIN_RATE_LIMIT_WINDOW_MS from "now" - not a fixed bucket that resets wholesale once
 * its start time expires. E.g. 4 failures at minute 0 and a 5th at minute 14 still locks
 * (all 5 are within the trailing 15-minute window), whereas a fixed window anchored at
 * minute 0 would have already rolled over and missed it.
 *
 * Deliberately IP-only (not IP+username): simpler to reason about, at the cost of
 * clients behind a shared/NAT IP being able to lock each other out. Acceptable for the
 * trusted-network deployment model this whole RBAC system targets.
 */
class LoginRateLimiter {
  private static instance: LoginRateLimiter;
  private readonly attempts: Map<string, AttemptRecord> = new Map();
  private sweepIntervalHandle: NodeJS.Timeout | undefined;

  public static getInstance(): LoginRateLimiter {
    if (!LoginRateLimiter.instance) {
      LoginRateLimiter.instance = new LoginRateLimiter();
    }
    return LoginRateLimiter.instance;
  }

  /** Milliseconds remaining before this IP may attempt login again, or 0 if it's clear. */
  public getCooldownRemaining(ip: string): number {
    const record = this.attempts.get(ip);
    if (!record?.lockedUntil) {
      return 0;
    }
    const remaining = record.lockedUntil - Date.now();
    if (remaining <= 0) {
      this.attempts.delete(ip);
      return 0;
    }
    return remaining;
  }

  /** Records a failed login attempt, locking the IP out once the threshold is crossed. */
  public recordFailure(ip: string): void {
    const now = Date.now();
    const record = this.attempts.get(ip) ?? { failureTimestamps: [] };

    // Slide the window: drop failures older than the trailing window before counting.
    record.failureTimestamps = record.failureTimestamps.filter(
      (t) => now - t <= LOGIN_RATE_LIMIT_WINDOW_MS,
    );
    record.failureTimestamps.push(now);

    if (record.failureTimestamps.length >= LOGIN_RATE_LIMIT_MAX_ATTEMPTS) {
      record.lockedUntil = now + LOGIN_RATE_LIMIT_COOLDOWN_MS;
    }
    this.attempts.set(ip, record);
  }

  /** Clears the failure counter for an IP following a successful login. */
  public recordSuccess(ip: string): void {
    this.attempts.delete(ip);
  }

  /** Clears every tracked IP's failure counter and any active lockouts. */
  public clearAll(): void {
    this.attempts.clear();
  }

  public startCleanupSweep(): void {
    if (this.sweepIntervalHandle) {
      return;
    }
    this.sweepIntervalHandle = setInterval(() => {
      const now = Date.now();
      for (const [ip, record] of this.attempts) {
        record.failureTimestamps = record.failureTimestamps.filter(
          (t) => now - t <= LOGIN_RATE_LIMIT_WINDOW_MS,
        );
        const unlocked = !record.lockedUntil || record.lockedUntil <= now;
        if (record.failureTimestamps.length === 0 && unlocked) {
          this.attempts.delete(ip);
        }
      }
    }, LOGIN_RATE_LIMIT_SWEEP_INTERVAL_MS);
    this.sweepIntervalHandle.unref();
  }

  public stopCleanupSweep(): void {
    if (this.sweepIntervalHandle) {
      clearInterval(this.sweepIntervalHandle);
      this.sweepIntervalHandle = undefined;
    }
  }
}

export default LoginRateLimiter.getInstance();
