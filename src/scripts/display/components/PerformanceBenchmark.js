/**
 * PerformanceBenchmark
 * Comprehensive performance benchmarking suite for footer animations
 * 
 * Features:
 * - GPU acceleration benchmarks
 * - Animation smoothness testing
 * - CSS loading performance measurement
 * - Memory usage tracking
 * - Frame rate stability analysis
 * - Comparative performance testing
 * 
 * @version 1.0.0
 * @author Team Pinas Signage System
 */

class PerformanceBenchmark {
    constructor() {
        this.benchmarks = new Map();
        this.results = [];
        this.isRunning = false;
        this.currentTest = null;
        
        console.log('PerformanceBenchmark: Initialized');
    }
    
    /**
     * Register a benchmark test
     * @param {string} testId - Unique test identifier
     * @param {Object} testConfig - Test configuration
     * @param {Function} testFunction - Test function to execute
     */
    registerTest(testId, testConfig, testFunction) {
        const test = {
            id: testId,
            config: {
                duration: 10000, // Default 10 seconds
                iterations: 1,
                warmupTime: 2000, // 2 second warmup
                cooldownTime: 1000, // 1 second cooldown
                ...testConfig
            },
            testFunction,
            results: []
        };
        
        this.benchmarks.set(testId, test);
        console.log(`PerformanceBenchmark: Registered test: ${testId}`);
        
        return test;
    }
    
    /**
     * Run all registered benchmarks
     * @returns {Promise<Object>} Complete benchmark results
     */
    async runAllBenchmarks() {
        if (this.isRunning) {
            throw new Error('Benchmarks are already running');
        }
        
        console.log('PerformanceBenchmark: Starting complete benchmark suite...');
        this.isRunning = true;
        this.results = [];
        
        try {
            for (const [testId, test] of this.benchmarks) {
                console.log(`PerformanceBenchmark: Running test: ${testId}`);
                this.currentTest = testId;
                
                const result = await this.runSingleTest(test);
                this.results.push(result);
                
                // Cool down between tests
                await this.delay(2000);
            }
            
            const summary = this.generateSummaryReport();
            console.log('PerformanceBenchmark: All benchmarks completed', summary);
            
            return {
                summary,
                individualResults: this.results,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                deviceInfo: this.getDeviceInfo()
            };
            
        } finally {
            this.isRunning = false;
            this.currentTest = null;
        }
    }
    
    /**
     * Run a single benchmark test
     * @param {Object} test - Test configuration
     * @returns {Promise<Object>} Test results
     */
    async runSingleTest(test) {
        const startTime = performance.now();
        
        // Pre-test cleanup
        await this.cleanupBeforeTest();
        
        // Warmup period
        if (test.config.warmupTime > 0) {
            await this.delay(test.config.warmupTime);
        }
        
        const results = {
            testId: test.id,
            config: test.config,
            startTime,
            iterations: [],
            errors: [],
            metrics: {
                averageFPS: 0,
                minFPS: Infinity,
                maxFPS: 0,
                frameDrops: 0,
                smoothness: 0,
                memoryUsage: {},
                cpuTime: 0,
                gpuAccelerated: false
            }
        };
        
        try {
            // Run test iterations
            for (let i = 0; i < test.config.iterations; i++) {
                console.log(`PerformanceBenchmark: Running iteration ${i + 1}/${test.config.iterations}`);
                
                const iterationResult = await this.runTestIteration(test, i);
                results.iterations.push(iterationResult);
                
                // Update aggregate metrics
                this.updateAggregateMetrics(results.metrics, iterationResult.metrics);
                
                // Brief pause between iterations
                if (i < test.config.iterations - 1) {
                    await this.delay(500);
                }
            }
            
            // Calculate final metrics
            this.calculateFinalMetrics(results);
            
        } catch (error) {
            console.error(`PerformanceBenchmark: Test ${test.id} failed:`, error);
            results.errors.push({
                error: error.message,
                stack: error.stack,
                timestamp: performance.now()
            });
        }
        
        results.endTime = performance.now();
        results.totalDuration = results.endTime - results.startTime;
        
        // Cooldown period
        if (test.config.cooldownTime > 0) {
            await this.delay(test.config.cooldownTime);
        }
        
        return results;
    }
    
