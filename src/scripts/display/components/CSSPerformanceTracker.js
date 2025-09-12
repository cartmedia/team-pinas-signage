/**
 * CSSPerformanceTracker
 * CSS loading and animation performance metrics collection
 * 
 * Features:
 * - CSS loading time measurement
 * - Animation frame rate tracking
 * - CSS critical path analysis
 * - Render-blocking resource detection
 * - Paint timing metrics
 * 
 * @version 1.0.0
 * @author Team Pinas Signage System
 */

class CSSPerformanceTracker {
    constructor() {
        this.metrics = {
            cssLoadTime: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            criticalPath: [],
            renderBlocking: [],
            animationMetrics: {
                smoothFrames: 0,
                jankyFrames: 0,
                totalFrames: 0
            }
        };
        
        this.isTracking = false;
        this.observers = [];
        this.startTime = performance.now();
        
        console.log('CSSPerformanceTracker: Initialized');
    }
    
    /**
     * Start tracking CSS performance
     */
    startTracking() {
        if (this.isTracking) {
            console.warn('CSSPerformanceTracker: Already tracking');
            return;
        }
        
        this.isTracking = true;
        this.startTime = performance.now();
        
        // Track CSS loading
        this.trackCSSLoading();
        
        // Track paint timing
        this.trackPaintTiming();
        
        // Track resource timing
        this.trackResourceTiming();
        
        // Track animation performance
        this.trackAnimationPerformance();
        
        console.log('CSSPerformanceTracker: Started tracking');
    }
    
    /**
     * Stop tracking and return final metrics
     */
    stopTracking() {
        if (!this.isTracking) {
            return this.metrics;
        }
        
        this.isTracking = false;
        
        // Disconnect all observers
        this.observers.forEach(observer => {
            if (observer && observer.disconnect) {
                observer.disconnect();
            }
        });
        this.observers = [];
        
        console.log('CSSPerformanceTracker: Stopped tracking', this.metrics);
        return this.metrics;
    }
    
