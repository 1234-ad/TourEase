/**
 * Error Handling Middleware
 * Centralized error handling with logging and user-friendly responses
 */

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle MongoDB cast errors (invalid ObjectId)
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB duplicate key errors
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists. Please use another value.`;
  return new AppError(message, 400);
};

/**
 * Handle MongoDB validation errors
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401);
};

/**
 * Handle JWT expired errors
 */
const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again.', 401);
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, req, res) => {
  // API error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // Rendered website error
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, req, res) => {
  // API error
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
      });
    }

    // Programming or unknown error: don't leak error details
    console.error('ERROR 💥', err);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong!',
    });
  }

  // Rendered website error
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Programming or unknown error: don't leak error details
  console.error('ERROR 💥', err);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong!',
  });
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'CastError') error = handleCastError(error);
    if (err.code === 11000) error = handleDuplicateKeyError(error);
    if (err.name === 'ValidationError') error = handleValidationError(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

/**
 * Handle 404 errors
 */
const notFoundHandler = (req, res, next) => {
  const err = new AppError(
    `Cannot find ${req.originalUrl} on this server`,
    404
  );
  next(err);
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = (server) => {
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);

    server.close(() => {
      process.exit(1);
    });
  });
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
  });
};

/**
 * Handle SIGTERM signal
 */
const handleSIGTERM = (server) => {
  process.on('SIGTERM', () => {
    console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
      console.log('💥 Process terminated!');
    });
  });
};

/**
 * Error logger middleware
 * Logs errors to console and external services
 */
const errorLogger = (err, req, res, next) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    error: {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
    },
  };

  // Log to console
  console.error('🔴 ERROR:', JSON.stringify(errorLog, null, 2));

  // In production, send to logging service (e.g., Sentry, LogRocket)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to logging service
    // Example: Sentry.captureException(err);
  }

  next(err);
};

/**
 * Common error responses
 */
const errors = {
  badRequest: (message = 'Bad request') => new AppError(message, 400),
  unauthorized: (message = 'Unauthorized') => new AppError(message, 401),
  forbidden: (message = 'Forbidden') => new AppError(message, 403),
  notFound: (message = 'Not found') => new AppError(message, 404),
  conflict: (message = 'Conflict') => new AppError(message, 409),
  tooManyRequests: (message = 'Too many requests') =>
    new AppError(message, 429),
  internalServer: (message = 'Internal server error') =>
    new AppError(message, 500),
};

/**
 * Success response helper
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Paginated response helper
 */
const paginatedResponse = (
  res,
  data,
  page,
  limit,
  total,
  message = 'Success'
) => {
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

/**
 * Validation error response
 */
const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors,
  });
};

module.exports = {
  // Error class
  AppError,

  // Error handlers
  errorHandler,
  notFoundHandler,
  errorLogger,
  asyncHandler,

  // Process handlers
  handleUnhandledRejection,
  handleUncaughtException,
  handleSIGTERM,

  // Common errors
  errors,

  // Response helpers
  successResponse,
  paginatedResponse,
  validationErrorResponse,
};
