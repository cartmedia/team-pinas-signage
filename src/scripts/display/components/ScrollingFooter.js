/**
 * ScrollingFooter Component
 * Hardware-accelerated continuous scrolling footer for digital signage displays
 * 
 * Features:
 * - GPU-accelerated CSS animations (60fps target)
 * - Automatic text duplication for screen-filling
 * - Performance monitoring with automatic fallback
 * - Event-driven architecture for real-time updates
 * 
 * @author Team Pinas Signage System
 * @version 1.0.0
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

        // Store references
        this.container = container;
        this.config = { ...config };
        
        // Initialize state
        this.isAnimating = false;
        this.animationId = null;
        this.performanceObserver = null;
        this.animationState = null;
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.fpsHistory = [];
        
        // Generate unique ID for CSS keyframes
        this.instanceId = `scrolling-footer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Apply base CSS class
        this.container.classList.add('scrolling-footer');
        
        // Initialize component
        this._initialize();
        
        console.log(`ScrollingFooter initialized with config:`, {
            text_length: config.footer_text.length,
            scroll_speed: config.scroll_speed,
            direction: config.scroll_direction
        });
    }

    /**
     * Initialize component with configuration
     * @private
     */
    _initialize() {
        // Apply container styles
        this.container.style.color = this.config.text_color || '#101010';
        this.container.style.fontSize = this.config.font_size || '3vh';
        
        if (this.config.background_color) {
            this.container.style.backgroundColor = this.config.background_color;
        }
        
        // Parse footer text into segments
        this._parseFooterText();
        
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            console.log('ScrollingFooter: Reduced motion detected, will use static fallback');
            this.config.scroll_direction = 'static';
        }
    }

    /**
     * Parse footer text and split by separator tags
     * @private
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
     * Start continuous scrolling animation
     * @returns {Promise<boolean>} - Promise resolving to true if animation started successfully
     */
    async start() {
        try {
            if (this.isAnimating) {
                console.log('ScrollingFooter: Animation already running');
                return true;
            }
            
            // Check if continuous scrolling is enabled
            if (this.config.scroll_direction !== 'continuous') {
                console.log('ScrollingFooter: Continuous scrolling not enabled, using static display');
                this._renderStaticFooter();
                return false;
            }
            
            // Measure dimensions and calculate repetitions
            this._measureAndPrepare();
            
            // Create DOM structure
            this._createScrollingDOM();
            
            // Generate and inject CSS keyframes
            this._generateKeyframes();
            
            // Apply animation
            this._startAnimation();
            
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
     * @param {Object} newConfig - New configuration object
     * @returns {Promise<boolean>} - Success status
     */
    async updateConfig(newConfig) {
        const wasAnimating = this.isAnimating;
        
        if (wasAnimating) {
            this.stop();
        }
        
        // Update configuration
        this.config = { ...newConfig };
        
        // Re-initialize
        this._initialize();
        
        if (wasAnimating && newConfig.scroll_direction === 'continuous') {
            return await this.start();
        }
        
        return true;
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance data
     */
    getPerformanceMetrics() {
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

    // === PRIVATE METHODS ===

    /**
     * Measure container dimensions and calculate text repetitions needed
     * @private
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
        
        // Add all text segments with separators
        const separatorText = this.config.separator_text || ' <img class="sep" src="assets/images/pinas_kroon.svg" alt="" role="presentation" aria-hidden="true" /> ';
        let totalContent = this.textSegments.join(separatorText);
        measureElement.textContent = totalContent;
        
        document.body.appendChild(measureElement);
        const contentWidth = measureElement.offsetWidth;
        document.body.removeChild(measureElement);
        
        // Calculate how many repetitions needed to fill screen
        const repetitions = Math.max(1, Math.ceil((containerWidth * 1.5) / contentWidth));
        
        // Calculate animation duration based on scroll speed (default changed to very slow)
        const duration = Math.max(1, 60 / (this.config.scroll_speed || 1.5));
        
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
     * Create DOM structure for scrolling animation
     * @private
     */
    _createScrollingDOM() {
        // Clear existing content
        this.container.innerHTML = '';
        
        // Create scroll content container
        const scrollContent = document.createElement('div');
        scrollContent.className = 'scroll-content';
        scrollContent.id = `scroll-content-${this.instanceId}`;
        
        // Add repeated text segments
        for (let rep = 0; rep < this.animationState.repetitions; rep++) {
            for (let i = 0; i < this.textSegments.length; i++) {
                // Add text segment
                const textSpan = document.createElement('span');
                textSpan.className = 'text-segment';
                textSpan.textContent = this.textSegments[i];
                scrollContent.appendChild(textSpan);
                
                // Add separator (except after last segment of last repetition)
                if (i < this.textSegments.length - 1 || rep < this.animationState.repetitions - 1) {
                    const separatorSpan = document.createElement('span');
                    separatorSpan.className = 'separator';
                    separatorSpan.setAttribute('aria-hidden', 'true');
                    separatorSpan.innerHTML = this.config.separator_text || ' <img class="sep" src="assets/images/pinas_kroon.svg" alt="" role="presentation" aria-hidden="true" /> ';
                    scrollContent.appendChild(separatorSpan);
                }
            }
        }
        
        this.container.appendChild(scrollContent);
        this.scrollContent = scrollContent;
    }

    /**
     * Generate and inject CSS keyframes for animation
     * @private
     */
    _generateKeyframes() {
        const keyframeName = this.animationState.keyframeName;
        const totalWidth = this.animationState.totalWidth;
        
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
        
        // Create or update style element
        let styleElement = document.getElementById(`scrolling-footer-styles-${this.instanceId}`);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = `scrolling-footer-styles-${this.instanceId}`;
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = keyframeCSS;
        
        console.log(`ScrollingFooter: Generated keyframes for ${keyframeName}`);
    }

    /**
     * Apply animation to scroll content
     * @private
     */
    _startAnimation() {
        if (!this.scrollContent) {
            throw new Error('ScrollingFooter: Scroll content not found');
        }
        
        const duration = this.animationState.duration;
        const keyframeName = this.animationState.keyframeName;
        
        // Apply animation CSS
        this.scrollContent.style.animation = `${keyframeName} ${duration}s linear infinite`;
        
        // Add GPU acceleration hint
        this.container.classList.add('gpu-accelerated');
        
        console.log(`ScrollingFooter: Animation applied - ${keyframeName} ${duration}s`);
    }

    /**
     * Stop animation
     * @private
     */
    _stopAnimation() {
        if (this.scrollContent) {
            this.scrollContent.style.animation = 'none';
        }
        
        this.container.classList.remove('gpu-accelerated');
    }

    /**
     * Clean up generated CSS keyframes
     * @private
     */
    _cleanupKeyframes() {
        const styleElement = document.getElementById(`scrolling-footer-styles-${this.instanceId}`);
        if (styleElement) {
            styleElement.remove();
        }
    }

    /**
     * Render static footer as fallback
     * @private
     */
    _renderStaticFooter() {
        this.container.innerHTML = '';
        this.container.classList.add('fallback');
        
        // Join segments with separator symbol
        const separatorText = this.config.separator_text || ' <img class="sep" src="assets/images/pinas_kroon.svg" alt="" role="presentation" aria-hidden="true" /> ';
        const staticText = this.textSegments.join(separatorText);
        this.container.textContent = staticText;
        
        console.log('ScrollingFooter: Rendered static fallback');
    }

    /**
     * Start performance monitoring
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
     * Start frame-by-frame measurement
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
     * Stop performance monitoring
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
     * Check if GPU acceleration is active
     * @private
     * @returns {boolean}
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
     * Dispatch custom event from container
     * @private
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail data
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
}

// Make ScrollingFooter available globally
if (typeof window !== 'undefined') {
    window.ScrollingFooter = ScrollingFooter;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollingFooter;
}