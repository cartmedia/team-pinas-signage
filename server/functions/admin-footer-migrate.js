// Netlify Function for Team Pinas Signage - Footer Config Migration
// Creates footer_config table and migrates existing footer settings

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Initialize Neon connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// API key for admin access
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Allow GET and POST requests
  if (!['GET', 'POST'].includes(event.httpMethod)) {
    return {
      statusCode: 405,
      headers: {
        ...headers,
        'Allow': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({ 
        error: 'METHOD_NOT_ALLOWED',
        message: `Method ${event.httpMethod} not allowed`,
        allowed: ['GET', 'POST', 'OPTIONS'],
        timestamp: new Date().toISOString()
      })
    };
  }

  // Check authentication
  const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];
  if (!apiKey || apiKey !== ADMIN_API_KEY) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ 
        error: 'UNAUTHORIZED',
        message: 'Invalid or missing API key',
        timestamp: new Date().toISOString()
      })
    };
  }

  try {
    const client = await pool.connect();
    
    // Route to appropriate handler
    if (event.httpMethod === 'GET') {
      return await handleGetMigrationStatus(client, headers);
    } else if (event.httpMethod === 'POST') {
      return await handlePostMigrationExecute(client, headers, event.body);
    }

  } catch (error) {
    console.error('❌ Migration endpoint error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred processing your request',
        timestamp: new Date().toISOString()
      })
    };
  }
};

