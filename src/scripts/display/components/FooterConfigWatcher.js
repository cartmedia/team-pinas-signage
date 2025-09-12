/**
 * FooterConfigWatcher Component
 * 
 * Watches for footer configuration changes and updates the component accordingly.
 * Provides real-time configuration updates without page refresh.
 */

class FooterConfigWatcher {
  /**
   * Creates a new FooterConfigWatcher instance
   * @param {HTMLElement} footerContainer - Footer container element
   * @param {ScrollingFooter} footerComponent - Footer component instance
   * @param {Object} options - Configuration options
   */
  constructor(footerContainer, footerComponent, options = {}) {
    this.container = footerContainer;
    this.footerComponent = footerComponent;
    
    // Configuration options
    this.options = {
      pollInterval: 30000, // Poll every 30 seconds
      apiEndpoint: '/.netlify/functions/footer',
      maxRetries: 3,
      retryDelay: 5000,
      ...options
    };
    
    // State tracking
    this.currentConfigHash = null;
    this.isPolling = false;
    this.pollInterval = null;
    this.retryCount = 0;
    this.lastError = null;
    
    // Event handlers bound to this instance
    this.boundHandlers = {
      handleVisibilityChange: this.handleVisibilityChange.bind(this),
      handleOnline: this.handleOnline.bind(this),
      handleOffline: this.handleOffline.bind(this)
    };
    
    this.setupEventListeners();
  }
  
  /**
   * Sets up event listeners for browser events
   */
  setupEventListeners() {
    // Listen for page visibility changes to pause/resume polling
    document.addEventListener('visibilitychange', this.boundHandlers.handleVisibilityChange);
    
    // Listen for network status changes
    window.addEventListener('online', this.boundHandlers.handleOnline);
    window.addEventListener('offline', this.boundHandlers.handleOffline);
  }
  
  /**
   * Starts watching for configuration changes
   * @param {Object} initialConfig - Initial configuration to establish baseline
   */
  start(initialConfig = null) {
    if (this.isPolling) return;
    
    this.isPolling = true;
    
    // Set initial configuration hash
    if (initialConfig) {
      this.currentConfigHash = createConfigHash(initialConfig);
    }
    
    // Start polling for changes
    this.startPolling();
    
    console.log('FooterConfigWatcher: Started watching for configuration changes');
  }
  
  /**
   * Stops watching for configuration changes
   */
  stop() {
    if (!this.isPolling) return;
    
    this.isPolling = false;
    
    // Clear polling interval
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    console.log('FooterConfigWatcher: Stopped watching for configuration changes');
  }
  
  /**
   * Starts the polling mechanism
   */
  startPolling() {
    this.pollInterval = setInterval(async () => {
      await this.checkForConfigChanges();
    }, this.options.pollInterval);
  }
  
