/**
 * Unit Tests for Validation Middleware
 * Tests for input validation and sanitization
 */

const {
  schemas,
  validate,
  validateUserRegistration,
  validateUserLogin,
  validateContactForm,
  sanitizeInput,
} = require('../middleware/validation');

describe('Validation Middleware', () => {
  describe('User Registration Validation', () => {
    it('should validate correct registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const { error } = schemas.userRegistration.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject short names', () => {
      const invalidData = {
        name: 'J',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const { error } = schemas.userRegistration.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('at least 2 characters');
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const { error } = schemas.userRegistration.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('valid email');
    });

    it('should reject weak passwords', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
        confirmPassword: 'weak',
      };

      const { error } = schemas.userRegistration.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
      };

      const { error } = schemas.userRegistration.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('do not match');
    });

    it('should normalize email to lowercase', () => {
      const data = {
        name: 'John Doe',
        email: 'JOHN@EXAMPLE.COM',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const { value } = schemas.userRegistration.validate(data);
      expect(value.email).toBe('john@example.com');
    });
  });

  describe('User Login Validation', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'john@example.com',
        password: 'Password123!',
      };

      const { error } = schemas.userLogin.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'Password123!',
      };

      const { error } = schemas.userLogin.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Email is required');
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'john@example.com',
      };

      const { error } = schemas.userLogin.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Password is required');
    });
  });

  describe('Contact Form Validation', () => {
    it('should validate correct contact form data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message with enough characters.',
      };

      const { error } = schemas.contactForm.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject short subject', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Hi',
        message: 'This is a test message with enough characters.',
      };

      const { error } = schemas.contactForm.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('at least 5 characters');
    });

    it('should reject short message', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Short',
      };

      const { error } = schemas.contactForm.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('at least 10 characters');
    });

    it('should reject message exceeding max length', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'a'.repeat(1001),
      };

      const { error } = schemas.contactForm.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('cannot exceed 1000 characters');
    });
  });

  describe('Trip Planning Validation', () => {
    it('should validate correct trip planning data', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const validData = {
        destination: 'Paris',
        startDate: tomorrow,
        endDate: nextWeek,
        budget: 5000,
        travelers: 2,
        interests: ['culture', 'food'],
      };

      const { error } = schemas.tripPlanning.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject past start date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const invalidData = {
        destination: 'Paris',
        startDate: yesterday,
        endDate: tomorrow,
        budget: 5000,
        travelers: 2,
        interests: ['culture'],
      };

      const { error } = schemas.tripPlanning.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must be in the future');
    });

    it('should reject end date before start date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const invalidData = {
        destination: 'Paris',
        startDate: tomorrow,
        endDate: yesterday,
        budget: 5000,
        travelers: 2,
        interests: ['culture'],
      };

      const { error } = schemas.tripPlanning.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject negative budget', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const invalidData = {
        destination: 'Paris',
        startDate: tomorrow,
        endDate: nextWeek,
        budget: -1000,
        travelers: 2,
        interests: ['culture'],
      };

      const { error } = schemas.tripPlanning.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('positive number');
    });

    it('should reject zero travelers', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const invalidData = {
        destination: 'Paris',
        startDate: tomorrow,
        endDate: nextWeek,
        budget: 5000,
        travelers: 0,
        interests: ['culture'],
      };

      const { error } = schemas.tripPlanning.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('At least 1 traveler');
    });
  });

  describe('Review Validation', () => {
    it('should validate correct review data', () => {
      const validData = {
        placeId: '507f1f77bcf86cd799439011',
        rating: 5,
        title: 'Great place!',
        comment: 'This is a wonderful place to visit. Highly recommended!',
        photos: ['https://example.com/photo1.jpg'],
      };

      const { error } = schemas.review.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject rating below 1', () => {
      const invalidData = {
        placeId: '507f1f77bcf86cd799439011',
        rating: 0,
        title: 'Great place!',
        comment: 'This is a wonderful place to visit.',
      };

      const { error } = schemas.review.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('at least 1');
    });

    it('should reject rating above 5', () => {
      const invalidData = {
        placeId: '507f1f77bcf86cd799439011',
        rating: 6,
        title: 'Great place!',
        comment: 'This is a wonderful place to visit.',
      };

      const { error } = schemas.review.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('cannot exceed 5');
    });

    it('should reject more than 5 photos', () => {
      const invalidData = {
        placeId: '507f1f77bcf86cd799439011',
        rating: 5,
        title: 'Great place!',
        comment: 'This is a wonderful place to visit.',
        photos: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg',
          'https://example.com/6.jpg',
        ],
      };

      const { error } = schemas.review.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('more than 5 photos');
    });
  });

  describe('Input Sanitization', () => {
    it('should remove HTML tags from strings', () => {
      const req = {
        body: {
          name: '<script>alert("xss")</script>John',
          message: '<b>Bold</b> text',
        },
        query: {},
        params: {},
      };

      const res = {};
      const next = jest.fn();

      sanitizeInput(req, res, next);

      expect(req.body.name).toBe('John');
      expect(req.body.message).toBe('Bold text');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize nested objects', () => {
      const req = {
        body: {
          user: {
            name: '<script>alert("xss")</script>John',
            profile: {
              bio: '<b>Bold</b> bio',
            },
          },
        },
        query: {},
        params: {},
      };

      const res = {};
      const next = jest.fn();

      sanitizeInput(req, res, next);

      expect(req.body.user.name).toBe('John');
      expect(req.body.user.profile.bio).toBe('Bold bio');
    });

    it('should sanitize arrays', () => {
      const req = {
        body: {
          tags: ['<script>tag1</script>', '<b>tag2</b>'],
        },
        query: {},
        params: {},
      };

      const res = {};
      const next = jest.fn();

      sanitizeInput(req, res, next);

      expect(req.body.tags[0]).toBe('tag1');
      expect(req.body.tags[1]).toBe('tag2');
    });
  });

  describe('Pagination Validation', () => {
    it('should validate correct pagination parameters', () => {
      const validData = {
        page: 1,
        limit: 10,
        sort: 'desc',
      };

      const { error } = schemas.pagination.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should use default values for missing parameters', () => {
      const data = {};

      const { value } = schemas.pagination.validate(data);
      expect(value.page).toBe(1);
      expect(value.limit).toBe(10);
      expect(value.sort).toBe('desc');
    });

    it('should reject page less than 1', () => {
      const invalidData = {
        page: 0,
        limit: 10,
      };

      const { error } = schemas.pagination.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('at least 1');
    });

    it('should reject limit exceeding 100', () => {
      const invalidData = {
        page: 1,
        limit: 101,
      };

      const { error } = schemas.pagination.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('cannot exceed 100');
    });
  });

  describe('MongoDB ObjectId Validation', () => {
    it('should validate correct ObjectId', () => {
      const validId = '507f1f77bcf86cd799439011';

      const { error } = schemas.objectId.validate(validId);
      expect(error).toBeUndefined();
    });

    it('should reject invalid ObjectId', () => {
      const invalidId = 'invalid-id';

      const { error } = schemas.objectId.validate(invalidId);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Invalid ID format');
    });

    it('should reject short ObjectId', () => {
      const invalidId = '507f1f77';

      const { error } = schemas.objectId.validate(invalidId);
      expect(error).toBeDefined();
    });
  });
});
