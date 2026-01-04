/**
 * Input Validation Middleware
 * Comprehensive validation utilities using Joi
 */

const Joi = require('joi');

/**
 * Validation schemas for common data types
 */
const schemas = {
  // User registration validation
  userRegistration: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required',
      }),

    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),

    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base':
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required',
      }),

    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required',
      }),
  }),

  // User login validation
  userLogin: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),

    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required',
      }),
  }),

  // Password reset request validation
  passwordResetRequest: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
  }),

  // Password reset validation
  passwordReset: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Reset token is required',
      }),

    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base':
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required',
      }),

    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required',
      }),
  }),

  // Contact form validation
  contactForm: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required',
      }),

    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),

    subject: Joi.string()
      .min(5)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.min': 'Subject must be at least 5 characters long',
        'string.max': 'Subject cannot exceed 100 characters',
        'any.required': 'Subject is required',
      }),

    message: Joi.string()
      .min(10)
      .max(1000)
      .trim()
      .required()
      .messages({
        'string.min': 'Message must be at least 10 characters long',
        'string.max': 'Message cannot exceed 1000 characters',
        'any.required': 'Message is required',
      }),
  }),

  // Trip planning validation
  tripPlanning: Joi.object({
    destination: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.min': 'Destination must be at least 2 characters long',
        'string.max': 'Destination cannot exceed 100 characters',
        'any.required': 'Destination is required',
      }),

    startDate: Joi.date()
      .min('now')
      .required()
      .messages({
        'date.min': 'Start date must be in the future',
        'any.required': 'Start date is required',
      }),

    endDate: Joi.date()
      .min(Joi.ref('startDate'))
      .required()
      .messages({
        'date.min': 'End date must be after start date',
        'any.required': 'End date is required',
      }),

    budget: Joi.number()
      .positive()
      .max(1000000)
      .required()
      .messages({
        'number.positive': 'Budget must be a positive number',
        'number.max': 'Budget cannot exceed 1,000,000',
        'any.required': 'Budget is required',
      }),

    travelers: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .required()
      .messages({
        'number.min': 'At least 1 traveler is required',
        'number.max': 'Cannot exceed 50 travelers',
        'any.required': 'Number of travelers is required',
      }),

    interests: Joi.array()
      .items(Joi.string().trim())
      .min(1)
      .max(10)
      .messages({
        'array.min': 'At least one interest is required',
        'array.max': 'Cannot exceed 10 interests',
      }),
  }),

  // Review validation
  review: Joi.object({
    placeId: Joi.string()
      .required()
      .messages({
        'any.required': 'Place ID is required',
      }),

    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .required()
      .messages({
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating cannot exceed 5',
        'any.required': 'Rating is required',
      }),

    title: Joi.string()
      .min(5)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.min': 'Title must be at least 5 characters long',
        'string.max': 'Title cannot exceed 100 characters',
        'any.required': 'Title is required',
      }),

    comment: Joi.string()
      .min(10)
      .max(1000)
      .trim()
      .required()
      .messages({
        'string.min': 'Comment must be at least 10 characters long',
        'string.max': 'Comment cannot exceed 1000 characters',
        'any.required': 'Comment is required',
      }),

    photos: Joi.array()
      .items(Joi.string().uri())
      .max(5)
      .messages({
        'array.max': 'Cannot upload more than 5 photos',
      }),
  }),

  // Pagination validation
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.min': 'Page must be at least 1',
      }),

    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100',
      }),

    sort: Joi.string()
      .valid('asc', 'desc', 'newest', 'oldest', 'popular')
      .default('desc'),
  }),

  // MongoDB ObjectId validation
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid ID format',
    }),
};

/**
 * Generic validation middleware factory
 * Creates middleware for validating request data
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Replace request data with validated and sanitized data
    req[property] = value;
    next();
  };
};

/**
 * Validate user registration
 */
const validateUserRegistration = validate(schemas.userRegistration);

/**
 * Validate user login
 */
const validateUserLogin = validate(schemas.userLogin);

/**
 * Validate password reset request
 */
const validatePasswordResetRequest = validate(schemas.passwordResetRequest);

/**
 * Validate password reset
 */
const validatePasswordReset = validate(schemas.passwordReset);

/**
 * Validate contact form
 */
const validateContactForm = validate(schemas.contactForm);

/**
 * Validate trip planning
 */
const validateTripPlanning = validate(schemas.tripPlanning);

/**
 * Validate review
 */
const validateReview = validate(schemas.review);

/**
 * Validate pagination parameters
 */
const validatePagination = validate(schemas.pagination, 'query');

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const { error } = schemas.objectId.validate(req.params[paramName]);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    next();
  };
};

/**
 * Custom validation for file uploads
 */
const validateFileUpload = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'],
    maxFiles = 5,
  } = options;

  return (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    // Check number of files
    if (req.files.length > maxFiles) {
      return res.status(400).json({
        success: false,
        message: `Cannot upload more than ${maxFiles} files`,
      });
    }

    // Validate each file
    for (const file of req.files) {
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} exceeds maximum size of ${
            maxSize / 1024 / 1024
          }MB`,
        });
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} has invalid type. Allowed types: ${allowedTypes.join(
            ', '
          )}`,
        });
      }
    }

    next();
  };
};

/**
 * Sanitize user input
 * Removes potentially dangerous characters
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove HTML tags
      return obj.replace(/<[^>]*>/g, '');
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }

    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.query) {
    req.query = sanitize(req.query);
  }

  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

module.exports = {
  // Schemas
  schemas,

  // Generic validator
  validate,

  // Specific validators
  validateUserRegistration,
  validateUserLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateContactForm,
  validateTripPlanning,
  validateReview,
  validatePagination,
  validateObjectId,
  validateFileUpload,

  // Utilities
  sanitizeInput,
};
