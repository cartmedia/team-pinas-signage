// Contract Test: PUT /.netlify/functions/footer
// This test MUST FAIL until the footer endpoint is implemented  
// Tests the API contract as defined in /specs/003-ik-wil-dat/contracts/footer-api.yaml

const https = require('https');
const http = require('http');

function makeRequest(options, putData = null) {
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
    
    if (putData) {
      req.write(putData);
    }
    req.end();
  });
}

async function testFooterPutContract() {
  console.log('🧪 Contract Test: PUT /.netlify/functions/footer');
  
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8080';
  const url = new URL('/.netlify/functions/footer', baseUrl);
  const adminApiKey = process.env.ADMIN_API_KEY || 'team-pinas-admin-2024';
  
  // Test payload matching FooterUpdateRequest schema (partial update)
  const updatePayload = {
    footer_text: 'Updated Footer Content <separator> Modified section',
    scroll_speed: 45,
    text_color: '#00FF00'
    // Note: Only updating specific fields, not all
  };
  
  const putData = JSON.stringify(updatePayload);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(putData),
      'Accept': 'application/json',
      'X-API-Key': adminApiKey,
      'User-Agent': 'footer-contract-test/1.0'
    }
  };

  try {
    console.log(`Making PUT request to: ${url.href}`);
    console.log('Update payload:', JSON.stringify(updatePayload, null, 2));
    
    const response = await makeRequest(options, putData);
    
    // Contract Assertion 1: Response status should be 200 (OK)
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
    const requiredFields = ['id', 'footer_text', 'text_color', 'scroll_speed', 'scroll_direction', 'font_size', 'is_active', 'updated_at'];
    for (const field of requiredFields) {
      if (!(field in responseData)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    console.log('✅ All required fields present');
    
    // Contract Assertion 4: Updated fields should match input data
    if (responseData.footer_text !== updatePayload.footer_text) {
      throw new Error(`footer_text not updated: expected ${updatePayload.footer_text}, got ${responseData.footer_text}`);
    }
    
    if (responseData.text_color !== updatePayload.text_color) {
      throw new Error(`text_color not updated: expected ${updatePayload.text_color}, got ${responseData.text_color}`);
    }
    
    if (responseData.scroll_speed !== updatePayload.scroll_speed) {
      throw new Error(`scroll_speed not updated: expected ${updatePayload.scroll_speed}, got ${responseData.scroll_speed}`);
    }
    
    console.log('✅ Updated fields match input data');
    
    // Contract Assertion 5: Non-updated fields should retain defaults/previous values
    if (!['left', 'right', 'static'].includes(responseData.scroll_direction)) {
      throw new Error(`Invalid scroll_direction: ${responseData.scroll_direction}`);
    }
    
    if (typeof responseData.font_size !== 'string' || !/^[0-9]+(\.[0-9]+)?(vh|px|em|rem)$/.test(responseData.font_size)) {
      throw new Error(`Invalid font_size format: ${responseData.font_size}`);
    }
    
    console.log('✅ Non-updated fields retain valid values');
    
    // Contract Assertion 6: Should remain active after update
    if (responseData.is_active !== true) {
      throw new Error(`Expected is_active to remain true, got ${responseData.is_active}`);
    }
    console.log('✅ Record remains active after update');
    
    // Contract Assertion 7: updated_at should be valid timestamp
    const updatedAt = new Date(responseData.updated_at);
    if (isNaN(updatedAt.getTime())) {
      throw new Error(`Invalid updated_at timestamp: ${responseData.updated_at}`);
    }
    console.log('✅ updated_at timestamp is valid');
    
    // Contract Assertion 8: Content-Type should be application/json
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected Content-Type: application/json, got: ${contentType}`);
    }
    console.log('✅ Content-Type is application/json');
    
    console.log('✅ PUT /footer contract test PASSED');
    console.log('📋 Updated resource:', JSON.stringify(responseData, null, 2));
    
    return {
      success: true,
      message: 'PUT /footer contract validated successfully',
      responseData
    };
    
  } catch (error) {
    console.error('❌ PUT /footer contract test FAILED:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testFooterPutValidation() {
  console.log('🧪 Contract Test: PUT validation errors');
  
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8080';
  const url = new URL('/.netlify/functions/footer', baseUrl);
  const adminApiKey = process.env.ADMIN_API_KEY || 'team-pinas-admin-2024';
  
  // Test invalid payload (bad text_color format)
  const invalidPayload = {
    text_color: 'invalid-color',  // Should be hex format
    scroll_speed: 999             // Should be <= 200
  };
  
  const putData = JSON.stringify(invalidPayload);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(putData),
      'Accept': 'application/json',
      'X-API-Key': adminApiKey,
      'User-Agent': 'footer-contract-test/1.0'
    }
  };

  try {
    console.log('Testing validation with invalid payload...');
    const response = await makeRequest(options, putData);
    
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
    console.error('❌ PUT validation test FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

async function testFooterPutAuth() {
  console.log('🧪 Contract Test: PUT authentication');
  
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8080';
  const url = new URL('/.netlify/functions/footer', baseUrl);
  
  const updatePayload = {
    footer_text: 'Unauthorized update attempt'
  };
  
  const putData = JSON.stringify(updatePayload);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(putData),
      'Accept': 'application/json',
      // No X-API-Key header (unauthenticated)
      'User-Agent': 'footer-contract-test/1.0'
    }
  };

  try {
    console.log('Testing authentication requirement...');
    const response = await makeRequest(options, putData);
    
    // Should return 401 Unauthorized without API key
    if (response.statusCode !== 401) {
      throw new Error(`Expected status 401 for unauthenticated request, got ${response.statusCode}`);
    }
    console.log('✅ Returns 401 for unauthenticated requests');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ PUT auth test FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

async function testFooterPutNotFound() {
  console.log('🧪 Contract Test: PUT non-existent resource');
  
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8080';
  // Test updating non-existent footer (should update the active one or create if none)
  const url = new URL('/.netlify/functions/footer', baseUrl);
  const adminApiKey = process.env.ADMIN_API_KEY || 'team-pinas-admin-2024';
  
  // This is testing the behavior when no active footer exists
  // According to our design, PUT should still work on the active config
  const updatePayload = {
    footer_text: 'Test for empty state'
  };
  
  const putData = JSON.stringify(updatePayload);
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(putData),
      'Accept': 'application/json',
      'X-API-Key': adminApiKey,
      'User-Agent': 'footer-contract-test/1.0'
    }
  };

  try {
    console.log('Testing PUT behavior when no active configuration exists...');
    const response = await makeRequest(options, putData);
    
    // This should either:
    // 1. Return 404 if no active config exists, OR
    // 2. Return 200 if it creates/updates the active config
    // We'll accept either as valid contract behavior
    if (![200, 404].includes(response.statusCode)) {
      throw new Error(`Expected status 200 or 404, got ${response.statusCode}`);
    }
    console.log(`✅ Returns appropriate status (${response.statusCode}) for empty state`);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ PUT not found test FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

// Run tests if called directly
if (require.main === module) {
  Promise.all([
    testFooterPutContract(),
    testFooterPutValidation(), 
    testFooterPutAuth(),
    testFooterPutNotFound()
  ])
    .then(results => {
      const allPassed = results.every(r => r.success);
      if (allPassed) {
        console.log('🎉 All PUT contract tests completed successfully');
        process.exit(0);
      } else {
        console.error('💥 Some PUT contract tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testFooterPutContract, testFooterPutValidation, testFooterPutAuth, testFooterPutNotFound };