    /**
     * Run a single test iteration
     * @param {Object} test - Test configuration
     * @param {number} iteration - Iteration number
     * @returns {Promise<Object>} Iteration results
     */
    async runTestIteration(test, iteration) {
        const iterationStart = performance.now();
        
        // Initialize performance monitoring
        const performanceTracker = this.createPerformanceTracker();
        performanceTracker.start();
        
        // Record initial memory usage
        const initialMemory = this.getMemoryUsage();
        
        try {
            // Execute the test function
            const testResult = await test.testFunction({
                iteration,
                duration: test.config.duration,
                tracker: performanceTracker
            });
            
            // Wait for test duration
            await this.delay(test.config.duration);
            
            // Stop performance tracking
            const performanceMetrics = performanceTracker.stop();
            
            // Record final memory usage
            const finalMemory = this.getMemoryUsage();
            
            return {
                iteration,
                duration: performance.now() - iterationStart,
                testResult,
                metrics: {
                    ...performanceMetrics,
                    memoryDelta: this.calculateMemoryDelta(initialMemory, finalMemory),
                    initialMemory,
                    finalMemory
                }
            };
            
        } catch (error) {
            console.error(`PerformanceBenchmark: Iteration ${iteration} failed:`, error);
            throw error;
        }
    }
    
