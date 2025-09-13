/**
 * T004: Contract test GET /.netlify/functions/footer endpoint
 * Tests: 200 response with FooterConfiguration schema, 204 no active config, 404 not visible
 * THIS TEST MUST FAIL BEFORE IMPLEMENTATION
 */

const request = require('supertest');
const { validateSchema, isValidHexColor, isValidEnum } = require('./footer-api.test');

describe('GET /.netlify/functions/footer Contract Tests', () => {
  const baseURL = 'http://localhost:8080/.netlify/functions';

  test('Should return 200 with valid FooterConfiguration schema when active config exists', async () => {
    const response = await request(baseURL)
      .get('/footer')
      .expect(200);

    // Validate required fields from OpenAPI schema
    const requiredFields = [
      'id', 'footer_text', 'text_color', 'background_color', 
      'scroll_speed', 'scroll_direction', 'separator_type',
      'is_visible', 'is_active', 'created_at', 'updated_at'
    ];

    expect(() => validateSchema(response.body, requiredFields)).not.toThrow();

    // Validate data types and constraints
    expect(typeof response.body.id).toBe('number');
    expect(typeof response.body.footer_text).toBe('string');
    expect(response.body.footer_text.length).toBeLessThanOrEqual(10000);
    
    // Validate hex colors
    expect(isValidHexColor(response.body.text_color)).toBe(true);
    expect(isValidHexColor(response.body.background_color)).toBe(true);
    
    // Validate scroll speed constraints
    expect(response.body.scroll_speed).toBeGreaterThanOrEqual(1);
    expect(response.body.scroll_speed).toBeLessThanOrEqual(100);
    
    // Validate enums
    expect(isValidEnum(response.body.scroll_direction, ['continuous', 'discrete', 'static'])).toBe(true);
    expect(isValidEnum(response.body.separator_type, ['custom', 'crown', 'star', 'dot', 'dash', 'space'])).toBe(true);
    
    // Validate boolean flags
    expect(typeof response.body.is_visible).toBe('boolean');
    expect(typeof response.body.is_active).toBe('boolean');
    expect(response.body.is_active).toBe(true); // Should be active when returned
    
    // Validate timestamps
    expect(new Date(response.body.created_at)).toBeInstanceOf(Date);
    expect(new Date(response.body.updated_at)).toBeInstanceOf(Date);
  });

  test('Should return 204 when no active footer configuration found', async () => {
    // This test assumes no active configuration exists
    // Will be implemented when we can control test data
    await request(baseURL)
      .get('/footer')
      .expect(204);
  });

  test('Should return 404 with error schema when footer not visible', async () => {
    // This test assumes active config exists but is not visible
    const response = await request(baseURL)
      .get('/footer')
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('code');
    expect(response.body.code).toBe('FOOTER_NOT_VISIBLE');
    expect(typeof response.body.error).toBe('string');
  });

  test('Should return proper Content-Type header', async () => {
    const response = await request(baseURL)
      .get('/footer');

    if (response.status === 200) {
      expect(response.headers['content-type']).toMatch(/application\/json/);
    }
  });

  test('Should handle server errors gracefully', async () => {
    // This will test 500 error handling when database issues occur
    // Implementation will need to handle database connection failures
    
    // For now, we expect the endpoint to exist and respond
    const response = await request(baseURL)
      .get('/footer');

    // Should not return unhandled errors
    expect(response.status).not.toBe(500);
  });

  test('Should respect cache headers for performance', async () => {
    const response = await request(baseURL)
      .get('/footer');

    if (response.status === 200) {
      // Should have cache control headers for performance
      expect(response.headers).toHaveProperty('cache-control');
    }
  });

  // Test for new schema fields that don't exist yet
  test('Should include enhanced configuration fields in response', async () => {
    const response = await request(baseURL)
      .get('/footer')
      .expect(200);

    // These fields are added in the migration - should exist after implementation
    const enhancedFields = [
      'font_size', 'separator_type', 'custom_separator', 'is_visible',
      'separator_spacing', 'separator_color', 'animation_timing',
      'pause_on_hover', 'reverse_on_complete', 'opacity',
      'text_shadow', 'border_radius'
    ];

    enhancedFields.forEach(field => {
      expect(response.body).toHaveProperty(field);
    });

    // Validate new field constraints
    if (response.body.opacity !== null) {
      expect(response.body.opacity).toBeGreaterThanOrEqual(0.0);
      expect(response.body.opacity).toBeLessThanOrEqual(1.0);
    }

    if (response.body.separator_color !== null) {
      expect(isValidHexColor(response.body.separator_color)).toBe(true);
    }

    expect(isValidEnum(response.body.animation_timing, ['linear', 'ease', 'ease-in-out', 'ease-in', 'ease-out'])).toBe(true);
  });
});