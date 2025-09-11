// Netlify Function for Team Pinas Signage - Footer Configuration Endpoint
// Provides GET (public), POST/PUT (admin) for footer content management

const { Pool } = require('pg');
const { requireAuth, createAuthErrorResponse } = require('./auth-middleware');

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
  'Cache-Control': 'public, max-age=300' // 5-minute cache for GET requests
};

// Validation schema for footer data
function validateFooterData(data, isUpdate = false) {
  const errors = [];
  
  // footer_text validation (required for POST, optional for PUT)
  if (!isUpdate && (!data.footer_text || typeof data.footer_text !== 'string' || data.footer_text.trim().length === 0)) {
    errors.push('footer_text is required and must be a non-empty string');
  } else if (isUpdate && data.footer_text !== undefined) {
    if (typeof data.footer_text !== 'string' || data.footer_text.trim().length === 0) {
      errors.push('footer_text must be a non-empty string when provided');
    }
  }
  
  // text_color validation (optional, but must be valid hex when provided)
  if (data.text_color !== undefined) {
    if (typeof data.text_color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(data.text_color)) {
      errors.push('text_color must be a valid hex color (e.g., #FF5733)');
    }
  }
  
  // background_color validation (optional, but must be valid hex when provided)
  if (data.background_color !== undefined && data.background_color !== null) {
    if (typeof data.background_color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(data.background_color)) {
      errors.push('background_color must be a valid hex color or null');
    }
  }
  
  // scroll_speed validation (optional, but must be in range when provided)
  if (data.scroll_speed !== undefined) {
    if (typeof data.scroll_speed !== 'number' || data.scroll_speed < 1 || data.scroll_speed > 200) {
      errors.push('scroll_speed must be a number between 1 and 200');
    }
  }
  
  // scroll_direction validation (optional, but must be valid value when provided)
  if (data.scroll_direction !== undefined) {
    if (!['left', 'right', 'static'].includes(data.scroll_direction)) {
      errors.push('scroll_direction must be one of: left, right, static');
    }
  }
  
  // font_size validation (optional, but must be valid CSS format when provided)
  if (data.font_size !== undefined) {
    if (typeof data.font_size !== 'string' || !/^[0-9]+(\.[0-9]+)?(vh|px|em|rem)$/.test(data.font_size)) {
      errors.push('font_size must be a valid CSS size (e.g., 3vh, 16px, 1.2em)');
    }
  }
  
  // divider_image validation (optional, but should be a reasonable path when provided)
  if (data.divider_image !== undefined) {
    if (typeof data.divider_image !== 'string' || data.divider_image.length === 0) {
      errors.push('divider_image must be a non-empty string when provided');
    }
  }
  
  return errors;
}

// GET: Retrieve active footer configuration (public endpoint)
async function handleGet(client) {
  console.log('GET /footer - retrieving active footer configuration');
  
  try {
    const query = `
      SELECT 
        id, footer_text, text_color, background_color, 
        scroll_speed, scroll_direction, divider_image, 
        font_size, is_active, created_at, updated_at
      FROM footer_config 
      WHERE is_active = true 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'No active footer configuration found',
          code: 'FOOTER_NOT_FOUND'
        })
      };
    }
    
    const footerConfig = result.rows[0];
    
    console.log(`Retrieved footer config ID ${footerConfig.id}: "${footerConfig.footer_text.substring(0, 50)}..."`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(footerConfig)
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
      const insertQuery = `
        INSERT INTO footer_config (
          footer_text, text_color, background_color, 
          scroll_speed, scroll_direction, divider_image, 
          font_size, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        RETURNING 
          id, footer_text, text_color, background_color, 
          scroll_speed, scroll_direction, divider_image, 
          font_size, is_active, created_at, updated_at
      `;
      
      const values = [
        data.footer_text,
        data.text_color || '#101010',
        data.background_color || null,
        data.scroll_speed || 30,
        data.scroll_direction || 'left',
        data.divider_image || 'assets/images/pinas_kroon.svg',
        data.font_size || '3vh'
      ];
      
      const result = await client.query(insertQuery, values);
      const newFooter = result.rows[0];
      
      await client.query('COMMIT');
      
      console.log(`Created new footer config ID ${newFooter.id}`);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newFooter)
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
    
    if (data.footer_text !== undefined) {
      updateFields.push(`footer_text = $${paramIndex++}`);
      updateValues.push(data.footer_text);
    }
    
    if (data.text_color !== undefined) {
      updateFields.push(`text_color = $${paramIndex++}`);
      updateValues.push(data.text_color);
    }
    
    if (data.background_color !== undefined) {
      updateFields.push(`background_color = $${paramIndex++}`);
      updateValues.push(data.background_color);
    }
    
    if (data.scroll_speed !== undefined) {
      updateFields.push(`scroll_speed = $${paramIndex++}`);
      updateValues.push(data.scroll_speed);
    }
    
    if (data.scroll_direction !== undefined) {
      updateFields.push(`scroll_direction = $${paramIndex++}`);
      updateValues.push(data.scroll_direction);
    }
    
    if (data.divider_image !== undefined) {
      updateFields.push(`divider_image = $${paramIndex++}`);
      updateValues.push(data.divider_image);
    }
    
    if (data.font_size !== undefined) {
      updateFields.push(`font_size = $${paramIndex++}`);
      updateValues.push(data.font_size);
    }
    
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
      RETURNING 
        id, footer_text, text_color, background_color, 
        scroll_speed, scroll_direction, divider_image, 
        font_size, is_active, created_at, updated_at
    `;
    
    updateValues.push(currentFooter.id);
    
    const updateResult = await client.query(updateQuery, updateValues);
    const updatedFooter = updateResult.rows[0];
    
    console.log(`Updated footer config ID ${updatedFooter.id}`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedFooter)
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