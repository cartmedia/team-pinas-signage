/**
 * T014: Create FooterConfiguration data model validation
 * Implement validation rules, hex color validation, enum constraints, content length limits
 */

class FooterConfiguration {
  constructor(data = {}) {
    this.id = data.id || null;
    this.footer_text = data.footer_text || '';
    this.text_color = data.text_color || '#1a1a1a';
    this.background_color = data.background_color || '#c19d6c';
    this.font_size = data.font_size || '3vh';
    this.scroll_speed = data.scroll_speed || 8;
    this.scroll_direction = data.scroll_direction || 'continuous';
    this.separator_type = data.separator_type || 'crown';
    this.custom_separator = data.custom_separator || null;
    this.is_visible = data.is_visible !== undefined ? data.is_visible : true;
    this.is_active = data.is_active || false;
    
    // Enhanced fields
    this.separator_spacing = data.separator_spacing || '0 0.5em';
    this.separator_color = data.separator_color || null;
    this.animation_timing = data.animation_timing || 'linear';
    this.pause_on_hover = data.pause_on_hover || false;
    this.reverse_on_complete = data.reverse_on_complete || false;
    this.opacity = data.opacity !== undefined ? data.opacity : 1.0;
    this.text_shadow = data.text_shadow || null;
    this.border_radius = data.border_radius || null;
    
    // Timestamps
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  /**
   * Validate the footer configuration
   * @returns {Object} { valid: boolean, errors: Array }
   */
  validate() {
    const errors = [];

    // Validate footer_text
    if (typeof this.footer_text !== 'string') {
      errors.push({ field: 'footer_text', message: 'Must be a string' });
    } else if (this.footer_text.length > 10000) {
      errors.push({ field: 'footer_text', message: 'Must be 10000 characters or less' });
    }

    // Validate hex colors
    if (!this.isValidHexColor(this.text_color)) {
      errors.push({ field: 'text_color', message: 'Must be a valid hex color (#RRGGBB)' });
    }

    if (!this.isValidHexColor(this.background_color)) {
      errors.push({ field: 'background_color', message: 'Must be a valid hex color (#RRGGBB)' });
    }

    if (this.separator_color !== null && !this.isValidHexColor(this.separator_color)) {
      errors.push({ field: 'separator_color', message: 'Must be a valid hex color (#RRGGBB) or null' });
    }

    // Validate scroll_speed
    if (typeof this.scroll_speed !== 'number' || this.scroll_speed < 1 || this.scroll_speed > 100) {
      errors.push({ field: 'scroll_speed', message: 'Must be a number between 1 and 100' });
    }

    // Validate scroll_direction enum
    const validDirections = ['continuous', 'discrete', 'static'];
    if (!validDirections.includes(this.scroll_direction)) {
      errors.push({ field: 'scroll_direction', message: `Must be one of: ${validDirections.join(', ')}` });
    }

    // Validate separator_type enum
    const validSeparatorTypes = ['custom', 'crown', 'star', 'dot', 'dash', 'space'];
    if (!validSeparatorTypes.includes(this.separator_type)) {
      errors.push({ field: 'separator_type', message: `Must be one of: ${validSeparatorTypes.join(', ')}` });
    }

    // Validate custom_separator when type is custom
    if (this.separator_type === 'custom') {
      if (!this.custom_separator || this.custom_separator.length === 0) {
        errors.push({ field: 'custom_separator', message: 'Required when separator_type is "custom"' });
      } else if (this.custom_separator.length > 50) {
        errors.push({ field: 'custom_separator', message: 'Must be 50 characters or less' });
      }
    }

    // Validate animation_timing enum
    const validTimings = ['linear', 'ease', 'ease-in-out', 'ease-in', 'ease-out'];
    if (!validTimings.includes(this.animation_timing)) {
      errors.push({ field: 'animation_timing', message: `Must be one of: ${validTimings.join(', ')}` });
    }

    // Validate opacity
    if (typeof this.opacity !== 'number' || this.opacity < 0 || this.opacity > 1) {
      errors.push({ field: 'opacity', message: 'Must be a number between 0.0 and 1.0' });
    }

    // Validate boolean fields
    if (typeof this.is_visible !== 'boolean') {
      errors.push({ field: 'is_visible', message: 'Must be a boolean' });
    }

    if (typeof this.is_active !== 'boolean') {
      errors.push({ field: 'is_active', message: 'Must be a boolean' });
    }

    if (typeof this.pause_on_hover !== 'boolean') {
      errors.push({ field: 'pause_on_hover', message: 'Must be a boolean' });
    }

    if (typeof this.reverse_on_complete !== 'boolean') {
      errors.push({ field: 'reverse_on_complete', message: 'Must be a boolean' });
    }

    // Validate font_size (basic CSS validation)
    if (!this.isValidCSSSize(this.font_size)) {
      errors.push({ field: 'font_size', message: 'Must be a valid CSS size (e.g., "3vh", "24px")' });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate hex color format
   * @param {string} color 
   * @returns {boolean}
   */
  isValidHexColor(color) {
    if (typeof color !== 'string') return false;
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  }

  /**
   * Basic CSS size validation
   * @param {string} size 
   * @returns {boolean}
   */
  isValidCSSSize(size) {
    if (typeof size !== 'string') return false;
    // Allow common CSS units
    return /^\d+(\.\d+)?(px|vh|vw|em|rem|%)$/.test(size) || size === 'inherit' || size === 'initial';
  }

  /**
   * Convert to plain object for database storage
   * @returns {Object}
   */
  toObject() {
    return {
      id: this.id,
      footer_text: this.footer_text,
      text_color: this.text_color,
      background_color: this.background_color,
      font_size: this.font_size,
      scroll_speed: this.scroll_speed,
      scroll_direction: this.scroll_direction,
      separator_type: this.separator_type,
      custom_separator: this.custom_separator,
      is_visible: this.is_visible,
      is_active: this.is_active,
      separator_spacing: this.separator_spacing,
      separator_color: this.separator_color,
      animation_timing: this.animation_timing,
      pause_on_hover: this.pause_on_hover,
      reverse_on_complete: this.reverse_on_complete,
      opacity: this.opacity,
      text_shadow: this.text_shadow,
      border_radius: this.border_radius,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  /**
   * Convert to API response format
   * @returns {Object}
   */
  toApiResponse() {
    const obj = this.toObject();
    
    // Convert timestamps to ISO strings if they exist
    if (obj.created_at instanceof Date) {
      obj.created_at = obj.created_at.toISOString();
    }
    if (obj.updated_at instanceof Date) {
      obj.updated_at = obj.updated_at.toISOString();
    }

    return obj;
  }

  /**
   * Create FooterConfiguration from database row
   * @param {Object} row 
   * @returns {FooterConfiguration}
   */
  static fromDatabaseRow(row) {
    return new FooterConfiguration({
      id: row.id,
      footer_text: row.footer_text,
      text_color: row.text_color,
      background_color: row.background_color,
      font_size: row.font_size,
      scroll_speed: row.scroll_speed,
      scroll_direction: row.scroll_direction,
      separator_type: row.separator_type,
      custom_separator: row.custom_separator,
      is_visible: row.is_visible,
      is_active: row.is_active,
      separator_spacing: row.separator_spacing,
      separator_color: row.separator_color,
      animation_timing: row.animation_timing,
      pause_on_hover: row.pause_on_hover,
      reverse_on_complete: row.reverse_on_complete,
      opacity: row.opacity,
      text_shadow: row.text_shadow,
      border_radius: row.border_radius,
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  }

  /**
   * Validate request data for API endpoints
   * @param {Object} requestData 
   * @param {boolean} isUpdate - Whether this is an update (PUT) request
   * @returns {Object} { valid: boolean, errors: Array, config: FooterConfiguration }
   */
  static validateRequest(requestData, isUpdate = false) {
    const config = new FooterConfiguration(requestData);
    
    if (isUpdate) {
      // For updates, only validate provided fields
      const validation = config.validatePartial(requestData);
      return {
        ...validation,
        config: validation.valid ? config : null
      };
    } else {
      // For creation, validate all fields
      const validation = config.validate();
      return {
        ...validation,
        config: validation.valid ? config : null
      };
    }
  }

  /**
   * Validate only the provided fields (for partial updates)
   * @param {Object} providedData - Only the fields provided in the request
   * @returns {Object} { valid: boolean, errors: Array }
   */
  validatePartial(providedData) {
    const errors = [];

    // Only validate fields that are actually provided
    if (providedData.footer_text !== undefined) {
      if (typeof this.footer_text !== 'string' || this.footer_text.length === 0) {
        errors.push({ field: 'footer_text', message: 'Must be a non-empty string' });
      } else if (this.footer_text.length > 10000) {
        errors.push({ field: 'footer_text', message: 'Must be 10000 characters or less' });
      }
    }

    // Validate hex colors if provided
    if (providedData.text_color !== undefined && !this.isValidHexColor(this.text_color)) {
      errors.push({ field: 'text_color', message: 'Must be a valid hex color (#RRGGBB)' });
    }

    if (providedData.background_color !== undefined && !this.isValidHexColor(this.background_color)) {
      errors.push({ field: 'background_color', message: 'Must be a valid hex color (#RRGGBB)' });
    }

    if (providedData.separator_color !== undefined && this.separator_color !== null && !this.isValidHexColor(this.separator_color)) {
      errors.push({ field: 'separator_color', message: 'Must be a valid hex color (#RRGGBB) or null' });
    }

    // Validate scroll_speed if provided
    if (providedData.scroll_speed !== undefined) {
      if (typeof this.scroll_speed !== 'number' || this.scroll_speed < 1 || this.scroll_speed > 100) {
        errors.push({ field: 'scroll_speed', message: 'Must be a number between 1 and 100' });
      }
    }

    // Validate enums if provided
    if (providedData.scroll_direction !== undefined) {
      const validDirections = ['continuous', 'discrete', 'static'];
      if (!validDirections.includes(this.scroll_direction)) {
        errors.push({ field: 'scroll_direction', message: `Must be one of: ${validDirections.join(', ')}` });
      }
    }

    if (providedData.separator_type !== undefined) {
      const validSeparatorTypes = ['custom', 'crown', 'star', 'dot', 'dash', 'space'];
      if (!validSeparatorTypes.includes(this.separator_type)) {
        errors.push({ field: 'separator_type', message: `Must be one of: ${validSeparatorTypes.join(', ')}` });
      }
    }

    // Validate custom_separator when type is custom
    if (providedData.separator_type === 'custom' || (this.separator_type === 'custom' && providedData.custom_separator !== undefined)) {
      if (!this.custom_separator || this.custom_separator.length === 0) {
        errors.push({ field: 'custom_separator', message: 'Required when separator_type is "custom"' });
      } else if (this.custom_separator.length > 50) {
        errors.push({ field: 'custom_separator', message: 'Must be 50 characters or less' });
      }
    }

    if (providedData.animation_timing !== undefined) {
      const validTimings = ['linear', 'ease', 'ease-in-out', 'ease-in', 'ease-out'];
      if (!validTimings.includes(this.animation_timing)) {
        errors.push({ field: 'animation_timing', message: `Must be one of: ${validTimings.join(', ')}` });
      }
    }

    // Validate opacity if provided
    if (providedData.opacity !== undefined) {
      if (typeof this.opacity !== 'number' || this.opacity < 0 || this.opacity > 1) {
        errors.push({ field: 'opacity', message: 'Must be a number between 0.0 and 1.0' });
      }
    }

    // Validate font_size if provided
    if (providedData.font_size !== undefined && !this.isValidCSSSize(this.font_size)) {
      errors.push({ field: 'font_size', message: 'Must be a valid CSS size (e.g., "3vh", "24px")' });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = FooterConfiguration;