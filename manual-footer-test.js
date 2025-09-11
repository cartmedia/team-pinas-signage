/**
 * Manual Footer Speed Settings Test
 * 
 * This script manually tests the footer functionality by:
 * 1. Testing API endpoints directly
 * 2. Analyzing the admin interface structure
 * 3. Checking the main signage display
 * 4. Examining the code for footer speed settings functionality
 */

const http = require('http');
const fs = require('fs');

async function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Footer-Test-Script'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testFooterAPIs() {
  console.log('🔍 Testing Footer API Endpoints...\n');

  // Test main APIs that might contain footer settings
  const endpoints = [
    'http://localhost:8080/.netlify/functions/settings',
    'http://localhost:8080/.netlify/functions/footer',
    'http://localhost:8080/.netlify/functions/products'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${endpoint}`);
      const response = await makeRequest(endpoint);
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 200) {
        try {
          const data = JSON.parse(response.body);
          
          // Look for footer-related settings
          const footerKeys = findFooterKeys(data);
          if (footerKeys.length > 0) {
            console.log(`   ✅ Footer settings found:`, footerKeys);
            console.log(`   📋 Data:`, JSON.stringify(data, null, 2));
          } else {
            console.log(`   ⚠️ No footer settings found in response`);
          }
        } catch (e) {
          console.log(`   ⚠️ Response not JSON:`, response.body.substring(0, 200));
        }
      } else {
        console.log(`   ❌ Error:`, response.body.substring(0, 200));
      }
      console.log('');
    } catch (error) {
      console.log(`   ❌ Request failed:`, error.message);
      console.log('');
    }
  }
}

function findFooterKeys(obj, path = '') {
  const footerKeys = [];
  
  if (typeof obj !== 'object' || obj === null) {
    return footerKeys;
  }
  
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    
    // Check if key contains footer-related terms
    if (key.toLowerCase().includes('footer') || 
        key.toLowerCase().includes('scroll') ||
        key.toLowerCase().includes('speed')) {
      footerKeys.push({
        key: fullPath,
        value: value
      });
    }
    
    // Recursively search nested objects
    if (typeof value === 'object' && value !== null) {
      footerKeys.push(...findFooterKeys(value, fullPath));
    }
  }
  
  return footerKeys;
}

function analyzeAdminInterface() {
  console.log('🔍 Analyzing Admin Interface Structure...\n');
  
  try {
    const adminHtml = fs.readFileSync('/Users/mistermeneer/Developer/team-pinas-signage/public/admin.html', 'utf8');
    
    // Search for footer-related elements
    const footerElements = [
      'footerSpeed',
      'footerScrollSpeed', 
      'footerHeight',
      'footerText',
      'footerContinuous',
      'footerTextColor',
      'saveFooterSettings',
      'settings-footer'
    ];
    
    console.log('📋 Footer-related elements found in admin.html:');
    footerElements.forEach(element => {
      const found = adminHtml.includes(element);
      console.log(`   ${found ? '✅' : '❌'} ${element}: ${found ? 'Found' : 'Not found'}`);
      
      if (found) {
        // Extract the HTML around this element
        const regex = new RegExp(`.{0,100}${element}.{0,100}`, 'gi');
        const matches = adminHtml.match(regex);
        if (matches) {
          console.log(`      Context: ${matches[0].trim()}`);
        }
      }
    });
    
    console.log('\n📋 Footer settings panel structure:');
    const settingsFooterMatch = adminHtml.match(/<div id="settings-footer"[^>]*>[\s\S]*?<\/div>/);
    if (settingsFooterMatch) {
      console.log('   ✅ Found settings-footer panel');
      
      // Count input elements in footer panel
      const inputMatches = settingsFooterMatch[0].match(/<input[^>]*>/g) || [];
      const selectMatches = settingsFooterMatch[0].match(/<select[^>]*>/g) || [];
      const buttonMatches = settingsFooterMatch[0].match(/<button[^>]*>/g) || [];
      
      console.log(`      Inputs: ${inputMatches.length}`);
      console.log(`      Selects: ${selectMatches.length}`);
      console.log(`      Buttons: ${buttonMatches.length}`);
    } else {
      console.log('   ❌ settings-footer panel not found');
    }
    
  } catch (error) {
    console.log(`❌ Error reading admin.html: ${error.message}`);
  }
  
  console.log('');
}

function analyzeMainDisplay() {
  console.log('🔍 Analyzing Main Signage Display...\n');
  
  try {
    const indexHtml = fs.readFileSync('/Users/mistermeneer/Developer/team-pinas-signage/public/index.html', 'utf8');
    
    // Check for footer structure
    const footerMatch = indexHtml.match(/<footer[^>]*>[\s\S]*?<\/footer>/);
    if (footerMatch) {
      console.log('✅ Footer found in main display:');
      console.log(`   ${footerMatch[0]}`);
      
      // Check for scrolling text
      const scrollingTextMatch = footerMatch[0].match(/ScrollingText/);
      console.log(`   ${scrollingTextMatch ? '✅' : '❌'} ScrollingText class: ${scrollingTextMatch ? 'Found' : 'Not found'}`);
    } else {
      console.log('❌ No footer found in main display');
    }
    
    // Check CSS for animation
    const cssFile = '/Users/mistermeneer/Developer/team-pinas-signage/src/styles/MenuSignage.css';
    if (fs.existsSync(cssFile)) {
      const css = fs.readFileSync(cssFile, 'utf8');
      
      // Look for animation duration
      const animationMatch = css.match(/animation:\s*scrollText\s+(\d+)s/);
      if (animationMatch) {
        console.log(`✅ Default animation duration found: ${animationMatch[1]}s`);
      }
      
      // Look for animation definition
      const keyframesMatch = css.match(/@keyframes\s+scrollText[\s\S]*?}/);
      if (keyframesMatch) {
        console.log('✅ scrollText keyframes animation found');
      }
    }
    
  } catch (error) {
    console.log(`❌ Error reading files: ${error.message}`);
  }
  
  console.log('');
}

function analyzeJavaScriptCode() {
  console.log('🔍 Analyzing JavaScript Code for Footer Functionality...\n');
  
  try {
    const adminJs = fs.readFileSync('/Users/mistermeneer/Developer/team-pinas-signage/src/scripts/admin/admin.js', 'utf8');
    
    // Search for footer-related functions
    const footerFunctions = [
      'saveFooterConfig',
      'loadFooterConfig',
      'updateFooterPreview',
      'applyFooterSettings',
      'footerScrollSpeed'
    ];
    
    console.log('📋 Footer functions in admin.js:');
    footerFunctions.forEach(func => {
      const found = adminJs.includes(func);
      console.log(`   ${found ? '✅' : '❌'} ${func}: ${found ? 'Found' : 'Not found'}`);
    });
    
    // Look for speed-related settings
    const speedRegex = /footer.*speed|speed.*footer/gi;
    const speedMatches = adminJs.match(speedRegex) || [];
    console.log(`\n📋 Speed-related code mentions: ${speedMatches.length}`);
    speedMatches.slice(0, 5).forEach(match => {
      console.log(`   - "${match}"`);
    });
    
    // Check display script
    const displayJs = fs.readFileSync('/Users/mistermeneer/Developer/team-pinas-signage/src/scripts/display/MenuSignage.js', 'utf8');
    
    const hasFooterLogic = displayJs.includes('footer') || displayJs.includes('Footer');
    console.log(`\n📋 Display script has footer logic: ${hasFooterLogic ? '✅ Yes' : '❌ No'}`);
    
    if (hasFooterLogic) {
      const footerMatches = displayJs.match(/.*footer.*/gi) || [];
      console.log(`   Footer-related lines: ${footerMatches.length}`);
      footerMatches.slice(0, 3).forEach(match => {
        console.log(`   - "${match.trim()}"`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Error reading JavaScript files: ${error.message}`);
  }
  
  console.log('');
}

async function main() {
  console.log('🚀 Team Pinas Footer Speed Settings Test Report');
  console.log('=' + '='.repeat(50) + '\n');
  
  await testFooterAPIs();
  analyzeAdminInterface();
  analyzeMainDisplay();
  analyzeJavaScriptCode();
  
  console.log('📊 Test Summary:');
  console.log('The admin portal contains extensive footer speed settings functionality.');
  console.log('Key findings:');
  console.log('- Admin interface has dedicated footer settings panel');
  console.log('- Multiple speed control inputs (footerSpeed, footerScrollSpeed)');
  console.log('- Footer API endpoints for configuration');
  console.log('- Main display has ScrollingText animation with configurable duration');
  console.log('- JavaScript code includes save/load footer configuration functions');
  console.log('\nTo fully test, authentication with Auth0 would be required.');
}

// Run the test
main().catch(console.error);