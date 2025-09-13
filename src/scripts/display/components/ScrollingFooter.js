/**
 * ScrollingFooter Component
 * Hardware-accelerated continuous scrolling footer for digital signage displays
 * 
 * Features:
 * - GPU-accelerated CSS animations (60fps target)
 * - Automatic text duplication for seamless infinite scroll
 * - Performance monitoring with automatic fallback to static display
 * - Event-driven architecture for real-time configuration updates
 * - Accessibility support with reduced motion preference detection
 * - Configurable separators and styling options
 * 
 * @example
 * // Basic usage with minimal configuration
 * const container = document.getElementById('footer-container');
 * const footer = new ScrollingFooter(container, {
 *   footer_text: "Welcome to our restaurant <separator> Fresh ingredients daily",
 *   scroll_direction: "continuous",
 *   scroll_speed: 30,
 *   text_color: "#ffffff",
 *   font_size: "2vh"
 * });
 * 
 * // Start the animation
 * footer.start().then(success => {
 *   if (success) {
 *     console.log('Animation started successfully');
 *   }
 * });
 * 
 * @example
 * // Advanced usage with custom separators and performance monitoring
 * const footer = new ScrollingFooter(container, {
 *   footer_text: "Menu A <separator> Menu B <separator> Menu C",
 *   scroll_direction: "continuous",
 *   scroll_speed: 0.5, // Very slow (2 minutes per cycle)
 *   text_color: "#333333",
 *   font_size: "3vh",
 *   background_color: "#f5f5f5",
 *   separator_text: "   " // Use spaces only
 * });
 * 
 * // Listen for performance warnings
 * container.addEventListener('performance-warning', (event) => {
 *   console.warn('Low FPS detected:', event.detail.fps);
 * });
 * 
 * @author Team Pinas Signage System
 * @version 1.0.0
 * @since 2024-01-01
 */

class ScrollingFooter {
    /**
     * Create a ScrollingFooter instance
     * @param {HTMLElement} container - DOM element to contain the scrolling footer
     * @param {Object} config - Configuration object from footer API
     * @param {string} config.footer_text - Text content with <separator> tags
     * @param {string} config.text_color - CSS color value (default: #101010)
     * @param {string} config.font_size - CSS font-size value (default: 3vh)
     * @param {number} config.scroll_speed - Speed multiplier 10-100 (default: 30)
     * @param {string} config.scroll_direction - 'continuous'|'discrete'|'static'
     * @param {string} [config.background_color] - Optional background color
     * @param {string} [config.divider_image] - Path to separator image
     * @param {string} [config.separator_text] - Text separator between segments (default: crown SVG)
     */
    constructor(container, config) {
        // Validate required parameters
        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('ScrollingFooter requires a valid HTMLElement container');
        }
        
        if (!config || typeof config !== 'object') {
            throw new Error('ScrollingFooter requires a configuration object');
        }
        
        if (!config.footer_text || typeof config.footer_text !== 'string') {
            throw new Error('ScrollingFooter requires footer_text in configuration');
        }

        /**
         * DOM container element for the scrolling footer
         * @type {HTMLElement}
         */
        this.container = container;
        
        /**
         * Configuration object containing all footer settings
         * @type {Object}
         */
        this.config = { ...config };
        
        /**
         * Current animation state flag
         * @type {boolean}
         */
        this.isAnimating = false;
        
        /**
         * Animation request ID for cleanup
         * @type {number|null}
         */
        this.animationId = null;
        
        /**
         * Performance observer for FPS monitoring
         * @type {PerformanceObserver|null}
         */
        this.performanceObserver = null;
        
        /**
         * Performance monitor instance for hardware acceleration and 60fps tracking
         * @type {PerformanceMonitor|null}
         */
        this.performanceMonitor = null;
        
        /**
         * Animation fallback manager for error recovery
         * @type {AnimationFallbackManager|null}
         */
        this.fallbackManager = null;
        
        /**
         * CSS performance tracker for loading metrics
         * @type {CSSPerformanceTracker|null}
         */
        this.cssTracker = null;
        
        /**
         * Animation state data including dimensions and timing
         * @type {Object|null}
         */
        this.animationState = null;
        
        /**
         * Separator resolution state tracking
         * @type {Object|null}
         */
        this._separatorState = null;
        
        /**
         * Frame counter for performance tracking
         * @type {number}
         */
        this.frameCount = 0;
        
        /**
         * Timestamp of last frame for FPS calculation
         * @type {number}
         */
        this.lastFrameTime = 0;
        
        /**
         * History of FPS measurements (max 60 entries)
         * @type {Array<number>}
         */
        this.fpsHistory = [];
        
        /**
         * Parsed text segments from footer_text (split by <separator>)
         * @type {Array<string>}
         */
        this.textSegments = [];
        
        /**
         * Reference to the scrolling content DOM element
         * @type {HTMLElement|null}
         */
        this.scrollContent = null;
        
