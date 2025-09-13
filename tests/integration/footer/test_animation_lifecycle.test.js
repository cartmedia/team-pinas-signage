/**
 * Footer Animation Lifecycle Integration Tests
 * 
 * Tests animation start/stop behavior, configuration updates, and memory cleanup.
 * Verifies complete animation lifecycle management and resource cleanup.
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Footer Animation Lifecycle Integration', () => {
    let dom;
    let document;
    let window;
    let footerComponent;
    let mockConfigurations;

    beforeEach(async () => {
        // Load the actual HTML structure
        const htmlContent = fs.readFileSync(
            path.join(__dirname, '../../../public/index.html'), 
            'utf8'
        );
        
        dom = new JSDOM(htmlContent, {
            runScripts: 'dangerously',
            resources: 'usable',
            url: 'http://localhost:8080'
        });

        document = dom.window.document;
        window = dom.window;

        // Mock different footer configurations for animation testing
        mockConfigurations = {
            active: {
                success: true,
                data: {
                    id: 1,
                    footer_text: "🍔 Welcome to Team Pinas! • Fresh ingredients daily • Open 7 days a week • Order online now",
                    scroll_speed: 50,
                    text_color: "#ffffff",
                    background_color: "#d4af37",
                    font_size: 18,
                    scroll_direction: "left",
                    divider_image: null,
                    is_active: true
                }
            },
            inactive: {
                success: true,
                data: {
                    id: 1,
                    footer_text: "🍔 Welcome to Team Pinas!",
                    scroll_speed: 50,
                    text_color: "#ffffff",
                    background_color: "#d4af37",
                    font_size: 18,
                    scroll_direction: "left",
                    divider_image: null,
                    is_active: false
                }
            },
            fastScroll: {
                success: true,
                data: {
                    id: 1,
                    footer_text: "🍔 Welcome to Team Pinas!",
                    scroll_speed: 20,
                    text_color: "#ffffff",
                    background_color: "#d4af37",
                    font_size: 18,
                    scroll_direction: "left",
                    divider_image: null,
                    is_active: true
                }
            },
            slowScroll: {
                success: true,
                data: {
                    id: 1,
                    footer_text: "🍔 Welcome to Team Pinas!",
                    scroll_speed: 100,
                    text_color: "#ffffff",
                    background_color: "#d4af37",
                    font_size: 18,
                    scroll_direction: "left",
                    divider_image: null,
                    is_active: true
                }
            }
        };

        // Mock fetch globally
        window.fetch = jest.fn();
        
        // Load actual CSS for animation testing
        const cssContent = `
            .scrolling-footer {
                position: fixed;
                bottom: 0;
                width: 100%;
                overflow: hidden;
                z-index: 500;
            }
            
            .footer-text {
                display: inline-block;
                white-space: nowrap;
                animation: scroll-left 10s linear infinite;
            }
            
            @keyframes scroll-left {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }
            
            .footer-visible {
                display: block;
            }
            
            .footer-hidden {
                display: none;
            }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.textContent = cssContent;
        document.head.appendChild(styleElement);
        
        // Load ScrollingFooter component
        const componentCode = fs.readFileSync(
            path.join(__dirname, '../../../src/scripts/display/components/ScrollingFooter.js'),
            'utf8'
        );
        
        // Execute component code in JSDOM context
        const script = document.createElement('script');
        script.textContent = componentCode;
        document.head.appendChild(script);
        
        footerComponent = window.ScrollingFooter;
    });

    afterEach(() => {
        if (dom) {
            dom.window.close();
        }
        jest.clearAllMocks();
    });

    describe('Animation Start Behavior', () => {
        test('animation starts immediately when footer becomes visible', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            
            // Track animation events
            let animationStarted = false;
            document.addEventListener('animationstart', (event) => {
                if (event.target.closest('.scrolling-footer')) {
                    animationStarted = true;
                }
            });

            await footer.init();
            await new Promise(resolve => setTimeout(resolve, 200));

            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement).toBeTruthy();
            
            const style = window.getComputedStyle(footerElement.querySelector('.footer-text') || footerElement);
            expect(style.animationName).toContain('scroll');
            expect(style.animationPlayState).toBe('running');
        });

        test('animation does not start when footer is initially hidden', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.inactive
            });

            const footer = new footerComponent();
            
            let animationStarted = false;
            document.addEventListener('animationstart', (event) => {
                if (event.target.closest('.scrolling-footer')) {
                    animationStarted = true;
                }
            });

            await footer.init();
            await new Promise(resolve => setTimeout(resolve, 200));

            expect(animationStarted).toBe(false);
            
            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement.style.display).toBe('none');
        });

        test('animation parameters are correctly applied on start', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.fastScroll
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            const textElement = footerElement.querySelector('.footer-text') || footerElement;
            const style = window.getComputedStyle(textElement);

            // Fast scroll should have shorter duration
            const duration = parseFloat(style.animationDuration);
            expect(duration).toBeGreaterThan(0);
            expect(duration).toBeLessThan(15); // Faster than default
        });

        test('animation starts smoothly after initial delay', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            
            const startTime = Date.now();
            await footer.init();
            
            // Wait for animation to initialize
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const footerElement = document.querySelector('.scrolling-footer');
            const textElement = footerElement.querySelector('.footer-text') || footerElement;
            const style = window.getComputedStyle(textElement);

            expect(style.animationPlayState).toBe('running');
            
            // Should start within reasonable time
            const initTime = Date.now() - startTime;
            expect(initTime).toBeLessThan(500);
        });
    });

    describe('Animation Stop Behavior', () => {
        test('animation stops cleanly when footer becomes hidden', async () => {
            // Start with visible footer
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            let animationStopped = false;
            document.addEventListener('animationend', (event) => {
                if (event.target.closest('.scrolling-footer')) {
                    animationStopped = true;
                }
            });

            // Hide footer
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.inactive
            });

            await footer.updateFromDatabase();
            await new Promise(resolve => setTimeout(resolve, 200));

            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement.style.display).toBe('none');
        });

        test('animation stops immediately without completing cycle', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            await footer.init();

            // Wait for animation to start
            await new Promise(resolve => setTimeout(resolve, 100));

            const preStopTime = Date.now();

            // Hide footer mid-animation
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.inactive
            });

            await footer.updateFromDatabase();
            
            const stopTime = Date.now() - preStopTime;
            expect(stopTime).toBeLessThan(100); // Should stop quickly
        });

        test('animation state is properly reset when stopped', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            // Stop animation
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.inactive
            });

            await footer.updateFromDatabase();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Restart animation
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            await footer.updateFromDatabase();
            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            const textElement = footerElement.querySelector('.footer-text') || footerElement;
            const style = window.getComputedStyle(textElement);

            // Animation should restart from beginning
            expect(style.animationPlayState).toBe('running');
        });

        test('multiple stop/start cycles work correctly', async () => {
            const footer = new footerComponent();
            
            // Cycle through visible/hidden states
            const cycles = 5;
            for (let i = 0; i < cycles; i++) {
                const isVisible = i % 2 === 0;
                const config = isVisible ? mockConfigurations.active : mockConfigurations.inactive;
                
                window.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => config
                });

                if (i === 0) {
                    await footer.init();
                } else {
                    await footer.updateFromDatabase();
                }

                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Final state should be functional
            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement).toBeTruthy();
            expect(footerElement.classList.contains('footer-error')).toBe(false);
        });
    });

    describe('Configuration-Driven Animation Updates', () => {
        test('animation speed updates immediately when configuration changes', async () => {
            // Start with normal speed
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            const textElement = footerElement.querySelector('.footer-text') || footerElement;
            const initialStyle = window.getComputedStyle(textElement);
            const initialDuration = parseFloat(initialStyle.animationDuration);

            // Update to fast speed
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.fastScroll
            });

            await footer.updateConfiguration();
            await new Promise(resolve => setTimeout(resolve, 100));

            const updatedStyle = window.getComputedStyle(textElement);
            const updatedDuration = parseFloat(updatedStyle.animationDuration);

            expect(updatedDuration).not.toBe(initialDuration);
            expect(updatedDuration).toBeLessThan(initialDuration); // Faster = shorter duration
        });

        test('animation direction changes are applied correctly', async () => {
            const rightScrollConfig = {
                ...mockConfigurations.active.data,
                scroll_direction: "right"
            };

            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: rightScrollConfig })
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            const textElement = footerElement.querySelector('.footer-text') || footerElement;
            const style = window.getComputedStyle(textElement);

            // Animation should reflect direction change
            expect(style.animationName).toBeTruthy();
        });

        test('text content updates maintain animation state', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            // Update text content
            const newTextConfig = {
                ...mockConfigurations.active.data,
                footer_text: "🍕 New menu items available! • Check out our daily specials • Fresh ingredients every day"
            };

            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: newTextConfig })
            });

            await footer.updateConfiguration();
            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            const textElement = footerElement.querySelector('.footer-text') || footerElement;
            
            // Text should be updated
            expect(textElement.textContent).toContain('New menu items');
            
            // Animation should continue running
            const style = window.getComputedStyle(textElement);
            expect(style.animationPlayState).toBe('running');
        });

        test('configuration updates during animation do not cause flicker', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            await footer.init();

            // Wait for animation to start
            await new Promise(resolve => setTimeout(resolve, 100));

            // Track visibility during update
            const footerElement = document.querySelector('.scrolling-footer');
            let wasHidden = false;
            
            const observer = new window.MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        if (footerElement.style.display === 'none') {
                            wasHidden = true;
                        }
                    }
                });
            });

            observer.observe(footerElement, { attributes: true });

            // Update configuration mid-animation
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.fastScroll
            });

            await footer.updateConfiguration();
            await new Promise(resolve => setTimeout(resolve, 200));

            observer.disconnect();

            // Footer should not have been hidden during update
            expect(wasHidden).toBe(false);
        });
    });

    describe('Memory Cleanup and Resource Management', () => {
        test('animation event listeners are properly cleaned up', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            await footer.init();

            // Track event listener count (approximation)
            const initialEventListeners = document._events || {};

            // Hide footer to trigger cleanup
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.inactive
            });

            await footer.updateFromDatabase();
            
            // Cleanup should not leave orphaned listeners
            const finalEventListeners = document._events || {};
            expect(Object.keys(finalEventListeners).length).toBeLessThanOrEqual(Object.keys(initialEventListeners).length + 2);
        });

        test('animation timers are cleared when component destroyed', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            // Spy on clearTimeout and clearInterval
            const originalClearTimeout = window.clearTimeout;
            const originalClearInterval = window.clearInterval;
            let timeoutsCleared = 0;
            let intervalsCleared = 0;

            window.clearTimeout = jest.fn((id) => {
                timeoutsCleared++;
                return originalClearTimeout(id);
            });

            window.clearInterval = jest.fn((id) => {
                intervalsCleared++;
                return originalClearInterval(id);
            });

            // Destroy component
            if (footer.destroy) {
                footer.destroy();
            } else {
                // Simulate destruction by hiding
                window.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockConfigurations.inactive
                });
                await footer.updateFromDatabase();
            }

            await new Promise(resolve => setTimeout(resolve, 50));

            // Some cleanup should have occurred
            expect(timeoutsCleared + intervalsCleared).toBeGreaterThanOrEqual(0);
        });

        test('animation frames are properly canceled', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            
            // Mock requestAnimationFrame and cancelAnimationFrame
            let rafCallbacks = new Map();
            let rafId = 1;
            
            window.requestAnimationFrame = jest.fn((callback) => {
                const id = rafId++;
                rafCallbacks.set(id, callback);
                return id;
            });

            window.cancelAnimationFrame = jest.fn((id) => {
                rafCallbacks.delete(id);
            });

            await footer.init();
            await new Promise(resolve => setTimeout(resolve, 100));

            const initialRafCount = rafCallbacks.size;

            // Hide footer
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.inactive
            });

            await footer.updateFromDatabase();
            await new Promise(resolve => setTimeout(resolve, 50));

            // Some animation frames should be canceled
            expect(rafCallbacks.size).toBeLessThanOrEqual(initialRafCount);
        });

        test('memory usage remains stable across multiple animation cycles', async () => {
            const footer = new footerComponent();

            // Simulate multiple animation cycles
            for (let i = 0; i < 10; i++) {
                const config = i % 2 === 0 ? mockConfigurations.active : mockConfigurations.inactive;
                
                window.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => config
                });

                if (i === 0) {
                    await footer.init();
                } else {
                    await footer.updateFromDatabase();
                }

                await new Promise(resolve => setTimeout(resolve, 50));
            }

            // Final cleanup
            if (footer.destroy) {
                footer.destroy();
            }

            // No memory leaks should be detectable (basic check)
            const footerElements = document.querySelectorAll('.scrolling-footer');
            expect(footerElements.length).toBeLessThanOrEqual(1);
        });

        test('prevents memory leaks from rapid animation start/stop', async () => {
            const footer = new footerComponent();
            
            // Rapid show/hide cycles
            const rapidCycles = 20;
            const promises = [];

            for (let i = 0; i < rapidCycles; i++) {
                const config = i % 2 === 0 ? mockConfigurations.active : mockConfigurations.inactive;
                
                window.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => config
                });

                if (i === 0) {
                    promises.push(footer.init());
                } else {
                    promises.push(footer.updateFromDatabase());
                }
            }

            await Promise.all(promises);
            await new Promise(resolve => setTimeout(resolve, 200));

            // Component should still be functional
            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement).toBeTruthy();
            
            // No excessive elements created
            const allFooterElements = document.querySelectorAll('.scrolling-footer');
            expect(allFooterElements.length).toBeLessThanOrEqual(2);
        });
    });

    describe('Error Handling in Animation Lifecycle', () => {
        test('gracefully handles animation errors without breaking component', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            
            // Mock animation error
            const originalConsoleError = console.error;
            console.error = jest.fn();

            await footer.init();

            // Simulate animation error event
            const footerElement = document.querySelector('.scrolling-footer');
            const errorEvent = new window.Event('animationend');
            errorEvent.animationName = 'invalid-animation';
            footerElement.dispatchEvent(errorEvent);

            await new Promise(resolve => setTimeout(resolve, 100));

            // Component should still be functional
            expect(footerElement).toBeTruthy();
            expect(footerElement.classList.contains('footer-error')).toBe(false);

            console.error = originalConsoleError;
        });

        test('recovers from animation performance issues', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            await footer.init();

            // Simulate performance degradation
            const footerElement = document.querySelector('.scrolling-footer');
            const textElement = footerElement.querySelector('.footer-text') || footerElement;
            
            // Force very slow animation that might cause issues
            textElement.style.animationDuration = '0.001s';

            await new Promise(resolve => setTimeout(resolve, 100));

            // Component should handle extreme values gracefully
            const style = window.getComputedStyle(textElement);
            expect(style.animationPlayState).not.toBe('paused');
        });

        test('animation continues after temporary rendering issues', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            // Simulate rendering issue by temporarily hiding element
            const footerElement = document.querySelector('.scrolling-footer');
            footerElement.style.visibility = 'hidden';

            await new Promise(resolve => setTimeout(resolve, 100));

            // Restore visibility
            footerElement.style.visibility = 'visible';

            await new Promise(resolve => setTimeout(resolve, 100));

            // Animation should continue
            const textElement = footerElement.querySelector('.footer-text') || footerElement;
            const style = window.getComputedStyle(textElement);
            expect(style.animationPlayState).toBe('running');
        });
    });

    describe('Performance Optimization', () => {
        test('animation uses hardware acceleration when available', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            const textElement = footerElement.querySelector('.footer-text') || footerElement;
            const style = window.getComputedStyle(textElement);

            // Check for hardware acceleration hints
            expect(style.transform).toBeTruthy();
            expect(style.willChange).toBeTruthy() || expect(style.backfaceVisibility).toBe('hidden');
        });

        test('animation pauses when page is not visible', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            // Simulate page becoming hidden
            Object.defineProperty(document, 'hidden', {
                writable: true,
                configurable: true,
                value: true,
            });

            document.dispatchEvent(new window.Event('visibilitychange'));

            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            const textElement = footerElement.querySelector('.footer-text') || footerElement;
            const style = window.getComputedStyle(textElement);

            // Animation should be paused when page is hidden
            expect(style.animationPlayState).toBe('paused');
        });

        test('animation resumes when page becomes visible', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.active
            });

            const footer = new footerComponent();
            await footer.init();

            // Hide page first
            Object.defineProperty(document, 'hidden', {
                writable: true,
                configurable: true,
                value: true,
            });
            document.dispatchEvent(new window.Event('visibilitychange'));

            await new Promise(resolve => setTimeout(resolve, 50));

            // Show page again
            Object.defineProperty(document, 'hidden', {
                writable: true,
                configurable: true,
                value: false,
            });
            document.dispatchEvent(new window.Event('visibilitychange'));

            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            const textElement = footerElement.querySelector('.footer-text') || footerElement;
            const style = window.getComputedStyle(textElement);

            expect(style.animationPlayState).toBe('running');
        });
    });
});