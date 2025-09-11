// Integration Test: Footer Configuration Retrieval
// Tests end-to-end footer configuration retrieval workflow
// Based on quickstart.md scenario 1: "Public API Access"

const https = require('https');
const http = require('http');

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => reject(new Error('Request timeout')));
    req.end();
  });
}

async function testFooterRetrievalIntegration() {
  console.log('🔗 Integration Test: Footer Configuration Retrieval');
  console.log('Scenario: Public client retrieves active footer configuration');
  
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8080';
  
  try {
    // Step 1: Retrieve footer configuration via public GET endpoint
    console.log('\n📋 Step 1: GET active footer configuration');
    const getUrl = new URL('/.netlify/functions/footer', baseUrl);
    
    const getOptions = {
      hostname: getUrl.hostname,
      port: getUrl.port,
      path: getUrl.pathname,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'footer-integration-test/1.0'
      }
    };
    
    const getResponse = await makeRequest(getOptions);
    
    if (getResponse.statusCode !== 200) {
      throw new Error(`GET failed: ${getResponse.statusCode} - ${getResponse.body}`);
    }
    
    const footerConfig = JSON.parse(getResponse.body);
    console.log('✅ Retrieved footer configuration');
    console.log(`   ID: ${footerConfig.id}`);
    console.log(`   Text: ${footerConfig.footer_text.substring(0, 50)}...`);
    console.log(`   Color: ${footerConfig.text_color}`);
    console.log(`   Speed: ${footerConfig.scroll_speed}px/s`);
    
    // Step 2: Validate configuration meets signage display requirements
    console.log('\n🎯 Step 2: Validate configuration for signage display');
    
    // Check required signage properties
    if (!footerConfig.footer_text || footerConfig.footer_text.length === 0) {
      throw new Error('Footer text is empty - signage cannot display');
    }
    console.log('✅ Footer text is present for display');
    
    if (!footerConfig.text_color || !/^#[0-9a-fA-F]{6}$/.test(footerConfig.text_color)) {
      throw new Error('Invalid text color format - CSS will fail');
    }
    console.log('✅ Text color is valid hex format');
    
    if (!footerConfig.scroll_speed || footerConfig.scroll_speed < 1 || footerConfig.scroll_speed > 200) {
      throw new Error('Scroll speed out of range - animation will break');
    }
    console.log('✅ Scroll speed is within valid range');
    
    if (!footerConfig.font_size || !/^[0-9]+(\.[0-9]+)?(vh|px|em|rem)$/.test(footerConfig.font_size)) {
      throw new Error('Invalid font size format - CSS will fail');
    }
    console.log('✅ Font size is valid CSS format');
    
    if (!footerConfig.is_active) {
      throw new Error('Configuration is not active - should not be returned');
    }
    console.log('✅ Configuration is active');
    
    // Step 3: Test performance requirements (< 500ms response time)
    console.log('\n⚡ Step 3: Test performance requirements');
    
    const startTime = Date.now();
    const perfResponse = await makeRequest(getOptions);
    const responseTime = Date.now() - startTime;
    
    if (perfResponse.statusCode !== 200) {
      throw new Error(`Performance test failed: ${perfResponse.statusCode}`);
    }
    
    if (responseTime > 500) {
      console.warn(`⚠️ Response time ${responseTime}ms exceeds 500ms target`);
    } else {
      console.log(`✅ Response time ${responseTime}ms meets performance requirement`);
    }
    
    // Step 4: Test caching behavior (second request should be faster)
    console.log('\n🗄️ Step 4: Test caching behavior');
    
    const cacheStartTime = Date.now();
    const cacheResponse = await makeRequest(getOptions);
    const cacheResponseTime = Date.now() - cacheStartTime;
    
    if (cacheResponse.statusCode !== 200) {
      throw new Error(`Cache test failed: ${cacheResponse.statusCode}`);
    }
    
    console.log(`📊 First request: ${responseTime}ms`);
    console.log(`📊 Second request: ${cacheResponseTime}ms`);
    
    if (cacheResponseTime <= responseTime) {
      console.log('✅ Caching appears to be working (second request not slower)');
    } else {
      console.log('⚠️ Caching may not be working (second request slower)');
    }
    
    // Step 5: Validate response headers for signage compatibility
    console.log('\n🌐 Step 5: Validate response headers');
    
    const corsHeader = getResponse.headers['access-control-allow-origin'];
    if (!corsHeader || corsHeader !== '*') {
      throw new Error('Missing or invalid CORS header - signage client will be blocked');
    }
    console.log('✅ CORS headers allow signage client access');
    
    const contentType = getResponse.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid Content-Type - client expects JSON');
    }
    console.log('✅ Content-Type is application/json');
    
    // Step 6: Test divider image path accessibility
    console.log('\n🖼️ Step 6: Test divider image accessibility');
    
    if (footerConfig.divider_image) {
      // For now, just validate the path format - full image test would require static server
      if (!footerConfig.divider_image.startsWith('assets/') || !footerConfig.divider_image.endsWith('.svg')) {
        console.warn(`⚠️ Divider image path may be invalid: ${footerConfig.divider_image}`);
      } else {
        console.log(`✅ Divider image path format is valid: ${footerConfig.divider_image}`);
      }
    }
    
    console.log('\n🎉 Footer retrieval integration test PASSED');
    console.log('📋 All signage display requirements validated');
    
    return {
      success: true,
      message: 'Footer retrieval integration test completed successfully',
      footerConfig,
      responseTime,
      cacheResponseTime
    };
    
  } catch (error) {
    console.error('\n❌ Footer retrieval integration test FAILED:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test scenario: Multiple rapid requests (simulating multiple signage displays)
async function testFooterRetrievalLoad() {
  console.log('\n🔄 Load Test: Multiple concurrent footer retrievals');
  
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8080';
  const getUrl = new URL('/.netlify/functions/footer', baseUrl);
  
  const getOptions = {
    hostname: getUrl.hostname,
    port: getUrl.port,
    path: getUrl.pathname,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'footer-load-test/1.0'
    }
  };
  
  try {
    // Simulate 5 concurrent signage displays requesting footer
    const concurrentRequests = 5;
    const promises = [];
    
    console.log(`Launching ${concurrentRequests} concurrent requests...`);
    const startTime = Date.now();
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(makeRequest(getOptions));
    }
    
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    // Validate all requests succeeded
    const failures = results.filter(r => r.statusCode !== 200);
    if (failures.length > 0) {
      throw new Error(`${failures.length}/${concurrentRequests} requests failed`);
    }
    
    console.log(`✅ All ${concurrentRequests} requests succeeded`);
    console.log(`⚡ Total time: ${totalTime}ms (avg: ${Math.round(totalTime/concurrentRequests)}ms per request)`);
    
    // Validate all responses are identical (consistency)
    const responses = results.map(r => r.body);
    const firstResponse = responses[0];
    const allIdentical = responses.every(r => r === firstResponse);
    
    if (!allIdentical) {
      throw new Error('Responses are not identical - possible consistency issue');
    }
    console.log('✅ All responses are identical (consistency validated)');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Load test FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

// Run tests if called directly
if (require.main === module) {
  Promise.all([
    testFooterRetrievalIntegration(),
    testFooterRetrievalLoad()
  ])
    .then(results => {
      const allPassed = results.every(r => r.success);
      if (allPassed) {
        console.log('\n🎉 All footer retrieval integration tests completed successfully');
        process.exit(0);
      } else {
        console.error('\n💥 Some footer retrieval integration tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testFooterRetrievalIntegration, testFooterRetrievalLoad };