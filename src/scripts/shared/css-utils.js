/**
 * CSS Utility Functions for Footer Component
 * 
 * Provides utilities for CSS property mapping, validation, and management
 * to bridge database configuration with CSS custom properties.
 */

/**
 * Maps database footer configuration to CSS custom properties
 * @param {Object} config - Footer configuration from database
 * @returns {Object} CSS custom property mappings
 */
function mapConfigToCSSProperties(config) {
  const cssProperties = {};
  
  // Text color mapping with validation
  if (config.text_color && isValidHexColor(config.text_color)) {
    cssProperties['--footer-text-color'] = config.text_color;
  }
  
  // Background color mapping with validation
  if (config.background_color && isValidHexColor(config.background_color)) {
    cssProperties['--footer-bg-color'] = config.background_color;
  }
  
  // Font size mapping with validation
  if (config.font_size && isValidCSSSize(config.font_size)) {
    cssProperties['--footer-font-size'] = config.font_size;
  }
  
  // Scroll speed mapping (convert to pixels per second)
  if (config.scroll_speed && typeof config.scroll_speed === 'number') {
    const clampedSpeed = Math.max(20, Math.min(200, config.scroll_speed));
    cssProperties['--footer-scroll-speed'] = `${clampedSpeed}px`;
  }
  
  // Scroll direction mapping
  if (config.scroll_direction) {
    cssProperties['--footer-scroll-direction'] = config.scroll_direction === 'right' ? '-1' : '1';
  }
  
  return cssProperties;
}

/**
 * Applies CSS custom properties to a DOM element
 * @param {HTMLElement} element - Target element
 * @param {Object} properties - CSS custom properties to apply
 */
function applyCSSProperties(element, properties) {
  if (!element || !properties) return;
  
  Object.entries(properties).forEach(([property, value]) => {
    if (property.startsWith('--') && value !== undefined) {
      element.style.setProperty(property, value);
    }
  });
}

/**
 * Removes CSS custom properties from a DOM element
 * @param {HTMLElement} element - Target element
 * @param {Array<string>} properties - Property names to remove
 */
function removeCSSProperties(element, properties) {
  if (!element || !Array.isArray(properties)) return;
  
  properties.forEach(property => {
    if (property.startsWith('--')) {
      element.style.removeProperty(property);
    }
  });
}

/**
 * Validates hex color format
 * @param {string} color - Color string to validate
 * @returns {boolean} True if valid hex color
 */
function isValidHexColor(color) {
  if (typeof color !== 'string') return false;
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Validates CSS size format (px, vh, rem, em)
 * @param {string} size - Size string to validate
 * @returns {boolean} True if valid CSS size
 */
function isValidCSSSize(size) {
  if (typeof size !== 'string') return false;
  return /^\d+(\.\d+)?(px|vh|rem|em)$/.test(size);
}

/**
 * Gets computed CSS custom property value
 * @param {HTMLElement} element - Element to read from
 * @param {string} property - CSS custom property name
 * @returns {string} Computed property value
 */
function getCSSProperty(element, property) {
  if (!element || !property.startsWith('--')) return '';
  
  const computedStyle = getComputedStyle(element);
  return computedStyle.getPropertyValue(property).trim();
}

/**
 * Converts configuration object to CSS class names
 * @param {Object} config - Footer configuration
 * @returns {Array<string>} CSS class names
 */
function configToCSSClasses(config) {
  const classes = ['SignageFooter'];
  
  // Visibility state
  if (config.is_active) {
    classes.push('footer-visible');
  } else {
    classes.push('footer-hidden');
  }
  
  // Theme classes based on colors
  if (config.text_color === '#ffffff' || config.text_color === '#FFFFFF') {
    classes.push('footer-theme-light');
  } else if (config.text_color === '#101010' || config.text_color === '#000000') {
    classes.push('footer-theme-dark');
  }
  
  // Size classes based on font size
  if (config.font_size) {
    const sizeValue = parseFloat(config.font_size);
    if (config.font_size.includes('vh')) {
      if (sizeValue <= 2.5) {
        classes.push('footer-size-small');
      } else if (sizeValue >= 4) {
        classes.push('footer-size-large');
      } else {
        classes.push('footer-size-medium');
      }
    }
  }
  
  // Speed classes
  if (config.scroll_speed) {
    if (config.scroll_speed <= 40) {
      classes.push('footer-speed-slow');
    } else if (config.scroll_speed >= 80) {
      classes.push('footer-speed-fast');
    } else {
      classes.push('footer-speed-medium');
    }
  }
  
  // Direction classes
  if (config.scroll_direction === 'right') {
    classes.push('footer-direction-right');
  } else {
    classes.push('footer-direction-left');
  }
  
  return classes;
}

/**
 * Safely updates multiple CSS custom properties with fallbacks
 * @param {HTMLElement} element - Target element
 * @param {Object} config - Footer configuration
 * @param {Object} fallbacks - Fallback values for properties
 */
function updateFooterStyles(element, config, fallbacks = {}) {
  if (!element) return;
  
  const cssProperties = mapConfigToCSSProperties(config);
  
  // Apply fallbacks for missing properties
  const defaultFallbacks = {
    '--footer-text-color': '#101010',
    '--footer-bg-color': '#c19d6c',
    '--footer-font-size': '3vh',
    '--footer-scroll-speed': '50px',
    '--footer-scroll-direction': '1'
  };
  
  const mergedFallbacks = { ...defaultFallbacks, ...fallbacks };
  
  // Apply properties with fallbacks
  Object.entries(mergedFallbacks).forEach(([property, fallback]) => {
    const value = cssProperties[property] || fallback;
    element.style.setProperty(property, value);
  });
  
  // Update CSS classes
  const cssClasses = configToCSSClasses(config);
  element.className = cssClasses.join(' ');
}

/**
 * Validates that CSS custom properties are properly applied
 * @param {HTMLElement} element - Element to validate
 * @param {Array<string>} requiredProperties - Properties that must be present
 * @returns {Object} Validation result with any missing properties
 */
function validateCSSProperties(element, requiredProperties = []) {
  if (!element) {
    return { valid: false, missing: requiredProperties };
  }
  
  const computedStyle = getComputedStyle(element);
  const missing = [];
  
  requiredProperties.forEach(property => {
    const value = computedStyle.getPropertyValue(property).trim();
    if (!value) {
      missing.push(property);
    }
  });
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Creates a CSS custom property hash for change detection
 * @param {Object} config - Footer configuration
 * @returns {string} Hash string for detecting changes
 */
function createConfigHash(config) {
  const relevantProps = [
    'text_color',
    'background_color', 
    'font_size',
    'scroll_speed',
    'scroll_direction',
    'is_active',
    'footer_text'
  ];
  
  const hashData = relevantProps
    .map(prop => `${prop}:${config[prop]}`)
    .join('|');
    
  // Simple hash function for change detection
  let hash = 0;
  for (let i = 0; i < hashData.length; i++) {
    const char = hashData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.CSSUtils = {
    mapConfigToCSSProperties,
    applyCSSProperties,
    removeCSSProperties,
    isValidHexColor,
    isValidCSSSize,
    getCSSProperty,
    configToCSSClasses,
    updateFooterStyles,
    validateCSSProperties,
    createConfigHash
  };
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mapConfigToCSSProperties,
    applyCSSProperties,
    removeCSSProperties,
    isValidHexColor,
    isValidCSSSize,
    getCSSProperty,
    configToCSSClasses,
    updateFooterStyles,
    validateCSSProperties,
    createConfigHash
  };
}