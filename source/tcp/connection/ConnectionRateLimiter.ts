import {
  CONNECTION_RATE_LIMIT_COOLDOWN_MS,
  CONNECTION_RATE_LIMIT_MAX_ATTEMPTS,
  CONNECTION_RATE_LIMIT_SWEEP_INTERVAL_MS,
  CONNECTION_RATE_LIMIT_WINDOW_MS,
} from '../config/keys';

interface AttemptRecord {
  /** Timestamps of connection attempts within the current sliding window, oldest first. */
  attemptTimestamps: number[];
  lockedUntil?: number;
}

/**
 * In-memory, per-IP connection-*attempt* rate limiter for the TCP server. Complements
 * MAX_CONNECTIONS_PER_IP (enforced in ConnectionManager), which only bounds *concurrent*
 * connections from one IP - it does nothing to stop an attacker who stays under that cap
 * while hammering the server with rapid connect-then-drop churn, since each attempt still
 * costs a TCP handshake and an accept()/reject() cycle regardless of whether the connection
 * itself is ultimately accepted.
 *
 * Same true-sliding-window + cooldown design as LoginRateLimiter.service.ts, applied to
 * connection attempts instead of failed logins. In-memory only, reset on process restart.
 */
class ConnectionRateLimiter {
  private static instance: ConnectionRateLimiter;
  private readonly attempts: Map<string, AttemptRecord> = new Map();
  private sweepIntervalHandle: NodeJS.Timeout | undefined;

  public static getInstance(): ConnectionRateLimiter {
    if (!ConnectionRateLimiter.instance) {
      ConnectionRateLimiter.instance = new ConnectionRateLimiter();
    }
    return ConnectionRateLimiter.instance;
  }

  /** Milliseconds remaining before this IP may open a new connection, or 0 if it's clear. */
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

  /**
   * Records a new connection attempt, locking the IP out of further connections once the
   * threshold is crossed. Call once per accepted socket, regardless of whether the
   * connection is ultimately allowed through or rejected by the concurrent-connection cap.
   */
  public recordAttempt(ip: string): void {
    const now = Date.now();
    const record = this.attempts.get(ip) ?? { attemptTimestamps: [] };

    // Slide the window: drop attempts older than the trailing window before counting.
    record.attemptTimestamps = record.attemptTimestamps.filter(
      (t) => now - t <= CONNECTION_RATE_LIMIT_WINDOW_MS,
    );
    record.attemptTimestamps.push(now);

    if (record.attemptTimestamps.length >= CONNECTION_RATE_LIMIT_MAX_ATTEMPTS) {
      record.lockedUntil = now + CONNECTION_RATE_LIMIT_COOLDOWN_MS;
    }
    this.attempts.set(ip, record);
  }

  public startCleanupSweep(): void {
    if (this.sweepIntervalHandle) {
      return;
    }
    this.sweepIntervalHandle = setInterval(() => {
      const now = Date.now();
      for (const [ip, record] of this.attempts) {
        record.attemptTimestamps = record.attemptTimestamps.filter(
          (t) => now - t <= CONNECTION_RATE_LIMIT_WINDOW_MS,
        );
        const unlocked = !record.lockedUntil || record.lockedUntil <= now;
        if (record.attemptTimestamps.length === 0 && unlocked) {
          this.attempts.delete(ip);
        }
      }
    }, CONNECTION_RATE_LIMIT_SWEEP_INTERVAL_MS);
    this.sweepIntervalHandle.unref();
  }

  public stopCleanupSweep(): void {
    if (this.sweepIntervalHandle) {
      clearInterval(this.sweepIntervalHandle);
      this.sweepIntervalHandle = undefined;
    }
  }

  /** Test/shutdown helper - clears every tracked IP's attempt counter and any active lockouts. */
  public clearAll(): void {
    this.attempts.clear();
  }
}

export default ConnectionRateLimiter.getInstance();
