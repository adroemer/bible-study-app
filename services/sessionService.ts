// Session management service for handling user authentication sessions with 4-hour expiry

export interface SessionData {
  isAuthenticated: boolean;
  loginTime: number; // timestamp in milliseconds
  expiryTime: number; // timestamp in milliseconds
}

const SESSION_KEY = 'f3-session';
const SESSION_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

export class SessionService {
  /**
   * Create a new session for authenticated user
   */
  static createSession(): void {
    const now = Date.now();
    const sessionData: SessionData = {
      isAuthenticated: true,
      loginTime: now,
      expiryTime: now + SESSION_DURATION
    };

    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.warn('Failed to create session:', error);
    }
  }

  /**
   * Check if there is an active, non-expired session
   */
  static isSessionActive(): boolean {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) {
        return false;
      }

      const session: SessionData = JSON.parse(sessionData);
      const now = Date.now();

      // Check if session exists, is authenticated, and hasn't expired
      if (session.isAuthenticated && now < session.expiryTime) {
        return true;
      }

      // Session expired, clear it
      if (now >= session.expiryTime) {
        this.destroySession();
      }

      return false;
    } catch (error) {
      console.warn('Failed to check session:', error);
      return false;
    }
  }

  /**
   * Get remaining session time in milliseconds
   */
  static getRemainingTime(): number {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) {
        return 0;
      }

      const session: SessionData = JSON.parse(sessionData);
      const now = Date.now();
      const remaining = session.expiryTime - now;

      return remaining > 0 ? remaining : 0;
    } catch (error) {
      console.warn('Failed to get remaining session time:', error);
      return 0;
    }
  }

  /**
   * Get remaining session time formatted as human-readable string
   */
  static getRemainingTimeFormatted(): string {
    const ms = this.getRemainingTime();
    if (ms <= 0) return 'Expired';

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Extend session (called when user is active)
   */
  static extendSession(): void {
    if (this.isSessionActive()) {
      this.createSession();
    }
  }

  /**
   * Destroy the current session
   */
  static destroySession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn('Failed to destroy session:', error);
    }
  }

  /**
   * Get session data
   */
  static getSessionData(): SessionData | null {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.warn('Failed to get session data:', error);
      return null;
    }
  }
}
