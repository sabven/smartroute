const morgan = require('morgan');
const { apiLogger } = require('../logger');

// Create custom morgan token for request ID
morgan.token('id', function getId(req) {
  return req.id || 'no-id';
});

// Custom morgan format
const morganFormat = ':id :method :url :status :res[content-length] - :response-time ms';

// Morgan middleware with winston integration
const requestLogger = morgan(morganFormat, {
  stream: {
    write: (message) => {
      apiLogger.http(message.trim());
    }
  }
});

// Request ID middleware
const requestIdMiddleware = (req, res, next) => {
  req.id = Math.random().toString(36).substr(2, 9);
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  const { errorLogger } = require('../logger');
  
  errorLogger.error('Request error', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code || 'UNKNOWN'
    },
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  next(err);
};

// Success logging middleware for important actions
const actionLogger = (action) => (req, res, next) => {
  const { apiLogger } = require('../logger');
  
  res.on('finish', () => {
    if (res.statusCode < 400) {
      apiLogger.info(`Action: ${action}`, {
        requestId: req.id,
        userId: req.user?.id,
        userEmail: req.user?.email,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        ip: req.ip
      });
    }
  });
  
  next();
};

module.exports = {
  requestLogger,
  requestIdMiddleware,
  errorLogger,
  actionLogger
};