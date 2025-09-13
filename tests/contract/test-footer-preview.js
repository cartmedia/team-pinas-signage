/**
 * T006: Contract test POST /.netlify/functions/footer/preview endpoint
 * Tests: 200 preview generation, validate FooterPreview schema, test segment parsing and HTML rendering
 * THIS TEST MUST FAIL BEFORE IMPLEMENTATION
 */

const request = require('supertest');
const { validateSchema, isValidHexColor } = require('./footer-api.test');

describe('POST /.netlify/functions/footer/preview Contract Tests', () => {
  const baseURL = 'http://localhost:8080/.netlify/functions';
  const validApiKey = process.env.ADMIN_API_KEY || 'test-api-key';
  
  const validPreviewRequest = {
    footer_text: "PREVIEW TEST <separator> SAMPLE CONTENT <separator> FINAL SEGMENT",
    text_color: "#ffffff",
    background_color: "#000000",
    font_size: "2.5vh",
    scroll_speed: 15,
    scroll_direction: "continuous",
    separator_type: "star",
    custom_separator: null,
    is_visible: true
  };

  test('Should return 200 with FooterPreview schema for valid request', async () => {
    const response = await request(baseURL)
      .post('/footer/preview')
      .set('X-API-Key', validApiKey)
      .send(validPreviewRequest)
      .expect(200);

    // Validate FooterPreview schema structure
    const requiredFields = [
      'config', 'parsed_segments', 'rendered_html', 
      'estimated_duration', 'performance_warning'
    ];

    expect(() => validateSchema(response.body, requiredFields)).not.toThrow();

    // Validate config field contains the request data
    expect(response.body.config).toEqual(validPreviewRequest);

    // Validate parsed_segments structure
    expect(Array.isArray(response.body.parsed_segments)).toBe(true);
    expect(response.body.parsed_segments.length).toBe(3); // Three segments from the test text

    response.body.parsed_segments.forEach(segment => {
      expect(segment).toHaveProperty('text');
      expect(segment).toHaveProperty('separator_after');
      expect(typeof segment.text).toBe('string');
      expect(typeof segment.separator_after).toBe('string');
    });

    // Validate specific parsed content
    expect(response.body.parsed_segments[0].text).toBe("PREVIEW TEST");
    expect(response.body.parsed_segments[1].text).toBe("SAMPLE CONTENT");
    expect(response.body.parsed_segments[2].text).toBe("FINAL SEGMENT");

    // Last segment should have empty separator
    expect(response.body.parsed_segments[2].separator_after).toBe("");

    // Star separator should be used (not crown) since separator_type is "star"
    expect(response.body.parsed_segments[0].separator_after).toContain("⭐");
    expect(response.body.parsed_segments[1].separator_after).toContain("⭐");

    // Validate rendered HTML
    expect(typeof response.body.rendered_html).toBe('string');
    expect(response.body.rendered_html).toContain('scrolling-footer-content');
    expect(response.body.rendered_html).toContain('PREVIEW TEST');
    expect(response.body.rendered_html).toContain('SAMPLE CONTENT');

    // Validate estimated duration
    expect(typeof response.body.estimated_duration).toBe('number');
    expect(response.body.estimated_duration).toBeGreaterThan(0);

    // Performance warning should be null for valid configuration
    expect(response.body.performance_warning).toBeNull();
  });

  test('Should return 401 when API key is missing', async () => {
    const response = await request(baseURL)
      .post('/footer/preview')
      .send(validPreviewRequest)
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('code');
  });

  test('Should return 401 when API key is invalid', async () => {
    const response = await request(baseURL)
      .post('/footer/preview')
      .set('X-API-Key', 'invalid-key')
      .send(validPreviewRequest)
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('code');
  });

  test('Should return 400 with validation errors for invalid preview data', async () => {
    const invalidRequest = {
      footer_text: "", // Empty content
      text_color: "invalid", // Invalid color
      scroll_speed: 200, // Out of range
      separator_type: "nonexistent"
    };

    const response = await request(baseURL)
      .post('/footer/preview')
      .set('X-API-Key', validApiKey)
      .send(invalidRequest)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('code');
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(response.body).toHaveProperty('details');
  });

  test('Should handle custom separator in preview', async () => {
    const customRequest = {
      ...validPreviewRequest,
      separator_type: "custom",
      custom_separator: " ••• "
    };

    const response = await request(baseURL)
      .post('/footer/preview')
      .set('X-API-Key', validApiKey)
      .send(customRequest)
      .expect(200);

    // Custom separator should be used
    expect(response.body.parsed_segments[0].separator_after).toContain("•••");
    expect(response.body.parsed_segments[1].separator_after).toContain("•••");
    expect(response.body.rendered_html).toContain("•••");
  });

  test('Should handle content without separators', async () => {
    const noSeparatorRequest = {
      ...validPreviewRequest,
      footer_text: "SINGLE CONTINUOUS MESSAGE WITHOUT SEPARATORS"
    };

    const response = await request(baseURL)
      .post('/footer/preview')
      .set('X-API-Key', validApiKey)
      .send(noSeparatorRequest)
      .expect(200);

    expect(response.body.parsed_segments.length).toBe(1);
    expect(response.body.parsed_segments[0].text).toBe("SINGLE CONTINUOUS MESSAGE WITHOUT SEPARATORS");
    expect(response.body.parsed_segments[0].separator_after).toBe("");
  });

  test('Should calculate estimated duration based on content and speed', async () => {
    const fastRequest = {
      ...validPreviewRequest,
      scroll_speed: 50 // Fast speed
    };

    const slowRequest = {
      ...validPreviewRequest,
      scroll_speed: 5 // Slow speed
    };

    const fastResponse = await request(baseURL)
      .post('/footer/preview')
      .set('X-API-Key', validApiKey)
      .send(fastRequest)
      .expect(200);

    const slowResponse = await request(baseURL)
      .post('/footer/preview')
      .set('X-API-Key', validApiKey)
      .send(slowRequest)
      .expect(200);

    // Slower speed should result in longer duration
    expect(slowResponse.body.estimated_duration).toBeGreaterThan(fastResponse.body.estimated_duration);
  });

  test('Should provide performance warning for potentially problematic configurations', async () => {
    const problematicRequest = {
      ...validPreviewRequest,
      footer_text: "VERY LONG CONTENT ".repeat(100), // Extremely long content
      scroll_speed: 100 // Very fast speed
    };

    const response = await request(baseURL)
      .post('/footer/preview')
      .set('X-API-Key', validApiKey)
      .send(problematicRequest)
      .expect(200);

    // Should provide performance warning for very long content
    expect(response.body.performance_warning).not.toBeNull();
    expect(typeof response.body.performance_warning).toBe('string');
    expect(response.body.performance_warning.length).toBeGreaterThan(0);
  });

  test('Should handle different separator types correctly', async () => {
    const separatorTests = [
      { type: 'crown', expectedChar: '👑' },
      { type: 'star', expectedChar: '⭐' },
      { type: 'dot', expectedChar: '•' },
      { type: 'dash', expectedChar: '–' },
      { type: 'space', expectedChar: ' ' }
    ];

    for (const test of separatorTests) {
      const response = await request(baseURL)
        .post('/footer/preview')
        .set('X-API-Key', validApiKey)
        .send({
          ...validPreviewRequest,
          separator_type: test.type
        })
        .expect(200);

      if (test.type !== 'space') {
        expect(response.body.parsed_segments[0].separator_after).toContain(test.expectedChar);
      }
    }
  });

  test('Should generate valid HTML structure', async () => {
    const response = await request(baseURL)
      .post('/footer/preview')
      .set('X-API-Key', validApiKey)
      .send(validPreviewRequest)
      .expect(200);

    const html = response.body.rendered_html;

    // Should contain proper CSS classes
    expect(html).toContain('scrolling-footer-content');
    
    // Should not contain script tags or dangerous content
    expect(html).not.toContain('<script');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('onload');
    
    // Should be properly escaped
    expect(html).not.toContain('&lt;script&gt;');
  });

  test('Should handle empty or whitespace-only content', async () => {
    const emptyRequest = {
      ...validPreviewRequest,
      footer_text: "   <separator>   <separator>   " // Only whitespace and separators
    };

    const response = await request(baseURL)
      .post('/footer/preview')
      .set('X-API-Key', validApiKey)
      .send(emptyRequest)
      .expect(200);

    // Should filter out empty segments
    const nonEmptySegments = response.body.parsed_segments.filter(seg => seg.text.trim().length > 0);
    expect(nonEmptySegments.length).toBe(0);
    
    // Estimated duration should be minimal
    expect(response.body.estimated_duration).toBeLessThan(1);
  });
});