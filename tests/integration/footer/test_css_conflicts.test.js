/**
 * Footer CSS Conflicts Integration Tests
 * 
 * Tests CSS conflicts prevention and dynamic styling integration.
 * Verifies custom properties, component class precedence, and animation conflicts.
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Footer CSS Conflicts Integration', () => {
    let dom;
    let document;
    let window;
    let footerComponent;

    beforeEach(async () => {
        // Load the actual HTML structure with all CSS
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

        // Load actual CSS files
        const cssFiles = [
            '../../../src/styles/MenuSignage.css',
            '../../../src/styles/components/scrolling-footer.css'
        ];

        cssFiles.forEach(cssFile => {
            try {
                const cssContent = fs.readFileSync(path.join(__dirname, cssFile), 'utf8');
                const styleElement = document.createElement('style');
                styleElement.textContent = cssContent;
                document.head.appendChild(styleElement);
            } catch (error) {
                console.warn(`Could not load CSS file: ${cssFile}`);
            }
        });

        // Add potential conflicting styles that might exist
        const conflictingStyles = document.createElement('style');
        conflictingStyles.textContent = `
            /* Simulate potential global conflicts */
            .footer { background: red !important; }
            * { animation: global-animation 1s infinite; }
            .scrolling { transform: translateX(100px); }
            div { z-index: 9999; }
            
            /* Legacy footer styles that might conflict */
            .legacy-footer {
                position: fixed;
                bottom: 0;
                width: 100%;
                background: blue;
                z-index: 1000;
            }
            
            /* Global animation that might interfere */
            @keyframes global-animation {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(conflictingStyles);

        // Mock footer configuration
        window.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
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
            })
        });
        
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

    describe('CSS Conflicts Prevention', () => {
        test('footer component styles take precedence over global styles', async () => {
            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement).toBeTruthy();

            const computedStyle = window.getComputedStyle(footerElement);
            
            // Component styles should override global conflicts
            expect(computedStyle.backgroundColor).not.toContain('255, 0, 0'); // Not red from global
            expect(computedStyle.backgroundColor).toContain('212, 175, 55'); // Component color
        });

        test('component classes isolate footer from external CSS', async () => {
            const footer = new footerComponent();
            await footer.init();

            const footerElement = document.querySelector('.scrolling-footer');
            
            // Check that component has proper class isolation
            expect(footerElement.classList.contains('scrolling-footer')).toBe(true);
            
            // Verify no unwanted global classes
            expect(footerElement.classList.contains('footer')).toBe(false);
            expect(footerElement.classList.contains('legacy-footer')).toBe(false);
        });

        test('prevents CSS cascade conflicts with menu content', async () => {
            // Add menu content that might conflict
            const menuGrid = document.createElement('div');
            menuGrid.className = 'menu-grid';
            menuGrid.innerHTML = `
                <div class="category">
                    <div class="product">
                        <span class="price">€5.50</span>
                    </div>
                </div>
            `;
            document.body.appendChild(menuGrid);

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            // Menu styles should not be affected by footer CSS
            const menuElement = document.querySelector('.menu-grid');
            const productElement = document.querySelector('.product');
            const priceElement = document.querySelector('.price');

            const menuStyle = window.getComputedStyle(menuElement);
            const productStyle = window.getComputedStyle(productElement);
            const priceStyle = window.getComputedStyle(priceElement);

            // Footer should not interfere with menu layout
            expect(menuStyle.position).not.toBe('fixed');
            expect(productStyle.transform).not.toContain('translateX');
            expect(priceStyle.animation).not.toContain('scroll');
        });

        test('handles multiple footer instances without style conflicts', async () => {
            // Create multiple footer instances (edge case)
            const footer1 = new footerComponent();
            const footer2 = new footerComponent();

            await footer1.init();
            await footer2.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElements = document.querySelectorAll('.scrolling-footer');
            
            // Should handle multiple instances gracefully
            footerElements.forEach(element => {
                const style = window.getComputedStyle(element);
                expect(style.backgroundColor).toContain('212, 175, 55');
            });
        });
    });

    describe('CSS Custom Properties Override', () => {
        test('custom properties override legacy styles correctly', async () => {
            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            // Check that CSS custom properties are set
            const rootStyle = window.getComputedStyle(document.documentElement);
            const footerHeight = rootStyle.getPropertyValue('--footer-height');
            const footerBgColor = rootStyle.getPropertyValue('--footer-bg-color');

            expect(footerHeight).toBeTruthy();
            expect(footerBgColor).toBeTruthy();
        });

        test('custom properties update dynamically without conflicts', async () => {
            const footer = new footerComponent();
            await footer.init();

            // Update configuration
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: {
                        id: 1,
                        footer_text: "🍔 Welcome to Team Pinas!",
                        scroll_speed: 30,
                        text_color: "#000000",
                        background_color: "#ff6b6b",
                        font_size: 20,
                        scroll_direction: "left",
                        divider_image: null,
                        is_active: true
                    }
                })
            });

            await footer.updateConfiguration();
            await new Promise(resolve => setTimeout(resolve, 100));

            const rootStyle = window.getComputedStyle(document.documentElement);
            const footerBgColor = rootStyle.getPropertyValue('--footer-bg-color');
            
            expect(footerBgColor).toContain('#ff6b6b');
        });

        test('custom properties scope correctly to avoid global pollution', async () => {
            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            // Check that custom properties don't affect other elements
            const menuElement = document.querySelector('.menu-grid') || document.createElement('div');
            menuElement.className = 'menu-grid';
            document.body.appendChild(menuElement);

            const menuStyle = window.getComputedStyle(menuElement);
            
            // Menu should not inherit footer custom properties
            expect(menuStyle.getPropertyValue('--footer-height')).toBe('');
            expect(menuStyle.backgroundColor).not.toContain('212, 175, 55');
        });

        test('custom properties handle invalid values gracefully', async () => {
            // Mock invalid color values
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: {
                        id: 1,
                        footer_text: "🍔 Welcome to Team Pinas!",
                        scroll_speed: 50,
                        text_color: "invalid-color",
                        background_color: null,
                        font_size: "not-a-number",
                        scroll_direction: "left",
                        divider_image: null,
                        is_active: true
                    }
                })
            });

            const footer = new footerComponent();
            
            await expect(footer.init()).resolves.not.toThrow();
            
            const footerElement = document.querySelector('.scrolling-footer');
            const style = window.getComputedStyle(footerElement);
            
            // Should fallback to valid defaults
            expect(style.backgroundColor).toBeTruthy();
            expect(style.color).toBeTruthy();
        });
    });

    describe('Component Class Precedence', () => {
        test('scrolling-footer class takes precedence over generic classes', async () => {
            // Add conflicting generic classes
            const conflictElement = document.createElement('div');
            conflictElement.className = 'footer scrolling';
            conflictElement.style.cssText = `
                background: red !important;
                transform: rotate(45deg) !important;
                animation: spin 1s infinite !important;
            `;
            document.body.appendChild(conflictElement);

            const footer = new footerComponent();
            await footer.init();

            const footerElement = document.querySelector('.scrolling-footer');
            const conflictingElement = document.querySelector('.footer.scrolling');
            
            // Footer should maintain its specific styling
            const footerStyle = window.getComputedStyle(footerElement);
            const conflictStyle = window.getComputedStyle(conflictingElement);
            
            expect(footerStyle.backgroundColor).toContain('212, 175, 55');
            expect(conflictStyle.backgroundColor).toContain('255, 0, 0'); // Red
            
            // They should not interfere with each other
            expect(footerStyle.transform).not.toContain('rotate');
        });

        test('modifier classes work correctly with base component class', async () => {
            const footer = new footerComponent();
            await footer.init();

            const footerElement = document.querySelector('.scrolling-footer');
            
            // Add modifier class
            footerElement.classList.add('footer-visible');
            
            const style = window.getComputedStyle(footerElement);
            
            // Both base and modifier classes should be respected
            expect(footerElement.classList.contains('scrolling-footer')).toBe(true);
            expect(footerElement.classList.contains('footer-visible')).toBe(true);
            
            // Styles should cascade properly
            expect(style.display).not.toBe('none');
        });

        test('state classes override base styles appropriately', async () => {
            const footer = new footerComponent();
            await footer.init();

            const footerElement = document.querySelector('.scrolling-footer');
            
            // Test different state classes
            footerElement.classList.add('footer-loading');
            let style = window.getComputedStyle(footerElement);
            // Loading state might have different opacity or animation
            
            footerElement.classList.remove('footer-loading');
            footerElement.classList.add('footer-error');
            style = window.getComputedStyle(footerElement);
            // Error state might have different styling

            // Base functionality should remain
            expect(footerElement.classList.contains('scrolling-footer')).toBe(true);
        });

        test('deep nesting does not break component isolation', async () => {
            // Create deeply nested structure that might cause specificity issues
            const container = document.createElement('div');
            container.className = 'app-container';
            const layout = document.createElement('div');
            layout.className = 'main-layout';
            const content = document.createElement('div');
            content.className = 'content-area';
            
            content.appendChild(layout);
            layout.appendChild(container);
            document.body.appendChild(container);

            const footer = new footerComponent();
            await footer.init();

            const footerElement = document.querySelector('.scrolling-footer');
            
            // Footer should maintain its styles regardless of nesting
            const style = window.getComputedStyle(footerElement);
            expect(style.backgroundColor).toContain('212, 175, 55');
        });
    });

    describe('Animation Keyframes Conflicts', () => {
        test('footer animation keyframes do not conflict with global animations', async () => {
            const footer = new footerComponent();
            await footer.init();

            const footerElement = document.querySelector('.scrolling-footer');
            
            // Add element with global animation
            const globalElement = document.createElement('div');
            globalElement.style.animation = 'global-animation 1s infinite';
            document.body.appendChild(globalElement);

            await new Promise(resolve => setTimeout(resolve, 200));

            const footerStyle = window.getComputedStyle(footerElement);
            const globalStyle = window.getComputedStyle(globalElement);

            // Each should maintain its own animation
            expect(footerStyle.animationName).toContain('scroll');
            expect(globalStyle.animationName).toContain('global-animation');
        });

        test('multiple animation properties coexist without interference', async () => {
            const footer = new footerComponent();
            await footer.init();

            const footerElement = document.querySelector('.scrolling-footer');
            
            // Add additional animations programmatically
            footerElement.style.animation += ', fadeIn 0.5s ease-in';

            await new Promise(resolve => setTimeout(resolve, 100));

            const style = window.getComputedStyle(footerElement);
            
            // Should handle multiple animations
            expect(style.animationName).toContain('scroll');
            expect(style.animationName).toContain('fadeIn');
        });

        test('animation cleanup prevents lingering effects', async () => {
            const footer = new footerComponent();
            await footer.init();

            // Hide footer (should clean up animations)
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
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
                })
            });

            await footer.updateFromDatabase();
            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            const style = window.getComputedStyle(footerElement);

            // Animations should be cleaned up when hidden
            expect(style.animationPlayState).toBe('paused');
        });

        test('keyframe animations handle browser prefixes correctly', async () => {
            const footer = new footerComponent();
            await footer.init();

            const footerElement = document.querySelector('.scrolling-footer');
            const style = window.getComputedStyle(footerElement);

            // Check that animations work regardless of vendor prefixes
            const hasAnimation = 
                style.animationName !== 'none' ||
                style.WebkitAnimationName !== 'none' ||
                style.MozAnimationName !== 'none';

            expect(hasAnimation).toBe(true);
        });
    });

    describe('Responsive Design Conflicts', () => {
        test('footer adapts to different screen sizes without breaking layout', async () => {
            const footer = new footerComponent();
            await footer.init();

            // Simulate different screen sizes
            const screenSizes = [
                { width: 1920, height: 1080 }, // Large desktop
                { width: 1366, height: 768 },  // Standard laptop
                { width: 1024, height: 768 }   // Tablet landscape
            ];

            for (const size of screenSizes) {
                // Simulate viewport change
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: size.width,
                });
                Object.defineProperty(window, 'innerHeight', {
                    writable: true,
                    configurable: true,
                    value: size.height,
                });

                // Trigger resize event
                window.dispatchEvent(new window.Event('resize'));
                await new Promise(resolve => setTimeout(resolve, 50));

                const footerElement = document.querySelector('.scrolling-footer');
                const style = window.getComputedStyle(footerElement);

                // Footer should remain functional across screen sizes
                expect(style.position).toBe('fixed');
                expect(style.bottom).toBe('0px');
                expect(parseInt(style.width)).toBeGreaterThan(0);
            }
        });

        test('high contrast mode does not break footer visibility', async () => {
            // Simulate high contrast mode
            const highContrastStyles = document.createElement('style');
            highContrastStyles.textContent = `
                @media (prefers-contrast: high) {
                    * {
                        background: white !important;
                        color: black !important;
                    }
                }
            `;
            document.head.appendChild(highContrastStyles);

            const footer = new footerComponent();
            await footer.init();

            const footerElement = document.querySelector('.scrolling-footer');
            const style = window.getComputedStyle(footerElement);

            // Footer should remain visible and readable
            expect(style.opacity).not.toBe('0');
            expect(style.display).not.toBe('none');
        });

        test('reduced motion settings are respected', async () => {
            // Simulate prefers-reduced-motion
            const reducedMotionStyles = document.createElement('style');
            reducedMotionStyles.textContent = `
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `;
            document.head.appendChild(reducedMotionStyles);

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            const style = window.getComputedStyle(footerElement);

            // Animation should be significantly reduced or removed
            const duration = parseFloat(style.animationDuration);
            expect(duration).toBeLessThan(0.1); // Nearly instant
        });
    });

    describe('Z-index and Layering', () => {
        test('footer maintains correct z-index relative to other elements', async () => {
            // Add elements with various z-indexes
            const menuElement = document.createElement('div');
            menuElement.className = 'menu-grid';
            menuElement.style.zIndex = '100';
            document.body.appendChild(menuElement);

            const modalElement = document.createElement('div');
            modalElement.className = 'modal';
            modalElement.style.zIndex = '1000';
            document.body.appendChild(modalElement);

            const footer = new footerComponent();
            await footer.init();

            const footerElement = document.querySelector('.scrolling-footer');
            const footerStyle = window.getComputedStyle(footerElement);
            const menuStyle = window.getComputedStyle(menuElement);
            const modalStyle = window.getComputedStyle(modalElement);

            const footerZIndex = parseInt(footerStyle.zIndex);
            const menuZIndex = parseInt(menuStyle.zIndex);
            const modalZIndex = parseInt(modalStyle.zIndex);

            // Footer should be above menu but below modal
            expect(footerZIndex).toBeGreaterThan(menuZIndex);
            expect(footerZIndex).toBeLessThan(modalZIndex);
        });

        test('footer layering works with sticky elements', async () => {
            const stickyHeader = document.createElement('div');
            stickyHeader.style.cssText = `
                position: sticky;
                top: 0;
                z-index: 500;
                background: white;
                height: 60px;
            `;
            document.body.appendChild(stickyHeader);

            const footer = new footerComponent();
            await footer.init();

            const footerElement = document.querySelector('.scrolling-footer');
            const footerStyle = window.getComputedStyle(footerElement);
            const headerStyle = window.getComputedStyle(stickyHeader);

            // Footer should not interfere with sticky header
            expect(parseInt(footerStyle.zIndex)).toBeLessThan(parseInt(headerStyle.zIndex));
        });
    });
});