/**
 * T016: Create FooterContentService for content parsing
 * Handles footer content parsing, segment processing, and HTML generation
 */

const SeparatorService = require('./SeparatorService');

class FooterContentService {
  constructor() {
    this.separatorService = new SeparatorService();
  }

  /**
   * Parse footer text into segments based on separator
   * @param {string} text - Raw footer text
   * @param {string} separator - Separator to split on (default: '<separator>')
   * @returns {Array} Array of text segments
   */
  parseTextSegments(text, separator = '<separator>') {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const segments = text
      .split(separator)
      .map(segment => segment.trim())
      .filter(segment => segment.length > 0);

    return segments;
  }

  /**
   * Generate continuous scrolling content
   * @param {Array} segments - Text segments
   * @param {Object} config - Footer configuration
   * @returns {string} HTML content for scrolling
   */
  generateContinuousContent(segments, config) {
    if (!segments || segments.length === 0) {
      return '';
    }

    try {
      const separator = this.separatorService.createFormattedSeparator(config);
      const joinedContent = segments.join(` ${separator} `);
      
      // Duplicate content for seamless scrolling
      return `${joinedContent} ${separator} ${joinedContent}`;
    } catch (error) {
      console.error('Error generating continuous content:', error);
      // Fallback to simple joining
      return segments.join(' • ');
    }
  }

  /**
   * Generate discrete scrolling content (individual segments)
   * @param {Array} segments - Text segments
   * @param {Object} config - Footer configuration
   * @returns {Array} Array of individual content blocks
   */
  generateDiscreteContent(segments, config) {
    if (!segments || segments.length === 0) {
      return [];
    }

    try {
      const separator = this.separatorService.createFormattedSeparator(config);
      
      return segments.map((segment, index) => ({
        id: `segment-${index}`,
        content: segment.trim(),
        separator: index < segments.length - 1 ? separator : ''
      }));
    } catch (error) {
      console.error('Error generating discrete content:', error);
      // Fallback without separators
      return segments.map((segment, index) => ({
        id: `segment-${index}`,
        content: segment.trim(),
        separator: ''
      }));
    }
  }

  /**
   * Generate static content (no scrolling)
   * @param {Array} segments - Text segments
   * @param {Object} config - Footer configuration
   * @returns {string} Static HTML content
   */
  generateStaticContent(segments, config) {
    if (!segments || segments.length === 0) {
      return '';
    }

    try {
      const separator = this.separatorService.createFormattedSeparator(config);
      return segments.join(` ${separator} `);
    } catch (error) {
      console.error('Error generating static content:', error);
      // Fallback to simple joining
      return segments.join(' • ');
    }
  }

  /**
   * Process footer content based on scroll direction
   * @param {Object} config - Footer configuration
   * @returns {Object} Processed content object
   */
  processFooterContent(config) {
    if (!config || !config.footer_text) {
      return {
        success: false,
        error: 'Footer text is required'
      };
    }

    try {
      const segments = this.parseTextSegments(config.footer_text);
      
      if (segments.length === 0) {
        return {
          success: false,
          error: 'No valid content segments found'
        };
      }

      let processedContent;
      let contentType = config.scroll_direction || 'continuous';

      switch (contentType) {
        case 'continuous':
          processedContent = {
            type: 'continuous',
            content: this.generateContinuousContent(segments, config),
            segments: segments.length
          };
          break;

        case 'discrete':
          processedContent = {
            type: 'discrete',
            content: this.generateDiscreteContent(segments, config),
            segments: segments.length
          };
          break;

        case 'static':
          processedContent = {
            type: 'static',
            content: this.generateStaticContent(segments, config),
            segments: segments.length
          };
          break;

        default:
          throw new Error(`Unknown scroll direction: ${contentType}`);
      }

      return {
        success: true,
        ...processedContent,
        originalSegments: segments
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate preview of footer content
   * @param {Object} config - Configuration to preview
   * @returns {Object} Preview data
   */
  previewContent(config) {
    const processed = this.processFooterContent(config);
    
    if (!processed.success) {
      return processed;
    }

    try {
      const separatorPreview = this.separatorService.previewSeparator(config);
      
      return {
        success: true,
        preview: {
          ...processed,
          separator: separatorPreview.success ? separatorPreview.separator : null,
          config: {
            scroll_direction: config.scroll_direction,
            scroll_speed: config.scroll_speed,
            text_color: config.text_color,
            background_color: config.background_color,
            font_size: config.font_size
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Preview generation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate content configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} { valid: boolean, errors: Array }
   */
  validateContent(config) {
    const errors = [];

    if (!config) {
      errors.push({ field: 'config', message: 'Configuration is required' });
      return { valid: false, errors };
    }

    if (!config.footer_text || config.footer_text.trim().length === 0) {
      errors.push({ field: 'footer_text', message: 'Footer text is required' });
    }

    const validDirections = ['continuous', 'discrete', 'static'];
    if (config.scroll_direction && !validDirections.includes(config.scroll_direction)) {
      errors.push({ 
        field: 'scroll_direction', 
        message: `Invalid scroll direction. Must be one of: ${validDirections.join(', ')}` 
      });
    }

    // Validate separator configuration
    const separatorValidation = this.separatorService.validateSeparatorConfig(config);
    if (!separatorValidation.valid) {
      errors.push(...separatorValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate estimated animation duration
   * @param {string} content - Content to animate
   * @param {number} scrollSpeed - Scroll speed (1-100)
   * @returns {number} Duration in seconds
   */
  calculateAnimationDuration(content, scrollSpeed = 8) {
    if (!content) return 0;
    
    // Rough estimation: 1 character = 0.1 seconds at speed 10
    const baseRate = 0.1;
    const speedMultiplier = 11 - (scrollSpeed / 10); // Invert speed (higher speed = faster)
    const characterCount = content.length;
    
    return Math.max(1, (characterCount * baseRate * speedMultiplier));
  }

  /**
   * Sanitize content for HTML output
   * @param {string} content - Content to sanitize
   * @returns {string} Sanitized content
   */
  sanitizeContent(content) {
    if (!content || typeof content !== 'string') {
      return '';
    }

    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .trim();
  }

  /**
   * Get content statistics
   * @param {Object} config - Footer configuration
   * @returns {Object} Content statistics
   */
  getContentStats(config) {
    if (!config || !config.footer_text) {
      return {
        segments: 0,
        totalLength: 0,
        estimatedDuration: 0
      };
    }

    const segments = this.parseTextSegments(config.footer_text);
    const processed = this.processFooterContent(config);
    
    let contentLength = 0;
    if (processed.success && typeof processed.content === 'string') {
      contentLength = processed.content.length;
    }

    return {
      segments: segments.length,
      totalLength: contentLength,
      estimatedDuration: this.calculateAnimationDuration(
        processed.success ? processed.content : '',
        config.scroll_speed
      ),
      averageSegmentLength: segments.length > 0 ? 
        Math.round(config.footer_text.length / segments.length) : 0
    };
  }
}

module.exports = FooterContentService;