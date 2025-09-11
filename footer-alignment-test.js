const { chromium } = require('playwright');

(async () => {
  console.log('Starting footer alignment verification...');
  
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 } // 16:9 aspect ratio for digital signage
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:8080...');
    
    // Navigate to the page
    await page.goto('http://localhost:8080');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for any JavaScript to execute
    await page.waitForTimeout(2000);
    
    console.log('Page loaded, taking screenshot...');
    
    // Take a full page screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `/Users/mistermeneer/Developer/team-pinas-signage/footer-alignment-screenshot-${timestamp}.png`;
    
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    console.log(`Screenshot saved to: ${screenshotPath}`);
    
    // Check if footer exists and get its properties
    const footerInfo = await page.evaluate(() => {
      const footer = document.querySelector('footer, .footer, #footer');
      if (!footer) {
        return { exists: false, message: 'No footer element found' };
      }
      
      const computedStyle = window.getComputedStyle(footer);
      const rect = footer.getBoundingClientRect();
      
      return {
        exists: true,
        height: rect.height,
        computedStyles: {
          display: computedStyle.display,
          alignItems: computedStyle.alignItems,
          justifyContent: computedStyle.justifyContent,
          flexDirection: computedStyle.flexDirection,
          padding: computedStyle.padding,
          textAlign: computedStyle.textAlign
        },
        innerHTML: footer.innerHTML.substring(0, 200) + '...' // First 200 chars
      };
    });
    
    console.log('Footer information:', JSON.stringify(footerInfo, null, 2));
    
    // Also check for any text elements in the footer specifically
    const footerTextInfo = await page.evaluate(() => {
      const footer = document.querySelector('footer, .footer, #footer');
      if (!footer) return null;
      
      const textElements = footer.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
      return Array.from(textElements).map(el => {
        const rect = el.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(el);
        return {
          tagName: el.tagName,
          textContent: el.textContent.trim(),
          height: rect.height,
          lineHeight: computedStyle.lineHeight,
          verticalAlign: computedStyle.verticalAlign,
          paddingTop: computedStyle.paddingTop,
          paddingBottom: computedStyle.paddingBottom
        };
      });
    });
    
    if (footerTextInfo) {
      console.log('Footer text elements:', JSON.stringify(footerTextInfo, null, 2));
    }
    
    console.log('✅ Footer alignment verification complete!');
    console.log(`📸 Screenshot saved at: ${screenshotPath}`);
    
  } catch (error) {
    console.error('❌ Error during footer alignment verification:', error);
  } finally {
    await browser.close();
  }
})();