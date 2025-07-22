const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'smartroute-server' },
  transports: [
    // Error logs - separate file for errors only
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: customFormat
    }),
    
    // Combined logs - all levels
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: customFormat
    }),
    
    // API access logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '14d',
      format: customFormat
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Create specialized loggers for different components
const createComponentLogger = (component) => {
  return {
    info: (message, meta = {}) => logger.info(message, { component, ...meta }),
    error: (message, meta = {}) => logger.error(message, { component, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { component, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { component, ...meta }),
    http: (message, meta = {}) => logger.http(message, { component, ...meta })
  };
};

// Export loggers for different components
module.exports = {
  logger,
  authLogger: createComponentLogger('auth'),
  apiLogger: createComponentLogger('api'),
  dbLogger: createComponentLogger('database'),
  bookingLogger: createComponentLogger('booking'),
  errorLogger: createComponentLogger('error')
};