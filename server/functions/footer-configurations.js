// Netlify Function for Team Pinas Signage - Footer Configurations Management
// T020-T021: GET/POST footer/configurations endpoints for admin management
// Provides listing and creation of footer configurations

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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate'
};

// Enhanced validation using FooterConfiguration model
function validateFooterData(data, isUpdate = false) {
  try {
    const validation = FooterConfiguration.validateRequest(data, isUpdate);
    
    if (!validation.valid) {
      return validation.errors.map(err => `${err.field}: ${err.message}`);
    }
    
    // Additional validations for content
    const contentValidation = footerContentService.validateContent(validation.config);
    if (!contentValidation.valid) {
      return contentValidation.errors.map(err => `${err.field}: ${err.message}`);
    }
    
    return [];
  } catch (error) {
    console.error('Validation error:', error);
    return ['Invalid configuration data'];
  }
}

// GET: List all footer configurations (admin only)
async function handleGet(client, event) {
  console.log('GET /footer-configurations - listing footer configurations');
  
  try {
    const queryParams = event.queryStringParameters || {};
    const includeInactive = queryParams.include_inactive === 'true';
    const limit = parseInt(queryParams.limit) || 20;
    const offset = parseInt(queryParams.offset) || 0;
    
    // Build dynamic query
    let query = `
      SELECT 
        id, footer_text, text_color, background_color, 
        scroll_speed, scroll_direction, font_size, 
        is_visible, is_active, separator_type, custom_separator,
        separator_spacing, separator_color, animation_timing,
        pause_on_hover, reverse_on_complete, opacity,
        text_shadow, border_radius, divider_image,
        created_at, updated_at
      FROM footer_config 
    `;
    
    const params = [];
    const conditions = [];
    
    // Filter by active status if not including inactive
    if (!includeInactive) {
      conditions.push('is_active = true OR is_visible = true');
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY is_active DESC, updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await client.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM footer_config';
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countResult = await client.query(countQuery);
    const total = parseInt(countResult.rows[0].total);
    
    // Convert database rows to FooterConfiguration objects
    const configurations = result.rows.map(row => {
      const config = FooterConfiguration.fromDatabaseRow(row);
      
      // Add content preview for each configuration
      const contentPreview = footerContentService.processFooterContent(config);
      const contentStats = footerContentService.getContentStats(config);
      
      return {
        ...config.toApiResponse(),
        preview: {
          segments: contentStats.segments,
          totalLength: contentStats.totalLength,
          estimatedDuration: contentStats.estimatedDuration,
          contentType: config.scroll_direction,
          separatorType: config.separator_type
        }
      };
    });
    
    const response = {
      success: true,
      configurations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + configurations.length < total
      },
      meta: {
        activeCount: configurations.filter(c => c.is_active).length,
        visibleCount: configurations.filter(c => c.is_visible).length,
        totalCount: total,
        includeInactive
      }
    };
    
    console.log(`Retrieved ${configurations.length} configurations (total: ${total}, active: ${response.meta.activeCount})`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('GET /footer-configurations error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to retrieve footer configurations',
        details: error.message 
      })
    };
  }
}

// POST: Create new footer configuration (admin only)
async function handlePost(client, requestBody) {
  console.log('POST /footer-configurations - creating new footer configuration');
  
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
    
    // Create configuration (default to inactive)
    const config = new FooterConfiguration({ ...data, is_active: false });
    
    // Insert new configuration
    const insertQuery = `
      INSERT INTO footer_config (
        footer_text, text_color, background_color, 
        scroll_speed, scroll_direction, font_size, 
        is_visible, is_active, separator_type, custom_separator,
        separator_spacing, separator_color, animation_timing,
        pause_on_hover, reverse_on_complete, opacity,
        text_shadow, border_radius, divider_image
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
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
      false, // Always create as inactive
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
    const newConfig = FooterConfiguration.fromDatabaseRow(result.rows[0]);
    
    // Generate content preview for the response
    const contentStats = footerContentService.getContentStats(newConfig);
    
    const response = {
      success: true,
      configuration: {
        ...newConfig.toApiResponse(),
        preview: {
          segments: contentStats.segments,
          totalLength: contentStats.totalLength,
          estimatedDuration: contentStats.estimatedDuration,
          contentType: newConfig.scroll_direction,
          separatorType: newConfig.separator_type
        }
      }
    };
    
    console.log(`Created new footer configuration ID ${newConfig.id} (inactive)`);
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('POST /footer-configurations error:', error);
    
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
    // All requests require admin authentication
    const authResult = await requireAuth(event);
    
    if (!authResult.success) {
      return createAuthErrorResponse(
        authResult.statusCode || 401,
        authResult.error || 'Authentication failed'
      );
    }
    
    console.log(`${event.httpMethod} /footer-configurations - authenticated user: ${authResult.user.email || authResult.user.sub}`);
    
    if (event.httpMethod === 'GET') {
      return await handleGet(client, event);
    } else if (event.httpMethod === 'POST') {
      return await handlePost(client, event.body);
    }
    
    // Method not allowed
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: `Method ${event.httpMethod} not allowed`,
        allowed: ['GET', 'POST', 'OPTIONS']
      })
    };

  } catch (error) {
    console.error('Footer configurations endpoint error:', error);
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