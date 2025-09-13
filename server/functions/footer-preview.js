// Netlify Function for Team Pinas Signage - Footer Preview Endpoint
// T018: POST footer/preview endpoint for admin preview functionality
// Provides real-time preview of footer configurations without saving

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
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache, no-store, must-revalidate'
};

// Enhanced validation using FooterConfiguration model
function validateFooterData(data) {
  try {
    const config = new FooterConfiguration(data);
    const validation = config.validate();
    
    if (!validation.valid) {
      return validation.errors.map(err => `${err.field}: ${err.message}`);
    }
    
    // Additional validations for content
    const contentValidation = footerContentService.validateContent(config);
    if (!contentValidation.valid) {
      return contentValidation.errors.map(err => `${err.field}: ${err.message}`);
    }
    
    return [];
  } catch (error) {
    console.error('Validation error:', error);
    return ['Invalid configuration data'];
  }
}

// POST: Preview footer configuration (admin only)
async function handlePreview(requestBody) {
  console.log('POST /footer-preview - generating footer configuration preview');
  
  try {
    const data = JSON.parse(requestBody);
    
    // Validate input data
    const validationErrors = validateFooterData(data);
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
    
    // Create temporary configuration for preview
    const config = new FooterConfiguration(data);
    
    // Generate comprehensive preview
    const preview = footerContentService.previewContent(config);
    const separatorPreview = separatorService.previewSeparator(config);
    const contentStats = footerContentService.getContentStats(config);
    
    if (!preview.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Preview generation failed',
          details: preview.error
        })
      };
    }
    
    // Build comprehensive preview response
    const previewResponse = {
      success: true,
      preview: {
        // Content preview
        content: {
          ...preview.preview,
          html: preview.preview.content,
          segments: preview.preview.originalSegments,
          type: preview.preview.type
        },
        
        // Separator preview
        separator: separatorPreview.success ? {
          raw: separatorPreview.separator.raw,
          formatted: separatorPreview.separator.formatted,
          type: separatorPreview.separator.type
        } : null,
        
        // Content statistics
        stats: contentStats,
        
        // Visual configuration
        styles: {
          textColor: config.text_color,
          backgroundColor: config.background_color,
          fontSize: config.font_size,
          opacity: config.opacity,
          textShadow: config.text_shadow,
          borderRadius: config.border_radius
        },
        
        // Animation settings
        animation: {
          scrollSpeed: config.scroll_speed,
          scrollDirection: config.scroll_direction,
          animationTiming: config.animation_timing,
          pauseOnHover: config.pause_on_hover,
          reverseOnComplete: config.reverse_on_complete
        }
      },
      
      // Original configuration
      config: config.toApiResponse(),
      
      // Timestamp
      generatedAt: new Date().toISOString()
    };
    
    console.log(`Generated preview for ${contentStats.segments} segments, ${contentStats.totalLength} characters`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(previewResponse)
    };
    
  } catch (error) {
    console.error('POST /footer-preview error:', error);
    
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
        error: 'Failed to generate footer preview',
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

  try {
    // POST requests require admin authentication
    const authResult = await requireAuth(event);
    
    if (!authResult.success) {
      return createAuthErrorResponse(
        authResult.statusCode || 401,
        authResult.error || 'Authentication failed'
      );
    }
    
    console.log(`POST /footer-preview - authenticated user: ${authResult.user.email || authResult.user.sub}`);
    
    return await handlePreview(event.body);

  } catch (error) {
    console.error('Footer preview endpoint error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};