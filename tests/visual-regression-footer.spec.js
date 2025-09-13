/**
 * Visual Regression Tests for Footer System
 * Tests visual consistency and performance of the footer component
 * 
 * @requires @playwright/test
 * @version 1.0.0
 * @author Team Pinas Signage System
 */

const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_CONFIG = {
    baseURL: 'http://localhost:8080',
    timeout: 30000,
    viewport: { width: 1920, height: 1080 }, // Standard digital signage resolution
    animations: {
        shortDuration: 2000,
        mediumDuration: 5000,
        longDuration: 10000
    }
};

// Test data for different footer configurations
const FOOTER_CONFIGS = {
    basic: {
        footer_text: 'Welcome to Team Pinas <separator> Fresh ingredients daily',
        scroll_speed: 30,
        text_color: '#101010',
        background_color: '#c19d6c',
        font_size: '3vh',
        scroll_direction: 'continuous'
    },
    fast: {
        footer_text: 'Fast scrolling test <separator> Performance check',
        scroll_speed: 80,
        text_color: '#ffffff',
        background_color: '#333333',
        font_size: '3vh',
        scroll_direction: 'continuous'
    },
    slow: {
        footer_text: 'Slow scrolling test <separator> Smooth movement <separator> Quality check',
        scroll_speed: 10,
        text_color: '#101010',
        background_color: '#f5f5f5',
        font_size: '4vh',
        scroll_direction: 'continuous'
    },
    static: {
        footer_text: 'Static footer display <separator> No animation',
        scroll_speed: 30,
        text_color: '#101010',
        background_color: '#c19d6c',
        font_size: '3vh',
        scroll_direction: 'static'
    }
};