    /**
     * Create a performance tracker for the test
     * @returns {Object} Performance tracker instance
     */
    createPerformanceTracker() {
        return {
            frameCount: 0,
            fpsHistory: [],
            startTime: 0,
            isRunning: false,
            animationId: null,
            
            start() {
                this.startTime = performance.now();
                this.isRunning = true;
                this.trackFrames();
            },
            
            trackFrames() {
                let lastFrameTime = performance.now();
                
                const measureFrame = (timestamp) => {
                    if (!this.isRunning) return;
                    
                    const deltaTime = timestamp - lastFrameTime;
                    const fps = 1000 / deltaTime;
                    
                    this.frameCount++;
                    this.fpsHistory.push(fps);
                    
                    lastFrameTime = timestamp;
                    this.animationId = requestAnimationFrame(measureFrame);
                };
                
                this.animationId = requestAnimationFrame(measureFrame);
            },
            
            stop() {
                this.isRunning = false;
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                }
                
                const totalTime = performance.now() - this.startTime;
                const averageFPS = this.fpsHistory.length > 0 
                    ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length 
                    : 0;
                
                const smoothFrames = this.fpsHistory.filter(fps => fps >= 55).length;
                const smoothness = this.fpsHistory.length > 0 
                    ? (smoothFrames / this.fpsHistory.length) * 100 
                    : 0;
                
                return {
                    totalTime,
                    frameCount: this.frameCount,
                    averageFPS,
                    minFPS: Math.min(...this.fpsHistory),
                    maxFPS: Math.max(...this.fpsHistory),
                    smoothness,
                    frameDrops: this.fpsHistory.filter(fps => fps < 45).length
                };
            }
        };
    }
    
    /**
     * Get current memory usage
     * @returns {Object} Memory usage information
     */
    getMemoryUsage() {
        if ('memory' in performance) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                timestamp: performance.now()
            };
        }
        
        return {
            usedJSHeapSize: 0,
            totalJSHeapSize: 0,
            jsHeapSizeLimit: 0,
            timestamp: performance.now(),
            available: false
        };
    }
    
    /**
     * Calculate memory usage delta
     * @param {Object} initial - Initial memory usage
     * @param {Object} final - Final memory usage
     * @returns {Object} Memory usage delta
     */
    calculateMemoryDelta(initial, final) {
        return {
            usedJSHeapSizeDelta: final.usedJSHeapSize - initial.usedJSHeapSize,
            totalJSHeapSizeDelta: final.totalJSHeapSize - initial.totalJSHeapSize,
            duration: final.timestamp - initial.timestamp
        };
    }
    
    /**
     * Update aggregate metrics with iteration results
     * @param {Object} aggregate - Aggregate metrics object
     * @param {Object} iteration - Iteration metrics
     */
    updateAggregateMetrics(aggregate, iteration) {
        aggregate.averageFPS = (aggregate.averageFPS + iteration.averageFPS) / 2;
        aggregate.minFPS = Math.min(aggregate.minFPS, iteration.minFPS);
        aggregate.maxFPS = Math.max(aggregate.maxFPS, iteration.maxFPS);
        aggregate.frameDrops += iteration.frameDrops || 0;
        aggregate.smoothness = (aggregate.smoothness + iteration.smoothness) / 2;
        aggregate.cpuTime += iteration.totalTime || 0;
    }
    
    /**
     * Calculate final test metrics
     * @param {Object} results - Test results object
     */
    calculateFinalMetrics(results) {
        if (results.iterations.length === 0) return;
        
        const iterations = results.iterations;
        
        // Calculate averages across iterations
        results.metrics.averageFPS = iterations.reduce((sum, iter) => 
            sum + iter.metrics.averageFPS, 0) / iterations.length;
            
        results.metrics.smoothness = iterations.reduce((sum, iter) => 
            sum + iter.metrics.smoothness, 0) / iterations.length;
            
        // Calculate stability (low variance in FPS)
        const fpsValues = iterations.map(iter => iter.metrics.averageFPS);
        const meanFPS = results.metrics.averageFPS;
        const variance = fpsValues.reduce((sum, fps) => sum + Math.pow(fps - meanFPS, 2), 0) / fpsValues.length;
        results.metrics.stability = 100 - Math.min(100, variance);
        
        // Memory metrics
        const memoryDeltas = iterations.map(iter => iter.metrics.memoryDelta.usedJSHeapSizeDelta);
        results.metrics.memoryUsage = {
            averageDelta: memoryDeltas.reduce((sum, delta) => sum + delta, 0) / memoryDeltas.length,
            maxDelta: Math.max(...memoryDeltas),
            minDelta: Math.min(...memoryDeltas)
        };
    }
    
    /**
     * Generate summary report of all benchmarks
     * @returns {Object} Summary report
     */
    generateSummaryReport() {
        if (this.results.length === 0) {
            return { overall: 'No benchmarks completed' };
        }
        
        const overallMetrics = {
            averageFPS: 0,
            smoothness: 0,
            stability: 0,
            memoryEfficiency: 0,
            performanceGrade: 'F'
        };
        
        // Calculate overall metrics
        this.results.forEach(result => {
            overallMetrics.averageFPS += result.metrics.averageFPS || 0;
            overallMetrics.smoothness += result.metrics.smoothness || 0;
            overallMetrics.stability += result.metrics.stability || 0;
        });
        
        const testCount = this.results.length;
        overallMetrics.averageFPS /= testCount;
        overallMetrics.smoothness /= testCount;
        overallMetrics.stability /= testCount;
        
        // Calculate memory efficiency
        const memoryDeltas = this.results.map(r => r.metrics.memoryUsage?.averageDelta || 0);
        const avgMemoryGrowth = memoryDeltas.reduce((sum, delta) => sum + Math.abs(delta), 0) / memoryDeltas.length;
        overallMetrics.memoryEfficiency = Math.max(0, 100 - (avgMemoryGrowth / 1000000)); // Convert to MB scale
        
        // Calculate performance grade
        overallMetrics.performanceGrade = this.calculatePerformanceGrade(overallMetrics);
        
        return {
            overall: overallMetrics,
            testCount,
            totalDuration: this.results.reduce((sum, r) => sum + r.totalDuration, 0),
            errors: this.results.reduce((sum, r) => sum + r.errors.length, 0),
            recommendations: this.generateRecommendations(overallMetrics)
        };
    }
    
    /**
     * Calculate overall performance grade
     * @param {Object} metrics - Overall performance metrics
     * @returns {string} Performance grade A-F
     */
    calculatePerformanceGrade(metrics) {
        const score = (
            (metrics.averageFPS / 60) * 30 +
            (metrics.smoothness / 100) * 25 +
            (metrics.stability / 100) * 25 +
            (metrics.memoryEfficiency / 100) * 20
        );
        
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }
    
    /**
     * Generate performance recommendations
     * @param {Object} metrics - Performance metrics
     * @returns {Array<string>} Recommendations
     */
    generateRecommendations(metrics) {
        const recommendations = [];
        
        if (metrics.averageFPS < 50) {
            recommendations.push('Optimize animations for better frame rate performance');
        }
        
        if (metrics.smoothness < 85) {
            recommendations.push('Reduce animation complexity to improve smoothness');
        }
        
        if (metrics.stability < 80) {
            recommendations.push('Implement GPU acceleration to stabilize frame rates');
        }
        
        if (metrics.memoryEfficiency < 70) {
            recommendations.push('Investigate memory leaks in animation loops');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Performance is optimal!');
        }
        
        return recommendations;
    }
    
    /**
     * Get device information
     * @returns {Object} Device information
     */
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory || 'unknown',
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink
            } : 'unknown',
            screen: {
                width: screen.width,
                height: screen.height,
                pixelRatio: window.devicePixelRatio
            }
        };
    }
    
    /**
     * Cleanup before running tests
     * @returns {Promise<void>}
     */
    async cleanupBeforeTest() {
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Clear performance entries
        if (performance.clearResourceTimings) {
            performance.clearResourceTimings();
        }
        
        // Wait for cleanup to complete
        await this.delay(100);
    }
    
    /**
     * Delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Export results to JSON
     * @returns {string} JSON string of results
     */
    exportResults() {
        return JSON.stringify({
            results: this.results,
            summary: this.generateSummaryReport(),
            timestamp: new Date().toISOString(),
            deviceInfo: this.getDeviceInfo()
        }, null, 2);
    }
    
    /**
     * Clear all results and benchmarks
     */
    clear() {
        this.results = [];
        this.benchmarks.clear();
        this.isRunning = false;
        this.currentTest = null;
        
        console.log('PerformanceBenchmark: Cleared all data');
    }
}

