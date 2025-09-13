/**
 * FooterPreview Component
 * Real-time preview component for footer configurations in the admin interface
 * 
 * Features:
 * - Live preview of footer configurations
 * - Support for all enhancement features (discrete mode, separator types, etc.)
 * - Real-time updates as configuration changes
 * - Error handling and fallback displays
 * - Performance optimization for admin interface
 * 
 * @example
 * const preview = new FooterPreview(previewContainer, {
 *   apiEndpoint: '/.netlify/functions/footer-preview',
 *   onError: (error) => console.error('Preview error:', error)
 * });
 * 
 * preview.updateConfiguration({
 *   footer_text: "Preview text <separator> Second segment",
 *   scroll_direction: "discrete",
 *   separator_type: "crown"
 * });
 */

class FooterPreview {
    /**
     * Create a FooterPreview instance
     * @param {HTMLElement} container - Container element for the preview
     * @param {Object} options - Configuration options
     * @param {string} options.apiEndpoint - Preview API endpoint URL
     * @param {Function} options.onError - Error handler function
     * @param {boolean} options.enableLiveUpdate - Enable real-time updates (default: true)
     */
    constructor(container, options = {}) {
        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('FooterPreview requires a valid HTMLElement container');
        }

        this.container = container;
        this.options = {
            apiEndpoint: options.apiEndpoint || '/.netlify/functions/footer-preview',
            onError: options.onError || this._defaultErrorHandler.bind(this),
            enableLiveUpdate: options.enableLiveUpdate !== false,
            debounceDelay: options.debounceDelay || 300
        };

        // State management
        this.currentConfig = null;
        this.isPreviewActive = false;
        this.footerInstance = null;
        this.updateTimer = null;
        this.previewContainer = null;

