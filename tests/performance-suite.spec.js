/**
 * Performance Testing Suite
 * Comprehensive performance validation for Phase 3.6 completion
 * 
 * Tests all performance optimization and polish implementations:
 * - T031: Hardware acceleration verification
 * - T032: 60fps performance monitoring 
 * - T033: CSS loading performance metrics
 * - T034: Graceful animation fallbacks
 * - T035: Error boundaries and recovery
 * - T037: Performance benchmarking
 * 
 * @requires @playwright/test
 * @version 1.0.0
 * @author Team Pinas Signage System
 */

const { test, expect } = require('@playwright/test');

// Performance test configuration
const PERF_CONFIG = {
    baseURL: 'http://localhost:8080',
    timeout: 60000,
    viewport: { width: 1920, height: 1080 },
    targetFPS: 60,
    minAcceptableFPS: 50,
    benchmarkDuration: 10000,
    warningThreshold: 45
};

// Test data for performance scenarios
const PERFORMANCE_SCENARIOS = {
    light: {
        footer_text: 'Light test <separator> Simple content',
        scroll_speed: 30,
        expected_grade: 'A'
    },
    medium: {
        footer_text: 'Medium test <separator> More content here <separator> Additional text',
        scroll_speed: 50,
        expected_grade: 'B'
    },
    heavy: {
        footer_text: 'Heavy performance test <separator> Long content with multiple segments <separator> Testing system limits <separator> Extended text for stress testing',
        scroll_speed: 80,
        expected_grade: 'C'
    }
};

