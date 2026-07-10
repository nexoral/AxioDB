import { randomBytes } from "crypto";
import { SessionRecord } from "../../config/Interfaces/Auth/auth.interface";
import { SESSION_SWEEP_INTERVAL_MS, SESSION_TTL_MS } from "../../config/Keys/Permissions";

/**
 * In-memory-only session store for the Control Server. Sessions never touch disk
 * and are lost on process restart by design - this is the literal "store the
 * session on server in memory only" requirement.
 */
class SessionStore {
  private static instance: SessionStore;
  private readonly sessions: Map<string, SessionRecord> = new Map();
  private sweepIntervalHandle: NodeJS.Timeout | undefined;

  public static getInstance(): SessionStore {
    if (!SessionStore.instance) {
      SessionStore.instance = new SessionStore();
    }
    return SessionStore.instance;
  }

  public createSession(username: string, role: string, mustChangePassword: boolean): SessionRecord {
    const sid = randomBytes(32).toString("hex");
    const now = Date.now();
    const record: SessionRecord = {
      sid,
      username,
      role,
      mustChangePassword,
      createdAt: now,
      lastSeenAt: now,
      expiresAt: now + SESSION_TTL_MS,
    };
    this.sessions.set(sid, record);
    return record;
  }

  public getSession(sid: string): SessionRecord | null {
    const record = this.sessions.get(sid);
    if (!record) {
      return null;
    }
    if (record.expiresAt <= Date.now()) {
      this.sessions.delete(sid);
      return null;
    }
    return record;
  }

  public touchSession(sid: string): void {
    const record = this.sessions.get(sid);
    if (!record) {
      return;
    }
    const now = Date.now();
    record.lastSeenAt = now;
    record.expiresAt = now + SESSION_TTL_MS;
  }

  public updateSessionMustChangePassword(sid: string, mustChangePassword: boolean): void {
    const record = this.sessions.get(sid);
    if (record) {
      record.mustChangePassword = mustChangePassword;
    }
  }

  public revokeSession(sid: string): void {
    this.sessions.delete(sid);
  }

  public revokeSessionsForUser(username: string): void {
    for (const [sid, record] of this.sessions) {
      if (record.username === username) {
        this.sessions.delete(sid);
      }
    }
  }

  public countActiveSessions(): number {
    return this.sessions.size;
  }

  public startCleanupSweep(): void {
    if (this.sweepIntervalHandle) {
      return;
    }
    this.sweepIntervalHandle = setInterval(() => {
      const now = Date.now();
      for (const [sid, record] of this.sessions) {
        if (record.expiresAt <= now) {
          this.sessions.delete(sid);
        }
      }
    }, SESSION_SWEEP_INTERVAL_MS);
    this.sweepIntervalHandle.unref();
  }

  public stopCleanupSweep(): void {
    if (this.sweepIntervalHandle) {
      clearInterval(this.sweepIntervalHandle);
      this.sweepIntervalHandle = undefined;
    }
  }
}

export default SessionStore.getInstance();