        // Initialize the preview component
        this._initialize();
    }

    /**
     * Initialize the preview component
     * @private
     */
    _initialize() {
        // Create preview container structure
        this.container.innerHTML = '';
        this.container.className = 'footer-preview-component';

        // Create preview header
        const header = document.createElement('div');
        header.className = 'preview-header';
        header.innerHTML = `
            <h3>Footer Preview</h3>
            <div class="preview-controls">
                <button type="button" class="preview-refresh-btn" title="Refresh Preview">
                    <span class="icon">🔄</span>
                </button>
                <button type="button" class="preview-fullscreen-btn" title="Fullscreen Preview">
                    <span class="icon">⛶</span>
                </button>
            </div>
        `;

        // Create preview viewport
        const viewport = document.createElement('div');
        viewport.className = 'preview-viewport';

        // Create actual preview container (simulates signage footer area)
        this.previewContainer = document.createElement('div');
        this.previewContainer.className = 'preview-footer-container';
        viewport.appendChild(this.previewContainer);

        // Create status/info area
        const infoArea = document.createElement('div');
        infoArea.className = 'preview-info';
        infoArea.innerHTML = `
            <div class="preview-status">
                <span class="status-text">Ready for preview</span>
                <span class="config-stats"></span>
            </div>
        `;

        // Assemble the component
        this.container.appendChild(header);
        this.container.appendChild(viewport);
        this.container.appendChild(infoArea);

        // Bind event handlers
        this._bindEventHandlers();

        console.log('FooterPreview: Component initialized');
    }

    /**
     * Bind event handlers for preview controls
     * @private
     */
    _bindEventHandlers() {
        // Refresh button
        const refreshBtn = this.container.querySelector('.preview-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshPreview());
        }

        // Fullscreen button
        const fullscreenBtn = this.container.querySelector('.preview-fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // Handle container resize
        if (window.ResizeObserver) {
            const resizeObserver = new ResizeObserver(() => {
                if (this.footerInstance && this.isPreviewActive) {
                    // Refresh preview when container resizes
                    this._debounceUpdate(() => this.refreshPreview());
                }
            });
            resizeObserver.observe(this.container);
        }
    }

    /**
     * Update preview with new configuration
     * @param {Object} config - Footer configuration object
     * @returns {Promise<boolean>} Success status
     */
    async updateConfiguration(config) {
        if (!config || typeof config !== 'object') {
            this._showError('Invalid configuration object');
            return false;
        }

        this.currentConfig = { ...config };

        if (this.options.enableLiveUpdate) {
            // Debounce rapid updates for better performance
            this._debounceUpdate(() => this._renderPreview());
        }

        return true;
    }

    /**
     * Refresh the current preview
     * @returns {Promise<boolean>} Success status
     */
    async refreshPreview() {
        if (!this.currentConfig) {
            this._showStatus('No configuration to preview');
            return false;
        }

        return await this._renderPreview();
    }

    /**
     * Render the footer preview with current configuration
     * @private
     * @returns {Promise<boolean>} Success status
     */
    async _renderPreview() {
        if (!this.currentConfig) return false;

        try {
            this._showStatus('Generating preview...', 'loading');

            // Clean up existing preview
            if (this.footerInstance) {
                this.footerInstance.stop();
                this.footerInstance = null;
            }

            // Clear preview container
            this.previewContainer.innerHTML = '';

            // Try to use the real ScrollingFooter component
            if (typeof ScrollingFooter !== 'undefined') {
                console.log('ScrollingFooter available, creating real preview');
                try {
                    // Create preview-specific configuration (force static mode for preview)
                    const previewConfig = {
                        ...this.currentConfig,
                        scroll_direction: 'static', // Force static mode for better preview experience
                        scroll_speed: 0 // No animation in preview
                    };
                    
                    // Create new footer instance with preview configuration
                    this.footerInstance = new ScrollingFooter(this.previewContainer, previewConfig);
                    
                    // Start the footer in static mode
                    const success = await this.footerInstance.start();
                    
                    if (success) {
                        this.isPreviewActive = true;
                        this._showStatus('Live preview active', 'success');
                        this._updateConfigStats();
                        return true;
                    } else {
                        console.warn('ScrollingFooter failed to start, using fallback');
                        this._renderFallbackPreview();
                        return true;
                    }
                } catch (error) {
                    console.error('ScrollingFooter error:', error);
                    this._renderFallbackPreview();
                    return true;
                }
            } else {
                console.warn('ScrollingFooter not available, creating fallback preview');
                this._renderFallbackPreview();
                return true;
            }

        } catch (error) {
            console.error('FooterPreview: Render error:', error);
            this.options.onError(error);
            this._showStatus('Preview error', 'error');
            this._renderFallbackPreview();
            return false;
        }
    }

    /**
     * Render a fallback preview when ScrollingFooter is not available
     * @private
     */
    _renderFallbackPreview() {
        const fallback = document.createElement('div');
        fallback.className = 'preview-fallback';
        fallback.style.cssText = `
            background-color: ${this.currentConfig.background_color || '#c19d6c'};
            color: ${this.currentConfig.text_color || '#101010'};
            font-size: ${this.currentConfig.font_size || '1.2rem'};
            padding: 1rem;
            text-align: center;
            border-radius: ${this.currentConfig.border_radius || '0'};
            opacity: ${this.currentConfig.opacity !== undefined ? this.currentConfig.opacity : 1};
            text-shadow: ${this.currentConfig.text_shadow || 'none'};
            white-space: nowrap;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Process text with separators
        const text = this.currentConfig.footer_text || 'No text configured';
        const segments = text.split('<separator>').map(s => s.trim()).filter(s => s);
        
        const separatorMap = {
            crown: '👑',
            star: '⭐',
            dot: '•',
            dash: '—',
            space: ' ',
            custom: this.currentConfig.custom_separator || '|'
        };

        const separator = separatorMap[this.currentConfig.separator_type] || separatorMap.crown;
        
        // Create horizontal content with proper separators
        const horizontalContent = segments.join(` ${separator} `);
        fallback.textContent = horizontalContent;

        this.previewContainer.appendChild(fallback);
        this._showStatus('Fallback preview (limited functionality)', 'warning');
    }

    /**
     * Update configuration statistics display
     * @private
     */
    _updateConfigStats() {
        const statsElement = this.container.querySelector('.config-stats');
        if (!statsElement || !this.currentConfig) return;

        const segments = (this.currentConfig.footer_text || '').split('<separator>').length;
        const mode = this.currentConfig.scroll_direction || 'continuous';
        const separator = this.currentConfig.separator_type || 'crown';

        statsElement.textContent = `${segments} segments • ${mode} mode • ${separator} separators`;
    }

    /**
     * Show status message in the preview component
     * @param {string} message - Status message
     * @param {string} type - Status type (loading, success, error, warning)
     * @private
     */
    _showStatus(message, type = 'info') {
        const statusElement = this.container.querySelector('.status-text');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status-text status-${type}`;
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     * @private
     */
    _showError(message) {
        this._showStatus(message, 'error');
        console.error('FooterPreview:', message);
    }

    /**
     * Toggle fullscreen preview mode
     */
    toggleFullscreen() {
        const viewport = this.container.querySelector('.preview-viewport');
        if (!viewport) return;

        if (viewport.classList.contains('fullscreen')) {
            viewport.classList.remove('fullscreen');
            this._showStatus('Exited fullscreen', 'info');
        } else {
            viewport.classList.add('fullscreen');
            this._showStatus('Fullscreen preview mode', 'info');
        }
    }

    /**
     * Stop the preview and clean up resources
     */
    stop() {
        if (this.footerInstance) {
            this.footerInstance.stop();
            this.footerInstance = null;
        }

        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }

        this.isPreviewActive = false;
        this._showStatus('Preview stopped', 'info');
        console.log('FooterPreview: Stopped');
    }

    /**
     * Debounce update calls to prevent excessive rendering
     * @param {Function} callback - Function to debounce
     * @private
     */
    _debounceUpdate(callback) {
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
        this.updateTimer = setTimeout(callback, this.options.debounceDelay);
    }

    /**
     * Default error handler
     * @param {Error} error - Error object
     * @private
     */
    _defaultErrorHandler(error) {
        console.error('FooterPreview error:', error);
        this._showError(`Preview error: ${error.message}`);
    }

    /**
     * Get current preview status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            isActive: this.isPreviewActive,
            hasConfiguration: !!this.currentConfig,
            hasFooterInstance: !!this.footerInstance
        };
    }
}

// Export for use in admin interface
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FooterPreview;
} else {
    window.FooterPreview = FooterPreview;
}