test.describe('Phase 3.6: Performance and Polish Validation', () => {
    test.beforeEach(async ({ page }) => {
        // Set performance viewport
        await page.setViewportSize(PERF_CONFIG.viewport);
        
        // Navigate with performance timing
        await page.goto(PERF_CONFIG.baseURL);
        await page.waitForLoadState('networkidle');
        
        // Ensure footer system is loaded
        await page.waitForSelector('.SignageFooter', { timeout: 10000 });
        
        // Enable debug mode for detailed metrics
        await page.evaluate(() => {
            localStorage.setItem('debugMode', 'true');
        });
        
        // Wait for performance systems to initialize
        await page.waitForTimeout(2000);
    });
    
    test('T031: Hardware Acceleration Verification', async ({ page }) => {
        console.log('Testing T031: Hardware acceleration verification...');
        
        // Initialize performance monitoring systems
        const performanceData = await page.evaluate(() => {
            return new Promise((resolve) => {
                // Check if PerformanceMonitor is available
                if (!window.PerformanceMonitor) {
                    resolve({ error: 'PerformanceMonitor not available' });
                    return;
                }
                
                const container = document.querySelector('.SignageFooter');
                const monitor = new window.PerformanceMonitor(container);
                
                monitor.start().then(() => {
                    // Wait for hardware acceleration check
                    setTimeout(() => {
                        const metrics = monitor.getMetrics();
                        monitor.stop();
                        resolve({
                            gpuAccelerated: metrics.isGPUAccelerated,
                            fallbackActive: metrics.fallbackActive,
                            properties: metrics.properties || []
                        });
                    }, 2000);
                });
            });
        });
        
        // Validate hardware acceleration is detected or applied
        expect(performanceData.error).toBeUndefined();
        expect(performanceData.gpuAccelerated).toBe(true);
        
        console.log('T031 ✓: Hardware acceleration verified', performanceData);
    });
    
    test('T032: 60fps Performance Monitoring', async ({ page }) => {
        console.log('Testing T032: 60fps performance monitoring...');
        
        // Start footer animation
        await page.evaluate((scenario) => {
            if (window.scrollingFooterInstance) {
                window.scrollingFooterInstance.updateConfig(scenario);
                window.scrollingFooterInstance.start();
            }
        }, PERFORMANCE_SCENARIOS.light);
        
        // Monitor performance for 5 seconds
        const performanceResults = await page.evaluate(() => {
            return new Promise((resolve) => {
                let frameCount = 0;
                let fpsHistory = [];
                let startTime = performance.now();
                
                const measureFrame = (timestamp) => {
                    if (frameCount === 0) {
                        startTime = timestamp;
                    }
                    
                    frameCount++;
                    
                    if (frameCount > 1) {
                        const deltaTime = timestamp - startTime;
                        const fps = (frameCount / deltaTime) * 1000;
                        fpsHistory.push(fps);
                    }
                    
                    if (frameCount < 300) { // ~5 seconds at 60fps
                        requestAnimationFrame(measureFrame);
                    } else {
                        const avgFPS = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
                        const minFPS = Math.min(...fpsHistory);
                        const maxFPS = Math.max(...fpsHistory);
                        const smoothFrames = fpsHistory.filter(fps => fps >= 55).length;
                        const smoothness = (smoothFrames / fpsHistory.length) * 100;
                        
                        resolve({
                            averageFPS: avgFPS,
                            minFPS: minFPS,
                            maxFPS: maxFPS,
                            smoothness: smoothness,
                            frameCount: frameCount,
                            duration: performance.now() - startTime
                        });
                    }
                };
                
                requestAnimationFrame(measureFrame);
            });
        });
        
        // Validate 60fps target
        expect(performanceResults.averageFPS).toBeGreaterThan(PERF_CONFIG.minAcceptableFPS);
        expect(performanceResults.smoothness).toBeGreaterThan(80); // 80% smooth frames
        expect(performanceResults.frameCount).toBeGreaterThan(250); // Expected frame count
        
        console.log('T032 ✓: 60fps monitoring validated', {
            fps: Math.round(performanceResults.averageFPS),
            smoothness: Math.round(performanceResults.smoothness),
            frames: performanceResults.frameCount
        });
    });
    
    test('T033: CSS Loading Performance Metrics', async ({ page }) => {
        console.log('Testing T033: CSS loading performance metrics...');
        
        // Test CSS performance tracking
        const cssMetrics = await page.evaluate(() => {
            return new Promise((resolve) => {
                if (!window.CSSPerformanceTracker) {
                    resolve({ error: 'CSSPerformanceTracker not available' });
                    return;
                }
                
                const tracker = new window.CSSPerformanceTracker();
                tracker.startTracking();
                
                // Wait for tracking to complete
                setTimeout(() => {
                    const metrics = tracker.stopTracking();
                    const report = tracker.generateReport();
                    
                    resolve({
                        cssLoadTime: metrics.cssLoadTime,
                        firstPaint: metrics.firstPaint,
                        firstContentfulPaint: metrics.firstContentfulPaint,
                        smoothness: metrics.smoothness,
                        report: report
                    });
                }, 3000);
            });
        });
        
        // Validate CSS performance
        expect(cssMetrics.error).toBeUndefined();
        expect(cssMetrics.cssLoadTime).toBeLessThan(1000); // Under 1 second
        expect(cssMetrics.firstContentfulPaint).toBeLessThan(2000); // Under 2 seconds
        
        console.log('T033 ✓: CSS performance validated', {
            cssLoad: Math.round(cssMetrics.cssLoadTime),
            fcp: Math.round(cssMetrics.firstContentfulPaint)
        });
    });
    
    test('T034: Graceful Animation Fallbacks', async ({ page }) => {
        console.log('Testing T034: Graceful animation fallbacks...');
        
        // Test fallback system activation
        const fallbackResults = await page.evaluate(() => {
            return new Promise((resolve) => {
                if (!window.AnimationFallbackManager) {
                    resolve({ error: 'AnimationFallbackManager not available' });
                    return;
                }
                
                const container = document.querySelector('.SignageFooter');
                const fallbackManager = new window.AnimationFallbackManager(container);
                
                // Register test animation context
                fallbackManager.registerAnimationContext('test', {}, () => {
                    return { fallbackRendered: true };
                });
                
                // Simulate performance degradation
                fallbackManager.activateFallback('performance', { fps: 30 });
                
                setTimeout(() => {
                    const status = fallbackManager.getStatus();
                    resolve({
                        fallbackActive: status.fallbackActive,
                        currentState: status.currentState,
                        animationContexts: status.animationContexts
                    });
                }, 1000);
            });
        });
        
        // Validate fallback activation
        expect(fallbackResults.error).toBeUndefined();
        expect(fallbackResults.fallbackActive).toBe(true);
        expect(fallbackResults.currentState).toBe('fallback');
        
        console.log('T034 ✓: Animation fallbacks validated', fallbackResults);
    });
    
    test('T035: Error Boundaries and Recovery', async ({ page }) => {
        console.log('Testing T035: Error boundaries and recovery...');
        
        // Test error boundary system
        const errorHandling = await page.evaluate(() => {
            return new Promise((resolve) => {
                const errors = [];
                const recoveries = [];
                
                // Set up error listeners
                window.addEventListener('error', (event) => {
                    errors.push({ message: event.error?.message, filename: event.filename });
                });
                
                // Test with AnimationFallbackManager
                if (window.AnimationFallbackManager) {
                    const container = document.querySelector('.SignageFooter');
                    const fallbackManager = new window.AnimationFallbackManager(container);
                    
                    // Test error boundary activation
                    try {
                        fallbackManager.activateFallback('error', { error: 'Test error' });
                        recoveries.push({ type: 'fallback', success: true });
                    } catch (e) {
                        errors.push({ message: e.message, context: 'fallback-test' });
                    }
                }
                
                setTimeout(() => {
                    resolve({
                        errorCount: errors.length,
                        recoveryCount: recoveries.length,
                        hasErrorBoundaries: !!window.AnimationFallbackManager
                    });
                }, 1500);
            });
        });
        
        // Validate error handling
        expect(errorHandling.hasErrorBoundaries).toBe(true);
        expect(errorHandling.recoveryCount).toBeGreaterThan(0);
        
        console.log('T035 ✓: Error boundaries validated', errorHandling);
    });
    
    test('T037: Performance Benchmarking', async ({ page }) => {
        console.log('Testing T037: Performance benchmarking...');
        
        // Run comprehensive benchmark
        const benchmarkResults = await page.evaluate(() => {
            return new Promise((resolve) => {
                if (!window.PerformanceBenchmark) {
                    resolve({ error: 'PerformanceBenchmark not available' });
                    return;
                }
                
                const benchmark = new window.PerformanceBenchmark();
                
                // Register footer benchmarks if available
                if (window.FooterPerformanceBenchmarks) {
                    window.FooterPerformanceBenchmarks.register(benchmark);
                }
                
                // Run all benchmarks
                benchmark.runAllBenchmarks().then((results) => {
                    resolve({
                        summary: results.summary,
                        testCount: results.testCount,
                        errors: results.errors,
                        deviceInfo: results.deviceInfo
                    });
                }).catch((error) => {
                    resolve({ error: error.message });
                });
            });
        });
        
        // Validate benchmark execution
        expect(benchmarkResults.error).toBeUndefined();
        expect(benchmarkResults.testCount).toBeGreaterThan(0);
        expect(benchmarkResults.summary.overall.performanceGrade).toMatch(/[A-F]/);
        
        console.log('T037 ✓: Performance benchmarking completed', {
            tests: benchmarkResults.testCount,
            grade: benchmarkResults.summary.overall.performanceGrade,
            fps: Math.round(benchmarkResults.summary.overall.averageFPS || 0)
        });
    });
    
    test('Integration: Complete Footer System Performance', async ({ page }) => {
        console.log('Testing complete footer system performance integration...');
        
        // Test all scenarios with different performance loads
        const scenarioResults = [];
        
        for (const [scenarioName, scenario] of Object.entries(PERFORMANCE_SCENARIOS)) {
            console.log(`Testing scenario: ${scenarioName}`);
            
            // Apply scenario configuration
            await page.evaluate((config) => {
                if (window.scrollingFooterInstance) {
                    window.scrollingFooterInstance.updateConfig(config);
                    window.scrollingFooterInstance.start();
                }
            }, scenario);
            
            // Wait for stabilization
            await page.waitForTimeout(3000);
            
            // Get comprehensive metrics
            const metrics = await page.evaluate(() => {
                if (window.scrollingFooterInstance) {
                    return window.scrollingFooterInstance.getPerformanceMetrics();
                }
                return null;
            });
            
            if (metrics) {
                scenarioResults.push({
                    scenario: scenarioName,
                    fps: metrics.combined?.fps || 0,
                    grade: metrics.combined?.performance_grade || 'F',
                    gpuAccelerated: metrics.combined?.gpu_accelerated || false,
                    fallbackActive: metrics.combined?.fallback_active || false
                });
            }
            
            // Brief pause between scenarios
            await page.waitForTimeout(1000);
        }
        
        // Validate all scenarios performed adequately
        expect(scenarioResults.length).toBe(3);
        
        scenarioResults.forEach((result, index) => {
            expect(result.fps).toBeGreaterThan(30); // Minimum acceptable FPS
            expect(result.grade).toMatch(/[A-D]/); // No complete failures
            
            console.log(`Scenario ${result.scenario}: FPS=${Math.round(result.fps)}, Grade=${result.grade}, GPU=${result.gpuAccelerated}`);
        });
        
        console.log('Integration ✓: Complete footer system validated');
    });
});

