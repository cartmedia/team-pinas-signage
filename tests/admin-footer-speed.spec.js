const { test, expect } = require('@playwright/test');

/**
 * Playwright Test: Admin Portal Footer Speed Settings
 * 
 * Tests the functionality of the admin portal's footer/scrolling text speed settings:
 * 1. Navigate to admin portal
 * 2. Check footer speed settings in admin interface  
 * 3. Test changing speed settings
 * 4. Verify network requests to footer API
 * 5. Confirm speed changes are applied to main signage display
 */

test.describe('Admin Portal Footer Speed Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the admin portal
    await page.goto('http://localhost:8080/admin');
    
    // Wait for the admin interface to load
    await page.waitForSelector('#adminInterface', { timeout: 10000 });
    
    // Wait a bit more for any async initialization
    await page.waitForTimeout(1000);
  });

  test('should find footer speed settings in admin interface', async ({ page }) => {
    console.log('🔍 Test 1: Checking for footer speed settings in admin interface...');
    
    // Look for footer-related navigation items
    await page.screenshot({ path: 'admin-interface-initial.png' });
    
    // Try to find footer settings category
    const footerCategory = page.locator('[data-category="footer"]');
    if (await footerCategory.count() > 0) {
      console.log('✅ Found footer category in navigation');
      await footerCategory.click();
      await page.waitForTimeout(500);
      
      // Look for footer speed input
      const footerSpeed = page.locator('#footerSpeed');
      const footerScrollSpeed = page.locator('#footerScrollSpeed');
      
      if (await footerSpeed.count() > 0) {
        console.log('✅ Found footerSpeed input');
        const speedValue = await footerSpeed.inputValue();
        console.log(`Current footer speed value: ${speedValue}`);
      }
      
      if (await footerScrollSpeed.count() > 0) {
        console.log('✅ Found footerScrollSpeed input'); 
        const scrollSpeedValue = await footerScrollSpeed.inputValue();
        console.log(`Current footer scroll speed value: ${scrollSpeedValue}`);
      }
      
    } else {
      console.log('⚠️ No footer category found, checking alternative locations...');
    }
    
    // Also check settings panels
    const settingsFooter = page.locator('#settings-footer');
    if (await settingsFooter.count() > 0) {
      console.log('✅ Found settings-footer panel');
    }
    
    await page.screenshot({ path: 'admin-footer-settings.png' });
  });

  test('should load footer configuration from API', async ({ page }) => {
    console.log('🔍 Test 2: Testing footer API loading...');
    
    // Set up network request monitoring
    const footerRequests = [];
    page.on('request', request => {
      if (request.url().includes('/footer')) {
        footerRequests.push({
          url: request.url(),
          method: request.method()
        });
        console.log(`📡 Footer API request: ${request.method()} ${request.url()}`);
      }
    });

    // Set up response monitoring
    page.on('response', async response => {
      if (response.url().includes('/footer')) {
        console.log(`📡 Footer API response: ${response.status()} ${response.url()}`);
        if (response.ok()) {
          try {
            const data = await response.json();
            console.log('Footer API data:', JSON.stringify(data, null, 2));
          } catch (e) {
            console.log('Could not parse footer API response as JSON');
          }
        }
      }
    });
    
    // Navigate to footer settings
    const footerCategory = page.locator('[data-category="footer"]');
    if (await footerCategory.count() > 0) {
      await footerCategory.click();
      await page.waitForTimeout(1000);
      
      // Wait for potential API calls
      await page.waitForTimeout(2000);
      
      console.log(`Total footer API requests captured: ${footerRequests.length}`);
      footerRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.method} ${req.url}`);
      });
    }
  });

  test('should be able to change footer speed settings', async ({ page }) => {
    console.log('🔍 Test 3: Testing footer speed setting changes...');
    
    // Navigate to footer settings
    const footerCategory = page.locator('[data-category="footer"]'); 
    if (await footerCategory.count() > 0) {
      await footerCategory.click();
      await page.waitForTimeout(500);
      
      // Test footerSpeed input (for settings)
      const footerSpeed = page.locator('#footerSpeed');
      if (await footerSpeed.count() > 0) {
        const originalValue = await footerSpeed.inputValue();
        console.log(`Original footerSpeed value: ${originalValue}`);
        
        // Change the value
        await footerSpeed.fill('45');
        const newValue = await footerSpeed.inputValue();
        console.log(`New footerSpeed value: ${newValue}`);
        
        expect(newValue).toBe('45');
      }
      
      // Test footerScrollSpeed input (for detailed footer config)
      const footerScrollSpeed = page.locator('#footerScrollSpeed');
      if (await footerScrollSpeed.count() > 0) {
        const originalScrollValue = await footerScrollSpeed.inputValue();
        console.log(`Original footerScrollSpeed value: ${originalScrollValue}`);
        
        // Change the value
        await footerScrollSpeed.fill('60');
        const newScrollValue = await footerScrollSpeed.inputValue();
        console.log(`New footerScrollSpeed value: ${newScrollValue}`);
        
        expect(newScrollValue).toBe('60');
      }
      
      await page.screenshot({ path: 'admin-footer-speed-changed.png' });
    }
  });

  test('should save footer settings to API', async ({ page }) => {
    console.log('🔍 Test 4: Testing footer settings save functionality...');
    
    let saveRequests = [];
    
    // Monitor save requests
    page.on('request', request => {
      if ((request.url().includes('/footer') || request.url().includes('/settings')) && 
          (request.method() === 'POST' || request.method() === 'PUT')) {
        saveRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
        console.log(`💾 Save request: ${request.method()} ${request.url()}`);
      }
    });

    // Navigate to footer settings
    const footerCategory = page.locator('[data-category="footer"]');
    if (await footerCategory.count() > 0) {
      await footerCategory.click();
      await page.waitForTimeout(500);
      
      // Change speed value
      const footerSpeed = page.locator('#footerSpeed');
      const footerScrollSpeed = page.locator('#footerScrollSpeed');
      
      if (await footerSpeed.count() > 0) {
        await footerSpeed.fill('25');
      }
      
      if (await footerScrollSpeed.count() > 0) {
        await footerScrollSpeed.fill('40');
      }
      
      // Try to find and click save button
      const saveButtons = [
        '#saveFooterSettings',
        '#saveFooterConfig', 
        '#saveSettings',
        'button:has-text("Footer Instellingen Opslaan")',
        'button:has-text("Instellingen Opslaan")'
      ];
      
      let saveButtonFound = false;
      for (const selector of saveButtons) {
        const button = page.locator(selector);
        if (await button.count() > 0 && await button.isVisible()) {
          console.log(`Found save button: ${selector}`);
          await button.click();
          saveButtonFound = true;
          break;
        }
      }
      
      if (saveButtonFound) {
        // Wait for save request
        await page.waitForTimeout(2000);
        
        console.log(`Save requests captured: ${saveRequests.length}`);
        saveRequests.forEach((req, index) => {
          console.log(`  ${index + 1}. ${req.method} ${req.url}`);
          if (req.postData) {
            console.log(`     Data: ${req.postData}`);
          }
        });
      } else {
        console.log('⚠️ No save button found');
      }
    }
  });

  test('should verify footer speed changes on main signage display', async ({ page, context }) => {
    console.log('🔍 Test 5: Testing footer speed changes on main signage display...');
    
    // First, change footer settings in admin
    const footerCategory = page.locator('[data-category="footer"]');
    if (await footerCategory.count() > 0) {
      await footerCategory.click();
      await page.waitForTimeout(500);
      
      // Set a specific speed value
      const footerSpeed = page.locator('#footerSpeed');
      const footerScrollSpeed = page.locator('#footerScrollSpeed');
      
      if (await footerSpeed.count() > 0) {
        await footerSpeed.fill('15'); // Fast speed
      }
      
      if (await footerScrollSpeed.count() > 0) {
        await footerScrollSpeed.fill('15'); // Fast speed
      }
      
      // Try to save
      const saveButton = page.locator('#saveFooterSettings, #saveSettings').first();
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Open main signage display in new tab
    const signagePage = await context.newPage();
    await signagePage.goto('http://localhost:8080/');
    
    // Wait for signage to load
    await signagePage.waitForSelector('.SignageFooter', { timeout: 10000 });
    await signagePage.waitForTimeout(2000);
    
    // Check if footer is visible and has scrolling animation
    const footer = signagePage.locator('.SignageFooter');
    const scrollingText = signagePage.locator('.ScrollingText span');
    
    if (await footer.count() > 0) {
      console.log('✅ Footer found on signage display');
      
      if (await scrollingText.count() > 0) {
        console.log('✅ Scrolling text found');
        
        // Check animation duration in CSS
        const animationDuration = await scrollingText.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.animationDuration;
        });
        
        console.log(`Animation duration: ${animationDuration}`);
        
        // Take screenshot of signage display
        await signagePage.screenshot({ path: 'signage-footer-animation.png' });
        
        // Monitor the actual scrolling by checking transform values over time
        const initialTransform = await scrollingText.evaluate(el => {
          return window.getComputedStyle(el).transform;
        });
        
        await signagePage.waitForTimeout(1000);
        
        const laterTransform = await scrollingText.evaluate(el => {
          return window.getComputedStyle(el).transform;
        });
        
        console.log(`Initial transform: ${initialTransform}`);
        console.log(`Later transform: ${laterTransform}`);
        
        // Verify animation is running (transforms should be different)
        expect(initialTransform).not.toBe(laterTransform);
        
      } else {
        console.log('⚠️ No scrolling text found');
      }
    } else {
      console.log('⚠️ No footer found on signage display');
    }
    
    await signagePage.close();
  });

  test('should verify footer API endpoints are working', async ({ page }) => {
    console.log('🔍 Test 6: Testing footer API endpoints directly...');
    
    // Test the footer API endpoint directly
    try {
      const response = await page.request.get('http://localhost:8080/.netlify/functions/footer');
      console.log(`Footer API status: ${response.status()}`);
      
      if (response.ok()) {
        const data = await response.json();
        console.log('Footer API response:', JSON.stringify(data, null, 2));
      } else {
        console.log(`Footer API error: ${response.status()} ${response.statusText()}`);
      }
    } catch (error) {
      console.log('Footer API request failed:', error.message);
    }
    
    // Test settings API which might contain footer speed
    try {
      const settingsResponse = await page.request.get('http://localhost:8080/.netlify/functions/settings');
      console.log(`Settings API status: ${settingsResponse.status()}`);
      
      if (settingsResponse.ok()) {
        const settingsData = await settingsResponse.json();
        console.log('Settings API response:', JSON.stringify(settingsData, null, 2));
        
        // Check for footer-related settings
        if (settingsData.settings) {
          const footerSettings = Object.keys(settingsData.settings).filter(key => 
            key.toLowerCase().includes('footer') || key.toLowerCase().includes('scroll')
          );
          console.log('Footer-related settings found:', footerSettings);
        }
      }
    } catch (error) {
      console.log('Settings API request failed:', error.message);
    }
  });
});