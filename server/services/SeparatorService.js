/**
 * T015: Create SeparatorService for separator resolution
 * Handles separator type resolution, validation, and rendering for footer content
 */

class SeparatorService {
  constructor() {
    this.separatorMap = {
      'crown': '👑',
      'star': '⭐',
      'dot': '•',
      'dash': '—',
      'space': ' '
    };
  }

  /**
   * Resolve separator based on configuration
   * @param {Object} config - Footer configuration object
   * @returns {string} Resolved separator
   */
  resolveSeparator(config) {
    if (!config) {
      throw new Error('Configuration is required');
    }

    const { separator_type, custom_separator } = config;

    if (separator_type === 'custom') {
      if (!custom_separator || custom_separator.trim().length === 0) {
        throw new Error('Custom separator is required when separator_type is "custom"');
      }
      return custom_separator.trim();
    }

    const separator = this.separatorMap[separator_type];
    if (!separator) {
      throw new Error(`Unknown separator type: ${separator_type}`);
    }

    return separator;
  }

  /**
   * Get all available separator types
   * @returns {Array} Array of separator type objects
   */
  getAvailableSeparators() {
    return Object.entries(this.separatorMap).map(([type, symbol]) => ({
      type,
      symbol,
      preview: symbol
    }));
  }

  /**
   * Validate separator configuration
   * @param {Object} config - Configuration object to validate
   * @returns {Object} { valid: boolean, errors: Array }
   */
  validateSeparatorConfig(config) {
    const errors = [];

    if (!config.separator_type) {
      errors.push({ field: 'separator_type', message: 'Separator type is required' });
      return { valid: false, errors };
    }

    const validTypes = [...Object.keys(this.separatorMap), 'custom'];
    if (!validTypes.includes(config.separator_type)) {
      errors.push({ 
        field: 'separator_type', 
        message: `Invalid separator type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    if (config.separator_type === 'custom') {
      if (!config.custom_separator || config.custom_separator.trim().length === 0) {
        errors.push({ 
          field: 'custom_separator', 
          message: 'Custom separator is required when separator_type is "custom"' 
        });
      } else if (config.custom_separator.length > 50) {
        errors.push({ 
          field: 'custom_separator', 
          message: 'Custom separator must be 50 characters or less' 
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Apply separator styling if needed
   * @param {string} separator - The separator to style
   * @param {Object} config - Footer configuration
   * @returns {string} Styled separator HTML
   */
  applySeparatorStyling(separator, config) {
    if (!config || !separator) return separator;

    const styles = [];
    
    if (config.separator_color) {
      styles.push(`color: ${config.separator_color}`);
    }

    if (styles.length === 0) {
      return separator;
    }

    return `<span style="${styles.join('; ')}">${separator}</span>`;
  }

  /**
   * Create separator with default spacing
   * @param {Object} config - Footer configuration
   * @returns {string} Formatted separator with spacing
   */
  createFormattedSeparator(config) {
    const separator = this.resolveSeparator(config);
    const styledSeparator = this.applySeparatorStyling(separator, config);
    
    // Default spacing if not specified
    const spacing = config.separator_spacing || '0 0.5em';
    
    return `<span style="margin: ${spacing}">${styledSeparator}</span>`;
  }

  /**
   * Preview separator rendering
   * @param {Object} config - Configuration to preview
   * @returns {Object} Preview data
   */
  previewSeparator(config) {
    try {
      const validation = this.validateSeparatorConfig(config);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      const separator = this.resolveSeparator(config);
      const formatted = this.createFormattedSeparator(config);

      return {
        success: true,
        separator: {
          raw: separator,
          formatted,
          type: config.separator_type,
          custom: config.separator_type === 'custom' ? config.custom_separator : null
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SeparatorService;