test.describe('Performance Regression Prevention', () => {
    test('Memory leak detection', async ({ page }) => {
        console.log('Testing memory leak prevention...');
        
        // Create and destroy multiple footer instances
        const memoryResults = await page.evaluate(() => {
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const instances = [];
            
            // Create multiple instances
            for (let i = 0; i < 10; i++) {
                const container = document.createElement('div');
                container.className = 'test-footer';
                document.body.appendChild(container);
                
                if (window.ScrollingFooter) {
                    const instance = new window.ScrollingFooter(container, {
                        footer_text: `Test ${i} <separator> Memory test`,
                        scroll_speed: 30
                    });
                    instances.push({ instance, container });
                    instance.start();
                }
            }
            
            const midMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            // Clean up all instances
            instances.forEach(({ instance, container }) => {
                instance.stop();
                container.remove();
            });
            
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
            
            setTimeout(() => {
                const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
                
                return {
                    initialMemory,
                    midMemory,
                    finalMemory,
                    memoryGrowth: finalMemory - initialMemory,
                    peakGrowth: midMemory - initialMemory
                };
            }, 2000);
        });
        
        // Validate memory usage is reasonable
        if (memoryResults.initialMemory > 0) {
            expect(memoryResults.memoryGrowth).toBeLessThan(5 * 1024 * 1024); // Under 5MB growth
        }
        
        console.log('Memory leak test completed', {
            growth: Math.round(memoryResults.memoryGrowth / 1024),
            peak: Math.round(memoryResults.peakGrowth / 1024)
        });
    });
    
    test('Performance stability over time', async ({ page }) => {
        console.log('Testing performance stability...');
        
        // Start footer with medium load scenario
        await page.evaluate((scenario) => {
            if (window.scrollingFooterInstance) {
                window.scrollingFooterInstance.updateConfig(scenario);
                window.scrollingFooterInstance.start();
            }
        }, PERFORMANCE_SCENARIOS.medium);
        
        // Measure performance over extended period
        const stabilityResults = await page.evaluate(() => {
            return new Promise((resolve) => {
                const measurements = [];
                let measurementCount = 0;
                const maxMeasurements = 10;
                
                const measurePerformance = () => {
                    const startTime = performance.now();
                    let frameCount = 0;
                    
                    const countFrames = () => {
                        frameCount++;
                        if (frameCount < 60) { // 1 second of frames
                            requestAnimationFrame(countFrames);
                        } else {
                            const elapsed = performance.now() - startTime;
                            const fps = (frameCount / elapsed) * 1000;
                            measurements.push(fps);
                            measurementCount++;
                            
                            if (measurementCount < maxMeasurements) {
                                setTimeout(measurePerformance, 1000); // Wait 1 second between measurements
                            } else {
                                const avgFPS = measurements.reduce((a, b) => a + b, 0) / measurements.length;
                                const minFPS = Math.min(...measurements);
                                const maxFPS = Math.max(...measurements);
                                const variance = measurements.reduce((sum, fps) => sum + Math.pow(fps - avgFPS, 2), 0) / measurements.length;
                                
                                resolve({
                                    measurements: measurements,
                                    averageFPS: avgFPS,
                                    minFPS: minFPS,
                                    maxFPS: maxFPS,
                                    variance: variance,
                                    stability: Math.max(0, 100 - variance)
                                });
                            }
                        }
                    };
                    
                    requestAnimationFrame(countFrames);
                };
                
                measurePerformance();
            });
        });
        
        // Validate performance stability
        expect(stabilityResults.averageFPS).toBeGreaterThan(45);
        expect(stabilityResults.variance).toBeLessThan(100); // Low variance indicates stability
        expect(stabilityResults.stability).toBeGreaterThan(70); // 70% stability
        
        console.log('Performance stability validated', {
            avgFPS: Math.round(stabilityResults.averageFPS),
            stability: Math.round(stabilityResults.stability),
            variance: Math.round(stabilityResults.variance)
        });
    });
});
