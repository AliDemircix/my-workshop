/**
 * Centralized logging utility for the application
 * Provides structured logging with different levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;
    let formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context)}`;
    }
    
    if (error) {
      formatted += ` | Error: ${error.message}`;
      if (this.isDevelopment && error.stack) {
        formatted += `\nStack: ${error.stack}`;
      }
    }
    
    return formatted;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error
    };

    const formatted = this.formatMessage(entry);

    // In development, use console methods for better DevTools experience
    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.debug(formatted);
          break;
        case 'info':
          console.info(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        case 'error':
          console.error(formatted);
          break;
      }
    } else {
      // In production, use structured logging (could be sent to external service)
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    this.log('error', message, context, error);
  }

  // Helper methods for common use cases
  emailError(operation: string, error: Error, context?: Record<string, any>) {
    this.error(`Email operation failed: ${operation}`, { ...context, errorType: 'email' }, error);
  }

  webhookError(event: string, error: Error, context?: Record<string, any>) {
    this.error(`Webhook processing failed: ${event}`, { ...context, errorType: 'webhook' }, error);
  }

  smtpWarning(message: string) {
    this.warn(`SMTP: ${message}`, { category: 'smtp' });
  }
}

// Export singleton instance
export const logger = new Logger();