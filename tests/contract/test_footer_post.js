// Contract Test: POST /.netlify/functions/footer  
// This test MUST FAIL until the footer endpoint is implemented
// Tests the API contract as defined in /specs/003-ik-wil-dat/contracts/footer-api.yaml

const https = require('https');
const http = require('http');

function makeRequest(options, postData = null) {
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
    req.setTimeout(5000, () => reject(new Error('Request timeout')));
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testFooterPostContract() {
  console.log('🧪 Contract Test: POST /.netlify/functions/footer');
  
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8080';
  const url = new URL('/.netlify/functions/footer', baseUrl);
  const adminApiKey = process.env.ADMIN_API_KEY || 'team-pinas-admin-2024';
  
  // Test payload matching FooterCreateRequest schema
  const testPayload = {
    footer_text: 'Test Footer Content <separator> Another section for testing',
    text_color: '#FF5733',
    background_color: '#FFFFFF',
    scroll_speed: 50,
    scroll_direction: 'right',
    divider_image: 'assets/images/test_divider.svg',
    font_size: '4vh'
  };
  
  const postData = JSON.stringify(testPayload);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Accept': 'application/json',
      'X-API-Key': adminApiKey,
      'User-Agent': 'footer-contract-test/1.0'
    }
  };

  try {
    console.log(`Making POST request to: ${url.href}`);
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await makeRequest(options, postData);
    
    // Contract Assertion 1: Response status should be 201 (Created)
    if (response.statusCode !== 201) {
      throw new Error(`Expected status 201, got ${response.statusCode}. Response: ${response.body}`);
    }
    console.log('✅ Status code: 201');
    
    // Contract Assertion 2: Response should be valid JSON
    let responseData;
    try {
      responseData = JSON.parse(response.body);
    } catch (parseError) {
      throw new Error(`Response is not valid JSON: ${response.body}`);
    }
    console.log('✅ Response is valid JSON');
    
    // Contract Assertion 3: Response should match FooterResponse schema
    const requiredFields = ['id', 'footer_text', 'text_color', 'scroll_speed', 'scroll_direction', 'font_size', 'is_active', 'created_at'];
    for (const field of requiredFields) {
      if (!(field in responseData)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    console.log('✅ All required fields present');
    
    // Contract Assertion 4: Created resource should match input data
    if (responseData.footer_text !== testPayload.footer_text) {
      throw new Error(`footer_text mismatch: expected ${testPayload.footer_text}, got ${responseData.footer_text}`);
    }
    
    if (responseData.text_color !== testPayload.text_color) {
      throw new Error(`text_color mismatch: expected ${testPayload.text_color}, got ${responseData.text_color}`);
    }
    
    if (responseData.scroll_speed !== testPayload.scroll_speed) {
      throw new Error(`scroll_speed mismatch: expected ${testPayload.scroll_speed}, got ${responseData.scroll_speed}`);
    }
    
    if (responseData.scroll_direction !== testPayload.scroll_direction) {
      throw new Error(`scroll_direction mismatch: expected ${testPayload.scroll_direction}, got ${responseData.scroll_direction}`);
    }
    
    console.log('✅ Created resource matches input data');
    
    // Contract Assertion 5: New record should be active
    if (responseData.is_active !== true) {
      throw new Error(`Expected is_active to be true, got ${responseData.is_active}`);
    }
    console.log('✅ New record is active');
    
    // Contract Assertion 6: Should have timestamps
    if (!responseData.created_at || isNaN(Date.parse(responseData.created_at))) {
      throw new Error(`Invalid created_at timestamp: ${responseData.created_at}`);
    }
    console.log('✅ Valid timestamps present');
    
    // Contract Assertion 7: Content-Type should be application/json
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected Content-Type: application/json, got: ${contentType}`);
    }
    console.log('✅ Content-Type is application/json');
    
    console.log('✅ POST /footer contract test PASSED');
    console.log('📋 Created resource:', JSON.stringify(responseData, null, 2));
    
    return {
      success: true,
      message: 'POST /footer contract validated successfully',
      responseData
    };
    
  } catch (error) {
    console.error('❌ POST /footer contract test FAILED:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testFooterPostValidation() {
  console.log('🧪 Contract Test: POST validation errors');
  
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8080';
  const url = new URL('/.netlify/functions/footer', baseUrl);
  const adminApiKey = process.env.ADMIN_API_KEY || 'team-pinas-admin-2024';
  
  // Test invalid payload (missing required field)
  const invalidPayload = {
    text_color: '#FF5733'
    // missing footer_text (required)
  };
  
  const postData = JSON.stringify(invalidPayload);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Accept': 'application/json',
      'X-API-Key': adminApiKey,
      'User-Agent': 'footer-contract-test/1.0'
    }
  };

  try {
    console.log('Testing validation with invalid payload...');
    const response = await makeRequest(options, postData);
    
    // Should return 400 Bad Request for validation errors
    if (response.statusCode !== 400) {
      throw new Error(`Expected status 400 for validation error, got ${response.statusCode}`);
    }
    console.log('✅ Returns 400 for validation errors');
    
    const responseData = JSON.parse(response.body);
    if (!responseData.error) {
      throw new Error('Expected error message for validation failure');
    }
    console.log('✅ Returns error message for validation');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ POST validation test FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

async function testFooterPostAuth() {
  console.log('🧪 Contract Test: POST authentication');
  
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8080';
  const url = new URL('/.netlify/functions/footer', baseUrl);
  
  const testPayload = {
    footer_text: 'Test Footer Content',
    text_color: '#FF5733'
  };
  
  const postData = JSON.stringify(testPayload);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Accept': 'application/json',
      // No X-API-Key header (unauthenticated)
      'User-Agent': 'footer-contract-test/1.0'
    }
  };

  try {
    console.log('Testing authentication requirement...');
    const response = await makeRequest(options, postData);
    
    // Should return 401 Unauthorized without API key
    if (response.statusCode !== 401) {
      throw new Error(`Expected status 401 for unauthenticated request, got ${response.statusCode}`);
    }
    console.log('✅ Returns 401 for unauthenticated requests');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ POST auth test FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

// Run tests if called directly
if (require.main === module) {
  Promise.all([
    testFooterPostContract(),
    testFooterPostValidation(),
    testFooterPostAuth()
  ])
    .then(results => {
      const allPassed = results.every(r => r.success);
      if (allPassed) {
        console.log('🎉 All POST contract tests completed successfully');
        process.exit(0);
      } else {
        console.error('💥 Some POST contract tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testFooterPostContract, testFooterPostValidation, testFooterPostAuth };