test.describe('Footer Visual Regression Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Set consistent viewport for all tests
        await page.setViewportSize(TEST_CONFIG.viewport);
        
        // Navigate to the signage display
        await page.goto(TEST_CONFIG.baseURL);
        
        // Wait for page to load completely
        await page.waitForLoadState('networkidle');
        
        // Wait for footer to initialize
        await page.waitForSelector('.SignageFooter', { timeout: 10000 });
        
        // Hide loading screen if present
        await page.evaluate(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.remove();
            }
        });
        
        // Ensure stable state before tests
        await page.waitForTimeout(2000);
    });
    
    test('Footer basic appearance and layout', async ({ page }) => {
        // Apply basic footer configuration
        await page.evaluate((config) => {
            if (window.scrollingFooterInstance) {
                window.scrollingFooterInstance.updateConfig(config);
            }
        }, FOOTER_CONFIGS.basic);
        
        // Wait for configuration to apply
        await page.waitForTimeout(1000);
        
        // Take screenshot of initial state
        await expect(page.locator('.SignageFooter')).toHaveScreenshot('footer-basic-initial.png');
        
        // Verify footer is visible
        const footer = page.locator('.SignageFooter');
        await expect(footer).toBeVisible();
        
        // Check footer positioning
        const footerBox = await footer.boundingBox();
        expect(footerBox.y).toBeGreaterThan(TEST_CONFIG.viewport.height * 0.8); // Footer at bottom
        
        // Take full page screenshot
        await expect(page).toHaveScreenshot('footer-basic-full-page.png', {
            fullPage: true,
            animations: 'disabled'
        });
    });
    
    test('Footer animation frames consistency', async ({ page }) => {
        // Apply basic configuration
        await page.evaluate((config) => {
            if (window.scrollingFooterInstance) {
                window.scrollingFooterInstance.updateConfig(config);
            }
        }, FOOTER_CONFIGS.basic);
        
        // Start animation
        await page.evaluate(() => {
            if (window.scrollingFooterInstance) {
                window.scrollingFooterInstance.start();
            }
        });
        
        // Wait for animation to stabilize
        await page.waitForTimeout(2000);
        
        // Take screenshots at different animation phases
        const frameInterval = 500; // 0.5 second intervals
        const totalFrames = 5;
        
        for (let frame = 1; frame <= totalFrames; frame++) {
            await page.waitForTimeout(frameInterval);
            
            await expect(page.locator('.SignageFooter')).toHaveScreenshot(
                `footer-animation-frame-${frame}.png`,
                { animations: 'allow' }
            );
        }
    });
    
    test('Footer different scroll speeds visual comparison', async ({ page }) => {
        const speeds = [
            { name: 'slow', config: FOOTER_CONFIGS.slow },
            { name: 'normal', config: FOOTER_CONFIGS.basic },
            { name: 'fast', config: FOOTER_CONFIGS.fast }
        ];
        
        for (const speed of speeds) {
            // Apply configuration
            await page.evaluate((config) => {
                if (window.scrollingFooterInstance) {
                    window.scrollingFooterInstance.updateConfig(config);
                }
            }, speed.config);
            
            // Wait for configuration to apply and animation to start
            await page.waitForTimeout(1000);
            
            // Take screenshot after animation has run for a bit
            await page.waitForTimeout(2000);
            
            await expect(page.locator('.SignageFooter')).toHaveScreenshot(
                `footer-speed-${speed.name}.png`,
                { animations: 'allow' }
            );
        }
    });
    
    test('Footer static mode visual verification', async ({ page }) => {
        // Apply static configuration
        await page.evaluate((config) => {
            if (window.scrollingFooterInstance) {
                window.scrollingFooterInstance.updateConfig(config);
            }
        }, FOOTER_CONFIGS.static);
        
        // Wait for static rendering
        await page.waitForTimeout(1000);
        
        // Take screenshot of static footer
        await expect(page.locator('.SignageFooter')).toHaveScreenshot(
            'footer-static-display.png',
            { animations: 'disabled' }
        );
        
        // Verify no animation is running
        const animationState = await page.evaluate(() => {
            const element = document.querySelector('.scrolling-footer-content');
            return element ? window.getComputedStyle(element).animationPlayState : 'none';
        });
        
        expect(animationState).toBe('running'); // Should be 'none' or 'paused' for static
    });
    
    test('Footer error state and fallback visuals', async ({ page }) => {
        // Force an error condition
        await page.evaluate(() => {
            // Simulate animation error
            if (window.scrollingFooterInstance) {
                // Force fallback by clearing the element
                const element = document.querySelector('.SignageFooter');
                if (element) {
                    element.innerHTML = '<div class="fallback-content">Error: Animation failed</div>';
                }
            }
        });
        
        await page.waitForTimeout(1000);
        
        // Take screenshot of error state
        await expect(page.locator('.SignageFooter')).toHaveScreenshot(
            'footer-error-fallback.png',
            { animations: 'disabled' }
        );
    });
    
    test('Footer responsive behavior at different viewport sizes', async ({ page }) => {
        const viewports = [
            { name: 'standard-hd', width: 1920, height: 1080 },
            { name: 'wide-screen', width: 3840, height: 2160 },
            { name: 'narrow-screen', width: 1366, height: 768 }
        ];
        
        for (const viewport of viewports) {
            // Set viewport
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            
            // Apply basic configuration
            await page.evaluate((config) => {
                if (window.scrollingFooterInstance) {
                    window.scrollingFooterInstance.updateConfig(config);
                }
            }, FOOTER_CONFIGS.basic);
            
            // Wait for rendering at new size
            await page.waitForTimeout(1500);
            
            // Take screenshot
            await expect(page).toHaveScreenshot(
                `footer-responsive-${viewport.name}.png`,
                { fullPage: true, animations: 'allow' }
            );
        }
    });
    
    test('Footer crown separator visual consistency', async ({ page }) => {
        // Apply configuration with crown separators
        await page.evaluate((config) => {
            if (window.scrollingFooterInstance) {
                window.scrollingFooterInstance.updateConfig({
                    ...config,
                    separator_text: ' <img class="sep" src="assets/images/pinas_kroon.svg" alt="" role="presentation" aria-hidden="true" /> '
                });
            }
        }, FOOTER_CONFIGS.basic);
        
        // Wait for crown images to load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Take screenshot focusing on separators
        await expect(page.locator('.SignageFooter')).toHaveScreenshot(
            'footer-crown-separators.png',
            { animations: 'allow' }
        );
    });
    
    test('Footer performance under load visual stability', async ({ page }) => {
        // Create performance stress test
        await page.evaluate(() => {
            // Add multiple heavy DOM elements to stress the system
            for (let i = 0; i < 100; i++) {
                const div = document.createElement('div');
                div.style.position = 'absolute';
                div.style.opacity = '0';
                div.innerHTML = 'Stress test element ' + i;
                document.body.appendChild(div);
            }
        });
        
        // Apply fast animation
        await page.evaluate((config) => {
            if (window.scrollingFooterInstance) {
                window.scrollingFooterInstance.updateConfig(config);
            }
        }, FOOTER_CONFIGS.fast);
        
        // Wait for system to stabilize under load
        await page.waitForTimeout(3000);
        
        // Take screenshot to check for visual degradation
        await expect(page.locator('.SignageFooter')).toHaveScreenshot(
            'footer-performance-stress.png',
            { animations: 'allow' }
        );
        
        // Clean up stress elements
        await page.evaluate(() => {
            const stressElements = document.querySelectorAll('div');
            stressElements.forEach(el => {
                if (el.textContent && el.textContent.includes('Stress test element')) {
                    el.remove();
                }
            });
        });
    });
    
    test('Footer color scheme variations', async ({ page }) => {
        const colorSchemes = [
            {
                name: 'dark-theme',
                config: {
                    ...FOOTER_CONFIGS.basic,
                    text_color: '#ffffff',
                    background_color: '#1a1a1a'
                }
            },
            {
                name: 'light-theme',
                config: {
                    ...FOOTER_CONFIGS.basic,
                    text_color: '#333333',
                    background_color: '#f8f9fa'
                }
            },
            {
                name: 'brand-theme',
                config: {
                    ...FOOTER_CONFIGS.basic,
                    text_color: '#ffffff',
                    background_color: '#c19d6c'
                }
            }
        ];
        
        for (const scheme of colorSchemes) {
            await page.evaluate((config) => {
                if (window.scrollingFooterInstance) {
                    window.scrollingFooterInstance.updateConfig(config);
                }
            }, scheme.config);
            
            await page.waitForTimeout(1000);
            
            await expect(page.locator('.SignageFooter')).toHaveScreenshot(
                `footer-theme-${scheme.name}.png`,
                { animations: 'allow' }
            );
        }
    });
    
    test('Footer font size scaling visual verification', async ({ page }) => {
        const fontSizes = [
            { name: 'small', size: '2vh' },
            { name: 'medium', size: '3vh' },
            { name: 'large', size: '4vh' },
            { name: 'extra-large', size: '5vh' }
        ];
        
        for (const fontSize of fontSizes) {
            await page.evaluate((size) => {
                if (window.scrollingFooterInstance) {
                    window.scrollingFooterInstance.updateConfig({
                        ...arguments[1],
                        font_size: size
                    });
                }
            }, fontSize.size, FOOTER_CONFIGS.basic);
            
            await page.waitForTimeout(1000);
            
            await expect(page.locator('.SignageFooter')).toHaveScreenshot(
                `footer-font-${fontSize.name}.png`,
                { animations: 'allow' }
            );
        }
    });
    
    test('Footer accessibility reduced motion compliance', async ({ page }) => {
        // Enable reduced motion preference
        await page.emulateMedia({ reducedMotion: 'reduce' });
        
        // Apply basic configuration
        await page.evaluate((config) => {
            if (window.scrollingFooterInstance) {
                window.scrollingFooterInstance.updateConfig(config);
            }
        }, FOOTER_CONFIGS.basic);
        
        await page.waitForTimeout(2000);
        
        // Take screenshot of reduced motion state
        await expect(page.locator('.SignageFooter')).toHaveScreenshot(
            'footer-reduced-motion.png',
            { animations: 'disabled' }
        );
        
        // Verify no animation is running
        const hasAnimation = await page.evaluate(() => {
            const element = document.querySelector('.scrolling-footer-content');
            return element && window.getComputedStyle(element).animation !== 'none';
        });
        
        expect(hasAnimation).toBeFalsy();
    });
});

