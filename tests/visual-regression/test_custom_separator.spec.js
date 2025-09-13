/**
 * Visual Regression Test: Custom Separator Priority
 * Purpose: Verify custom separator_text takes absolute priority
 * 
 * This test validates that custom separators completely override
 * SVG and emoji defaults, ensuring no double separators appear.
 * 
 * CRITICAL: This test MUST FAIL before implementing separator resolution
 */

const { test, expect } = require('@playwright/test');
const testConfig = require('../fixtures/separator-config.json');

test.describe('Visual Regression: Custom Separator Priority', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the signage display
        await page.goto('/');
        
        // Wait for the page to load
        await page.waitForLoadState('networkidle');
    });
    
    test('custom pipe separator should override SVG crown', async ({ page }) => {
        const config = testConfig.test_configurations.custom_separator;
        
        // Mock the footer configuration API to return custom separator config
        await page.route('/.netlify/functions/footer', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(config)
            });
        });
        
        // Reload to apply the configuration
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Wait for footer to load
        await page.waitForSelector('.SignageFooter', { state: 'visible' });
        
        // This test WILL FAIL: Both SVG and custom separators may appear
        const svgSeparators = await page.locator('.scrolling-separator img.sep').count();
        const customSeparators = await page.locator('.scrolling-separator').filter({ hasText: '|' }).count();
        
        // Contract violation: Only custom separators should be present
        expect(svgSeparators).toBe(0); // WILL FAIL if SVG separators exist
        expect(customSeparators).toBeGreaterThan(0); // Custom separators should exist
        
        // Take screenshot for visual comparison
        await page.locator('.SignageFooter').screenshot({
            path: 'tests/visual-regression/output/custom-separator-priority.png'
        });
        
        // Verify no crown emojis are present
        const emojiCrowns = await page.locator('.scrolling-separator').filter({ hasText: '👑' }).count();
        expect(emojiCrowns).toBe(0); // WILL FAIL if emoji fallbacks appear
    });
    
    test('custom star separator should work correctly', async ({ page }) => {
        const config = testConfig.test_configurations.star_emoji_custom;
        
        // Mock the footer configuration API
        await page.route('/.netlify/functions/footer', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(config)
            });
        });
        
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.SignageFooter', { state: 'visible' });
        
        // This test WILL FAIL: Multiple separator types may appear
        const svgSeparators = await page.locator('.scrolling-separator img.sep').count();
        const starSeparators = await page.locator('.scrolling-separator').filter({ hasText: '⭐' }).count();
        
        expect(svgSeparators).toBe(0); // No SVG separators
        expect(starSeparators).toBeGreaterThan(0); // Star separators should exist
        
        // Take screenshot
        await page.locator('.SignageFooter').screenshot({
            path: 'tests/visual-regression/output/custom-star-separator.png'
        });
    });
    
    test('custom separator changes should apply immediately', async ({ page }) => {
        // Start with SVG default configuration
        const svgConfig = testConfig.test_configurations.svg_default;
        
        await page.route('/.netlify/functions/footer', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(svgConfig)
            });
        });
        
        await page.reload();
        await page.waitForSelector('.SignageFooter', { state: 'visible' });
        
        // Verify SVG separators are present initially
        let svgCount = await page.locator('.scrolling-separator img.sep').count();
        expect(svgCount).toBeGreaterThan(0);
        
        // Change to custom separator configuration
        const customConfig = testConfig.test_configurations.custom_separator;
        
        await page.route('/.netlify/functions/footer', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(customConfig)
            });
        });
        
        // Simulate real-time configuration update
        await page.evaluate(() => {
            // Trigger footer configuration update
            if (window.footerInstance && window.footerInstance.updateConfig) {
                window.footerInstance.updateConfig({
                    footer_text: 'Welcome to Team Pinas <separator> Fresh ingredients daily',
                    separator_text: ' | '
                });
            }
        });
        
        // Wait for DOM update
        await page.waitForTimeout(100);
        
        // This test WILL FAIL: SVG separators may still be present during transition
        svgCount = await page.locator('.scrolling-separator img.sep').count();
        const customCount = await page.locator('.scrolling-separator').filter({ hasText: '|' }).count();
        
        expect(svgCount).toBe(0); // SVG should be gone
        expect(customCount).toBeGreaterThan(0); // Custom should be present
        
        // Take screenshot of the change
        await page.locator('.SignageFooter').screenshot({
            path: 'tests/visual-regression/output/custom-separator-transition.png'
        });
    });
});

// Log why these tests are expected to fail
console.log('\n=== VISUAL REGRESSION TEST EXPECTATIONS ===');
console.log('Custom separator tests WILL FAIL because:');
console.log('1. Current implementation may show both SVG and custom separators');
console.log('2. No separator resolution logic exists to enforce priority');
console.log('3. Real-time configuration changes may create temporary double separators');
console.log('4. Component does not implement exclusive separator rendering');
console.log('==========================================\n');