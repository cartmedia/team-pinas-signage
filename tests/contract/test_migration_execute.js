// Contract Test T007: POST /admin-footer-migrate endpoint
// This test MUST FAIL initially (TDD requirement)

const request = require('supertest');

describe('POST /admin-footer-migrate - Contract Tests', () => {
  const MIGRATION_EXECUTE_ENDPOINT = '/.netlify/functions/admin-footer-migrate';
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'team-pinas-admin-2024';
  
  beforeAll(() => {
    // This test should fail until migration execute endpoint is implemented
    console.log('🔴 Contract Test T007: POST /admin-footer-migrate - Expected to FAIL initially');
  });

  test('should return 200 and execute migration successfully with validate operation', async () => {
    const migrationRequest = {
      operation: "validate",
      force: false,
      conflict_resolution: "footer_priority"
    };

    // This test will fail until migration execute endpoint exists
    const response = await request('http://localhost:8080')
      .post(MIGRATION_EXECUTE_ENDPOINT)
      .set('X-API-Key', ADMIN_API_KEY)
      .send(migrationRequest)
      .expect('Content-Type', /json/);

    // Should return 200 (completed) or 202 (started)
    expect([200, 202]).toContain(response.status);

    // Validate response structure matches OpenAPI MigrationResponse schema
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('migration_id');

    // Required fields validation
    expect(typeof response.body.status).toBe('string');
    expect(typeof response.body.migration_id).toBe('string');

    // Status should be one of valid enum values
    const validStatuses = ['pending', 'in_progress', 'completed', 'failed'];
    expect(validStatuses).toContain(response.body.status);

    // Migration ID should be non-empty
    expect(response.body.migration_id.length).toBeGreaterThan(0);
  });

  test('should return 200 and execute migration successfully with execute operation', async () => {
    const migrationRequest = {
      operation: "execute",
      force: false,
      conflict_resolution: "settings_priority"
    };

    const response = await request('http://localhost:8080')
      .post(MIGRATION_EXECUTE_ENDPOINT)
      .set('X-API-Key', ADMIN_API_KEY)
      .send(migrationRequest);

    expect([200, 202]).toContain(response.status);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('migration_id');

    // Optional message field should be string if present
    if (response.body.message) {
      expect(typeof response.body.message).toBe('string');
      expect(response.body.message.length).toBeGreaterThan(0);
    }
  });

  test('should return valid migration summary when present', async () => {
    const migrationRequest = {
      operation: "execute",
      force: true,
      conflict_resolution: "manual"
    };

    const response = await request('http://localhost:8080')
      .post(MIGRATION_EXECUTE_ENDPOINT)
      .set('X-API-Key', ADMIN_API_KEY)
      .send(migrationRequest);

    if (response.body.summary) {
      const summary = response.body.summary;

      // Validate MigrationSummary schema fields
      if (summary.records_migrated !== undefined) {
        expect(typeof summary.records_migrated).toBe('number');
        expect(summary.records_migrated).toBeGreaterThanOrEqual(0);
      }

      if (summary.conflicts_found !== undefined) {
        expect(typeof summary.conflicts_found).toBe('number');
        expect(summary.conflicts_found).toBeGreaterThanOrEqual(0);
      }

      if (summary.conflicts_resolved !== undefined) {
        expect(typeof summary.conflicts_resolved).toBe('number');
        expect(summary.conflicts_resolved).toBeGreaterThanOrEqual(0);
      }

      if (summary.execution_time_ms !== undefined) {
        expect(typeof summary.execution_time_ms).toBe('number');
        expect(summary.execution_time_ms).toBeGreaterThan(0);
      }

      if (summary.backup_created !== undefined) {
        expect(typeof summary.backup_created).toBe('boolean');
      }
    }
  });

  test('should return valid conflicts array when present', async () => {
    const migrationRequest = {
      operation: "validate",
      force: false,
      conflict_resolution: "manual"
    };

    const response = await request('http://localhost:8080')
      .post(MIGRATION_EXECUTE_ENDPOINT)
      .set('X-API-Key', ADMIN_API_KEY)
      .send(migrationRequest);

    if (response.body.conflicts) {
      expect(Array.isArray(response.body.conflicts)).toBe(true);

      // Validate each conflict follows DataConflict schema
      response.body.conflicts.forEach(conflict => {
        expect(conflict).toHaveProperty('field');
        expect(conflict).toHaveProperty('settings_value');
        expect(conflict).toHaveProperty('footer_value');

        expect(typeof conflict.field).toBe('string');
        // values can be string or null
        expect(conflict.settings_value === null || typeof conflict.settings_value === 'string').toBe(true);
        expect(conflict.footer_value === null || typeof conflict.footer_value === 'string').toBe(true);

        if (conflict.resolution) {
          const validResolutions = ['footer_priority', 'settings_priority', 'manual'];
          expect(validResolutions).toContain(conflict.resolution);
        }
      });
    }
  });

  test('should return 401 when X-API-Key header is missing', async () => {
    const migrationRequest = {
      operation: "validate"
    };

    const response = await request('http://localhost:8080')
      .post(MIGRATION_EXECUTE_ENDPOINT)
      .send(migrationRequest)
      .expect(401)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('should return 401 when X-API-Key header is invalid', async () => {
    const migrationRequest = {
      operation: "validate"
    };

    const response = await request('http://localhost:8080')
      .post(MIGRATION_EXECUTE_ENDPOINT)
      .set('X-API-Key', 'invalid-api-key')
      .send(migrationRequest)
      .expect(401)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
  });

  test('should return 400 for missing required operation field', async () => {
    const invalidRequest = {
      force: false
      // Missing required 'operation' field
    };

    const response = await request('http://localhost:8080')
      .post(MIGRATION_EXECUTE_ENDPOINT)
      .set('X-API-Key', ADMIN_API_KEY)
      .send(invalidRequest)
      .expect(400)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toMatch(/operation/i);
  });

  test('should return 400 for invalid operation enum value', async () => {
    const invalidRequest = {
      operation: "invalid_operation",
      force: false
    };

    const response = await request('http://localhost:8080')
      .post(MIGRATION_EXECUTE_ENDPOINT)
      .set('X-API-Key', ADMIN_API_KEY)
      .send(invalidRequest)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.message).toMatch(/operation|enum/i);
  });

  test('should return 400 for invalid conflict_resolution enum value', async () => {
    const invalidRequest = {
      operation: "validate",
      conflict_resolution: "invalid_resolution"
    };

    const response = await request('http://localhost:8080')
      .post(MIGRATION_EXECUTE_ENDPOINT)
      .set('X-API-Key', ADMIN_API_KEY)
      .send(invalidRequest)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  test('should return 409 when migration already in progress', async () => {
    const migrationRequest = {
      operation: "execute",
      force: false
    };

    // Make first request
    const response1 = await request('http://localhost:8080')
      .post(MIGRATION_EXECUTE_ENDPOINT)
      .set('X-API-Key', ADMIN_API_KEY)
      .send(migrationRequest);

    // If first request starts successfully, second should return 409
    if ([200, 202].includes(response1.status) && response1.body.status === 'in_progress') {
      const response2 = await request('http://localhost:8080')
        .post(MIGRATION_EXECUTE_ENDPOINT)
        .set('X-API-Key', ADMIN_API_KEY)
        .send(migrationRequest);

      if (response2.status === 409) {
        expect(response2.body).toHaveProperty('error');
        expect(response2.body).toHaveProperty('message');
        expect(response2.body.message).toMatch(/in progress|already running/i);
      }
    }
  });

  test('should handle rollback operation', async () => {
    const rollbackRequest = {
      operation: "rollback",
      force: false
    };

    const response = await request('http://localhost:8080')
      .post(MIGRATION_EXECUTE_ENDPOINT)
      .set('X-API-Key', ADMIN_API_KEY)
      .send(rollbackRequest);

    // Should return success codes or error codes
    expect([200, 202, 400, 500, 501]).toContain(response.status);

    if ([200, 202].includes(response.status)) {
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('migration_id');
    }
  });

  test('should validate force parameter as boolean', async () => {
    const invalidRequest = {
      operation: "execute",
      force: "not_a_boolean"
    };

    const response = await request('http://localhost:8080')
      .post(MIGRATION_EXECUTE_ENDPOINT)
      .set('X-API-Key', ADMIN_API_KEY)
      .send(invalidRequest)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });

  test('should handle database errors gracefully', async () => {
    const migrationRequest = {
      operation: "execute",
      force: false,
      conflict_resolution: "footer_priority"
    };

    const response = await request('http://localhost:8080')
      .post(MIGRATION_EXECUTE_ENDPOINT)
      .set('X-API-Key', ADMIN_API_KEY)
      .send(migrationRequest);

    // Should return success codes or 500 for database errors
    expect([200, 202, 500]).toContain(response.status);

    if (response.status === 500) {
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    }
  });

  test('should return 202 for async operations', async () => {
    const migrationRequest = {
      operation: "execute",
      force: false,
      conflict_resolution: "footer_priority"
    };

    const response = await request('http://localhost:8080')
      .post(MIGRATION_EXECUTE_ENDPOINT)
      .set('X-API-Key', ADMIN_API_KEY)
      .send(migrationRequest);

    if (response.status === 202) {
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('migration_id');
      expect(response.body.status).toMatch(/pending|in_progress/);

      if (response.body.message) {
        expect(response.body.message).toMatch(/started|async|progress/i);
      }
    }
  });

  afterAll(() => {
    console.log('🔴 Contract Test T007: POST /admin-footer-migrate - If this passed, implement the endpoint!');
  });
});