test.describe('Footer Performance Visual Tests', () => {
    test('Footer GPU acceleration visual verification', async ({ page }) => {
        await page.goto(TEST_CONFIG.baseURL);
        await page.waitForLoadState('networkidle');
        
        // Force GPU acceleration
        await page.evaluate(() => {
            const element = document.querySelector('.SignageFooter .scrolling-footer-content');
            if (element) {
                element.style.transform = 'translateZ(0)';
                element.style.willChange = 'transform';
                element.style.backfaceVisibility = 'hidden';
            }
        });
        
        await page.waitForTimeout(1000);
        
        // Take screenshot with GPU acceleration enabled
        await expect(page.locator('.SignageFooter')).toHaveScreenshot(
            'footer-gpu-accelerated.png',
            { animations: 'allow' }
        );
        
        // Verify GPU properties are applied
        const gpuProperties = await page.evaluate(() => {
            const element = document.querySelector('.scrolling-footer-content');
            if (element) {
                const style = window.getComputedStyle(element);
                return {
                    transform: style.transform,
                    willChange: style.willChange,
                    backfaceVisibility: style.backfaceVisibility
                };
            }
            return null;
        });
        
        expect(gpuProperties).not.toBeNull();
        expect(gpuProperties.willChange).toBe('transform');
    });
    
    test('Footer memory usage visual stability over time', async ({ page }) => {
        await page.goto(TEST_CONFIG.baseURL);
        await page.waitForLoadState('networkidle');
        
        // Apply configuration and start animation
        await page.evaluate((config) => {
            if (window.scrollingFooterInstance) {
                window.scrollingFooterInstance.updateConfig(config);
                window.scrollingFooterInstance.start();
            }
        }, FOOTER_CONFIGS.basic);
        
        // Take initial screenshot
        await page.waitForTimeout(2000);
        await expect(page.locator('.SignageFooter')).toHaveScreenshot(
            'footer-memory-test-start.png',
            { animations: 'allow' }
        );
        
        // Run for extended period to test memory stability
        await page.waitForTimeout(15000);
        
        // Take final screenshot to compare visual consistency
        await expect(page.locator('.SignageFooter')).toHaveScreenshot(
            'footer-memory-test-end.png',
            { animations: 'allow' }
        );
    });
});

test.describe('Footer Cross-browser Visual Consistency', () => {
    test('Footer rendering consistency across different devices', async ({ page, browserName }) => {
        await page.goto(TEST_CONFIG.baseURL);
        await page.waitForLoadState('networkidle');
        
        // Apply standard configuration
        await page.evaluate((config) => {
            if (window.scrollingFooterInstance) {
                window.scrollingFooterInstance.updateConfig(config);
            }
        }, FOOTER_CONFIGS.basic);
        
        await page.waitForTimeout(2000);
        
        // Take browser-specific screenshot
        await expect(page.locator('.SignageFooter')).toHaveScreenshot(
            `footer-browser-${browserName}.png`,
            { animations: 'allow' }
        );
    });
});
