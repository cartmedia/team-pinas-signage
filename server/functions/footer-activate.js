// Netlify Function for Team Pinas Signage - Footer Configuration Activation
// T022: POST footer/configurations/{id}/activate endpoint for admin activation
// Activates a specific configuration while deactivating others (atomic operation)

const { Pool } = require('pg');
const { requireAuth, createAuthErrorResponse } = require('./auth-middleware');
const FooterConfiguration = require('../models/FooterConfiguration');
const FooterContentService = require('../services/FooterContentService');

// Initialize services
const footerContentService = new FooterContentService();

// Initialize Neon connection
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// CORS headers for all responses
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate'
};

// Extract configuration ID from URL path
function extractConfigId(event) {
  // URL format: /.netlify/functions/footer-activate?id=123
  // or from path: /footer-configurations/123/activate
  const queryParams = event.queryStringParameters || {};
  
  if (queryParams.id) {
    return parseInt(queryParams.id);
  }
  
  // Try to extract from path if using nested routing
  const pathParts = event.path ? event.path.split('/') : [];
  const idIndex = pathParts.findIndex(part => part === 'configurations') + 1;
  if (idIndex > 0 && idIndex < pathParts.length) {
    const idPart = pathParts[idIndex];
    const id = parseInt(idPart);
    if (!isNaN(id)) {
      return id;
    }
  }
  
  return null;
}

// POST: Activate specific footer configuration (admin only)
async function handleActivate(client, configId, requestBody) {
  console.log(`POST /footer-activate - activating configuration ID ${configId}`);
  
  try {
    // Parse any additional options from request body
    let options = {};
    if (requestBody) {
      try {
        options = JSON.parse(requestBody);
      } catch (parseError) {
        // Ignore parse errors for empty bodies
      }
    }
    
    // Begin atomic transaction
    await client.query('BEGIN');
    
    try {
      // First, check if the configuration exists and get its details
      const checkQuery = `
        SELECT id, footer_text, is_visible, is_active 
        FROM footer_config 
        WHERE id = $1
      `;
      
      const checkResult = await client.query(checkQuery, [configId]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Configuration not found',
            details: `Footer configuration with ID ${configId} does not exist`
          })
        };
      }
      
      const targetConfig = checkResult.rows[0];
      
      // Check if configuration is visible (can't activate invisible configs)
      if (!targetConfig.is_visible) {
        await client.query('ROLLBACK');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Cannot activate invisible configuration',
            details: 'Configuration must be visible to be activated'
          })
        };
      }
      
      // Check if already active
      if (targetConfig.is_active) {
        await client.query('ROLLBACK');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Configuration is already active',
            configuration: {
              id: configId,
              footer_text: targetConfig.footer_text.substring(0, 50) + '...',
              is_active: true,
              activated_at: new Date().toISOString()
            }
          })
        };
      }
      
      // Deactivate all currently active configurations
      const deactivateQuery = `
        UPDATE footer_config 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP 
        WHERE is_active = true
        RETURNING id, footer_text
      `;
      
      const deactivateResult = await client.query(deactivateQuery);
      const deactivatedConfigs = deactivateResult.rows;
      
      // Activate the target configuration
      const activateQuery = `
        UPDATE footer_config 
        SET is_active = true, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
        RETURNING *
      `;
      
      const activateResult = await client.query(activateQuery, [configId]);
      const activatedConfig = FooterConfiguration.fromDatabaseRow(activateResult.rows[0]);
      
      // Commit the transaction
      await client.query('COMMIT');
      
      // Generate content preview for response
      const contentStats = footerContentService.getContentStats(activatedConfig);
      
      const response = {
        success: true,
        message: 'Configuration activated successfully',
        configuration: {
          ...activatedConfig.toApiResponse(),
          preview: {
            segments: contentStats.segments,
            totalLength: contentStats.totalLength,
            estimatedDuration: contentStats.estimatedDuration,
            contentType: activatedConfig.scroll_direction,
            separatorType: activatedConfig.separator_type
          }
        },
        changes: {
          activated: {
            id: configId,
            footer_text: activatedConfig.footer_text.substring(0, 50) + (activatedConfig.footer_text.length > 50 ? '...' : '')
          },
          deactivated: deactivatedConfigs.map(config => ({
            id: config.id,
            footer_text: config.footer_text.substring(0, 50) + (config.footer_text.length > 50 ? '...' : '')
          }))
        },
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ Activated configuration ${configId}, deactivated ${deactivatedConfigs.length} previous configs`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response)
      };
      
    } catch (transactionError) {
      await client.query('ROLLBACK');
      throw transactionError;
    }
    
  } catch (error) {
    console.error('POST /footer-activate error:', error);
    
    // Check for specific database constraint violations
    if (error.code === '23505') { // Unique constraint violation
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          error: 'Constraint violation',
          details: 'Multiple active configurations detected. Database integrity issue.'
        })
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to activate configuration',
        details: error.message
      })
    };
  }
}

// Main handler
exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Only POST method allowed
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: `Method ${event.httpMethod} not allowed`,
        allowed: ['POST', 'OPTIONS']
      })
    };
  }

  const client = await pool.connect();
  
  try {
    // POST requests require admin authentication
    const authResult = await requireAuth(event);
    
    if (!authResult.success) {
      return createAuthErrorResponse(
        authResult.statusCode || 401,
        authResult.error || 'Authentication failed'
      );
    }
    
    console.log(`POST /footer-activate - authenticated user: ${authResult.user.email || authResult.user.sub}`);
    
    // Extract configuration ID from URL/query
    const configId = extractConfigId(event);
    
    if (!configId || isNaN(configId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing or invalid configuration ID',
          details: 'Configuration ID must be provided as query parameter: ?id=123'
        })
      };
    }
    
    return await handleActivate(client, configId, event.body);

  } catch (error) {
    console.error('Footer activation endpoint error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
    
  } finally {
    client.release();
  }
};