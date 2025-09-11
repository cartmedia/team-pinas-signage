// Contract Test T008: GET /settings (footer excluded) endpoint
// This test MUST FAIL initially (TDD requirement)

const request = require('supertest');

describe('GET /settings (footer excluded) - Contract Tests', () => {
  const SETTINGS_ENDPOINT = '/.netlify/functions/settings';
  
  beforeAll(() => {
    // This test should fail until settings endpoint is modified to exclude footer data
    console.log('🔴 Contract Test T008: GET /settings (footer excluded) - Expected to FAIL initially');
  });

  test('should return 200 and settings without footer data', async () => {
    // This test will fail until settings endpoint is modified post-migration
    const response = await request('http://localhost:8080')
      .get(SETTINGS_ENDPOINT)
      .expect(200)
      .expect('Content-Type', /json/);

    // Validate response structure matches OpenAPI SystemSettings schema
    expect(response.body).toHaveProperty('settings');
    expect(typeof response.body.settings).toBe('object');
    
    const settings = response.body.settings;

    // Required fields should be present
    expect(settings).toHaveProperty('organization_name');
    expect(settings).toHaveProperty('display_columns');
    expect(settings).toHaveProperty('rotation_interval');

    // Validate required field types and constraints
    expect(typeof settings.organization_name).toBe('string');
    expect(settings.organization_name.length).toBeLessThanOrEqual(255);
    
    expect(typeof settings.display_columns).toBe('number');
    expect([1, 2]).toContain(settings.display_columns);
    
    expect(typeof settings.rotation_interval).toBe('number');
    expect(settings.rotation_interval).toBeGreaterThanOrEqual(1000);
  });

  test('should NOT include footer-related fields after migration', async () => {
    const response = await request('http://localhost:8080')
      .get(SETTINGS_ENDPOINT)
      .expect(200);

    const settings = response.body.settings;

    // Footer fields should be explicitly excluded after migration
    expect(settings).not.toHaveProperty('footer_text');
    expect(settings).not.toHaveProperty('scroll_speed');
    expect(settings).not.toHaveProperty('text_color');
    expect(settings).not.toHaveProperty('background_color');
    expect(settings).not.toHaveProperty('font_size');
    expect(settings).not.toHaveProperty('scroll_direction');
    expect(settings).not.toHaveProperty('divider_image');
    expect(settings).not.toHaveProperty('is_active');
  });

  test('should return valid organization_name', async () => {
    const response = await request('http://localhost:8080')
      .get(SETTINGS_ENDPOINT);

    expect(response.body.settings.organization_name).toBeDefined();
    expect(typeof response.body.settings.organization_name).toBe('string');
    expect(response.body.settings.organization_name.length).toBeGreaterThan(0);
    expect(response.body.settings.organization_name.length).toBeLessThanOrEqual(255);
  });

  test('should return valid display_columns enum value', async () => {
    const response = await request('http://localhost:8080')
      .get(SETTINGS_ENDPOINT);

    expect(response.body.settings.display_columns).toBeDefined();
    expect(typeof response.body.settings.display_columns).toBe('number');
    expect([1, 2]).toContain(response.body.settings.display_columns);
  });

  test('should return valid rotation_interval with minimum constraint', async () => {
    const response = await request('http://localhost:8080')
      .get(SETTINGS_ENDPOINT);

    expect(response.body.settings.rotation_interval).toBeDefined();
    expect(typeof response.body.settings.rotation_interval).toBe('number');
    expect(response.body.settings.rotation_interval).toBeGreaterThanOrEqual(1000);
  });

  test('should return consistent response structure', async () => {
    // Make multiple requests to ensure consistent structure
    const response1 = await request('http://localhost:8080').get(SETTINGS_ENDPOINT);
    const response2 = await request('http://localhost:8080').get(SETTINGS_ENDPOINT);

    expect(Object.keys(response1.body).sort()).toEqual(Object.keys(response2.body).sort());
    expect(Object.keys(response1.body.settings).sort()).toEqual(Object.keys(response2.body.settings).sort());
  });

  test('should handle database connection errors gracefully', async () => {
    // Test error handling when database is unavailable
    const response = await request('http://localhost:8080')
      .get(SETTINGS_ENDPOINT);

    if (response.status === 500) {
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    } else {
      expect(response.status).toBe(200);
    }
  });

  test('should not accept footer updates via PUT after migration', async () => {
    // This test verifies footer updates are redirected to footer endpoint
    const settingsUpdateWithFooter = {
      organization_name: "Updated Organization",
      display_columns: 1,
      rotation_interval: 5000,
      footer_text: "This should be ignored", // Footer field
      scroll_speed: 50 // Footer field
    };

    const response = await request('http://localhost:8080')
      .put(SETTINGS_ENDPOINT)
      .set('X-API-Key', process.env.ADMIN_API_KEY || 'team-pinas-admin-2024')
      .send(settingsUpdateWithFooter);

    // Should either succeed without footer fields or return error
    if (response.status === 200) {
      // If successful, footer fields should not be present in response
      expect(response.body.settings).not.toHaveProperty('footer_text');
      expect(response.body.settings).not.toHaveProperty('scroll_speed');
      
      // Non-footer fields should be updated
      expect(response.body.settings.organization_name).toBe(settingsUpdateWithFooter.organization_name);
    } else if (response.status === 400) {
      // Should return error indicating footer fields not accepted
      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toMatch(/footer|redirect/i);
    }
  });

  test('should accept valid settings updates (non-footer fields)', async () => {
    const validSettingsUpdate = {
      organization_name: "Test Organization",
      display_columns: 2,
      rotation_interval: 8000
    };

    const response = await request('http://localhost:8080')
      .put(SETTINGS_ENDPOINT)
      .set('X-API-Key', process.env.ADMIN_API_KEY || 'team-pinas-admin-2024')
      .send(validSettingsUpdate);

    // Should accept valid non-footer settings updates
    if ([200, 401].includes(response.status)) {
      // 401 is acceptable if API key is invalid
      if (response.status === 200) {
        expect(response.body.settings.organization_name).toBe(validSettingsUpdate.organization_name);
        expect(response.body.settings.display_columns).toBe(validSettingsUpdate.display_columns);
        expect(response.body.settings.rotation_interval).toBe(validSettingsUpdate.rotation_interval);
      }
    }
  });

  test('should return settings with all legacy footer fields removed', async () => {
    const response = await request('http://localhost:8080')
      .get(SETTINGS_ENDPOINT)
      .expect(200);

    const settings = response.body.settings;
    const possibleFooterFields = [
      'footer_text',
      'scroll_speed', 
      'text_color',
      'background_color',
      'font_size',
      'scroll_direction',
      'divider_image',
      'is_active',
      'footer_enabled',
      'footer_config',
      'footer_settings'
    ];

    // None of these footer-related fields should exist
    possibleFooterFields.forEach(field => {
      expect(settings).not.toHaveProperty(field);
    });
  });

  test('should maintain backward compatibility for existing settings fields', async () => {
    const response = await request('http://localhost:8080')
      .get(SETTINGS_ENDPOINT)
      .expect(200);

    const settings = response.body.settings;
    
    // These core settings should always be present for backward compatibility
    const coreFields = ['organization_name', 'display_columns', 'rotation_interval'];
    
    coreFields.forEach(field => {
      expect(settings).toHaveProperty(field);
    });
  });

  afterAll(() => {
    console.log('🔴 Contract Test T008: GET /settings (footer excluded) - If this passed, implement the changes!');
  });
});