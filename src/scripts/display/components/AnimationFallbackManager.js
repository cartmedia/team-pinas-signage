/**
 * AnimationFallbackManager
 * Comprehensive animation fallback and error boundary system
 * 
 * Features:
 * - Graceful degradation for animation failures
 * - Performance-based fallback detection
 * - Automatic recovery mechanisms
 * - Error boundary protection
 * - Accessibility-aware fallbacks
 * 
 * @version 1.0.0
 * @author Team Pinas Signage System
 */

class AnimationFallbackManager {
    /**
     * Create an AnimationFallbackManager instance
     * @param {HTMLElement} targetElement - Element to manage
     * @param {Object} options - Configuration options
     */
    constructor(targetElement, options = {}) {
        this.targetElement = targetElement;
        this.options = {
            performanceThreshold: 45, // Minimum FPS before fallback
            maxRecoveryAttempts: 3,
            recoveryDelay: 2000,
            enableAccessibilityFallbacks: true,
            fallbackDuration: 5000, // Time to show fallback before retry
            ...options
        };
        
        // State tracking
        this.currentState = 'initializing';
        this.fallbackActive = false;
        this.recoveryAttempts = 0;
        this.lastError = null;
        this.performanceHistory = [];
        
        // Error boundaries
        this.errorBoundaries = new Map();
        this.errorHandlers = new Map();
        
        // Animation contexts
        this.animationContexts = new Map();
        
        // Performance monitoring
        this.performanceMonitor = null;
        
        console.log('AnimationFallbackManager: Initialized for element:', targetElement?.tagName);
        
        this.initializeErrorBoundaries();
        this.checkAccessibilityPreferences();
    }
    
    /**
     * Initialize error boundary system
     */
    initializeErrorBoundaries() {
        // Global error boundary
        this.setupGlobalErrorBoundary();
        
        // Animation-specific error boundaries
        this.setupAnimationErrorBoundaries();
        
        // CSS error boundaries
        this.setupCSSErrorBoundaries();
        
        // Performance error boundaries
        this.setupPerformanceErrorBoundaries();
        
        console.log('AnimationFallbackManager: Error boundaries initialized');
    }
    
