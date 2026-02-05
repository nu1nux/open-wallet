/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/**
 * Log entry
 */
export interface LogEntry {
  level: LogLevel;
  timestamp: number;
  context: string;
  message: string;
  data?: unknown;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  context: string;
  handler?: (entry: LogEntry) => void;
}

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.SILENT]: 'SILENT',
};

/**
 * Default log handler that writes to console
 */
function defaultHandler(entry: LogEntry): void {
  const timestamp = new Date(entry.timestamp).toISOString();
  const levelName = LOG_LEVEL_NAMES[entry.level];
  const prefix = `[${timestamp}] [${levelName}] [${entry.context}]`;

  switch (entry.level) {
    case LogLevel.DEBUG:
      // eslint-disable-next-line no-console
      console.debug(prefix, entry.message, entry.data ?? '');
      break;
    case LogLevel.INFO:
      // eslint-disable-next-line no-console
      console.info(prefix, entry.message, entry.data ?? '');
      break;
    case LogLevel.WARN:
      console.warn(prefix, entry.message, entry.data ?? '');
      break;
    case LogLevel.ERROR:
      console.error(prefix, entry.message, entry.data ?? '');
      break;
  }
}

/**
 * Global log level
 */
let globalLogLevel = LogLevel.INFO;

/**
 * Set global log level
 */
export function setGlobalLogLevel(level: LogLevel): void {
  globalLogLevel = level;
}

/**
 * Get global log level
 */
export function getGlobalLogLevel(): LogLevel {
  return globalLogLevel;
}

/**
 * Logger class
 */
export class Logger {
  private readonly config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> & { context: string }) {
    this.config = {
      level: config.level ?? globalLogLevel,
      context: config.context,
      handler: config.handler ?? defaultHandler,
    };
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (level < this.config.level || level < globalLogLevel) {
      return;
    }

    const entry: LogEntry = {
      level,
      timestamp: Date.now(),
      context: this.config.context,
      message,
      data,
    };

    this.config.handler?.(entry);
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }

  child(subContext: string): Logger {
    return new Logger({
      ...this.config,
      context: `${this.config.context}:${subContext}`,
    });
  }
}

/**
 * Create a logger with a specific context
 */
export function createLogger(context: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger({ ...config, context });
}
