/**
 * Contract Test: PUT /.netlify/functions/footer
 * 
 * Tests the API contract for updating footer configuration
 * Based on: /specs/006-footer-fix-n/contracts/footer-api.json
 */

const request = require('supertest');

describe('PUT /.netlify/functions/footer - Contract Test', () => {
  const baseURL = 'http://localhost:8080';
  const validApiKey = process.env.ADMIN_API_KEY || 'test-admin-key';

  beforeAll(async () => {
    // Ensure test server is running
    // This test MUST FAIL initially until proper implementation
  });

  describe('Successful Update (200)', () => {
    test('should update footer configuration and return updated config', async () => {
      const updatePayload = {
        footer_text: 'Test Footer Message',
        is_active: true,
        scroll_speed: 75,
        text_color: '#FF0000',
        background_color: '#0000FF',
        font_size: '4vh',
        scroll_direction: 'left'
      };

      const response = await request(baseURL)
        .put('/.netlify/functions/footer')
        .set('X-API-Key', validApiKey)
        .send(updatePayload)
        .expect(200);

      // Contract: Response must be JSON
      expect(response.headers['content-type']).toMatch(/application\/json/);

      // Contract: Must return updated configuration
      expect(response.body).toHaveProperty('id');
      expect(response.body.footer_text).toBe(updatePayload.footer_text);
      expect(response.body.is_active).toBe(updatePayload.is_active);
      expect(response.body.scroll_speed).toBe(updatePayload.scroll_speed);
      expect(response.body.text_color).toBe(updatePayload.text_color);
      expect(response.body.background_color).toBe(updatePayload.background_color);
      expect(response.body.font_size).toBe(updatePayload.font_size);
      expect(response.body.scroll_direction).toBe(updatePayload.scroll_direction);

      // Contract: Must update timestamp
      expect(response.body).toHaveProperty('updated_at');
      expect(new Date(response.body.updated_at).toISOString()).toBe(response.body.updated_at);
    });

    test('should accept partial updates', async () => {
      const partialUpdate = {
        is_active: false,
        text_color: '#00FF00'
      };

      const response = await request(baseURL)
        .put('/.netlify/functions/footer')
        .set('X-API-Key', validApiKey)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.is_active).toBe(false);
      expect(response.body.text_color).toBe('#00FF00');
      expect(response.body).toHaveProperty('updated_at');
    });
  });

  describe('Authentication Errors', () => {
    test('should return 401 when no API key provided', async () => {
      const updatePayload = { is_active: true };

      const response = await request(baseURL)
        .put('/.netlify/functions/footer')
        .send(updatePayload)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 403 when invalid API key provided', async () => {
      const updatePayload = { is_active: true };

      const response = await request(baseURL)
        .put('/.netlify/functions/footer')
        .set('X-API-Key', 'invalid-key')
        .send(updatePayload)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Validation Errors (400)', () => {
    test('should reject invalid color format', async () => {
      const invalidPayload = {
        text_color: 'not-a-color'
      };

      const response = await request(baseURL)
        .put('/.netlify/functions/footer')
        .set('X-API-Key', validApiKey)
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      
      const fieldError = response.body.details.find(detail => detail.field === 'text_color');
      expect(fieldError).toBeDefined();
      expect(fieldError.message).toMatch(/color/i);
    });

    test('should reject invalid scroll_speed range', async () => {
      const invalidPayload = {
        scroll_speed: 300  // Over maximum of 200
      };

      const response = await request(baseURL)
        .put('/.netlify/functions/footer')
        .set('X-API-Key', validApiKey)
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('details');
      
      const fieldError = response.body.details.find(detail => detail.field === 'scroll_speed');
      expect(fieldError).toBeDefined();
    });

    test('should reject invalid scroll_direction', async () => {
      const invalidPayload = {
        scroll_direction: 'up'  // Not in enum [left, right]
      };

      const response = await request(baseURL)
        .put('/.netlify/functions/footer')
        .set('X-API-Key', validApiKey)
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('details');
      
      const fieldError = response.body.details.find(detail => detail.field === 'scroll_direction');
      expect(fieldError).toBeDefined();
    });

    test('should reject footer_text over 500 characters', async () => {
      const invalidPayload = {
        footer_text: 'a'.repeat(501)  // Over maximum length
      };

      const response = await request(baseURL)
        .put('/.netlify/functions/footer')
        .set('X-API-Key', validApiKey)
        .send(invalidPayload)
        .expect(400);

      expect(response.body).toHaveProperty('details');
      
      const fieldError = response.body.details.find(detail => detail.field === 'footer_text');
      expect(fieldError).toBeDefined();
    });
  });
});