    /**
     * Track CSS file loading performance
     */
    trackCSSLoading() {
        // Track CSS resources using PerformanceObserver
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                
                entries.forEach(entry => {
                    if (entry.initiatorType === 'link' && entry.name.includes('.css')) {
                        this.processCSSResource(entry);
                    }
                });
            });
            
            try {
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.push(resourceObserver);
            } catch (error) {
                console.warn('CSSPerformanceTracker: Resource observation failed:', error);
            }
        }
        
        // Track CSS load completion using document.styleSheets
        const trackStyleSheets = () => {
            const cssLoadStart = performance.now();
            
            const checkStyleSheets = () => {
                const stylesheets = Array.from(document.styleSheets);
                let loadedCount = 0;
                
                stylesheets.forEach(sheet => {
                    try {
                        // Accessing cssRules will throw if not loaded
                        if (sheet.cssRules || sheet.rules) {
                            loadedCount++;
                        }
                    } catch (e) {
                        // Still loading
                    }
                });
                
                if (loadedCount === stylesheets.length) {
                    this.metrics.cssLoadTime = performance.now() - cssLoadStart;
                    console.log(`CSSPerformanceTracker: All CSS loaded in ${this.metrics.cssLoadTime.toFixed(2)}ms`);
                } else if (this.isTracking) {
                    setTimeout(checkStyleSheets, 50);
                }
            };
            
            checkStyleSheets();
        };
        
        trackStyleSheets();
    }
    
    /**
     * Track paint timing metrics
     */
    trackPaintTiming() {
        if ('PerformanceObserver' in window) {
            const paintObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                
                entries.forEach(entry => {
                    switch (entry.name) {
                        case 'first-paint':
                            this.metrics.firstPaint = entry.startTime;
                            break;
                        case 'first-contentful-paint':
                            this.metrics.firstContentfulPaint = entry.startTime;
                            break;
                    }
                });
            });
            
            try {
                paintObserver.observe({ entryTypes: ['paint'] });
                this.observers.push(paintObserver);
            } catch (error) {
                console.warn('CSSPerformanceTracker: Paint observation failed:', error);
            }
        }
        
        // Fallback using performance.getEntriesByType
        setTimeout(() => {
            const paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach(entry => {
                switch (entry.name) {
                    case 'first-paint':
                        this.metrics.firstPaint = entry.startTime;
                        break;
                    case 'first-contentful-paint':
                        this.metrics.firstContentfulPaint = entry.startTime;
                        break;
                }
            });
        }, 1000);
    }
    
    /**
     * Track resource loading timing
     */
    trackResourceTiming() {
        const resources = performance.getEntriesByType('resource');
        
        resources.forEach(resource => {
            if (resource.name.includes('.css')) {
                this.processCSSResource(resource);
            }
        });
    }
    
    /**
     * Process CSS resource timing entry
     * @param {PerformanceResourceTiming} entry - Resource timing entry
     */
    processCSSResource(entry) {
        const resourceInfo = {
            name: entry.name,
            loadTime: entry.duration,
            renderBlocking: entry.renderBlockingStatus === 'blocking',
            critical: this.isCriticalCSS(entry.name)
        };
        
        if (resourceInfo.critical) {
            this.metrics.criticalPath.push(resourceInfo);
        }
        
        if (resourceInfo.renderBlocking) {
            this.metrics.renderBlocking.push(resourceInfo);
        }
        
        console.log('CSSPerformanceTracker: CSS resource processed:', resourceInfo);
    }
    
    /**
     * Determine if CSS file is part of critical rendering path
     * @param {string} cssUrl - CSS file URL
     * @returns {boolean} Whether CSS is critical
     */
    isCriticalCSS(cssUrl) {
        const criticalFiles = [
            'MenuSignage.css',
            'footer-component.css',
            'footer-variables.css',
            'scrolling-footer.css'
        ];
        
        return criticalFiles.some(file => cssUrl.includes(file));
    }
    
    /**
     * Track animation performance using RAF
     */
    trackAnimationPerformance() {
        let lastFrameTime = performance.now();
        
        const measureFrame = (timestamp) => {
            if (!this.isTracking) return;
            
            const deltaTime = timestamp - lastFrameTime;
            const fps = 1000 / deltaTime;
            
            this.metrics.animationMetrics.totalFrames++;
            
            // Consider frame smooth if above 55 FPS (close to 60 FPS target)
            if (fps >= 55) {
                this.metrics.animationMetrics.smoothFrames++;
            } else {
                this.metrics.animationMetrics.jankyFrames++;
            }
            
            lastFrameTime = timestamp;
            requestAnimationFrame(measureFrame);
        };
        
        requestAnimationFrame(measureFrame);
    }
    
    /**
     * Get current performance metrics
     * @returns {Object} Current metrics
     */
    getMetrics() {
        const smoothness = this.metrics.animationMetrics.totalFrames > 0 
            ? (this.metrics.animationMetrics.smoothFrames / this.metrics.animationMetrics.totalFrames) * 100
            : 0;
            
        return {
            ...this.metrics,
            smoothness,
            elapsedTime: performance.now() - this.startTime,
            isTracking: this.isTracking
        };
    }
    
    /**
     * Generate performance report
     * @returns {Object} Comprehensive performance report
     */
    generateReport() {
        const metrics = this.getMetrics();
        
        const report = {
            summary: {
                cssLoadTime: `${metrics.cssLoadTime.toFixed(2)}ms`,
                firstPaint: `${metrics.firstPaint.toFixed(2)}ms`,
                firstContentfulPaint: `${metrics.firstContentfulPaint.toFixed(2)}ms`,
                animationSmoothness: `${metrics.smoothness.toFixed(1)}%`
            },
            
            performance: {
                cssLoadGrade: this.gradeCSSLoad(metrics.cssLoadTime),
                paintGrade: this.gradePaintTiming(metrics.firstContentfulPaint),
                animationGrade: this.gradeAnimation(metrics.smoothness)
            },
            
            criticalPath: metrics.criticalPath,
            renderBlocking: metrics.renderBlocking,
            
            recommendations: this.generateRecommendations(metrics)
        };
        
        console.log('CSSPerformanceTracker: Performance report generated:', report);
        return report;
    }
    
    /**
     * Grade CSS loading performance
     * @param {number} loadTime - CSS load time in milliseconds
     * @returns {string} Performance grade (A-F)
     */
    gradeCSSLoad(loadTime) {
        if (loadTime < 100) return 'A';
        if (loadTime < 250) return 'B';
        if (loadTime < 500) return 'C';
        if (loadTime < 1000) return 'D';
        return 'F';
    }
    
    /**
     * Grade paint timing performance
     * @param {number} paintTime - First contentful paint time in milliseconds
     * @returns {string} Performance grade (A-F)
     */
    gradePaintTiming(paintTime) {
        if (paintTime < 1000) return 'A';
        if (paintTime < 1800) return 'B';
        if (paintTime < 3000) return 'C';
        if (paintTime < 5000) return 'D';
        return 'F';
    }
    
    /**
     * Grade animation performance
     * @param {number} smoothness - Animation smoothness percentage
     * @returns {string} Performance grade (A-F)
     */
    gradeAnimation(smoothness) {
        if (smoothness >= 95) return 'A';
        if (smoothness >= 90) return 'B';
        if (smoothness >= 80) return 'C';
        if (smoothness >= 70) return 'D';
        return 'F';
    }
    
    /**
     * Generate performance recommendations
     * @param {Object} metrics - Current performance metrics
     * @returns {Array<string>} Array of recommendations
     */
    generateRecommendations(metrics) {
        const recommendations = [];
        
        if (metrics.cssLoadTime > 500) {
            recommendations.push('Consider minifying CSS files and using critical CSS inlining');
        }
        
        if (metrics.renderBlocking.length > 2) {
            recommendations.push('Reduce render-blocking CSS resources using media queries or async loading');
        }
        
        if (metrics.smoothness < 90) {
            recommendations.push('Optimize animations using transform and opacity properties for better GPU acceleration');
        }
        
        if (metrics.firstContentfulPaint > 2000) {
            recommendations.push('Improve critical rendering path by inlining critical CSS');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('CSS performance is optimal!');
        }
        
        return recommendations;
    }
}

// Make CSSPerformanceTracker available globally
if (typeof window !== 'undefined') {
    window.CSSPerformanceTracker = CSSPerformanceTracker;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSSPerformanceTracker;
}