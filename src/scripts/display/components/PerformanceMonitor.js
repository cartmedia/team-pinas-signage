/**
 * PerformanceMonitor
 * Hardware acceleration verification and 60fps performance monitoring
 * 
 * Features:
 * - GPU acceleration detection and verification
 * - Real-time FPS monitoring with 60fps target
 * - CSS performance metrics collection
 * - Automatic performance issue detection and alerts
 * - Hardware acceleration fallback management
 * 
 * @version 1.0.0
 * @author Team Pinas Signage System
 */

class PerformanceMonitor {
    /**
     * Create a PerformanceMonitor instance
     * @param {HTMLElement} targetElement - Element to monitor
     * @param {Object} options - Configuration options
     * @param {number} options.targetFPS - Target FPS (default: 60)
     * @param {number} options.warningThreshold - FPS warning threshold (default: 50)
     * @param {number} options.sampleSize - Number of frames to average (default: 60)
     * @param {boolean} options.autoFallback - Enable automatic hardware acceleration fallback (default: true)
     */
    constructor(targetElement, options = {}) {
        this.targetElement = targetElement;
        this.options = {
            targetFPS: 60,
            warningThreshold: 50,
            sampleSize: 60,
            autoFallback: true,
            reportInterval: 5000, // Report metrics every 5 seconds
            ...options
        };
        
        // Performance tracking state
        this.isMonitoring = false;
        this.frameCount = 0;
        this.fpsHistory = [];
        this.lastFrameTime = 0;
        this.startTime = 0;
        this.performanceObserver = null;
        this.animationFrameId = null;
        this.reportInterval = null;
        
        // Hardware acceleration state
        this.gpuAcceleration = {
            detected: false,
            properties: new Set(),
            fallbackActive: false
        };
        
        // Performance metrics
        this.metrics = {
            averageFPS: 0,
            minFPS: Infinity,
            maxFPS: 0,
            droppedFrames: 0,
            smoothness: 0, // Percentage of frames within target range
            cpuTime: 0,
            gpuTime: 0
        };
        
        console.log('PerformanceMonitor: Initialized with target', this.options.targetFPS, 'FPS');
    }
    
    /**
     * Start performance monitoring
     * @returns {Promise<boolean>} Success status
     */
    async start() {
        if (this.isMonitoring) {
            console.warn('PerformanceMonitor: Already monitoring');
            return true;
        }
        
        try {
            // Verify hardware acceleration first
            this.verifyHardwareAcceleration();
            
            // Reset metrics
            this.resetMetrics();
            
            // Start monitoring systems
            this.startFrameMonitoring();
            this.startPerformanceObserver();
            this.startPeriodicReporting();
            
            this.isMonitoring = true;
            this.startTime = performance.now();
            
            console.log('PerformanceMonitor: Monitoring started successfully');
            
            // Dispatch start event
            this.dispatchEvent('monitoring-started', {
                targetFPS: this.options.targetFPS,
                gpuAccelerated: this.gpuAcceleration.detected
            });
            
            return true;
            
        } catch (error) {
            console.error('PerformanceMonitor: Failed to start monitoring:', error);
            return false;
        }
    }
    
    /**
     * Stop performance monitoring
     */
    stop() {
        if (!this.isMonitoring) {
            return;
        }
        
        // Stop all monitoring systems
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
            this.performanceObserver = null;
        }
        
        if (this.reportInterval) {
            clearInterval(this.reportInterval);
            this.reportInterval = null;
        }
        
        this.isMonitoring = false;
        
        // Dispatch final metrics
        this.dispatchEvent('monitoring-stopped', {
            finalMetrics: this.getMetrics(),
            duration: performance.now() - this.startTime
        });
        
