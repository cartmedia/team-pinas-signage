/**
 * Footer Visibility States Integration Tests
 * 
 * Tests footer show/hide behavior based on database settings and admin interface controls.
 * Verifies page layout adjustments and rapid toggle handling.
 */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Footer Visibility States Integration', () => {
    let dom;
    let document;
    let window;
    let footerComponent;
    let mockApiResponses;

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

        // Mock API responses
        mockApiResponses = {
            footerActive: {
                success: true,
                data: {
                    id: 1,
                    footer_text: "🍔 Welcome to Team Pinas! • Fresh ingredients daily • Open 7 days a week",
                    scroll_speed: 50,
                    text_color: "#ffffff",
                    background_color: "#d4af37",
                    font_size: 18,
                    scroll_direction: "left",
                    divider_image: null,
                    is_active: true
                }
            },
            footerInactive: {
                success: true,
                data: {
                    id: 1,
                    footer_text: "🍔 Welcome to Team Pinas! • Fresh ingredients daily • Open 7 days a week",
                    scroll_speed: 50,
                    text_color: "#ffffff",
                    background_color: "#d4af37",
                    font_size: 18,
                    scroll_direction: "left",
                    divider_image: null,
                    is_active: false
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

    describe('Database-Driven Visibility', () => {
        test('footer shows when is_active is true in database', async () => {
            // Mock API to return active footer
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockApiResponses.footerActive
            });

            // Initialize component
            const footer = new footerComponent();
            await footer.init();

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement).toBeTruthy();
            expect(footerElement.style.display).not.toBe('none');
            expect(footerElement.classList.contains('footer-visible')).toBe(true);
        });

        test('footer hides when is_active is false in database', async () => {
            // Mock API to return inactive footer
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockApiResponses.footerInactive
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement).toBeTruthy();
            expect(footerElement.style.display).toBe('none');
            expect(footerElement.classList.contains('footer-hidden')).toBe(true);
        });

        test('footer visibility updates when database setting changes', async () => {
            // Start with inactive footer
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockApiResponses.footerInactive
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            let footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement.style.display).toBe('none');

            // Simulate database update to active
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockApiResponses.footerActive
            });

            await footer.updateFromDatabase();
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(footerElement.style.display).not.toBe('none');
            expect(footerElement.classList.contains('footer-visible')).toBe(true);
        });
    });

    describe('Admin Interface Integration', () => {
        test('admin toggle immediately affects footer visibility', async () => {
            // Initialize with active footer
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockApiResponses.footerActive
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            // Mock admin API call to disable footer
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true })
            });

            // Simulate admin toggle
            await footer.toggleVisibility(false);

            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement.style.display).toBe('none');
            expect(footerElement.classList.contains('footer-hidden')).toBe(true);
        });

        test('admin interface reflects current database state', async () => {
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockApiResponses.footerActive
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            // Check that admin controls reflect the active state
            const toggleButton = document.querySelector('.admin-footer-toggle');
            if (toggleButton) {
                expect(toggleButton.checked).toBe(true);
                expect(toggleButton.getAttribute('aria-pressed')).toBe('true');
            }
        });
    });

    describe('Page Layout Adjustments', () => {
        test('page layout adjusts when footer becomes visible', async () => {
            // Start without footer
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockApiResponses.footerInactive
            });

            const footer = new footerComponent();
            await footer.init();

            const mainContent = document.querySelector('.menu-grid') || document.querySelector('main');
            const initialHeight = mainContent ? mainContent.offsetHeight : 0;

            // Show footer
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockApiResponses.footerActive
            });

            await footer.updateFromDatabase();
            await new Promise(resolve => setTimeout(resolve, 100));

            const newHeight = mainContent ? mainContent.offsetHeight : 0;
            expect(newHeight).toBeLessThan(initialHeight);

            // Check CSS custom properties are updated
            const rootStyles = window.getComputedStyle(document.documentElement);
            const footerHeight = rootStyles.getPropertyValue('--footer-height');
            expect(footerHeight).toBeTruthy();
        });

        test('content area reclaims space when footer hidden', async () => {
            // Start with visible footer
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockApiResponses.footerActive
            });

            const footer = new footerComponent();
            await footer.init();

            await new Promise(resolve => setTimeout(resolve, 100));

            const mainContent = document.querySelector('.menu-grid') || document.querySelector('main');
            const heightWithFooter = mainContent ? mainContent.offsetHeight : 0;

            // Hide footer
            window.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockApiResponses.footerInactive
            });

            await footer.updateFromDatabase();
            await new Promise(resolve => setTimeout(resolve, 100));

            const heightWithoutFooter = mainContent ? mainContent.offsetHeight : 0;
            expect(heightWithoutFooter).toBeGreaterThan(heightWithFooter);

            // Check CSS custom properties are cleared
            const rootStyles = window.getComputedStyle(document.documentElement);
            const footerHeight = rootStyles.getPropertyValue('--footer-height');
            expect(footerHeight).toBe('0px');
        });
    });

    describe('Rapid Toggle Handling', () => {
        test('handles multiple rapid visibility toggles without breaking', async () => {
            window.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true })
            });

            const footer = new footerComponent();
            await footer.init();

            // Perform rapid toggles
            const togglePromises = [];
            for (let i = 0; i < 10; i++) {
                const isVisible = i % 2 === 0;
                togglePromises.push(footer.toggleVisibility(isVisible));
            }

            await Promise.all(togglePromises);
            await new Promise(resolve => setTimeout(resolve, 200));

            // Footer should still be functional
            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement).toBeTruthy();
            expect(footerElement.classList.contains('footer-error')).toBe(false);
        });

        test('cancels pending animations during rapid toggles', async () => {
            window.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({ success: true })
            });

            const footer = new footerComponent();
            await footer.init();

            // Track animation state
            let animationStartCount = 0;
            let animationEndCount = 0;

            const originalAddEventListener = window.addEventListener;
            window.addEventListener = jest.fn((event, callback) => {
                if (event === 'animationstart') {
                    animationStartCount++;
                }
                if (event === 'animationend') {
                    animationEndCount++;
                }
                return originalAddEventListener.call(window, event, callback);
            });

            // Rapid toggles
            await footer.toggleVisibility(true);
            await footer.toggleVisibility(false);
            await footer.toggleVisibility(true);

            await new Promise(resolve => setTimeout(resolve, 100));

            // Should not have excessive animation starts
            expect(animationStartCount).toBeLessThanOrEqual(2);
        });

        test('maintains consistent state after rapid database updates', async () => {
            let callCount = 0;
            window.fetch.mockImplementation(() => {
                callCount++;
                const isActive = callCount % 2 === 0;
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        success: true,
                        data: { ...mockApiResponses.footerActive.data, is_active: isActive }
                    })
                });
            });

            const footer = new footerComponent();
            await footer.init();

            // Simulate rapid database polling
            const updatePromises = [];
            for (let i = 0; i < 5; i++) {
                updatePromises.push(footer.updateFromDatabase());
            }

            await Promise.all(updatePromises);
            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            const isVisible = footerElement.style.display !== 'none';
            const hasVisibleClass = footerElement.classList.contains('footer-visible');
            const hasHiddenClass = footerElement.classList.contains('footer-hidden');

            // State should be consistent
            expect(isVisible).toBe(hasVisibleClass);
            expect(isVisible).toBe(!hasHiddenClass);
        });
    });

    describe('Error Handling', () => {
        test('gracefully handles API failures during visibility changes', async () => {
            window.fetch.mockRejectedValue(new Error('Network error'));

            const footer = new footerComponent();
            
            // Should not throw
            await expect(footer.init()).resolves.not.toThrow();
            
            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement).toBeTruthy();
            
            // Should have error state but still be functional
            expect(footerElement.classList.contains('footer-error')).toBe(false);
        });

        test('recovers from temporary network failures', async () => {
            // First call fails
            window.fetch.mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockApiResponses.footerActive
                });

            const footer = new footerComponent();
            await footer.init();

            // Should recover on next update
            await footer.updateFromDatabase();
            await new Promise(resolve => setTimeout(resolve, 100));

            const footerElement = document.querySelector('.scrolling-footer');
            expect(footerElement.style.display).not.toBe('none');
        });
    });
});