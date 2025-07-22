export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  url?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  stack?: string;
}

class ClientLogger {
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;
  private flushInterval = 30000; // 30 seconds
  private logLevel = LogLevel.INFO;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandling();
    this.setupPeriodicFlush();
    this.logLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    if (data) {
      entry.data = typeof data === 'object' ? data : { value: data };
    }

    // Add stack trace for errors
    if (level === LogLevel.ERROR && data instanceof Error) {
      entry.stack = data.stack;
    }

    return entry;
  }

  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry);
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      const style = this.getConsoleStyle(entry.level);
      console.log(`%c[${entry.level.toUpperCase()}] ${entry.message}`, style, entry.data || '');
    }

    // Auto-flush if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush();
    }

    // Auto-flush for errors
    if (entry.level === LogLevel.ERROR) {
      this.flush();
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return 'color: #888';
      case LogLevel.INFO: return 'color: #007acc';
      case LogLevel.WARN: return 'color: #ff8800';
      case LogLevel.ERROR: return 'color: #cc0000; font-weight: bold';
      default: return '';
    }
  }

  private setupGlobalErrorHandling() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled JavaScript error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  private setupPeriodicFlush() {
    setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  private async flush() {
    if (this.logBuffer.length === 0) return;

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await fetch('/api/logs/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs })
      });
    } catch (error) {
      // Fallback: store in localStorage if server is unavailable
      this.storeLogsLocally(logs);
    }
  }

  private storeLogsLocally(logs: LogEntry[]) {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('client_logs') || '[]');
      const allLogs = [...existingLogs, ...logs].slice(-200); // Keep last 200 logs
      localStorage.setItem('client_logs', JSON.stringify(allLogs));
    } catch (error) {
      // localStorage might be full or unavailable
      console.warn('Unable to store logs locally:', error);
    }
  }

  // Public logging methods
  debug(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    this.addToBuffer(this.createLogEntry(LogLevel.DEBUG, message, data));
  }

  info(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    this.addToBuffer(this.createLogEntry(LogLevel.INFO, message, data));
  }

  warn(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    this.addToBuffer(this.createLogEntry(LogLevel.WARN, message, data));
  }

  error(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    this.addToBuffer(this.createLogEntry(LogLevel.ERROR, message, data));
  }

  // Utility methods
  setUserId(userId: string) {
    this.logBuffer.forEach(entry => entry.userId = userId);
  }

  // API call logging
  logApiCall(method: string, url: string, status: number, duration: number, error?: any) {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    const message = `API ${method} ${url} - ${status}`;
    
    this.addToBuffer(this.createLogEntry(level, message, {
      method,
      url,
      status,
      duration,
      error: error?.message || error
    }));
  }

  // User action logging
  logUserAction(action: string, data?: any) {
    this.info(`User action: ${action}`, data);
  }

  // Performance logging
  logPerformance(metric: string, value: number, unit: string = 'ms') {
    this.debug(`Performance: ${metric}`, { value, unit });
  }
}

// Create singleton instance
const logger = new ClientLogger();

export default logger;