        console.log('PerformanceMonitor: Monitoring stopped');
    }
    
    /**
     * Verify hardware acceleration CSS properties
     * Detects GPU acceleration and applies fallbacks if needed
     */
    verifyHardwareAcceleration() {
        if (!this.targetElement) {
            console.warn('PerformanceMonitor: No target element for hardware acceleration verification');
            return;
        }
        
        const computedStyle = window.getComputedStyle(this.targetElement);
        const properties = {
            transform: computedStyle.transform,
            willChange: computedStyle.willChange,
            backfaceVisibility: computedStyle.backfaceVisibility,
            perspective: computedStyle.perspective,
            transformStyle: computedStyle.transformStyle
        };
        
        // Check for GPU acceleration indicators
        const hasTransform3d = properties.transform.includes('matrix3d') || 
                             properties.transform.includes('translate3d');
        const hasWillChange = properties.willChange.includes('transform');
        const hasBackface = properties.backfaceVisibility === 'hidden';
        const hasPerspective = properties.perspective !== 'none';
        
        // Reset detection state
        this.gpuAcceleration.properties.clear();
        
        if (hasTransform3d) this.gpuAcceleration.properties.add('transform3d');
        if (hasWillChange) this.gpuAcceleration.properties.add('will-change');
        if (hasBackface) this.gpuAcceleration.properties.add('backface-visibility');
        if (hasPerspective) this.gpuAcceleration.properties.add('perspective');
        
        // Determine if GPU acceleration is likely active
        this.gpuAcceleration.detected = hasTransform3d || hasWillChange || hasBackface;
        
        console.log('PerformanceMonitor: Hardware acceleration check:', {
            detected: this.gpuAcceleration.detected,
            properties: Array.from(this.gpuAcceleration.properties),
            computedStyles: properties
        });
        
        // Apply hardware acceleration if not detected
        if (!this.gpuAcceleration.detected && this.options.autoFallback) {
            this.applyHardwareAcceleration();
        }
        
        // Dispatch hardware acceleration status
        this.dispatchEvent('gpu-acceleration-checked', {
            detected: this.gpuAcceleration.detected,
            properties: Array.from(this.gpuAcceleration.properties),
            fallbackApplied: this.gpuAcceleration.fallbackActive
        });
    }
    
    /**
     * Apply hardware acceleration properties to target element
     */
    applyHardwareAcceleration() {
        if (!this.targetElement) return;
        
        console.log('PerformanceMonitor: Applying hardware acceleration fallback');
        
        // Apply GPU acceleration CSS properties
        const style = this.targetElement.style;
        
        // Force GPU layer creation
        if (!style.transform || style.transform === 'none') {
            style.transform = 'translateZ(0)';
        }
        
        // Set performance hints
        style.willChange = 'transform';
        style.backfaceVisibility = 'hidden';
        
        // Add performance optimization class
        this.targetElement.classList.add('gpu-accelerated');
        
        this.gpuAcceleration.fallbackActive = true;
        
        // Re-verify after applying changes
        setTimeout(() => {
            this.verifyHardwareAcceleration();
        }, 100);
    }
    
    /**
     * Start frame-by-frame monitoring using requestAnimationFrame
     */
    startFrameMonitoring() {
        const measureFrame = (timestamp) => {
            if (!this.isMonitoring) return;
            
            // Calculate FPS from timestamp delta
            if (this.lastFrameTime > 0) {
                const deltaTime = timestamp - this.lastFrameTime;
                const fps = 1000 / deltaTime;
                
                this.recordFPS(fps);
                
                // Check for performance issues
                if (fps < this.options.warningThreshold) {
                    this.metrics.droppedFrames++;
                }
            }
            
            this.lastFrameTime = timestamp;
            this.frameCount++;
            
            // Continue monitoring
            this.animationFrameId = requestAnimationFrame(measureFrame);
        };
        
        this.animationFrameId = requestAnimationFrame(measureFrame);
    }
    
    /**
     * Start PerformanceObserver for detailed timing metrics
     */
    startPerformanceObserver() {
        if (!('PerformanceObserver' in window)) {
            console.warn('PerformanceMonitor: PerformanceObserver not available');
            return;
        }
        
        try {
            this.performanceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                
                for (const entry of entries) {
                    switch (entry.entryType) {
                        case 'measure':
                            if (entry.name.includes('frame')) {
                                this.processMeasureEntry(entry);
                            }
                            break;
                        case 'paint':
                            this.processPaintEntry(entry);
                            break;
                        case 'layout-shift':
                            this.processLayoutShiftEntry(entry);
                            break;
                    }
                }
            });
            
            // Observe multiple entry types
            const entryTypes = ['measure', 'paint'];
            
            // Add layout-shift if available
            if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
                entryTypes.push('layout-shift');
            }
            
            this.performanceObserver.observe({ entryTypes });
            
        } catch (error) {
            console.warn('PerformanceMonitor: PerformanceObserver setup failed:', error);
        }
    }
    
    /**
     * Start periodic performance reporting
     */
    startPeriodicReporting() {
        this.reportInterval = setInterval(() => {
            if (!this.isMonitoring) return;
            
            const metrics = this.getMetrics();
            
            // Dispatch periodic performance report
            this.dispatchEvent('performance-report', {
                metrics,
                timestamp: performance.now(),
                frameCount: this.frameCount
            });
            
            // Check for performance issues
            if (metrics.averageFPS < this.options.warningThreshold) {
                this.dispatchEvent('performance-warning', {
                    type: 'low-fps',
                    fps: metrics.averageFPS,
                    threshold: this.options.warningThreshold,
                    suggestion: 'Consider reducing animation complexity or enabling GPU acceleration'
                });
            }
            
            // Log metrics in debug mode
            if (localStorage.getItem('debugMode') === 'true') {
                console.log('PerformanceMonitor: Metrics report:', metrics);
            }
            
        }, this.options.reportInterval);
    }
    
    /**
     * Record FPS measurement and update metrics
     * @param {number} fps - Frames per second measurement
     */
    recordFPS(fps) {
        this.fpsHistory.push(fps);
        
        // Keep only recent samples
        if (this.fpsHistory.length > this.options.sampleSize) {
            this.fpsHistory.shift();
        }
        
        // Update min/max FPS
        this.metrics.minFPS = Math.min(this.metrics.minFPS, fps);
        this.metrics.maxFPS = Math.max(this.metrics.maxFPS, fps);
        
        // Calculate average FPS
        this.metrics.averageFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        
        // Calculate smoothness (percentage of frames within 5 FPS of target)
        const targetRange = this.options.targetFPS - 5;
        const smoothFrames = this.fpsHistory.filter(f => f >= targetRange).length;
        this.metrics.smoothness = (smoothFrames / this.fpsHistory.length) * 100;
    }
    
    /**
     * Process PerformanceObserver measure entry
     * @param {PerformanceEntry} entry - Performance measure entry
     */
    processMeasureEntry(entry) {
        // Track CPU/GPU timing from custom measures
        if (entry.name.includes('cpu')) {
            this.metrics.cpuTime = entry.duration;
        } else if (entry.name.includes('gpu')) {
            this.metrics.gpuTime = entry.duration;
        }
    }
    
    /**
     * Process PerformanceObserver paint entry
     * @param {PerformanceEntry} entry - Performance paint entry
     */
    processPaintEntry(entry) {
        // Log paint timing for debugging
        if (localStorage.getItem('debugMode') === 'true') {
            console.log(`PerformanceMonitor: ${entry.name} at ${entry.startTime}ms`);
        }
    }
    
    /**
     * Process PerformanceObserver layout-shift entry
     * @param {PerformanceEntry} entry - Performance layout-shift entry
     */
    processLayoutShiftEntry(entry) {
        // Alert on layout shifts that might affect animation smoothness
        if (entry.value > 0.1) {
            this.dispatchEvent('performance-warning', {
                type: 'layout-shift',
                value: entry.value,
                suggestion: 'Layout shift detected - consider using transform instead of layout properties'
            });
        }
    }
    
    /**
     * Get current performance metrics
     * @returns {Object} Current performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            isGPUAccelerated: this.gpuAcceleration.detected,
            fallbackActive: this.gpuAcceleration.fallbackActive,
            frameCount: this.frameCount,
            monitoringTime: this.isMonitoring ? performance.now() - this.startTime : 0,
            targetFPS: this.options.targetFPS,
            sampleSize: this.fpsHistory.length
        };
    }
    
    /**
     * Reset all metrics to initial state
     */
    resetMetrics() {
        this.frameCount = 0;
        this.fpsHistory = [];
        this.lastFrameTime = 0;
        this.metrics = {
            averageFPS: 0,
            minFPS: Infinity,
            maxFPS: 0,
            droppedFrames: 0,
            smoothness: 0,
            cpuTime: 0,
            gpuTime: 0
        };
    }
    
    /**
     * Dispatch custom event with performance data
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail data
     */
    dispatchEvent(eventName, detail) {
        if (!this.targetElement) return;
        
        const event = new CustomEvent(`performance-${eventName}`, {
            detail: {
                ...detail,
                timestamp: performance.now()
            },
            bubbles: true,
            cancelable: false
        });
        
        this.targetElement.dispatchEvent(event);
        
        // Log event in debug mode
        if (localStorage.getItem('debugMode') === 'true') {
            console.log(`PerformanceMonitor: Event ${eventName}:`, detail);
        }
    }
    
    /**
     * Enable debug mode with visual performance indicators
     */
    enableDebugMode() {
        if (!this.targetElement) return;
        
        this.targetElement.classList.add('performance-debug');
        
        // Add debug overlay
        const debugOverlay = document.createElement('div');
        debugOverlay.className = 'performance-debug-overlay';
        debugOverlay.style.cssText = `
            position: absolute;
            top: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px;
            font-size: 12px;
            font-family: monospace;
            z-index: 9999;
            border-radius: 0 0 0 8px;
        `;
        
        this.targetElement.appendChild(debugOverlay);
        
        // Update debug overlay periodically
        const updateDebugOverlay = () => {
            if (!this.isMonitoring) return;
            
            const metrics = this.getMetrics();
            debugOverlay.innerHTML = `
                FPS: ${Math.round(metrics.averageFPS)}<br>
                GPU: ${metrics.isGPUAccelerated ? '✓' : '✗'}<br>
                Smooth: ${Math.round(metrics.smoothness)}%<br>
                Dropped: ${metrics.droppedFrames}
            `;
            
            requestAnimationFrame(updateDebugOverlay);
        };
        
        if (this.isMonitoring) {
            updateDebugOverlay();
        }
    }
    
    /**
     * Create performance benchmark test
     * @param {number} duration - Test duration in milliseconds
     * @returns {Promise<Object>} Benchmark results
     */
    async runBenchmark(duration = 10000) {
        console.log(`PerformanceMonitor: Starting ${duration}ms benchmark...`);
        
        const startTime = performance.now();
        const initialMetrics = { ...this.metrics };
        
        // Run benchmark for specified duration
        await new Promise(resolve => setTimeout(resolve, duration));
        
        const endTime = performance.now();
        const finalMetrics = this.getMetrics();
        
        const results = {
            duration: endTime - startTime,
            framesTested: this.frameCount - (initialMetrics.frameCount || 0),
            averageFPS: finalMetrics.averageFPS,
            minFPS: finalMetrics.minFPS,
            maxFPS: finalMetrics.maxFPS,
            smoothness: finalMetrics.smoothness,
            droppedFrames: finalMetrics.droppedFrames - initialMetrics.droppedFrames,
            gpuAccelerated: finalMetrics.isGPUAccelerated,
            performance: finalMetrics.averageFPS >= this.options.targetFPS * 0.9 ? 'excellent' :
                        finalMetrics.averageFPS >= this.options.targetFPS * 0.8 ? 'good' :
                        finalMetrics.averageFPS >= this.options.targetFPS * 0.6 ? 'fair' : 'poor'
        };
        
        console.log('PerformanceMonitor: Benchmark results:', results);
        
        this.dispatchEvent('benchmark-completed', results);
        
        return results;
    }
}

// Make PerformanceMonitor available globally
if (typeof window !== 'undefined') {
    window.PerformanceMonitor = PerformanceMonitor;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}