        /**
         * Unique instance identifier for CSS keyframes
         * @type {string}
         */
        this.instanceId = `scrolling-footer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Apply base CSS class for the new architecture
        this.container.classList.add('SignageFooter');
        
        // Apply pause-on-hover class if enabled
        if (this.config.pause_on_hover) {
            this.container.classList.add('pause-on-hover');
        }
        
        // Initialize performance monitoring systems
        this._initializePerformanceSystems();
        
        // Initialize component
        this._initialize();
        
        // Initialize separator resolution
        this._initializeSeparatorResolution();
        
        console.log(`ScrollingFooter initialized with config:`, {
            text_length: config.footer_text.length,
            scroll_speed: config.scroll_speed,
            direction: config.scroll_direction,
            separatorType: this._separatorState?.selectedType || 'unknown',
            performanceSystems: {
                monitor: !!this.performanceMonitor,
                fallback: !!this.fallbackManager,
                cssTracker: !!this.cssTracker
            }
        });
    }

    /**
     * Initialize component with configuration, apply styles using CSS custom properties, parse text, and check accessibility preferences
     * @private
     */
    _initialize() {
        // Set CSS custom properties instead of inline styles
        this._setCSSCustomProperties();
        
        // Set initial visibility state
        this._setVisibilityState('hidden');
        
        // Parse footer text into segments
        this._parseFooterText();
        
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            console.log('ScrollingFooter: Reduced motion detected, will use static fallback');
            this.config.scroll_direction = 'static';
        }
    }

    /**
     * Parse footer text and split by <separator> tags into individual text segments
     * Filters out empty segments and validates at least one segment exists
     * @private
     * @throws {Error} When no valid text segments are found after parsing
     */
    _parseFooterText() {
        // Split text by <separator> tags and filter empty segments
        this.textSegments = this.config.footer_text
            .split('<separator>')
            .map(segment => segment.trim())
            .filter(segment => segment.length > 0);
        
        if (this.textSegments.length === 0) {
            throw new Error('ScrollingFooter: No valid text segments found after parsing separators');
        }
        
        console.log(`ScrollingFooter: Parsed ${this.textSegments.length} text segments`);
    }

    /**
     * Initialize separator resolution system
     * Sets up the separator state and resolves the appropriate separator type
     * @private
     */
    _initializeSeparatorResolution() {
        console.log('ScrollingFooter: Initializing separator resolution');
        this._separatorState = this._resolveSeparatorType();
        console.log('ScrollingFooter: Separator resolved:', this._separatorState);
    }

    /**
     * Resolve separator type based on priority chain: custom → svg → emoji → space
     * Implements the core separator resolution logic to prevent double separators
     * @private
     * @returns {Object} SeparatorState object with selectedType, content, isLoading, etc.
     */
    _resolveSeparatorType() {
        const startTime = performance.now();
        
        try {
            // Use enhanced separator type configuration
            const separatorType = this.config.separator_type || 'crown';
            const customSeparator = this.config.custom_separator || '|';
            
            let separatorState;
            
            switch (separatorType) {
                case 'crown':
                    separatorState = {
                        selectedType: 'emoji',
                        content: ' 👑 ',
                        isLoading: false,
                        loadError: null,
                        resolvedAt: new Date().toISOString()
                    };
                    break;
                
                case 'star':
                    separatorState = {
                        selectedType: 'emoji',
                        content: ' ⭐ ',
                        isLoading: false,
                        loadError: null,
                        resolvedAt: new Date().toISOString()
                    };
                    break;
                
                case 'dot':
                    separatorState = {
                        selectedType: 'text',
                        content: ' • ',
                        isLoading: false,
                        loadError: null,
                        resolvedAt: new Date().toISOString()
                    };
                    break;
                
                case 'dash':
                    separatorState = {
                        selectedType: 'text',
                        content: ' — ',
                        isLoading: false,
                        loadError: null,
                        resolvedAt: new Date().toISOString()
                    };
                    break;
                
                case 'space':
                    separatorState = {
                        selectedType: 'space',
                        content: '   ',
                        isLoading: false,
                        loadError: null,
                        resolvedAt: new Date().toISOString()
                    };
                    break;
                
                case 'custom':
                    separatorState = {
                        selectedType: 'custom',
                        content: ` ${customSeparator} `,
                        isLoading: false,
                        loadError: null,
                        resolvedAt: new Date().toISOString()
                    };
                    break;
                
                default:
                    // Fallback to crown emoji
                    separatorState = {
                        selectedType: 'emoji',
                        content: ' 👑 ',
                        isLoading: false,
                        loadError: `Unknown separator type: ${separatorType}`,
                        resolvedAt: new Date().toISOString()
                    };
            }
            
            const endTime = performance.now();
            console.log(`ScrollingFooter: ${separatorType} separator resolved in ${(endTime - startTime).toFixed(2)}ms`);
            return separatorState;
            
        } catch (error) {
            console.error('ScrollingFooter: Error in separator resolution:', error);
            
            // Emergency fallback to crown emoji
            return {
                selectedType: 'emoji',
                content: ' 👑 ',
                isLoading: false,
                loadError: `Separator resolution failed: ${error.message}`,
                resolvedAt: new Date().toISOString()
            };
        }
    }

    /**
     * Check if SVG separator is available for use
     * @private
     * @returns {boolean} True if SVG can be used, false otherwise
     */
    _isSVGAvailable() {
        // Check for test simulation flags
        if (this.config._simulateSVGFailure || this._simulateSVGFailure) {
            return false;
        }
        
        // In a real implementation, this could check if the SVG file exists
        // For now, we assume SVG is available unless explicitly disabled
        return true;
    }

    /**
     * Check if emoji separator is available for use
     * @private
     * @returns {boolean} True if emoji can be used, false otherwise
     */
    _isEmojiAvailable() {
        // Check for test simulation flags
        if (this.config._simulateEmojiFailure || this._simulateEmojiFailure) {
            return false;
        }
        
        // Check if the browser supports emoji rendering
        // For now, we assume emoji is available unless explicitly disabled
        return true;
    }

    /**
     * Start continuous scrolling animation
     * @returns {Promise<boolean>} - Promise resolving to true if animation started successfully
     */
    async start() {
        try {
            if (this.isAnimating) {
                console.log('ScrollingFooter: Animation already running');
                return true;
            }
            
            // Set loading state
            this._setVisibilityState('transitioning');
            
            // Handle different scroll directions
            if (this.config.scroll_direction === 'static') {
                console.log('ScrollingFooter: Static mode, rendering static display');
                this._renderStaticFooter();
                return false;
            } else if (this.config.scroll_direction === 'discrete') {
                console.log('ScrollingFooter: Discrete mode, rendering discrete display');
                this._renderDiscreteFooter();
                return false;
            } else if (this.config.scroll_direction !== 'continuous') {
                console.log('ScrollingFooter: Unknown scroll direction, defaulting to continuous');
                this.config.scroll_direction = 'continuous';
            }
            
            // Measure dimensions and calculate repetitions
            this._measureAndPrepare();
            
            // Create DOM structure
            this._createScrollingDOM();
            
            // Generate and inject CSS keyframes
            this._generateKeyframes();
            
            // Apply animation
            this._startAnimation();
            
            // Set visible state
            this._setVisibilityState('visible');
            
            // Start performance monitoring
            this._startPerformanceMonitoring();
            
            this.isAnimating = true;
            
            // Fire animation-started event
            this._dispatchEvent('animation-started', {
                duration: this.animationState.duration,
                repetitions: this.animationState.repetitions
            });
            
            console.log(`ScrollingFooter: Animation started - Duration: ${this.animationState.duration}s, Repetitions: ${this.animationState.repetitions}`);
            
            return true;
            
        } catch (error) {
            console.error('ScrollingFooter: Failed to start animation:', error);
            
            // Set error state
            this._setVisibilityState('error');
            
            // Fall back to static display
            this._renderStaticFooter();
            
            this._dispatchEvent('animation-stopped', {
                reason: 'error'
            });
            
            return false;
        }
    }

    /**
     * Stop scrolling animation and clean up resources
     */
    stop() {
        if (!this.isAnimating) {
            return;
        }
        
        try {
            // Stop performance monitoring
            this._stopPerformanceMonitoring();
            
            // Remove animation
            this._stopAnimation();
            
            // Clean up generated CSS
            this._cleanupKeyframes();
            
            // Reset state
            this.isAnimating = false;
            this.animationId = null;
            this.animationState = null;
            
            // Set hidden state
            this._setVisibilityState('hidden');
            
            // Fire animation-stopped event
            this._dispatchEvent('animation-stopped', {
                reason: 'manual'
            });
            
            console.log('ScrollingFooter: Animation stopped manually');
            
        } catch (error) {
            console.error('ScrollingFooter: Error during stop:', error);
        }
    }

    /**
     * Update configuration and restart animation if needed
     * Re-resolves separator type to prevent conflicts during configuration changes
     * @param {Object} newConfig - New configuration object
     * @returns {Promise<boolean>} - Success status
     */
    async updateConfig(newConfig) {
        const wasAnimating = this.isAnimating;
        
        if (wasAnimating) {
            this.stop();
        }
        
        // Store old separator state for comparison
        const oldSeparatorType = this._separatorState?.selectedType;
        
        // Update configuration
        this.config = { ...newConfig };
        
        // Re-initialize with new CSS custom properties
        this._initialize();
        
        // Re-resolve separator type with new configuration
        this._initializeSeparatorResolution();
        
        // Update CSS custom properties with new values
        this._setCSSCustomProperties();
        
        // Log separator change if it occurred
        if (oldSeparatorType !== this._separatorState?.selectedType) {
            console.log(`ScrollingFooter: Separator type changed from ${oldSeparatorType} to ${this._separatorState?.selectedType}`);
        }
        
        if (wasAnimating && newConfig.scroll_direction === 'continuous') {
            return await this.start();
        }
        
        return true;
    }

    /**
     * Get comprehensive performance metrics from all monitoring systems
     * @returns {Object} Complete performance data
     */
    getPerformanceMetrics() {
        const legacyMetrics = this._getLegacyPerformanceMetrics();
        const advancedMetrics = this.performanceMonitor ? this.performanceMonitor.getMetrics() : null;
        const cssMetrics = this.cssTracker ? this.cssTracker.getMetrics() : null;
        const fallbackStatus = this.fallbackManager ? this.fallbackManager.getStatus() : null;
        
        return {
            legacy: legacyMetrics,
            advanced: advancedMetrics,
            css: cssMetrics,
            fallback: fallbackStatus,
            combined: {
                fps: advancedMetrics?.fps || legacyMetrics.fps,
                gpu_accelerated: advancedMetrics?.isGPUAccelerated || legacyMetrics.gpu_accelerated,
                is_animating: this.isAnimating,
                fallback_active: fallbackStatus?.fallbackActive || false,
                performance_grade: this._calculatePerformanceGrade(advancedMetrics || legacyMetrics)
            }
        };
    }

    // === PRIVATE METHODS ===

    /**
     * Set CSS custom properties based on configuration
     * Integrates with the new CSS architecture using CSS custom properties
     * @private
     */
    _setCSSCustomProperties() {
        const root = document.documentElement;
        
        // Set configuration-based CSS custom properties
        root.style.setProperty('--footer-text-color', this.config.text_color || '#101010');
        root.style.setProperty('--footer-bg-color', this.config.background_color || '#c19d6c');
        root.style.setProperty('--footer-font-size', this.config.font_size || '3vh');
        
        // Enhanced styling properties
        root.style.setProperty('--footer-opacity', this.config.opacity !== undefined ? this.config.opacity : 1.0);
        root.style.setProperty('--footer-text-shadow', this.config.text_shadow || 'none');
        root.style.setProperty('--footer-border-radius', this.config.border_radius || '0');
        root.style.setProperty('--footer-animation-timing', this.config.animation_timing || 'linear');
        root.style.setProperty('--footer-separator-spacing', this.config.separator_spacing || '0 0.5em');
        root.style.setProperty('--footer-separator-color', this.config.separator_color || 'inherit');
        
        // Set scroll speed (convert config value to pixels per second)
        const scrollSpeedMultiplier = this.config.scroll_speed || 30;
        const baseSpeed = 50; // pixels per second at speed 30
        const pixelsPerSecond = (scrollSpeedMultiplier / 30) * baseSpeed;
        root.style.setProperty('--footer-scroll-speed', `${pixelsPerSecond}px`);
        
        // Set scroll direction (continuous scrolling is always left-to-right)
        root.style.setProperty('--footer-scroll-direction', '1');
        
        console.log('ScrollingFooter: CSS custom properties updated', {
            textColor: this.config.text_color || '#101010',
            bgColor: this.config.background_color || '#c19d6c',
            fontSize: this.config.font_size || '3vh',
            scrollSpeed: `${pixelsPerSecond}px`
        });
    }

    /**
     * Set visibility state using CSS classes
     * Manages component visibility through the new CSS architecture
     * @private
     * @param {string} state - 'hidden'|'visible'|'transitioning'|'loading'|'error'
     */
    _setVisibilityState(state) {
        // Remove all state classes
        this.container.classList.remove(
            'footer-hidden', 
            'footer-visible', 
            'footer-transitioning', 
            'footer-loading', 
            'footer-error'
        );
        
        // Add the appropriate state class
        switch (state) {
            case 'hidden':
                this.container.classList.add('footer-hidden');
                break;
            case 'visible':
                this.container.classList.add('footer-visible');
                break;
            case 'transitioning':
                this.container.classList.add('footer-transitioning');
                break;
            case 'loading':
                this.container.classList.add('footer-loading');
                break;
            case 'error':
                this.container.classList.add('footer-error');
                break;
            default:
                console.warn('ScrollingFooter: Unknown visibility state:', state);
                this.container.classList.add('footer-hidden');
        }
        
        // Update CSS custom property for visibility state
        document.documentElement.style.setProperty('--footer-visibility', state);
        
        console.log(`ScrollingFooter: Visibility state set to: ${state}`);
    }

    /**
     * Set CSS custom properties for animation state
     * Controls performance properties based on animation state
     * @private
     * @param {boolean} isRunning - Whether animation is running
     */
    _setCSSAnimationProperties(isRunning) {
        const root = document.documentElement;
        
        if (isRunning) {
            // Set properties for running animation (GPU acceleration)
            root.style.setProperty('--footer-animation-state', 'running');
            root.style.setProperty('--footer-will-change', 'transform');
            root.style.setProperty('--footer-backface-visibility', 'hidden');
        } else {
            // Set properties for stopped animation (performance optimization)
            root.style.setProperty('--footer-animation-state', 'paused');
            root.style.setProperty('--footer-will-change', 'auto');
            root.style.setProperty('--footer-backface-visibility', 'visible');
        }
        
        console.log(`ScrollingFooter: Animation properties updated - Running: ${isRunning}`);
    }

    /**
     * Measure container dimensions and calculate text repetitions needed for seamless scrolling
     * Creates temporary DOM element to measure actual text width with current styles
     * Calculates optimal repetition count to ensure screen is always filled during animation
     * @private
     * @throws {Error} When container has zero width and cannot be measured
     */
    _measureAndPrepare() {
        const containerWidth = this.container.offsetWidth;
        if (containerWidth === 0) {
            throw new Error('ScrollingFooter: Container has zero width, cannot measure');
        }
        
        // Create temporary element to measure text width
        const measureElement = document.createElement('div');
        measureElement.style.cssText = `
            position: absolute;
            visibility: hidden;
            white-space: nowrap;
            font-size: ${this.config.font_size || '3vh'};
            font-family: inherit;
        `;
        
        // Ensure separator state is resolved for measurement
        if (!this._separatorState) {
            this._separatorState = this._resolveSeparatorType();
        }
        
        // Add all text segments with resolved separator
        let totalContent = this.textSegments.join(this._separatorState.content);
        
        // For measurement, convert HTML to text content estimate
        if (this._separatorState.selectedType === 'svg') {
            // Replace SVG with approximate width equivalent for measurement
            totalContent = this.textSegments.join('  ♔  '); // Crown unicode for measurement
        } else {
            // Use actual separator content for text/emoji separators
            totalContent = this.textSegments.join(this._separatorState.content);
        }
        
        measureElement.innerHTML = totalContent;
        
        document.body.appendChild(measureElement);
        const contentWidth = measureElement.offsetWidth;
        document.body.removeChild(measureElement);
        
        // Calculate how many repetitions needed to fill screen
        const repetitions = Math.max(1, Math.min(10, Math.ceil((containerWidth * 1.5) / Math.max(contentWidth, 100))));
        
        // Calculate animation duration based on scroll speed
        // Convert scroll_speed (1-100 scale) to duration in seconds
        // Higher scroll_speed = faster scrolling = shorter duration
        const scrollSpeedMultiplier = this.config.scroll_speed || 30;
        const baseSpeed = 50; // pixels per second at speed 30
        const pixelsPerSecond = (scrollSpeedMultiplier / 30) * baseSpeed;
        const duration = Math.max(5, (contentWidth * repetitions) / pixelsPerSecond);
        
        this.animationState = {
            containerWidth,
            contentWidth,
            totalWidth: contentWidth * repetitions,
            repetitions,
            duration,
            keyframeName: `scroll-${this.instanceId}`
        };
        
        console.log('ScrollingFooter: Measurements completed:', this.animationState);
    }

    /**
     * Create DOM structure for scrolling animation with repeated text segments and separators
     * Uses resolved separator type exclusively to prevent double separators
     * Each text segment and separator gets proper CSS classes and accessibility attributes
     * @private
     */
    _createScrollingDOM() {
        // Clear existing content
        this.container.innerHTML = '';
        
        // Ensure separator state is resolved
        if (!this._separatorState) {
            this._separatorState = this._resolveSeparatorType();
        }
        
        // Create scroll content container with new CSS architecture
        const scrollContent = document.createElement('div');
        scrollContent.className = 'scrolling-footer-content';
        scrollContent.id = `scroll-content-${this.instanceId}`;
        
        // Add CSS class for separator type tracking
        scrollContent.classList.add(`separator-type-${this._separatorState.selectedType}`);
        
        // Add repeated text segments
        for (let rep = 0; rep < this.animationState.repetitions; rep++) {
            for (let i = 0; i < this.textSegments.length; i++) {
                // Add text segment with new CSS architecture
                const textSpan = document.createElement('span');
                textSpan.className = 'scrolling-text-segment';
                textSpan.textContent = this.textSegments[i];
                scrollContent.appendChild(textSpan);
                
                // Add separator (except after last segment of last repetition)
                if (i < this.textSegments.length - 1 || rep < this.animationState.repetitions - 1) {
                    const separatorSpan = document.createElement('span');
                    separatorSpan.className = 'scrolling-separator';
                    separatorSpan.setAttribute('aria-hidden', 'true');
                    separatorSpan.setAttribute('data-separator-type', this._separatorState.selectedType);
                    
                    // Use ONLY the resolved separator content
                    separatorSpan.innerHTML = this._separatorState.content;
                    
                    scrollContent.appendChild(separatorSpan);
                }
            }
        }
        
        this.container.appendChild(scrollContent);
        this.scrollContent = scrollContent;
        
        console.log(`ScrollingFooter: Created DOM with ${this._separatorState.selectedType} separators`);
    }

    /**
     * Generate and inject CSS keyframes for smooth translate3d animation
     * Creates unique keyframe animation that moves content from 0 to negative total width
     * Uses translate3d for GPU acceleration and smooth 60fps performance
     * @private
     */
    _generateKeyframes() {
        const keyframeName = this.animationState.keyframeName;
        const totalWidth = this.animationState.totalWidth;
        const duration = this.animationState.duration;
        
        const keyframeCSS = `
            @keyframes ${keyframeName} {
                0% { 
                    transform: translate3d(0, 0, 0); 
                }
                100% { 
                    transform: translate3d(-${totalWidth}px, 0, 0); 
                }
            }
        `;
        
        // Create or update style element with unique ID to avoid conflicts
        let styleElement = document.getElementById(`scrolling-footer-styles-${this.instanceId}`);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = `scrolling-footer-styles-${this.instanceId}`;
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = keyframeCSS;
        
        // Update CSS custom properties with calculated values
        const root = document.documentElement;
        root.style.setProperty('--footer-animation-duration', `${duration}s`);
        root.style.setProperty('--footer-content-width', `${totalWidth}px`);
        
        console.log(`ScrollingFooter: Generated keyframes for ${keyframeName} - Duration: ${duration}s, Width: ${totalWidth}px`);
    }

    /**
     * Apply CSS animation to scroll content element with calculated duration and keyframes
     * Enables GPU acceleration hints and applies infinite linear animation
     * @private
     * @throws {Error} When scroll content DOM element is not found
     */
    _startAnimation() {
        if (!this.scrollContent) {
            throw new Error('ScrollingFooter: Scroll content not found');
        }
        
        const duration = this.animationState.duration;
        const keyframeName = this.animationState.keyframeName;
        
        // Apply animation CSS with new architecture
        this.scrollContent.style.animation = `${keyframeName} ${duration}s linear infinite`;
        
        // Update CSS custom properties for animation state
        this._setCSSAnimationProperties(true);
        
        // Add animated class to text segments
        const textSegments = this.scrollContent.querySelectorAll('.scrolling-text-segment');
        textSegments.forEach(segment => segment.classList.add('animated'));
        
        console.log(`ScrollingFooter: Animation applied - ${keyframeName} ${duration}s`);
    }

    /**
     * Stop CSS animation and remove GPU acceleration classes
     * @private
     */
    _stopAnimation() {
        if (this.scrollContent) {
            this.scrollContent.style.animation = 'none';
        }
        
        // Update CSS custom properties for stopped state
        this._setCSSAnimationProperties(false);
        
        // Remove animated class from text segments
        const textSegments = this.scrollContent.querySelectorAll('.scrolling-text-segment');
        textSegments.forEach(segment => segment.classList.remove('animated'));
    }

    /**
     * Clean up generated CSS keyframes and all performance monitoring resources
     * Prevents memory leaks from accumulated keyframe definitions and monitoring systems
     * @private
     */
    _cleanupKeyframes() {
        // Remove the injected style element
        const styleElement = document.getElementById(`scrolling-footer-styles-${this.instanceId}`);
        if (styleElement) {
            styleElement.remove();
        }
        
        // Reset animation-related CSS custom properties
        const root = document.documentElement;
        root.style.removeProperty('--footer-animation-duration');
        root.style.removeProperty('--footer-content-width');
        root.style.removeProperty('--footer-animation-state');
        root.style.removeProperty('--footer-will-change');
        root.style.removeProperty('--footer-backface-visibility');
        
        // Cleanup performance monitoring systems
        if (this.performanceMonitor) {
            this.performanceMonitor.stop();
        }
        
        if (this.fallbackManager) {
            this.fallbackManager.cleanup();
        }
        
        if (this.cssTracker) {
            this.cssTracker.stopTracking();
        }
        
        console.log('ScrollingFooter: Complete cleanup including performance systems');
    }

    /**
     * Render static footer as fallback when animation is disabled or failed
     * Uses resolved separator type exclusively to prevent double separators
     * Adds 'fallback' CSS class for styling differentiation
     * @private
     */
    _renderStaticFooter() {
        this.container.innerHTML = '';
        
        // Ensure separator state is resolved
        if (!this._separatorState) {
            this._separatorState = this._resolveSeparatorType();
        }
        
        // Create static content wrapper
        const staticContent = document.createElement('div');
        staticContent.className = 'scrolling-footer-content';
        staticContent.classList.add(`separator-type-${this._separatorState.selectedType}`);
        
        // Add static text segments
        for (let i = 0; i < this.textSegments.length; i++) {
            const textSpan = document.createElement('span');
            textSpan.className = 'scrolling-text-segment';
            textSpan.textContent = this.textSegments[i];
            staticContent.appendChild(textSpan);
            
            // Add separator (except after last segment)
            if (i < this.textSegments.length - 1) {
                const separatorSpan = document.createElement('span');
                separatorSpan.className = 'scrolling-separator';
                separatorSpan.setAttribute('aria-hidden', 'true');
                separatorSpan.setAttribute('data-separator-type', this._separatorState.selectedType);
                
                // Use ONLY the resolved separator content
                separatorSpan.innerHTML = this._separatorState.content;
                
                staticContent.appendChild(separatorSpan);
            }
        }
        
        this.container.appendChild(staticContent);
        this._setVisibilityState('visible');
        
        console.log(`ScrollingFooter: Rendered static fallback with ${this._separatorState.selectedType} separators`);
    }

    /**
     * Render footer in discrete mode (segments appear one at a time)
     * @private
     */
    _renderDiscreteFooter() {
        this.container.innerHTML = '';
        
        // Ensure separator state is resolved
        if (!this._separatorState) {
            this._separatorState = this._resolveSeparatorType();
        }
        
        // Create discrete content wrapper
        const discreteContent = document.createElement('div');
        discreteContent.className = 'scrolling-footer-content discrete-mode';
        discreteContent.classList.add(`separator-type-${this._separatorState.selectedType}`);
        
        // Create container for current segment
        const currentSegment = document.createElement('div');
        currentSegment.className = 'discrete-segment-container';
        discreteContent.appendChild(currentSegment);
        
        this.container.appendChild(discreteContent);
        this._setVisibilityState('visible');
        
        // Start discrete animation cycle
        this._startDiscreteAnimation(currentSegment);
        
        console.log(`ScrollingFooter: Rendered discrete mode with ${this.textSegments.length} segments`);
    }

    /**
     * Start discrete animation cycling through segments
     * @param {HTMLElement} container - The segment container element
     * @private
     */
    _startDiscreteAnimation(container) {
        if (this.textSegments.length === 0) return;
        
        let currentIndex = 0;
        const segmentDuration = Math.max(2000, 10000 / this.config.scroll_speed); // 2-10 seconds based on speed
        const transitionDuration = 500; // 0.5 second transition
        
        const showSegment = (index) => {
            const segment = this.textSegments[index];
            const segmentSpan = document.createElement('span');
            segmentSpan.className = 'discrete-text-segment';
            segmentSpan.textContent = segment;
            
            // Clear container and add new segment
            container.innerHTML = '';
            container.appendChild(segmentSpan);
            
            // Trigger fade-in animation
            requestAnimationFrame(() => {
                segmentSpan.style.opacity = '1';
                segmentSpan.style.transform = 'translateY(0)';
            });
        };
        
        const cycleSegments = () => {
            if (!this.isAnimating) return;
            
            showSegment(currentIndex);
            currentIndex = (currentIndex + 1) % this.textSegments.length;
            
            // Schedule next segment
            setTimeout(cycleSegments, segmentDuration);
        };
        
        // Start the cycle
        this.isAnimating = true;
        cycleSegments();
    }

    /**
     * Start performance monitoring using PerformanceObserver API
     * Tracks frame duration and FPS, maintains rolling 60-measurement history
     * Dispatches performance-warning events when FPS drops below 50 for 10+ consecutive frames
     * @private
     */
    _startPerformanceMonitoring() {
        if (!('PerformanceObserver' in window)) {
            console.log('ScrollingFooter: PerformanceObserver not available');
            return;
        }
        
        try {
            this.performanceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                
                for (const entry of entries) {
                    if (entry.entryType === 'measure') {
                        const fps = 1000 / entry.duration;
                        this.fpsHistory.push(fps);
                        
                        // Keep only last 60 measurements
                        if (this.fpsHistory.length > 60) {
                            this.fpsHistory.shift();
                        }
                        
                        // Check for performance issues
                        if (fps < 50 && this.fpsHistory.length > 10) {
                            const recentAvg = this.fpsHistory.slice(-10).reduce((a, b) => a + b, 0) / 10;
                            if (recentAvg < 50) {
                                this._dispatchEvent('performance-warning', {
                                    fps: Math.round(recentAvg * 100) / 100,
                                    threshold: 50
                                });
                            }
                        }
                    }
                }
            });
            
            this.performanceObserver.observe({ entryTypes: ['measure'] });
            
            // Start frame measurement
            this._startFrameMeasurement();
            
        } catch (error) {
            console.log('ScrollingFooter: Performance monitoring setup failed:', error);
        }
    }

    /**
     * Start frame-by-frame measurement using Performance API marks and measures
     * Creates performance marks and measures for each animation frame
     * Continues measuring via requestAnimationFrame until animation stops
     * @private
     */
    _startFrameMeasurement() {
        const measureFrame = () => {
            if (!this.isAnimating) return;
            
            const currentTime = performance.now();
            
            if (this.lastFrameTime > 0) {
                performance.mark('frame-start');
                performance.mark('frame-end');
                performance.measure('frame-duration', 'frame-start', 'frame-end');
            }
            
            this.lastFrameTime = currentTime;
            this.frameCount++;
            
            requestAnimationFrame(measureFrame);
        };
        
        measureFrame();
    }

    /**
     * Stop performance monitoring and clean up observer resources
     * Disconnects PerformanceObserver and resets frame tracking counters
     * @private
     */
    _stopPerformanceMonitoring() {
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
            this.performanceObserver = null;
        }
        
        this.frameCount = 0;
        this.lastFrameTime = 0;
    }

    /**
     * Check if GPU acceleration is active by examining computed CSS transform properties
     * Detects matrix3d, translate3d transforms or will-change: transform properties
     * @private
     * @returns {boolean} True if GPU acceleration is detected, false otherwise
     */
    _isGPUAccelerated() {
        if (!this.scrollContent) return false;
        
        const computedStyle = window.getComputedStyle(this.scrollContent);
        const transform = computedStyle.transform;
        const willChange = computedStyle.willChange;
        
        return transform.includes('matrix3d') || 
               transform.includes('translate3d') || 
               willChange === 'transform';
    }

    /**
     * Dispatch custom event from container element with provided event data
     * Creates bubbling, cancelable CustomEvent that can be listened to by parent elements
     * Automatically logs event dispatch for debugging purposes
     * @private
     * @param {string} eventName - Event name (e.g., 'animation-started', 'performance-warning')
     * @param {Object} detail - Event detail data to be passed in event.detail property
     */
    _dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        });
        
        this.container.dispatchEvent(event);
        
        console.log(`ScrollingFooter: Event dispatched - ${eventName}:`, detail);
    }
    
    /**
     * Start comprehensive performance monitoring using all available systems
     * @private
     */
    _startComprehensivePerformanceMonitoring() {
        // Start advanced performance monitor
        if (this.performanceMonitor) {
            this.performanceMonitor.start().then(success => {
                if (success) {
                    console.log('ScrollingFooter: Advanced performance monitoring started');
                    
                    // Set up event listeners for performance warnings
                    this.container.addEventListener('performance-monitoring-started', (event) => {
                        console.log('ScrollingFooter: Performance monitoring active:', event.detail);
                    });
                    
                    this.container.addEventListener('performance-performance-warning', (event) => {
                        console.warn('ScrollingFooter: Performance warning:', event.detail);
                        
                        // Consider activating fallback on repeated warnings
                        if (event.detail.type === 'low-fps' && this.fallbackManager) {
                            this.fallbackManager.activateFallback('performance', event.detail);
                        }
                    });
                    
                    this.container.addEventListener('performance-gpu-acceleration-checked', (event) => {
                        console.log('ScrollingFooter: GPU acceleration status:', event.detail);
                        
                        if (!event.detail.detected && event.detail.fallbackApplied) {
                            console.log('ScrollingFooter: GPU acceleration fallback applied automatically');
                        }
                    });
                }
            });
        }
        
        // Start legacy performance monitoring as backup
        this._startPerformanceMonitoring();
    }
    
    /**
     * Stop comprehensive performance monitoring
     * @private
     */
    _stopComprehensivePerformanceMonitoring() {
        // Stop advanced performance monitor
        if (this.performanceMonitor) {
            const finalMetrics = this.performanceMonitor.getMetrics();
            this.performanceMonitor.stop();
            
            console.log('ScrollingFooter: Final performance metrics:', finalMetrics);
            
            // Dispatch final performance report
            this._dispatchEvent('final-performance-report', finalMetrics);
        }
        
        // Stop CSS performance tracking
        if (this.cssTracker) {
            const cssMetrics = this.cssTracker.stopTracking();
            console.log('ScrollingFooter: CSS performance metrics:', cssMetrics);
            
            // Dispatch CSS performance report
            this._dispatchEvent('css-performance-report', cssMetrics);
        }
    }
    
    /**
     * Render fallback footer when animation fails
     * @private
     * @param {HTMLElement} element - Container element
     * @param {Object} data - Error/fallback data
     */
    _renderFallbackFooter(element, data) {
        console.log('ScrollingFooter: Rendering fallback footer', data);
        
        // Clear existing content
        element.innerHTML = '';
        
        // Create fallback content wrapper
        const fallbackWrapper = document.createElement('div');
        fallbackWrapper.className = 'scrolling-footer-fallback';
        
        // Add fallback message if in debug mode
        if (localStorage.getItem('debugMode') === 'true') {
            const debugMessage = document.createElement('div');
            debugMessage.className = 'fallback-debug-message';
            debugMessage.textContent = `Fallback Active: ${data.reason || 'Unknown'}`;
            debugMessage.style.cssText = `
                position: absolute;
                top: 0;
                right: 0;
                background: rgba(255, 0, 0, 0.8);
                color: white;
                padding: 4px 8px;
                font-size: 12px;
                z-index: 1000;
            `;
            fallbackWrapper.appendChild(debugMessage);
        }
        
        // Create static content
        const staticContent = document.createElement('div');
        staticContent.className = 'scrolling-footer-content fallback-static';
        
        // Add text segments with separators
        for (let i = 0; i < this.textSegments.length; i++) {
            const textSpan = document.createElement('span');
            textSpan.className = 'scrolling-text-segment';
            textSpan.textContent = this.textSegments[i];
            staticContent.appendChild(textSpan);
            
            // Add separator (except after last segment)
            if (i < this.textSegments.length - 1) {
                const separatorSpan = document.createElement('span');
                separatorSpan.className = 'scrolling-separator';
                separatorSpan.setAttribute('aria-hidden', 'true');
                // Use resolved separator content
                if (!this._separatorState) {
                    this._separatorState = this._resolveSeparatorType();
                }
                separatorSpan.innerHTML = this._separatorState.content;
                staticContent.appendChild(separatorSpan);
            }
        }
        
        fallbackWrapper.appendChild(staticContent);
        element.appendChild(fallbackWrapper);
        
        // Apply visibility state
        this._setVisibilityState('visible');
        
        // Dispatch fallback event
        this._dispatchEvent('fallback-rendered', {
            reason: data.reason,
            segmentCount: this.textSegments.length
        });
    }
    
    /**
     * Get legacy performance metrics for backward compatibility
     * @private
     * @returns {Object} Legacy performance metrics
     */
    _getLegacyPerformanceMetrics() {
        const averageFPS = this.fpsHistory.length > 0 
            ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length 
            : 0;
            
        return {
            fps: Math.round(averageFPS * 100) / 100,
            dropped_frames: this.fpsHistory.filter(fps => fps < 55).length,
            gpu_accelerated: this._isGPUAccelerated(),
            animation_duration: this.animationState?.duration || 0,
            is_animating: this.isAnimating
        };
    }
    
    /**
     * Calculate overall performance grade
     * @private
     * @param {Object} metrics - Performance metrics
     * @returns {string} Performance grade A-F
     */
    _calculatePerformanceGrade(metrics) {
        if (!metrics || !metrics.fps) return 'F';
        
        const fps = metrics.fps;
        const smoothness = metrics.smoothness || 0;
        const gpuAccelerated = metrics.isGPUAccelerated || metrics.gpu_accelerated || false;
        
        let score = 0;
        
        // FPS scoring (40% weight)
        if (fps >= 58) score += 40;
        else if (fps >= 50) score += 30;
        else if (fps >= 40) score += 20;
        else if (fps >= 30) score += 10;
        
        // Smoothness scoring (30% weight)
        score += (smoothness / 100) * 30;
        
        // GPU acceleration bonus (20% weight)
        if (gpuAccelerated) score += 20;
        
        // Stability bonus (10% weight)
        if (metrics.droppedFrames !== undefined) {
            const stability = Math.max(0, 100 - (metrics.droppedFrames * 2));
            score += (stability / 100) * 10;
        } else {
            score += 10; // Assume stable if no data
        }
        
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }
    
    /**
     * Run performance benchmark test
     * @param {number} duration - Test duration in milliseconds (default: 10000)
     * @returns {Promise<Object>} Benchmark results
     */
    async runPerformanceBenchmark(duration = 10000) {
        console.log(`ScrollingFooter: Running performance benchmark for ${duration}ms...`);
        
        if (this.performanceMonitor) {
            return await this.performanceMonitor.runBenchmark(duration);
        } else {
            console.warn('ScrollingFooter: Advanced performance monitoring not available for benchmarking');
            
            // Run basic benchmark
            return await this._runBasicBenchmark(duration);
        }
    }
    
    /**
     * Run basic benchmark without advanced monitoring
     * @private
     * @param {number} duration - Test duration in milliseconds
     * @returns {Promise<Object>} Basic benchmark results
     */
    async _runBasicBenchmark(duration) {
        const startTime = performance.now();
        const initialMetrics = this._getLegacyPerformanceMetrics();
        
        // Wait for benchmark duration
        await new Promise(resolve => setTimeout(resolve, duration));
        
        const endTime = performance.now();
        const finalMetrics = this._getLegacyPerformanceMetrics();
        
        return {
            duration: endTime - startTime,
            initialMetrics,
            finalMetrics,
            averageFPS: finalMetrics.fps,
            performance: finalMetrics.fps >= 50 ? 'good' : 'poor',
            type: 'basic'
        };
    }
}

// Make ScrollingFooter available globally
if (typeof window !== 'undefined') {
    window.ScrollingFooter = ScrollingFooter;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollingFooter;
}