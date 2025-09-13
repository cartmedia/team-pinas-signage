// Netlify Function for Team Pinas Signage - Footer Configuration Endpoint
// Provides GET (public), POST/PUT (admin) for footer content management
// T017: Enhanced footer API with full configuration support

const { Pool } = require('pg');
const { requireAuth, createAuthErrorResponse } = require('./auth-middleware');
const FooterConfiguration = require('../models/FooterConfiguration');
const FooterContentService = require('../services/FooterContentService');
const SeparatorService = require('../services/SeparatorService');

// Initialize services
const footerContentService = new FooterContentService();
const separatorService = new SeparatorService();

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
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': process.env.NODE_ENV === 'development' ? 'no-cache, no-store, must-revalidate' : 'public, max-age=300' // No cache in development
};

// Enhanced validation using FooterConfiguration model
function validateFooterData(data, isUpdate = false) {
  try {
    const validation = FooterConfiguration.validateRequest(data, isUpdate);
    
    if (!validation.valid) {
      return validation.errors.map(err => `${err.field}: ${err.message}`);
    }
    
    // Additional validations for content (only if footer_text is provided)
    if (data.footer_text) {
      const contentValidation = footerContentService.validateContent(validation.config);
      if (!contentValidation.valid) {
        return contentValidation.errors.map(err => `${err.field}: ${err.message}`);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Validation error:', error);
    return ['Invalid configuration data'];
  }
}

// GET: Retrieve active footer configuration (public endpoint)
async function handleGet(client) {
  console.log('GET /footer - retrieving active footer configuration');
  
  try {
    const query = `
      SELECT 
        id, footer_text, text_color, background_color, 
        scroll_speed, scroll_direction, font_size, 
        is_visible, is_active, separator_type, custom_separator,
        separator_spacing, separator_color, animation_timing,
        pause_on_hover, reverse_on_complete, opacity,
        text_shadow, border_radius, divider_image,
        created_at, updated_at
      FROM footer_config 
      WHERE is_active = true AND is_visible = true
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      return {
        statusCode: 204,
        headers,
        body: ''
      };
    }
    
    const row = result.rows[0];
    const footerConfig = FooterConfiguration.fromDatabaseRow(row);
    
    // Process content for display
    const processedContent = footerContentService.processFooterContent(footerConfig);
    
    const response = {
      ...footerConfig.toApiResponse(),
      processedContent: processedContent.success ? processedContent : null
    };
    
    console.log(`Retrieved footer config ID ${footerConfig.id}: "${footerConfig.footer_text.substring(0, 50)}..."`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('GET /footer error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to retrieve footer configuration',
        details: error.message 
      })
    };
  }
}

// POST: Create new footer configuration (admin only)
async function handlePost(client, requestBody) {
  console.log('POST /footer - creating new footer configuration');
  
  try {
    const data = JSON.parse(requestBody);
    
    // Validate input data
    const validationErrors = validateFooterData(data, false);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation failed',
          message: validationErrors[0] || 'Request validation failed',
          details: validationErrors
        })
      };
    }
    
    // Begin transaction to ensure only one active config
    await client.query('BEGIN');
    
    try {
      // Deactivate any existing active configurations
      await client.query('UPDATE footer_config SET is_active = false WHERE is_active = true');
      
      // Insert new configuration as active
      const config = new FooterConfiguration(data);
      const insertQuery = `
        INSERT INTO footer_config (
          footer_text, text_color, background_color, 
          scroll_speed, scroll_direction, font_size, 
          is_visible, separator_type, custom_separator,
          separator_spacing, separator_color, animation_timing,
          pause_on_hover, reverse_on_complete, opacity,
          text_shadow, border_radius, divider_image, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, true)
        RETURNING *
      `;
      
      const values = [
        config.footer_text,
        config.text_color,
        config.background_color,
        config.scroll_speed,
        config.scroll_direction,
        config.font_size,
        config.is_visible,
        config.separator_type,
        config.custom_separator,
        config.separator_spacing,
        config.separator_color,
        config.animation_timing,
        config.pause_on_hover,
        config.reverse_on_complete,
        config.opacity,
        config.text_shadow,
        config.border_radius,
        data.divider_image || 'assets/images/pinas_kroon.svg'
      ];
      
      const result = await client.query(insertQuery, values);
      const newFooter = FooterConfiguration.fromDatabaseRow(result.rows[0]);
      
      await client.query('COMMIT');
      
      console.log(`Created new footer config ID ${newFooter.id}`);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newFooter.toApiResponse())
      };
      
    } catch (insertError) {
      await client.query('ROLLBACK');
      throw insertError;
    }
    
  } catch (error) {
    console.error('POST /footer error:', error);
    
    // Check if it's a JSON parse error
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON in request body',
          details: error.message
        })
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create footer configuration',
        details: error.message
      })
    };
  }
}

// PUT: Update active footer configuration (admin only)
async function handlePut(client, requestBody) {
  console.log('PUT /footer - updating active footer configuration');
  
  try {
    const data = JSON.parse(requestBody);
    
    // Validate input data for update (partial update allowed)
    const validationErrors = validateFooterData(data, true);
    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Validation failed',
          message: validationErrors[0] || 'Request validation failed',
          details: validationErrors
        })
      };
    }
    
    // Get current active configuration
    const currentQuery = 'SELECT * FROM footer_config WHERE is_active = true LIMIT 1';
    const currentResult = await client.query(currentQuery);
    
    if (currentResult.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'No active footer configuration found to update',
          code: 'FOOTER_NOT_FOUND'
        })
      };
    }
    
    const currentFooter = currentResult.rows[0];
    
    // Build update query dynamically based on provided fields
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    const config = new FooterConfiguration(data);
    const fieldsToUpdate = [
      'footer_text', 'text_color', 'background_color', 'scroll_speed', 
      'scroll_direction', 'font_size', 'is_visible', 'separator_type',
      'custom_separator', 'separator_spacing', 'separator_color',
      'animation_timing', 'pause_on_hover', 'reverse_on_complete',
      'opacity', 'text_shadow', 'border_radius', 'divider_image'
    ];
    
    fieldsToUpdate.forEach(field => {
      if (data[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex++}`);
        updateValues.push(config[field]);
      }
    });
    
    if (updateFields.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'No valid fields provided for update',
          details: 'At least one valid field must be provided'
        })
      };
    }
    
    // Add updated_at to the update
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    const updateQuery = `
      UPDATE footer_config 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    updateValues.push(currentFooter.id);
    
    const updateResult = await client.query(updateQuery, updateValues);
    const updatedFooter = FooterConfiguration.fromDatabaseRow(updateResult.rows[0]);
    
    console.log(`Updated footer config ID ${updatedFooter.id}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedFooter.toApiResponse())
    };
    
  } catch (error) {
    console.error('PUT /footer error:', error);
    
    // Check if it's a JSON parse error
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON in request body',
          details: error.message
        })
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to update footer configuration',
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

  const client = await pool.connect();
  
  try {
    // GET requests are public (no authentication required)
    if (event.httpMethod === 'GET') {
      return await handleGet(client);
    }
    
    // POST and PUT requests require admin authentication
    if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
      // Check authentication
      const authResult = await requireAuth(event);
      
      if (!authResult.success) {
        return createAuthErrorResponse(
          authResult.statusCode || 401,
          authResult.error || 'Authentication failed'
        );
      }
      
      console.log(`${event.httpMethod} /footer - authenticated user: ${authResult.user.email || authResult.user.sub}`);
      
      if (event.httpMethod === 'POST') {
        return await handlePost(client, event.body);
      } else {
        return await handlePut(client, event.body);
      }
    }
    
    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: `Method ${event.httpMethod} not allowed`,
        allowed: ['GET', 'POST', 'PUT', 'OPTIONS']
      })
    };

  } catch (error) {
    console.error('Footer endpoint error:', error);
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