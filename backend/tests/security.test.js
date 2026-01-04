/**
 * Unit Tests for Security Middleware
 * Tests for rate limiting, sanitization, and security features
 */

const request = require('supertest');
const express = require('express');
const {
  authRateLimiter,
  apiRateLimiter,
  detectSuspiciousActivity,
  corsOptions,
} = require('../middleware/security');

describe('Security Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      app.use('/api/test', apiRateLimiter, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/api/test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should block requests exceeding rate limit', async () => {
      app.use('/api/auth/login', authRateLimiter, (req, res) => {
        res.json({ success: true });
      });

      // Make 6 requests (limit is 5)
      for (let i = 0; i < 6; i++) {
        const response = await request(app).post('/api/auth/login');

        if (i < 5) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(429);
          expect(response.body.success).toBe(false);
        }
      }
    });
  });

  describe('Suspicious Activity Detection', () => {
    beforeEach(() => {
      app.use(detectSuspiciousActivity);
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should block path traversal attempts', async () => {
      const response = await request(app).get('/api/test?path=../../etc/passwd');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid request detected');
    });

    it('should block SQL injection attempts', async () => {
      const response = await request(app)
        .get('/api/test')
        .query({ search: "' OR 1=1--" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should block XSS attempts', async () => {
      const response = await request(app)
        .get('/api/test')
        .query({ name: '<script>alert("xss")</script>' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should allow legitimate requests', async () => {
      const response = await request(app)
        .get('/api/test')
        .query({ search: 'legitimate query' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from allowed origins', () => {
      const allowedOrigin = 'http://localhost:5173';
      const callback = jest.fn();

      corsOptions.origin(allowedOrigin, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should block requests from disallowed origins', () => {
      const disallowedOrigin = 'http://malicious-site.com';
      const callback = jest.fn();

      corsOptions.origin(disallowedOrigin, callback);

      expect(callback).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should allow requests with no origin', () => {
      const callback = jest.fn();

      corsOptions.origin(undefined, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });
  });
});
