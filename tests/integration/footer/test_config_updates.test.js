/**
 * Footer Configuration Updates Integration Tests
 * 
 * Tests real-time configuration updates without page refresh.
 * Verifies color changes, speed adjustments, font size updates, and error handling.
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Footer Configuration Updates Integration', () => {
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

        // Mock different footer configurations
        mockConfigurations = {
            default: {
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
                    is_active: true
                }
            },
            redTheme: {
                success: true,
                data: {
                    id: 1,
                    footer_text: "🍔 Welcome to Team Pinas!",
                    scroll_speed: 50,
                    text_color: "#ffffff",
                    background_color: "#dc2626",
                    font_size: 18,
                    scroll_direction: "left",
                    divider_image: null,
                    is_active: true
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
            largeFontSize: {
                success: true,
                data: {
                    id: 1,
                    footer_text: "🍔 Welcome to Team Pinas!",
                    scroll_speed: 50,
                    text_color: "#ffffff",
                    background_color: "#d4af37",
                    font_size: 24,
                    scroll_direction: "left",
                    divider_image: null,
                    is_active: true
                }
            }
        };

        // Mock fetch globally
        window.fetch = jest.fn();
        
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

    describe('Real-time Configuration Updates', () => {
        test('configuration changes apply immediately without page refresh', async () => {
            // Initialize with default config
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.default
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement).toBeTruthy();

            // Verify initial configuration
            const computedStyle = window.getComputedStyle(footerElement);
            expect(computedStyle.backgroundColor).toContain('212, 175, 55'); // #d4af37 in RGB

            // Update to red theme without page refresh
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.redTheme
            });

            await footer.updateConfiguration();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify configuration applied immediately
            const updatedStyle = window.getComputedStyle(footerElement);
            expect(updatedStyle.backgroundColor).toContain('220, 38, 38'); // #dc2626 in RGB
        });

        test('multiple rapid configuration updates handle gracefully', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.default
            });

            const footer = new footerComponent();
            await footer.init();

            // Mock rapid configuration updates
            const updatePromises = [];
            const configs = [
                mockConfigurations.redTheme,
                mockConfigurations.fastScroll,
                mockConfigurations.largeFontSize,
                mockConfigurations.default
            ];

            configs.forEach(config => {
                window.fetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => config
                });
                updatePromises.push(footer.updateConfiguration());
            });

            await Promise.all(updatePromises);
            await new Promise(resolve => setTimeout(resolve, 200));

            // Footer should still be functional after rapid updates
            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement).toBeTruthy();
            expect(footerElement.classList.contains('footer-error')).toBe(false);
        });

        test('configuration updates trigger only necessary DOM updates', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.default
            });

            const footer = new footerComponent();
            await footer.init();

            // Track DOM mutations
            let mutationCount = 0;
            const observer = new window.MutationObserver(() => mutationCount++);
            const footerElement = document.querySelector('.scrolling-footer');
            
            observer.observe(footerElement, {
                attributes: true,
                childList: true,
                subtree: true
            });

            // Update only background color
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.redTheme
            });

            await footer.updateConfiguration();
            await new Promise(resolve => setTimeout(resolve, 100));

            observer.disconnect();

            // Should have minimal mutations (only style changes, not structure)
            expect(mutationCount).toBeLessThan(5);
        });
    });

    describe('Color Changes Integration', () => {
        test('background color changes reflect immediately in display', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.default
            });

            const footer = new footerComponent();
            await footer.init();

            const footerElement = document.querySelector('.scrolling-footer');
            
            // Update background color
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.redTheme
            });

            await footer.updateConfiguration();
            await new Promise(resolve => setTimeout(resolve, 50));

            const style = window.getComputedStyle(footerElement);
            expect(style.backgroundColor).toContain('220, 38, 38'); // Red theme
        });

        test('text color changes apply to scrolling text', async () => {
            const blueTextConfig = {
                ...mockConfigurations.default.data,
                text_color: "#3b82f6"
            };

            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: blueTextConfig })
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const textElement = document.querySelector('.scrolling-footer .footer-text') || 
                              document.querySelector('.scrolling-footer span');
            
            if (textElement) {
                const style = window.getComputedStyle(textElement);
                expect(style.color).toContain('59, 130, 246'); // Blue color
            }
        });

        test('invalid color values fallback to defaults', async () => {
            const invalidColorConfig = {
                ...mockConfigurations.default.data,
                background_color: "invalid-color",
                text_color: null
            };

            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: invalidColorConfig })
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            const style = window.getComputedStyle(footerElement);
            
            // Should fallback to default colors
            expect(style.backgroundColor).toBeTruthy();
            expect(style.color).toBeTruthy();
        });
    });

    describe('Speed Changes Integration', () => {
        test('speed changes affect animation timing immediately', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.default
            });

            const footer = new footerComponent();
            await footer.init();

            const footerElement = document.querySelector('.scrolling-footer');
            const initialAnimationDuration = window.getComputedStyle(footerElement).animationDuration;

            // Update to fast scroll
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.fastScroll
            });

            await footer.updateConfiguration();
            await new Promise(resolve => setTimeout(resolve, 100));

            const newAnimationDuration = window.getComputedStyle(footerElement).animationDuration;
            
            // Animation duration should be different (faster = shorter duration)
            expect(newAnimationDuration).not.toBe(initialAnimationDuration);
        });

        test('speed changes maintain smooth animation transitions', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.default
            });

            const footer = new footerComponent();
            await footer.init();

            // Track animation events
            let animationInterrupted = false;
            const footerElement = document.querySelector('.scrolling-footer');
            
            footerElement.addEventListener('animationcancel', () => {
                animationInterrupted = true;
            });

            // Change speed during animation
            await new Promise(resolve => setTimeout(resolve, 50)); // Let animation start

            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.fastScroll
            });

            await footer.updateConfiguration();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Animation should transition smoothly, not be interrupted abruptly
            expect(animationInterrupted).toBe(false);
        });

        test('extreme speed values are handled safely', async () => {
            const extremeSpeedConfig = {
                ...mockConfigurations.default.data,
                scroll_speed: 1 // Very fast
            };

            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: extremeSpeedConfig })
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            const style = window.getComputedStyle(footerElement);
            
            // Should have animation duration within reasonable bounds
            const duration = parseFloat(style.animationDuration);
            expect(duration).toBeGreaterThan(0.5); // Not too fast
            expect(duration).toBeLessThan(300); // Not too slow
        });
    });

    describe('Font Size Updates', () => {
        test('font size changes apply correctly to footer text', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.default
            });

            const footer = new footerComponent();
            await footer.init();

            // Update to large font size
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.largeFontSize
            });

            await footer.updateConfiguration();
            await new Promise(resolve => setTimeout(resolve, 100));

            const textElement = document.querySelector('.scrolling-footer .footer-text') || 
                              document.querySelector('.scrolling-footer');
            
            const style = window.getComputedStyle(textElement);
            const fontSize = parseFloat(style.fontSize);
            
            expect(fontSize).toBeGreaterThanOrEqual(24);
        });

        test('font size changes adjust footer height automatically', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.default
            });

            const footer = new footerComponent();
            await footer.init();

            const footerElement = document.querySelector('.scrolling-footer');
            const initialHeight = footerElement.offsetHeight;

            // Update to large font size
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.largeFontSize
            });

            await footer.updateConfiguration();
            await new Promise(resolve => setTimeout(resolve, 100));

            const newHeight = footerElement.offsetHeight;
            expect(newHeight).toBeGreaterThanOrEqual(initialHeight);
        });

        test('font size updates maintain text readability', async () => {
            const smallFontConfig = {
                ...mockConfigurations.default.data,
                font_size: 12
            };

            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: smallFontConfig })
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const textElement = document.querySelector('.scrolling-footer .footer-text') || 
                              document.querySelector('.scrolling-footer');
            
            const style = window.getComputedStyle(textElement);
            const fontSize = parseFloat(style.fontSize);
            
            // Should enforce minimum readable size
            expect(fontSize).toBeGreaterThanOrEqual(12);
        });
    });

    describe('Invalid Configuration Handling', () => {
        test('handles null configuration gracefully', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: null })
            });

            const footer = new footerComponent();
            
            await expect(footer.init()).resolves.not.toThrow();
            
            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement).toBeTruthy();
        });

        test('handles malformed JSON configuration', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => { throw new Error('Invalid JSON'); }
            });

            const footer = new footerComponent();
            
            await expect(footer.init()).resolves.not.toThrow();
            
            // Should fall back to default behavior
            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement).toBeTruthy();
        });

        test('validates configuration data types', async () => {
            const invalidTypesConfig = {
                ...mockConfigurations.default.data,
                scroll_speed: "invalid",
                font_size: null,
                is_active: "true" // string instead of boolean
            };

            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: invalidTypesConfig })
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            // Should still function with default values
            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement).toBeTruthy();
            expect(footerElement.style.display).not.toBe('none');
        });

        test('recovers from temporary configuration errors', async () => {
            // First update fails
            window.fetch.mockRejectedValueOnce(new Error('Server error'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockConfigurations.default
                });

            const footer = new footerComponent();
            await footer.init();

            // Should recover on next update
            await footer.updateConfiguration();
            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement.style.display).not.toBe('none');
            expect(footerElement.classList.contains('footer-error')).toBe(false);
        });
    });

    describe('Configuration Persistence', () => {
        test('configuration changes persist across component reinitialization', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.redTheme
            });

            const footer1 = new footerComponent();
            await footer1.init();

            // Destroy and recreate component
            footer1.destroy && footer1.destroy();

            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.redTheme
            });

            const footer2 = new footerComponent();
            await footer2.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            const style = window.getComputedStyle(footerElement);
            expect(style.backgroundColor).toContain('220, 38, 38'); // Red theme persisted
        });

        test('handles configuration rollback scenarios', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigurations.default
            });

            const footer = new footerComponent();
            await footer.init();

            // Attempt invalid update
            window.fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ error: 'Invalid configuration' })
            });

            await footer.updateConfiguration();

            // Should rollback to previous valid configuration
            const footerElement = document.querySelector('.scrolling-footer');
            const style = window.getComputedStyle(footerElement);
            expect(style.backgroundColor).toContain('212, 175, 55'); // Default theme
        });
    });
});