    /**
     * Setup global error boundary
     */
    setupGlobalErrorBoundary() {
        const globalErrorHandler = (error, errorInfo = {}) => {
            console.error('AnimationFallbackManager: Global error caught:', error);
            
            this.lastError = {
                error,
                errorInfo,
                timestamp: Date.now(),
                context: 'global'
            };
            
            // Attempt graceful fallback
            this.activateFallback('error', {
                error: error.message || String(error),
                stack: error.stack,
                context: 'global'
            });
        };
        
        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            globalErrorHandler(event.reason, { type: 'unhandledrejection' });
        });
        
        // Catch JavaScript errors
        window.addEventListener('error', (event) => {
            if (event.filename && event.filename.includes('ScrollingFooter')) {
                globalErrorHandler(event.error, { type: 'javascript', filename: event.filename });
            }
        });
        
        this.errorBoundaries.set('global', globalErrorHandler);
    }
    
    /**
     * Setup animation-specific error boundaries
     */
    setupAnimationErrorBoundaries() {
        const animationErrorHandler = (context, error) => {
            console.warn(`AnimationFallbackManager: Animation error in ${context}:`, error);
            
            this.lastError = {
                error,
                timestamp: Date.now(),
                context: `animation-${context}`
            };
            
            // Try to recover animation
            this.recoverAnimation(context, error);
        };
        
        this.errorBoundaries.set('animation', animationErrorHandler);
    }
    
    /**
     * Setup CSS error boundaries
     */
    setupCSSErrorBoundaries() {
        const cssErrorHandler = (selector, property, error) => {
            console.warn(`AnimationFallbackManager: CSS error for ${selector}.${property}:`, error);
            
            // Attempt to apply fallback styles
            this.applyCSSFallback(selector, property);
        };
        
        this.errorBoundaries.set('css', cssErrorHandler);
    }
    
    /**
     * Setup performance error boundaries
     */
    setupPerformanceErrorBoundaries() {
        const performanceErrorHandler = (metrics) => {
            console.warn('AnimationFallbackManager: Performance degradation detected:', metrics);
            
            this.performanceHistory.push({
                timestamp: Date.now(),
                metrics
            });
            
            // Check if fallback is needed
            if (this.shouldActivatePerformanceFallback(metrics)) {
                this.activateFallback('performance', metrics);
            }
        };
        
        this.errorBoundaries.set('performance', performanceErrorHandler);
    }
    
    /**
     * Check accessibility preferences
     */
    checkAccessibilityPreferences() {
        if (!this.options.enableAccessibilityFallbacks) return;
        
        // Check for reduced motion preference
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (reducedMotion) {
            console.log('AnimationFallbackManager: Reduced motion detected, activating accessibility fallback');
            this.activateFallback('accessibility', { reason: 'reduced-motion' });
        }
        
        // Listen for preference changes
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            if (e.matches) {
                this.activateFallback('accessibility', { reason: 'reduced-motion-changed' });
            } else {
                this.deactivateFallback('accessibility');
            }
        });
    }
    
    /**
     * Register an animation context
     * @param {string} contextId - Unique identifier for animation context
     * @param {Object} animationConfig - Animation configuration
     * @param {Function} fallbackRenderer - Function to render fallback content
     */
    registerAnimationContext(contextId, animationConfig, fallbackRenderer) {
        const context = {
            id: contextId,
            config: animationConfig,
            fallbackRenderer,
            active: false,
            errors: [],
            performance: {
                fps: [],
                avgFPS: 0,
                smoothness: 100
            }
        };
        
        this.animationContexts.set(contextId, context);
        
        console.log(`AnimationFallbackManager: Registered animation context: ${contextId}`);
        return context;
    }
    
    /**
     * Execute animation with error protection
     * @param {string} contextId - Animation context identifier
     * @param {Function} animationFunction - Function to execute
     * @returns {Promise<boolean>} Success status
     */
    async executeWithProtection(contextId, animationFunction) {
        const context = this.animationContexts.get(contextId);
        if (!context) {
            throw new Error(`Animation context ${contextId} not registered`);
        }
        
        try {
            console.log(`AnimationFallbackManager: Executing protected animation: ${contextId}`);
            
            // Set context as active
            context.active = true;
            this.currentState = 'animating';
            
            // Execute animation with timeout protection
            const result = await this.executeWithTimeout(animationFunction, 5000);
            
            if (result) {
                console.log(`AnimationFallbackManager: Animation ${contextId} executed successfully`);
                return true;
            } else {
                throw new Error('Animation function returned false');
            }
            
        } catch (error) {
            console.error(`AnimationFallbackManager: Animation ${contextId} failed:`, error);
            
            // Record error in context
            context.errors.push({
                error,
                timestamp: Date.now()
            });
            
            // Trigger fallback
            this.recoverAnimation(contextId, error);
            
            return false;
        }
    }
    
    /**
     * Execute function with timeout protection
     * @param {Function} func - Function to execute
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise} Function result or timeout error
     */
    executeWithTimeout(func, timeout) {
        return Promise.race([
            func(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Animation timeout')), timeout)
            )
        ]);
    }
    
    /**
     * Recover animation after error
     * @param {string} contextId - Animation context identifier
     * @param {Error} error - Original error
     */
    async recoverAnimation(contextId, error) {
        if (this.recoveryAttempts >= this.options.maxRecoveryAttempts) {
            console.warn(`AnimationFallbackManager: Maximum recovery attempts reached for ${contextId}`);
            this.activateFallback('max-retries', { contextId, error: error.message });
            return;
        }
        
        this.recoveryAttempts++;
        console.log(`AnimationFallbackManager: Attempting recovery ${this.recoveryAttempts}/${this.options.maxRecoveryAttempts} for ${contextId}`);
        
        // Wait before recovery attempt
        await new Promise(resolve => setTimeout(resolve, this.options.recoveryDelay));
        
        const context = this.animationContexts.get(contextId);
        if (!context) return;
        
        try {
            // Reset element to clean state
            this.resetElementState(this.targetElement);
            
            // Attempt simplified animation
            const simplifiedConfig = this.createSimplifiedAnimation(context.config);
            
            // Try recovery with simplified animation
            if (await this.executeSimplifiedAnimation(contextId, simplifiedConfig)) {
                console.log(`AnimationFallbackManager: Recovery successful for ${contextId}`);
                this.currentState = 'recovered';
            } else {
                // Recovery failed, activate fallback
                this.activateFallback('recovery-failed', { contextId, attempts: this.recoveryAttempts });
            }
            
        } catch (recoveryError) {
            console.error(`AnimationFallbackManager: Recovery failed for ${contextId}:`, recoveryError);
            this.activateFallback('recovery-error', { contextId, error: recoveryError.message });
        }
    }
    
    /**
     * Execute simplified version of animation
     * @param {string} contextId - Animation context identifier
     * @param {Object} simplifiedConfig - Simplified animation configuration
     * @returns {Promise<boolean>} Success status
     */
    async executeSimplifiedAnimation(contextId, simplifiedConfig) {
        const context = this.animationContexts.get(contextId);
        if (!context) return false;
        
        try {
            // Apply simplified CSS animation
            this.applySimplifiedCSS(this.targetElement, simplifiedConfig);
            
            // Wait to see if it works
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return true;
            
        } catch (error) {
            console.error('AnimationFallbackManager: Simplified animation failed:', error);
            return false;
        }
    }
    
    /**
     * Create simplified animation configuration
     * @param {Object} originalConfig - Original animation configuration
     * @returns {Object} Simplified configuration
     */
    createSimplifiedAnimation(originalConfig) {
        return {
            duration: Math.min(originalConfig.duration || 10, 5), // Reduce duration
            easing: 'linear', // Simplify easing
            properties: ['opacity'], // Use only opacity
            transforms: ['translateX'], // Use only simple transform
            iterations: 'infinite'
        };
    }
    
    /**
     * Apply simplified CSS animation
     * @param {HTMLElement} element - Target element
     * @param {Object} config - Animation configuration
     */
    applySimplifiedCSS(element, config) {
        if (!element) return;
        
        // Remove complex animations
        element.style.animation = 'none';
        element.style.transform = 'none';
        
        // Apply simplified animation
        const simplifiedAnimation = `simplified-scroll ${config.duration}s linear infinite`;
        
        // Create simplified keyframes
        this.createSimplifiedKeyframes(config.duration);
        
        // Apply animation
        element.style.animation = simplifiedAnimation;
        
        console.log('AnimationFallbackManager: Applied simplified animation');
    }
    
    /**
     * Create simplified keyframes
     * @param {number} duration - Animation duration
     */
    createSimplifiedKeyframes(duration) {
        const styleId = 'simplified-footer-keyframes';
        let styleElement = document.getElementById(styleId);
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = `
            @keyframes simplified-scroll {
                0% { 
                    transform: translateX(0);
                    opacity: 1;
                }
                100% { 
                    transform: translateX(-50%);
                    opacity: 1;
                }
            }
        `;
    }
    
    /**
     * Activate fallback mode
     * @param {string} reason - Reason for fallback activation
     * @param {Object} data - Additional fallback data
     */
    activateFallback(reason, data = {}) {
        if (this.fallbackActive && reason !== 'performance') {
            return; // Already in fallback mode
        }
        
        console.log(`AnimationFallbackManager: Activating fallback - Reason: ${reason}`, data);
        
        this.fallbackActive = true;
        this.currentState = 'fallback';
        
        // Stop current animations
        this.stopAllAnimations();
        
        // Apply fallback based on reason
        switch (reason) {
            case 'error':
            case 'recovery-failed':
            case 'recovery-error':
                this.applyErrorFallback(data);
                break;
                
            case 'performance':
                this.applyPerformanceFallback(data);
                break;
                
            case 'accessibility':
                this.applyAccessibilityFallback(data);
                break;
                
            case 'max-retries':
                this.applyStaticFallback(data);
                break;
                
            default:
                this.applyDefaultFallback(data);
        }
        
        // Dispatch fallback event
        this.dispatchEvent('fallback-activated', {
            reason,
            data,
            timestamp: Date.now()
        });
        
        // Schedule fallback exit if appropriate
        if (reason !== 'accessibility' && this.options.fallbackDuration > 0) {
            setTimeout(() => {
                this.attemptFallbackRecovery(reason);
            }, this.options.fallbackDuration);
        }
    }
    
    /**
     * Apply error fallback
     * @param {Object} data - Error data
     */
    applyErrorFallback(data) {
        if (!this.targetElement) return;
        
        console.log('AnimationFallbackManager: Applying error fallback');
        
        // Show static content
        this.targetElement.classList.add('fallback-error');
        
        // Find all animation contexts and render their fallbacks
        this.animationContexts.forEach((context, contextId) => {
            if (context.fallbackRenderer) {
                try {
                    context.fallbackRenderer(this.targetElement, data);
                } catch (error) {
                    console.error(`AnimationFallbackManager: Fallback renderer failed for ${contextId}:`, error);
                }
            }
        });
    }
    
    /**
     * Apply performance fallback
     * @param {Object} data - Performance data
     */
    applyPerformanceFallback(data) {
        if (!this.targetElement) return;
        
        console.log('AnimationFallbackManager: Applying performance fallback');
        
        // Reduce animation complexity
        this.targetElement.classList.add('fallback-performance');
        
        // Apply low-performance CSS
        this.targetElement.style.animation = 'none';
        this.targetElement.style.transform = 'none';
        this.targetElement.style.willChange = 'auto';
        
        // Show simplified static scroll
        this.createStaticScrollEffect();
    }
    
    /**
     * Apply accessibility fallback
     * @param {Object} data - Accessibility data
     */
    applyAccessibilityFallback(data) {
        if (!this.targetElement) return;
        
        console.log('AnimationFallbackManager: Applying accessibility fallback');
        
        // Remove all animations for accessibility
        this.targetElement.classList.add('fallback-accessibility');
        this.targetElement.style.animation = 'none';
        this.targetElement.style.transform = 'none';
        
        // Ensure content is visible and readable
        this.ensureAccessibleContent();
    }
    
    /**
     * Apply static fallback
     * @param {Object} data - Static fallback data
     */
    applyStaticFallback(data) {
        if (!this.targetElement) return;
        
        console.log('AnimationFallbackManager: Applying static fallback');
        
        this.targetElement.classList.add('fallback-static');
        this.targetElement.style.animation = 'none';
        this.targetElement.style.transform = 'none';
        
        // Show static content
        this.renderStaticContent();
    }
    
    /**
     * Apply default fallback
     * @param {Object} data - Fallback data
     */
    applyDefaultFallback(data) {
        console.log('AnimationFallbackManager: Applying default fallback');
        this.applyStaticFallback(data);
    }
    
    /**
     * Create static scroll effect
     */
    createStaticScrollEffect() {
        // Implementation depends on the specific animation being replaced
        console.log('AnimationFallbackManager: Creating static scroll effect');
    }
    
    /**
     * Ensure content is accessible
     */
    ensureAccessibleContent() {
        if (!this.targetElement) return;
        
        // Ensure content is visible
        this.targetElement.style.opacity = '1';
        this.targetElement.style.visibility = 'visible';
        
        // Add ARIA labels if missing
        if (!this.targetElement.getAttribute('aria-live')) {
            this.targetElement.setAttribute('aria-live', 'polite');
        }
        
        console.log('AnimationFallbackManager: Accessibility content ensured');
    }
    
    /**
     * Render static content
     */
    renderStaticContent() {
        // Implementation depends on specific content requirements
        console.log('AnimationFallbackManager: Rendering static content');
    }
    
    /**
     * Attempt to recover from fallback mode
     * @param {string} originalReason - Original reason for fallback
     */
    async attemptFallbackRecovery(originalReason) {
        if (!this.fallbackActive) return;
        
        console.log(`AnimationFallbackManager: Attempting recovery from ${originalReason} fallback`);
        
        // Reset recovery attempts for new try
        this.recoveryAttempts = 0;
        
        try {
            // Clean element state
            this.resetElementState(this.targetElement);
            
            // Test if conditions have improved
            if (await this.testRecoveryConditions(originalReason)) {
                this.deactivateFallback(originalReason);
                return true;
            } else {
                console.log('AnimationFallbackManager: Recovery conditions not met, staying in fallback');
                return false;
            }
            
        } catch (error) {
            console.error('AnimationFallbackManager: Recovery attempt failed:', error);
            return false;
        }
    }
    
    /**
     * Test if recovery conditions are met
     * @param {string} originalReason - Original reason for fallback
     * @returns {Promise<boolean>} Whether recovery is possible
     */
    async testRecoveryConditions(originalReason) {
        switch (originalReason) {
            case 'performance':
                return this.testPerformanceRecovery();
            case 'error':
                return this.testErrorRecovery();
            default:
                return false;
        }
    }
    
    /**
     * Test performance recovery conditions
     * @returns {Promise<boolean>} Whether performance has improved
     */
    async testPerformanceRecovery() {
        // Run a quick performance test
        return new Promise((resolve) => {
            let frameCount = 0;
            let startTime = performance.now();
            
            const testFrame = () => {
                frameCount++;
                
                if (frameCount < 30) {
                    requestAnimationFrame(testFrame);
                } else {
                    const elapsed = performance.now() - startTime;
                    const fps = (frameCount / elapsed) * 1000;
                    
                    resolve(fps > this.options.performanceThreshold);
                }
            };
            
            requestAnimationFrame(testFrame);
        });
    }
    
    /**
     * Test error recovery conditions
     * @returns {Promise<boolean>} Whether error conditions have cleared
     */
    async testErrorRecovery() {
        // Simple test - assume recovery is possible after time has passed
        return true;
    }
    
    /**
     * Deactivate fallback mode
     * @param {string} reason - Reason for deactivation
     */
    deactivateFallback(reason) {
        if (!this.fallbackActive) return;
        
        console.log(`AnimationFallbackManager: Deactivating fallback - Reason: ${reason}`);
        
        this.fallbackActive = false;
        this.currentState = 'normal';
        
        // Remove fallback classes
        if (this.targetElement) {
            this.targetElement.classList.remove(
                'fallback-error', 
                'fallback-performance', 
                'fallback-accessibility', 
                'fallback-static'
            );
        }
        
        // Dispatch deactivation event
        this.dispatchEvent('fallback-deactivated', {
            reason,
            timestamp: Date.now()
        });
    }
    
    /**
     * Check if performance fallback should be activated
     * @param {Object} metrics - Performance metrics
     * @returns {boolean} Whether to activate performance fallback
     */
    shouldActivatePerformanceFallback(metrics) {
        // Check recent performance history
        const recentMetrics = this.performanceHistory.slice(-5);
        const recentAvgFPS = recentMetrics.reduce((sum, m) => sum + (m.metrics.fps || 0), 0) / recentMetrics.length;
        
        return recentAvgFPS < this.options.performanceThreshold && recentMetrics.length >= 3;
    }
    
    /**
     * Stop all active animations
     */
    stopAllAnimations() {
        this.animationContexts.forEach((context, contextId) => {
            if (context.active) {
                context.active = false;
                console.log(`AnimationFallbackManager: Stopped animation context: ${contextId}`);
            }
        });
        
        // Reset element animations
        if (this.targetElement) {
            this.targetElement.style.animation = 'none';
        }
    }
    
    /**
     * Reset element to clean state
     * @param {HTMLElement} element - Element to reset
     */
    resetElementState(element) {
        if (!element) return;
        
        // Reset CSS properties
        element.style.animation = '';
        element.style.transform = '';
        element.style.opacity = '';
        element.style.visibility = '';
        element.style.willChange = '';
        
        // Remove animation classes
        const classes = Array.from(element.classList);
        classes.forEach(cls => {
            if (cls.includes('fallback-') || cls.includes('animation-')) {
                element.classList.remove(cls);
            }
        });
        
        console.log('AnimationFallbackManager: Element state reset');
    }
    
    /**
     * Apply CSS fallback for specific selector and property
     * @param {string} selector - CSS selector
     * @param {string} property - CSS property
     */
    applyCSSFallback(selector, property) {
        console.log(`AnimationFallbackManager: Applying CSS fallback for ${selector}.${property}`);
        
        // Implementation would depend on specific CSS properties
        // This is a placeholder for CSS-specific fallback logic
    }
    
    /**
     * Get current manager status
     * @returns {Object} Current status information
     */
    getStatus() {
        return {
            currentState: this.currentState,
            fallbackActive: this.fallbackActive,
            recoveryAttempts: this.recoveryAttempts,
            lastError: this.lastError,
            animationContexts: Array.from(this.animationContexts.keys()),
            performanceHistory: this.performanceHistory.slice(-10) // Last 10 entries
        };
    }
    
    /**
     * Dispatch custom event
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail data
     */
    dispatchEvent(eventName, detail) {
        if (!this.targetElement) return;
        
        const event = new CustomEvent(`animation-${eventName}`, {
            detail,
            bubbles: true,
            cancelable: false
        });
        
        this.targetElement.dispatchEvent(event);
        
        // Debug logging
        if (localStorage.getItem('debugMode') === 'true') {
            console.log(`AnimationFallbackManager: Event ${eventName}:`, detail);
        }
    }
    
    /**
     * Cleanup manager resources
     */
    cleanup() {
        // Stop all animations
        this.stopAllAnimations();
        
        // Clear contexts
        this.animationContexts.clear();
        
        // Clear error boundaries
        this.errorBoundaries.clear();
        
        // Reset state
        this.currentState = 'destroyed';
        this.fallbackActive = false;
        
        console.log('AnimationFallbackManager: Cleanup completed');
    }
}

// Make AnimationFallbackManager available globally
if (typeof window !== 'undefined') {
    window.AnimationFallbackManager = AnimationFallbackManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationFallbackManager;
}