import { createLogger } from '@open-wallet/utils';

const logger = createLogger('audit');

/**
 * Audit event types
 */
export enum AuditEventType {
  // Wallet lifecycle
  WALLET_CREATED = 'wallet_created',
  WALLET_UNLOCKED = 'wallet_unlocked',
  WALLET_LOCKED = 'wallet_locked',
  WALLET_DESTROYED = 'wallet_destroyed',

  // Account operations
  ACCOUNT_CREATED = 'account_created',
  ACCOUNT_EXPORTED = 'account_exported',
  MNEMONIC_EXPORTED = 'mnemonic_exported',

  // Transaction operations
  TRANSACTION_SIGNED = 'transaction_signed',
  TRANSACTION_SENT = 'transaction_sent',
  TRANSACTION_CONFIRMED = 'transaction_confirmed',
  TRANSACTION_FAILED = 'transaction_failed',

  // Message signing
  MESSAGE_SIGNED = 'message_signed',

  // Security events
  PASSWORD_CHANGED = 'password_changed',
  FAILED_UNLOCK_ATTEMPT = 'failed_unlock_attempt',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',

  // Settings
  SETTINGS_CHANGED = 'settings_changed',
  NETWORK_CHANGED = 'network_changed',
}

/**
 * Audit event severity
 */
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ALERT = 'alert',
}

/**
 * Audit event
 */
export interface AuditEvent {
  id: string;
  type: AuditEventType;
  severity: AuditSeverity;
  timestamp: number;
  details: Record<string, unknown>;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

/**
 * Audit log configuration
 */
export interface AuditLogConfig {
  /** Maximum number of events to keep */
  maxEvents?: number;
  /** Whether to log to console */
  logToConsole?: boolean;
  /** Callback when alert-level event occurs */
  onAlert?: (event: AuditEvent) => void;
}

/**
 * Audit log
 */
export class AuditLog {
  private events: AuditEvent[] = [];
  private config: Required<AuditLogConfig>;
  private eventId = 0;

  constructor(config: AuditLogConfig = {}) {
    this.config = {
      maxEvents: config.maxEvents ?? 1000,
      logToConsole: config.logToConsole ?? true,
      onAlert: config.onAlert ?? (() => {}),
    };
  }

  /**
   * Log an audit event
   */
  log(
    type: AuditEventType,
    severity: AuditSeverity,
    details: Record<string, unknown> = {},
    metadata?: AuditEvent['metadata']
  ): AuditEvent {
    const event: AuditEvent = {
      id: `audit-${++this.eventId}`,
      type,
      severity,
      timestamp: Date.now(),
      details: this.sanitizeDetails(details),
      metadata,
    };

    // Add to log
    this.events.push(event);

    // Trim if needed
    while (this.events.length > this.config.maxEvents) {
      this.events.shift();
    }

    // Log to console if enabled
    if (this.config.logToConsole) {
      this.logToConsole(event);
    }

    // Trigger alert callback if needed
    if (severity === AuditSeverity.ALERT) {
      this.config.onAlert(event);
    }

    return event;
  }

  /**
   * Sanitize details to remove sensitive data
   */
  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...details };

    // Remove sensitive fields
    const sensitiveFields = ['privateKey', 'mnemonic', 'password', 'seed', 'secret'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Truncate addresses for privacy (show first/last 6 chars)
    if (typeof sanitized.address === 'string' && sanitized.address.length > 20) {
      const addr = sanitized.address;
      sanitized.address = `${addr.slice(0, 8)}...${addr.slice(-6)}`;
    }

    return sanitized;
  }

  /**
   * Log event to console
   */
  private logToConsole(event: AuditEvent): void {
    const severityEmoji = {
      [AuditSeverity.INFO]: 'i',
      [AuditSeverity.WARNING]: '!',
      [AuditSeverity.ALERT]: '!!',
    };

    const msg = `[${severityEmoji[event.severity]}] ${event.type}`;

    switch (event.severity) {
      case AuditSeverity.INFO:
        logger.info(msg, event.details);
        break;
      case AuditSeverity.WARNING:
        logger.warn(msg, event.details);
        break;
      case AuditSeverity.ALERT:
        logger.error(msg, event.details);
        break;
    }
  }

  /**
   * Get all events
   */
  getEvents(): AuditEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  getEventsByType(type: AuditEventType): AuditEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  /**
   * Get events by severity
   */
  getEventsBySeverity(severity: AuditSeverity): AuditEvent[] {
    return this.events.filter((e) => e.severity === severity);
  }

  /**
   * Get events in time range
   */
  getEventsInRange(startTime: number, endTime: number): AuditEvent[] {
    return this.events.filter((e) => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Export events as JSON
   */
  export(): string {
    return JSON.stringify(this.events, null, 2);
  }
}

/**
 * Global audit log instance
 */
let globalAuditLog: AuditLog | null = null;

/**
 * Get or create the global audit log
 */
export function getAuditLog(config?: AuditLogConfig): AuditLog {
  if (!globalAuditLog) {
    globalAuditLog = new AuditLog(config);
  }
  return globalAuditLog;
}

/**
 * Convenience functions for common audit events
 */
export const audit = {
  walletCreated: () =>
    getAuditLog().log(AuditEventType.WALLET_CREATED, AuditSeverity.INFO),

  walletUnlocked: () =>
    getAuditLog().log(AuditEventType.WALLET_UNLOCKED, AuditSeverity.INFO),

  walletLocked: () =>
    getAuditLog().log(AuditEventType.WALLET_LOCKED, AuditSeverity.INFO),

  accountCreated: (address: string, chainFamily: string) =>
    getAuditLog().log(AuditEventType.ACCOUNT_CREATED, AuditSeverity.INFO, {
      address,
      chainFamily,
    }),

  transactionSent: (hash: string, to: string, value: string) =>
    getAuditLog().log(AuditEventType.TRANSACTION_SENT, AuditSeverity.INFO, {
      hash,
      to,
      value,
    }),

  failedUnlock: () =>
    getAuditLog().log(AuditEventType.FAILED_UNLOCK_ATTEMPT, AuditSeverity.WARNING),

  suspiciousActivity: (description: string, details: Record<string, unknown>) =>
    getAuditLog().log(AuditEventType.SUSPICIOUS_ACTIVITY, AuditSeverity.ALERT, {
      description,
      ...details,
    }),

  mnemonicExported: () =>
    getAuditLog().log(AuditEventType.MNEMONIC_EXPORTED, AuditSeverity.WARNING),
};
