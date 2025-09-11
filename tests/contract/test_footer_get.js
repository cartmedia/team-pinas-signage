// Contract Test: GET /.netlify/functions/footer
// This test MUST FAIL until the footer endpoint is implemented
// Tests the API contract as defined in /specs/003-ik-wil-dat/contracts/footer-api.yaml

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
    req.setTimeout(5000, () => reject(new Error('Request timeout')));
    req.end();
  });
}

async function testFooterGetContract() {
  console.log('🧪 Contract Test: GET /.netlify/functions/footer');
  
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8080';
  const url = new URL('/.netlify/functions/footer', baseUrl);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'footer-contract-test/1.0'
    }
  };

  try {
    console.log(`Making request to: ${url.href}`);
    const response = await makeRequest(options);
    
    // Contract Assertion 1: Response status should be 200
    if (response.statusCode !== 200) {
      throw new Error(`Expected status 200, got ${response.statusCode}. Response: ${response.body}`);
    }
    console.log('✅ Status code: 200');
    
    // Contract Assertion 2: Response should be valid JSON
    let responseData;
    try {
      responseData = JSON.parse(response.body);
    } catch (parseError) {
      throw new Error(`Response is not valid JSON: ${response.body}`);
    }
    console.log('✅ Response is valid JSON');
    
    // Contract Assertion 3: Response should match FooterResponse schema
    const requiredFields = ['id', 'footer_text', 'text_color', 'scroll_speed', 'scroll_direction', 'font_size', 'is_active'];
    for (const field of requiredFields) {
      if (!(field in responseData)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    console.log('✅ All required fields present');
    
    // Contract Assertion 4: Validate field types and constraints
    if (typeof responseData.id !== 'number' || responseData.id <= 0) {
      throw new Error(`Invalid id: ${responseData.id} (should be positive integer)`);
    }
    
    if (typeof responseData.footer_text !== 'string' || responseData.footer_text.length === 0) {
      throw new Error(`Invalid footer_text: ${responseData.footer_text} (should be non-empty string)`);
    }
    
    if (typeof responseData.text_color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(responseData.text_color)) {
      throw new Error(`Invalid text_color: ${responseData.text_color} (should be hex color)`);
    }
    
    if (typeof responseData.scroll_speed !== 'number' || responseData.scroll_speed < 1 || responseData.scroll_speed > 200) {
      throw new Error(`Invalid scroll_speed: ${responseData.scroll_speed} (should be 1-200)`);
    }
    
    if (!['left', 'right', 'static'].includes(responseData.scroll_direction)) {
      throw new Error(`Invalid scroll_direction: ${responseData.scroll_direction} (should be left, right, or static)`);
    }
    
    if (typeof responseData.font_size !== 'string' || !/^[0-9]+(\.[0-9]+)?(vh|px|em|rem)$/.test(responseData.font_size)) {
      throw new Error(`Invalid font_size: ${responseData.font_size} (should be CSS size)`);
    }
    
    if (typeof responseData.is_active !== 'boolean') {
      throw new Error(`Invalid is_active: ${responseData.is_active} (should be boolean)`);
    }
    
    console.log('✅ All field types and constraints valid');
    
    // Contract Assertion 5: Content-Type should be application/json
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected Content-Type: application/json, got: ${contentType}`);
    }
    console.log('✅ Content-Type is application/json');
    
    // Contract Assertion 6: CORS headers should be present
    if (!response.headers['access-control-allow-origin']) {
      throw new Error('Missing CORS header: Access-Control-Allow-Origin');
    }
    console.log('✅ CORS headers present');
    
    console.log('✅ GET /footer contract test PASSED');
    console.log('📋 Response sample:', JSON.stringify(responseData, null, 2));
    
    return {
      success: true,
      message: 'GET /footer contract validated successfully',
      responseData
    };
    
  } catch (error) {
    console.error('❌ GET /footer contract test FAILED:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run test if called directly
if (require.main === module) {
  testFooterGetContract()
    .then(result => {
      if (result.success) {
        console.log('🎉 Contract test completed successfully');
        process.exit(0);
      } else {
        console.error('💥 Contract test failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testFooterGetContract };