/**
 * Visual Regression Test: Emoji Fallback Separator
 * Purpose: Verify emoji crown fallback when SVG fails to load
 * 
 * This test validates that emoji crown separators appear only when
 * SVG loading fails, ensuring no double separators during fallback.
 * 
 * CRITICAL: This test MUST FAIL before implementing separator resolution
 */

const { test, expect } = require('@playwright/test');
const testConfig = require('../fixtures/separator-config.json');

test.describe('Visual Regression: Emoji Fallback Separator', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });
    
    test('emoji crown should appear when SVG fails to load', async ({ page }) => {
        const config = testConfig.test_configurations.emoji_fallback;
        
        // Mock footer API and simulate SVG failure
        await page.route('/.netlify/functions/footer', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(config)
            });
        });
        
        // Block SVG loading to simulate failure
        await page.route('**/assets/images/pinas_kroon.svg', async route => {
            await route.abort('failed');
        });
        
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.SignageFooter', { state: 'visible' });
        
        // Wait for SVG loading to fail and fallback to trigger
        await page.waitForTimeout(1000);
        
        // This test WILL FAIL: Both SVG attempts and emoji may appear
        const svgSeparators = await page.locator('.scrolling-separator img.sep').count();
        const emojiSeparators = await page.locator('.scrolling-separator').filter({ hasText: '👑' }).count();
        const customSeparators = await page.locator('.scrolling-separator').filter({ hasText: '|' }).count();
        
        // Contract: Only emoji separators should be present when SVG fails
        expect(svgSeparators).toBe(0); // WILL FAIL if broken SVG elements remain
        expect(emojiSeparators).toBeGreaterThan(0); // Emoji fallback should activate
        expect(customSeparators).toBe(0); // No custom separators
        
        // Take screenshot for fallback verification
        await page.locator('.SignageFooter').screenshot({
            path: 'tests/visual-regression/output/emoji-fallback-separator.png'
        });
    });
    
    test('emoji fallback should maintain proper spacing', async ({ page }) => {
        const config = testConfig.test_configurations.emoji_fallback;
        
        await page.route('/.netlify/functions/footer', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(config)
            });
        });
        
        // Block SVG loading
        await page.route('**/assets/images/pinas_kroon.svg', async route => {
            await route.abort('failed');
        });
        
        await page.reload();
        await page.waitForSelector('.SignageFooter', { state: 'visible' });
        await page.waitForTimeout(1000);
        
        // This test WILL FAIL if spacing is inconsistent
        const emojiSeparators = await page.locator('.scrolling-separator').filter({ hasText: '👑' });
        const count = await emojiSeparators.count();
        
        expect(count).toBeGreaterThan(0);
        
        // Check spacing consistency between emoji separators
        const firstEmojiBox = await emojiSeparators.first().boundingBox();
        
        for (let i = 1; i < count; i++) {
            const emojiBox = await emojiSeparators.nth(i).boundingBox();
            
            // Verify consistent height and similar visual presence
            expect(Math.abs(emojiBox.height - firstEmojiBox.height)).toBeLessThan(5);
        }
        
        // Take screenshot for spacing verification
        await page.locator('.SignageFooter').screenshot({
            path: 'tests/visual-regression/output/emoji-fallback-spacing.png'
        });
    });
    
    test('emoji fallback should handle animation correctly', async ({ page }) => {
        const config = {
            ...testConfig.test_configurations.emoji_fallback,
            scroll_speed: 100 // Fast scroll for testing
        };
        
        await page.route('/.netlify/functions/footer', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(config)
            });
        });
        
        // Block SVG loading
        await page.route('**/assets/images/pinas_kroon.svg', async route => {
            await route.abort('failed');
        });
        
        await page.reload();
        await page.waitForSelector('.SignageFooter', { state: 'visible' });
        
        // Start the footer animation
        await page.evaluate(() => {
            if (window.footerInstance && window.footerInstance.start) {
                window.footerInstance.start();
            }
        });
        
        await page.waitForTimeout(2000); // Let animation run
        
        // This test WILL FAIL if animation breaks with emoji fallback
        const isAnimating = await page.evaluate(() => {
            const footerContent = document.querySelector('.scrolling-footer-content');
            if (!footerContent) return false;
            
            const computedStyle = window.getComputedStyle(footerContent);
            return computedStyle.animationName !== 'none' && computedStyle.animationName !== '';
        });
        
        expect(isAnimating).toBe(true);
        
        // Verify emoji separators are still present during animation
        const emojiCount = await page.locator('.scrolling-separator').filter({ hasText: '👑' }).count();
        expect(emojiCount).toBeGreaterThan(0);
        
        // Take screenshot during animation
        await page.locator('.SignageFooter').screenshot({
            path: 'tests/visual-regression/output/emoji-fallback-animation.png'
        });
    });
    
    test('emoji fallback should not appear when SVG loads successfully', async ({ page }) => {
        // Use SVG default config (SVG should load successfully)
        const config = testConfig.test_configurations.svg_default;
        
        await page.route('/.netlify/functions/footer', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(config)
            });
        });
        
        // Don't block SVG loading - let it succeed
        await page.reload();
        await page.waitForSelector('.SignageFooter', { state: 'visible' });
        await page.waitForTimeout(1000);
        
        // This test WILL FAIL if emoji fallback appears when SVG loads successfully
        const svgSeparators = await page.locator('.scrolling-separator img.sep').count();
        const emojiSeparators = await page.locator('.scrolling-separator').filter({ hasText: '👑' }).count();
        
        expect(svgSeparators).toBeGreaterThan(0); // SVG should be present
        expect(emojiSeparators).toBe(0); // WILL FAIL if emoji fallback incorrectly appears
        
        // Take screenshot for successful SVG loading
        await page.locator('.SignageFooter').screenshot({
            path: 'tests/visual-regression/output/svg-success-no-emoji.png'
        });
    });
});

console.log('\n=== EMOJI FALLBACK TEST EXPECTATIONS ===');
console.log('Emoji fallback tests WILL FAIL because:');
console.log('1. Current implementation may show broken SVG elements alongside emoji');
console.log('2. Fallback logic is not implemented to detect SVG loading failures');
console.log('3. Emoji fallback may appear even when SVG loads successfully');
console.log('4. Animation may break when switching separator types');
console.log('==========================================\n');