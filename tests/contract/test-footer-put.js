/**
 * T005: Contract test PUT /.netlify/functions/footer endpoint
 * Tests: 200 update success, 400 validation errors, 401 unauthorized
 * THIS TEST MUST FAIL BEFORE IMPLEMENTATION
 */

const request = require('supertest');
const { validateSchema, isValidHexColor, isValidEnum } = require('./footer-api.test');

describe('PUT /.netlify/functions/footer Contract Tests', () => {
  const baseURL = 'http://localhost:8080/.netlify/functions';
  const validApiKey = process.env.ADMIN_API_KEY || 'test-api-key';
  
  const validFooterRequest = {
    footer_text: "UPDATED CONTENT <separator> TEST MESSAGE",
    text_color: "#1a1a1a",
    background_color: "#c19d6c",
    font_size: "3vh",
    scroll_speed: 10,
    scroll_direction: "continuous",
    separator_type: "crown",
    custom_separator: null,
    is_visible: true
  };

  test('Should return 200 and updated configuration with valid request', async () => {
    const response = await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send(validFooterRequest)
      .expect(200);

    // Validate response has FooterConfiguration schema
    const requiredFields = [
      'id', 'footer_text', 'text_color', 'background_color', 
      'scroll_speed', 'scroll_direction', 'separator_type',
      'is_visible', 'is_active', 'created_at', 'updated_at'
    ];

    expect(() => validateSchema(response.body, requiredFields)).not.toThrow();

    // Verify the updated values are returned
    expect(response.body.footer_text).toBe(validFooterRequest.footer_text);
    expect(response.body.text_color).toBe(validFooterRequest.text_color);
    expect(response.body.background_color).toBe(validFooterRequest.background_color);
    expect(response.body.scroll_speed).toBe(validFooterRequest.scroll_speed);
    expect(response.body.is_visible).toBe(validFooterRequest.is_visible);

    // Updated timestamp should be recent
    const updatedAt = new Date(response.body.updated_at);
    const now = new Date();
    expect(updatedAt.getTime()).toBeCloseTo(now.getTime(), -4); // Within ~10 seconds
  });

  test('Should return 401 when API key is missing', async () => {
    const response = await request(baseURL)
      .put('/footer')
      .send(validFooterRequest)
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('code');
    expect(typeof response.body.error).toBe('string');
  });

  test('Should return 401 when API key is invalid', async () => {
    const response = await request(baseURL)
      .put('/footer')
      .set('X-API-Key', 'invalid-key')
      .send(validFooterRequest)
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('code');
  });

  test('Should return 400 with validation errors for invalid data', async () => {
    const invalidRequest = {
      footer_text: "", // Empty text
      text_color: "invalid-color", // Invalid hex
      background_color: "#ZZZ", // Invalid hex format
      scroll_speed: 150, // Out of range (max 100)
      scroll_direction: "invalid", // Invalid enum
      separator_type: "nonexistent", // Invalid enum
      is_visible: "not-boolean" // Invalid type
    };

    const response = await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send(invalidRequest)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('code');
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body).toHaveProperty('details');
    expect(Array.isArray(response.body.details)).toBe(true);

    // Should have validation errors for multiple fields
    expect(response.body.details.length).toBeGreaterThan(0);
    
    // Each validation error should have field and message
    response.body.details.forEach(detail => {
      expect(detail).toHaveProperty('field');
      expect(detail).toHaveProperty('message');
      expect(typeof detail.field).toBe('string');
      expect(typeof detail.message).toBe('string');
    });
  });

  test('Should validate scroll_speed constraints', async () => {
    // Test below minimum
    let response = await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send({ ...validFooterRequest, scroll_speed: 0 })
      .expect(400);

    expect(response.body.details.some(d => d.field === 'scroll_speed')).toBe(true);

    // Test above maximum
    response = await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send({ ...validFooterRequest, scroll_speed: 101 })
      .expect(400);

    expect(response.body.details.some(d => d.field === 'scroll_speed')).toBe(true);
  });

  test('Should validate hex color format', async () => {
    const invalidColorRequest = {
      ...validFooterRequest,
      text_color: "#GGG", // Invalid hex characters
      background_color: "red" // Not hex format
    };

    const response = await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send(invalidColorRequest)
      .expect(400);

    expect(response.body.details.some(d => d.field === 'text_color')).toBe(true);
    expect(response.body.details.some(d => d.field === 'background_color')).toBe(true);
  });

  test('Should require custom_separator when separator_type is custom', async () => {
    const customSeparatorRequest = {
      ...validFooterRequest,
      separator_type: "custom",
      custom_separator: null // Should be required when type is custom
    };

    const response = await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send(customSeparatorRequest)
      .expect(400);

    expect(response.body.details.some(d => d.field === 'custom_separator')).toBe(true);
  });

  test('Should accept valid custom separator', async () => {
    const customSeparatorRequest = {
      ...validFooterRequest,
      separator_type: "custom",
      custom_separator: " | "
    };

    const response = await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send(customSeparatorRequest)
      .expect(200);

    expect(response.body.separator_type).toBe("custom");
    expect(response.body.custom_separator).toBe(" | ");
  });

  test('Should validate enhanced configuration fields', async () => {
    const enhancedRequest = {
      ...validFooterRequest,
      opacity: 1.5, // Out of range (max 1.0)
      animation_timing: "invalid-timing", // Invalid enum
      separator_color: "not-hex", // Invalid hex color
      separator_spacing: "invalid-css" // Invalid CSS value (hard to validate automatically)
    };

    const response = await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send(enhancedRequest)
      .expect(400);

    expect(response.body.details.some(d => d.field === 'opacity')).toBe(true);
    expect(response.body.details.some(d => d.field === 'animation_timing')).toBe(true);
    expect(response.body.details.some(d => d.field === 'separator_color')).toBe(true);
  });

  test('Should handle missing required fields', async () => {
    const incompleteRequest = {
      footer_text: "Some text"
      // Missing required fields
    };

    const response = await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send(incompleteRequest)
      .expect(400);

    expect(response.body).toHaveProperty('details');
    expect(Array.isArray(response.body.details)).toBe(true);
  });

  test('Should preserve configuration atomicity on validation failure', async () => {
    // Get current configuration first
    const currentConfig = await request(baseURL)
      .get('/footer')
      .expect(200);

    // Try to update with invalid data
    await request(baseURL)
      .put('/footer')
      .set('X-API-Key', validApiKey)
      .send({ scroll_speed: 150 }) // Invalid
      .expect(400);

    // Verify configuration unchanged
    const afterFailedUpdate = await request(baseURL)
      .get('/footer')
      .expect(200);

    expect(afterFailedUpdate.body.updated_at).toBe(currentConfig.body.updated_at);
  });
});