  /**
   * Checks for configuration changes via API
   */
  async checkForConfigChanges() {
    if (!this.isPolling || !navigator.onLine) return;
    
    try {
      const response = await fetch(this.options.apiEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const config = await response.json();
      
      // Check if configuration has changed
      const configHash = createConfigHash(config);
      
      if (this.currentConfigHash && configHash !== this.currentConfigHash) {
        console.log('FooterConfigWatcher: Configuration change detected');
        await this.handleConfigChange(config);
      }
      
      // Update current hash
      this.currentConfigHash = configHash;
      
      // Reset retry count on successful request
      this.retryCount = 0;
      this.lastError = null;
      
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Handles configuration changes
   * @param {Object} newConfig - New configuration from API
   */
  async handleConfigChange(newConfig) {
    if (!this.footerComponent) return;
    
    try {
      // Dispatch custom event for configuration change
      const changeEvent = new CustomEvent('footer-config-change', {
        detail: { 
          newConfig,
          oldHash: this.currentConfigHash,
          newHash: createConfigHash(newConfig)
        }
      });
      
      this.container.dispatchEvent(changeEvent);
      
      // Update footer component with new configuration
      const success = await this.footerComponent.updateConfig(newConfig);
      
      if (success) {
        console.log('FooterConfigWatcher: Successfully updated footer configuration');
        
        // Dispatch success event
        const successEvent = new CustomEvent('footer-config-updated', {
          detail: { config: newConfig }
        });
        
        this.container.dispatchEvent(successEvent);
      } else {
        throw new Error('Footer component failed to update configuration');
      }
      
    } catch (error) {
      console.error('FooterConfigWatcher: Error updating configuration:', error);
      
      // Dispatch error event
      const errorEvent = new CustomEvent('footer-config-error', {
        detail: { error: error.message, config: newConfig }
      });
      
      this.container.dispatchEvent(errorEvent);
    }
  }
  
  /**
   * Handles errors during configuration polling
   * @param {Error} error - Error that occurred
   */
  handleError(error) {
    this.lastError = error;
    this.retryCount++;
    
    console.warn(`FooterConfigWatcher: Error checking configuration (attempt ${this.retryCount}):`, error.message);
    
    // Stop polling if max retries reached
    if (this.retryCount >= this.options.maxRetries) {
      console.error('FooterConfigWatcher: Maximum retries reached, stopping polling');
      this.stop();
      
      // Dispatch max retries error event
      const maxRetriesEvent = new CustomEvent('footer-config-max-retries', {
        detail: { 
          error: error.message,
          retryCount: this.retryCount
        }
      });
      
      this.container.dispatchEvent(maxRetriesEvent);
    }
  }
  
  /**
   * Handles page visibility changes (pause/resume polling when tab is hidden/visible)
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, pause polling to save resources
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    } else {
      // Page is visible, resume polling if we were polling before
      if (this.isPolling && !this.pollInterval) {
        this.startPolling();
        
        // Immediately check for changes when page becomes visible
        setTimeout(() => this.checkForConfigChanges(), 1000);
      }
    }
  }
  
  /**
   * Handles online event (network connection restored)
   */
  handleOnline() {
    console.log('FooterConfigWatcher: Network connection restored');
    
    // Restart polling if it was stopped due to network issues
    if (this.isPolling && !this.pollInterval) {
      this.startPolling();
    }
    
    // Reset retry count
    this.retryCount = 0;
    
    // Immediately check for changes when coming back online
    setTimeout(() => this.checkForConfigChanges(), 2000);
  }
  
  /**
   * Handles offline event (network connection lost)
   */
  handleOffline() {
    console.log('FooterConfigWatcher: Network connection lost, pausing configuration polling');
    
    // Keep polling flag but stop the actual polling
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
  
  /**
   * Manually triggers a configuration check (useful for testing or manual refresh)
   */
  async manualCheck() {
    console.log('FooterConfigWatcher: Manual configuration check triggered');
    await this.checkForConfigChanges();
  }
  
  /**
   * Gets current watcher status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isPolling: this.isPolling,
      currentConfigHash: this.currentConfigHash,
      retryCount: this.retryCount,
      lastError: this.lastError?.message || null,
      isOnline: navigator.onLine,
      pollInterval: this.options.pollInterval
    };
  }
  
  /**
   * Updates polling options
   * @param {Object} newOptions - New options to merge
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    // Restart polling with new interval if needed
    if (this.isPolling && newOptions.pollInterval) {
      this.stop();
      this.start();
    }
  }
  
  /**
   * Cleans up event listeners and stops polling
   */
  destroy() {
    this.stop();
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.boundHandlers.handleVisibilityChange);
    window.removeEventListener('online', this.boundHandlers.handleOnline);
    window.removeEventListener('offline', this.boundHandlers.handleOffline);
    
    // Clear references
    this.container = null;
    this.footerComponent = null;
    this.boundHandlers = {};
    
    console.log('FooterConfigWatcher: Destroyed');
  }
}

// Helper function for config hashing (inline since we can't import)
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

// Make FooterConfigWatcher available globally
if (typeof window !== 'undefined') {
  window.FooterConfigWatcher = FooterConfigWatcher;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FooterConfigWatcher;
}