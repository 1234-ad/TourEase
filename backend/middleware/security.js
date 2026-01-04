/**
 * Security Middleware
 * Comprehensive security utilities for API protection
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

/**
 * Rate limiting configuration
 * Prevents brute force attacks and API abuse
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs, // Time window in milliseconds
    max, // Max requests per window
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force login attempts
 */
const authRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5 // 5 requests per window
);

/**
 * General API rate limiter
 * Prevents API abuse
 */
const apiRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100 // 100 requests per window
);

/**
 * Strict rate limiter for sensitive operations
 * Password reset, email verification, etc.
 */
const sensitiveRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  3 // 3 requests per hour
);

/**
 * Security headers middleware
 * Sets various HTTP headers for security
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
});

/**
 * Data sanitization middleware
 * Prevents NoSQL injection attacks
 */
const sanitizeData = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️ Sanitized key: ${key} in request from ${req.ip}`);
  },
});

/**
 * XSS protection middleware
 * Prevents cross-site scripting attacks
 */
const xssProtection = xss();

/**
 * HTTP Parameter Pollution protection
 * Prevents parameter pollution attacks
 */
const hppProtection = hpp({
  whitelist: ['sort', 'fields', 'page', 'limit'], // Allow these params to be duplicated
});

/**
 * CORS configuration
 * Secure cross-origin resource sharing
 */
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://tour-ease-joh5.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'https://tourease-2.onrender.com',
    ].filter(Boolean); // Remove undefined values

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

/**
 * Request logging middleware
 * Logs all incoming requests for security monitoring
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  console.log(`📥 ${req.method} ${req.path} - ${req.ip}`);

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : '🟢';
    console.log(
      `${statusColor} ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

/**
 * IP whitelist middleware
 * Restricts access to specific IP addresses (for admin routes)
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (allowedIPs.length === 0 || allowedIPs.includes(clientIP)) {
      next();
    } else {
      console.warn(`⚠️ Blocked request from unauthorized IP: ${clientIP}`);
      res.status(403).json({
        success: false,
        message: 'Access denied. Your IP is not authorized.',
      });
    }
  };
};

/**
 * API key validation middleware
 * Validates API key for external integrations
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required',
    });
  }

  if (apiKey !== process.env.API_KEY) {
    console.warn(`⚠️ Invalid API key attempt from ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
    });
  }

  next();
};

/**
 * Request size limiter
 * Prevents large payload attacks
 */
const requestSizeLimiter = {
  json: { limit: '10mb' },
  urlencoded: { limit: '10mb', extended: true },
};

/**
 * Security audit logger
 * Logs security-related events
 */
const securityAuditLogger = (event, details) => {
  const timestamp = new Date().toISOString();
  console.log(`🔒 [SECURITY AUDIT] ${timestamp} - ${event}:`, details);

  // In production, send to logging service (e.g., Winston, Sentry)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to logging service
  }
};

/**
 * Suspicious activity detector
 * Detects and logs suspicious patterns
 */
const detectSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /(\.\.|\/etc\/|\/proc\/|\/sys\/)/i, // Path traversal
    /(union|select|insert|update|delete|drop|create|alter)/i, // SQL injection
    /(<script|javascript:|onerror=|onload=)/i, // XSS attempts
    /(eval\(|exec\(|system\()/i, // Code injection
  ];

  const checkString = `${req.path} ${JSON.stringify(req.query)} ${JSON.stringify(
    req.body
  )}`;

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      securityAuditLogger('Suspicious Activity Detected', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        userAgent: req.headers['user-agent'],
        pattern: pattern.toString(),
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid request detected',
      });
    }
  }

  next();
};

/**
 * Apply all security middleware
 * Convenience function to apply all security measures
 */
const applySecurityMiddleware = (app) => {
  // Security headers
  app.use(securityHeaders);

  // Request logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  // Data sanitization
  app.use(sanitizeData);
  app.use(xssProtection);
  app.use(hppProtection);

  // Suspicious activity detection
  app.use(detectSuspiciousActivity);

  console.log('✅ Security middleware applied');
};

module.exports = {
  // Rate limiters
  authRateLimiter,
  apiRateLimiter,
  sensitiveRateLimiter,
  createRateLimiter,

  // Security middleware
  securityHeaders,
  sanitizeData,
  xssProtection,
  hppProtection,
  corsOptions,

  // Utility middleware
  requestLogger,
  ipWhitelist,
  validateApiKey,
  requestSizeLimiter,

  // Security utilities
  securityAuditLogger,
  detectSuspiciousActivity,
  applySecurityMiddleware,
};