// Pre-defined benchmark tests for footer performance
class FooterPerformanceBenchmarks {
    static register(benchmark) {
        // GPU Acceleration Test
        benchmark.registerTest('gpu-acceleration', {
            duration: 5000,
            iterations: 3
        }, async ({ iteration, duration, tracker }) => {
            const element = document.querySelector('.SignageFooter .scrolling-footer-content');
            if (!element) throw new Error('Footer element not found');
            
            // Apply GPU acceleration
            element.style.transform = 'translateZ(0)';
            element.style.willChange = 'transform';
            
            // Test animation
            element.style.animation = 'test-scroll 2s linear infinite';
            
            return { gpuAccelerated: true };
        });
        
        // Animation Smoothness Test
        benchmark.registerTest('animation-smoothness', {
            duration: 8000,
            iterations: 2
        }, async ({ iteration, duration, tracker }) => {
            const element = document.querySelector('.SignageFooter');
            if (!element) throw new Error('Footer container not found');
            
            // Initialize ScrollingFooter if available
            if (window.ScrollingFooter) {
                const footer = new window.ScrollingFooter(element, {
                    footer_text: 'Performance test content <separator> Testing smoothness',
                    scroll_speed: 50,
                    scroll_direction: 'continuous'
                });
                
                await footer.start();
                
                // Let it run for the duration
                await new Promise(resolve => setTimeout(resolve, duration));
                
                footer.stop();
                return { smoothnessTest: true };
            }
            
            return { smoothnessTest: false, reason: 'ScrollingFooter not available' };
        });
        
        // Memory Usage Test
        benchmark.registerTest('memory-usage', {
            duration: 10000,
            iterations: 2
        }, async ({ iteration, duration, tracker }) => {
            // Create and destroy multiple footer instances
            const element = document.querySelector('.SignageFooter');
            if (!element) throw new Error('Footer element not found');
            
            const instances = [];
            
            // Create instances
            for (let i = 0; i < 5; i++) {
                if (window.ScrollingFooter) {
                    const instance = new window.ScrollingFooter(element, {
                        footer_text: `Memory test ${i} <separator> Testing memory usage`,
                        scroll_speed: 30
                    });
                    instances.push(instance);
                    await instance.start();
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Clean up instances
            instances.forEach(instance => instance.stop());
            
            return { instancesTested: instances.length };
        });
        
        // CSS Loading Performance Test
        benchmark.registerTest('css-loading', {
            duration: 3000,
            iterations: 1
        }, async ({ iteration, duration, tracker }) => {
            const startTime = performance.now();
            
            // Test CSS loading time
            const cssTracker = new window.CSSPerformanceTracker();
            cssTracker.startTracking();
            
            await new Promise(resolve => setTimeout(resolve, duration));
            
            const cssMetrics = cssTracker.stopTracking();
            
            return {
                cssLoadTime: cssMetrics.cssLoadTime,
                firstPaint: cssMetrics.firstPaint,
                firstContentfulPaint: cssMetrics.firstContentfulPaint
            };
        });
        
        console.log('FooterPerformanceBenchmarks: All benchmarks registered');
    }
}

// Make classes available globally
if (typeof window !== 'undefined') {
    window.PerformanceBenchmark = PerformanceBenchmark;
    window.FooterPerformanceBenchmarks = FooterPerformanceBenchmarks;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceBenchmark, FooterPerformanceBenchmarks };
}