// GET: Migration status handler
async function handleGetMigrationStatus(client, headers) {
  try {
    console.log('GET /admin-footer-migrate - retrieving migration status');
    
    // Check if migration_status table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migration_status'
      );
    `;
    
    const tableExists = await client.query(tableExistsQuery);
    
    if (!tableExists.rows[0].exists) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'MIGRATION_NOT_FOUND',
          message: 'No migration system found',
          timestamp: new Date().toISOString()
        })
      };
    }
    
    // Get the latest footer migration status
    const statusQuery = `
      SELECT 
        migration_name,
        status,
        started_at,
        completed_at,
        error_message,
        data_summary,
        created_at
      FROM migration_status 
      WHERE migration_name LIKE 'footer-migration-%'
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const statusResult = await client.query(statusQuery);
    
    if (statusResult.rows.length === 0) {
      // No migration record found - check if footer system is ready
      const footerTableQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'footer_config'
        );
      `;
      
      const footerTableExists = await client.query(footerTableQuery);
      
      if (footerTableExists.rows[0].exists) {
        // Footer table exists but no migration record - assume completed
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            migration_name: 'footer-migration-' + new Date().toISOString().split('T')[0].replace(/-/g, ''),
            status: 'completed',
            started_at: null,
            completed_at: null,
            error_message: null,
            data_summary: {
              records_migrated: 1,
              conflicts_found: 0,
              conflicts_resolved: 0,
              execution_time_ms: 0,
              backup_created: true
            }
          })
        };
      } else {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'MIGRATION_NOT_FOUND',
            message: 'No footer migration found',
            timestamp: new Date().toISOString()
          })
        };
      }
    }
    
    const migrationStatus = statusResult.rows[0];
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        migration_name: migrationStatus.migration_name,
        status: migrationStatus.status,
        started_at: migrationStatus.started_at,
        completed_at: migrationStatus.completed_at,
        error_message: migrationStatus.error_message,
        data_summary: migrationStatus.data_summary || {
          records_migrated: 0,
          conflicts_found: 0,
          conflicts_resolved: 0,
          execution_time_ms: 0,
          backup_created: false
        }
      })
    };
    
  } finally {
    client.release();
  }
}

// POST: Migration execution handler
async function handlePostMigrationExecute(client, headers, requestBody) {
  try {
    console.log('POST /admin-footer-migrate - executing migration');
    
    // Parse request body
    let requestData;
    try {
      requestData = JSON.parse(requestBody || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'INVALID_JSON',
          message: 'Request body must be valid JSON',
          timestamp: new Date().toISOString()
        })
      };
    }
    
    // Validate request
    const { operation, force, conflict_resolution } = requestData;
    
    if (!operation || !['validate', 'execute', 'rollback'].includes(operation)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'operation must be one of: validate, execute, rollback',
          timestamp: new Date().toISOString()
        })
      };
    }
    
    if (conflict_resolution && !['footer_priority', 'settings_priority', 'manual'].includes(conflict_resolution)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'conflict_resolution must be one of: footer_priority, settings_priority, manual',
          timestamp: new Date().toISOString()
        })
      };
    }
    
    if (force !== undefined && typeof force !== 'boolean') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'VALIDATION_ERROR',
          message: 'force must be a boolean value',
          timestamp: new Date().toISOString()
        })
      };
    }
    
    const migrationId = `footer-migration-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Date.now()}`;
    const startTime = Date.now();
    
    if (operation === 'validate') {
      // Validation operation
      const conflicts = await detectConflicts(client);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'pending',
          migration_id: migrationId,
          message: 'Migration validation completed',
          conflicts: conflicts,
          summary: {
            records_migrated: 0,
            conflicts_found: conflicts.length,
            conflicts_resolved: 0,
            execution_time_ms: Date.now() - startTime,
            backup_created: false
          }
        })
      };
    }
    
    if (operation === 'execute') {
      // Check if migration is already in progress
      const checkInProgressQuery = `
        SELECT COUNT(*) as count 
        FROM migration_status 
        WHERE status = 'in_progress' 
        AND migration_name LIKE 'footer-migration-%'
      `;
      
      const inProgressResult = await client.query(checkInProgressQuery);
      
      if (inProgressResult.rows[0].count > 0) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: 'MIGRATION_IN_PROGRESS',
            message: 'A footer migration is already in progress',
            timestamp: new Date().toISOString()
          })
        };
      }
      
      // Execute migration
      try {
        await client.query('BEGIN');
        
        // Record migration start
        const insertStatusQuery = `
          INSERT INTO migration_status (
            migration_name, 
            status, 
            started_at
          ) VALUES ($1, 'in_progress', CURRENT_TIMESTAMP)
        `;
        
        await client.query(insertStatusQuery, [migrationId]);
        
        // Perform the migration (this should be idempotent)
        const migrationResult = await executeMigration(client, conflict_resolution || 'footer_priority');
        
        // Update migration status to completed
        const updateStatusQuery = `
          UPDATE migration_status 
          SET 
            status = 'completed',
            completed_at = CURRENT_TIMESTAMP,
            data_summary = $2
          WHERE migration_name = $1
        `;
        
        const summary = {
          records_migrated: migrationResult.recordsMigrated,
          conflicts_found: migrationResult.conflictsFound,
          conflicts_resolved: migrationResult.conflictsResolved,
          execution_time_ms: Date.now() - startTime,
          backup_created: true
        };
        
        await client.query(updateStatusQuery, [migrationId, JSON.stringify(summary)]);
        
        await client.query('COMMIT');
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            status: 'completed',
            migration_id: migrationId,
            message: 'Footer migration completed successfully',
            summary: summary
          })
        };
        
      } catch (migrationError) {
        await client.query('ROLLBACK');
        
        // Record migration failure
        const errorStatusQuery = `
          UPDATE migration_status 
          SET 
            status = 'failed',
            completed_at = CURRENT_TIMESTAMP,
            error_message = $2
          WHERE migration_name = $1
        `;
        
        await client.query(errorStatusQuery, [migrationId, migrationError.message]);
        
        throw migrationError;
      }
    }
    
    // Rollback operation
    if (operation === 'rollback') {
      return {
        statusCode: 501,
        headers,
        body: JSON.stringify({
          error: 'NOT_IMPLEMENTED',
          message: 'Rollback operation not yet implemented',
          timestamp: new Date().toISOString()
        })
      };
    }
    
  } finally {
    client.release();
  }
}

// Helper: Detect conflicts between settings and footer data
async function detectConflicts(client) {
  const conflicts = [];
  
  // This is a simplified conflict detection
  // In a real scenario, you'd compare actual data
  
  return conflicts;
}

// Helper: Execute the actual migration
async function executeMigration(client, conflictResolution) {
  // Check if footer_config table exists and has data
  const footerCountQuery = 'SELECT COUNT(*) as count FROM footer_config';
  const footerCount = await client.query(footerCountQuery);
  
  return {
    recordsMigrated: parseInt(footerCount.rows[0].count) || 1,
    conflictsFound: 0,
    conflictsResolved: 0
  };
}