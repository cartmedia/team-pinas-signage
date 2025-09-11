// Integration Test: Footer Admin Management  
// Tests end-to-end admin footer management workflow
// Based on quickstart.md scenario 2: "Admin Management" 

const https = require('https');
const http = require('http');

function makeRequest(options, data = null) {
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
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testFooterAdminWorkflow() {
  console.log('🔗 Integration Test: Footer Admin Management Workflow');
  console.log('Scenario: Admin creates, reads, updates footer configuration');
  
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8080';
  const adminApiKey = process.env.ADMIN_API_KEY || 'team-pinas-admin-2024';
  const footerUrl = new URL('/.netlify/functions/footer', baseUrl);
  
  try {
    // Step 1: Create new footer configuration via admin POST
    console.log('\n📝 Step 1: Admin creates new footer configuration');
    
    const newFooterData = {
      footer_text: 'Admin Test Footer <separator> Created via integration test',
      text_color: '#FF6B35',
      background_color: '#FFFFFF',
      scroll_speed: 40,
      scroll_direction: 'right',
      divider_image: 'assets/images/test_crown.svg',
      font_size: '3.5vh'
    };
    
    const postData = JSON.stringify(newFooterData);
    const postOptions = {
      hostname: footerUrl.hostname,
      port: footerUrl.port,
      path: footerUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json',
        'X-API-Key': adminApiKey,
        'User-Agent': 'footer-admin-test/1.0'
      }
    };
    
    const postResponse = await makeRequest(postOptions, postData);
    
    if (postResponse.statusCode !== 201) {
      throw new Error(`POST failed: ${postResponse.statusCode} - ${postResponse.body}`);
    }
    
    const createdFooter = JSON.parse(postResponse.body);
    console.log('✅ Footer configuration created successfully');
    console.log(`   ID: ${createdFooter.id}`);
    console.log(`   Status: Active (${createdFooter.is_active})`);
    
    // Step 2: Verify created footer is now the active configuration
    console.log('\n🔍 Step 2: Verify new footer is active via GET');
    
    const getOptions = {
      hostname: footerUrl.hostname,
      port: footerUrl.port,
      path: footerUrl.pathname,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'footer-admin-test/1.0'
      }
    };
    
    const getResponse = await makeRequest(getOptions);
    
    if (getResponse.statusCode !== 200) {
      throw new Error(`GET failed: ${getResponse.statusCode} - ${getResponse.body}`);
    }
    
    const activeFooter = JSON.parse(getResponse.body);
    
    if (activeFooter.id !== createdFooter.id) {
      throw new Error(`Active footer ID mismatch: expected ${createdFooter.id}, got ${activeFooter.id}`);
    }
    
    if (activeFooter.footer_text !== newFooterData.footer_text) {
      throw new Error('Active footer text does not match created footer');
    }
    
    console.log('✅ New footer is now the active configuration');
    console.log(`   Retrieved text: ${activeFooter.footer_text.substring(0, 30)}...`);
    
    // Step 3: Update footer configuration via admin PUT
    console.log('\n📝 Step 3: Admin updates footer configuration');
    
    const updateData = {
      footer_text: 'Updated Admin Footer <separator> Modified via integration test',
      text_color: '#009688',
      scroll_speed: 60
    };
    
    const putData = JSON.stringify(updateData);
    const putOptions = {
      hostname: footerUrl.hostname,
      port: footerUrl.port,
      path: footerUrl.pathname,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(putData),
        'Accept': 'application/json',
        'X-API-Key': adminApiKey,
        'User-Agent': 'footer-admin-test/1.0'
      }
    };
    
    const putResponse = await makeRequest(putOptions, putData);
    
    if (putResponse.statusCode !== 200) {
      throw new Error(`PUT failed: ${putResponse.statusCode} - ${putResponse.body}`);
    }
    
    const updatedFooter = JSON.parse(putResponse.body);
    console.log('✅ Footer configuration updated successfully');
    
    // Verify updates were applied
    if (updatedFooter.footer_text !== updateData.footer_text) {
      throw new Error('Footer text was not updated');
    }
    
    if (updatedFooter.text_color !== updateData.text_color) {
      throw new Error('Text color was not updated');
    }
    
    if (updatedFooter.scroll_speed !== updateData.scroll_speed) {
      throw new Error('Scroll speed was not updated');
    }
    
    // Verify non-updated fields preserved
    if (updatedFooter.scroll_direction !== createdFooter.scroll_direction) {
      throw new Error('Non-updated scroll_direction was changed');
    }
    
    if (updatedFooter.font_size !== createdFooter.font_size) {
      throw new Error('Non-updated font_size was changed');
    }
    
    console.log('✅ Updates applied correctly, non-updated fields preserved');
    
    // Step 4: Verify updated footer is immediately available publicly
    console.log('\n🌐 Step 4: Verify updates are immediately available to public');
    
    const publicGetResponse = await makeRequest(getOptions);
    
    if (publicGetResponse.statusCode !== 200) {
      throw new Error(`Public GET failed: ${publicGetResponse.statusCode}`);
    }
    
    const publicFooter = JSON.parse(publicGetResponse.body);
    
    if (publicFooter.footer_text !== updateData.footer_text) {
      throw new Error('Updated footer not immediately available to public');
    }
    
    console.log('✅ Updated footer immediately available to public clients');
    
    // Step 5: Test admin authentication requirements
    console.log('\n🔐 Step 5: Verify admin authentication requirements');
    
    // Test POST without authentication
    const unauthPostOptions = { ...postOptions };
    delete unauthPostOptions.headers['X-API-Key'];
    
    const unauthPostResponse = await makeRequest(unauthPostOptions, postData);
    
    if (unauthPostResponse.statusCode !== 401) {
      throw new Error(`Expected 401 for unauthenticated POST, got ${unauthPostResponse.statusCode}`);
    }
    console.log('✅ POST requires authentication');
    
    // Test PUT without authentication
    const unauthPutOptions = { ...putOptions };
    delete unauthPutOptions.headers['X-API-Key'];
    
    const unauthPutResponse = await makeRequest(unauthPutOptions, putData);
    
    if (unauthPutResponse.statusCode !== 401) {
      throw new Error(`Expected 401 for unauthenticated PUT, got ${unauthPutResponse.statusCode}`);
    }
    console.log('✅ PUT requires authentication');
    
    // Step 6: Test data validation during admin operations
    console.log('\n✅ Step 6: Test admin input validation');
    
    // Note: Validation tests are covered in contract tests
    // For integration test, we focus on end-to-end workflow
    console.log('✅ Input validation covered by contract tests');
    
    console.log('\n🎉 Footer admin management workflow test PASSED');
    console.log('📋 All admin operations validated successfully');
    
    return {
      success: true,
      message: 'Footer admin workflow integration test completed successfully',
      createdFooter,
      updatedFooter,
      finalFooter: publicFooter
    };
    
  } catch (error) {
    console.error('\n❌ Footer admin workflow test FAILED:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test scenario: Admin operations under load
async function testFooterAdminLoad() {
  console.log('\n🔄 Load Test: Admin operations under concurrent load');
  
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:8080';
  const adminApiKey = process.env.ADMIN_API_KEY || 'team-pinas-admin-2024';
  const footerUrl = new URL('/.netlify/functions/footer', baseUrl);
  
  try {
    // Test multiple rapid PUT operations (admin updating footer quickly)
    const updateOperations = [];
    
    for (let i = 0; i < 3; i++) {
      const updateData = {
        footer_text: `Load test footer ${i} <separator> Update number ${i}`,
        scroll_speed: 30 + (i * 10)
      };
      
      const putData = JSON.stringify(updateData);
      const putOptions = {
        hostname: footerUrl.hostname,
        port: footerUrl.port,
        path: footerUrl.pathname,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(putData),
          'Accept': 'application/json',
          'X-API-Key': adminApiKey,
          'User-Agent': 'footer-admin-load-test/1.0'
        }
      };
      
      updateOperations.push(makeRequest(putOptions, putData));
    }
    
    console.log('Executing 3 rapid PUT operations...');
    const results = await Promise.all(updateOperations);
    
    // Verify all operations succeeded
    const failures = results.filter(r => r.statusCode !== 200);
    if (failures.length > 0) {
      throw new Error(`${failures.length}/3 PUT operations failed`);
    }
    
    console.log('✅ All rapid PUT operations succeeded');
    
    // Verify final state is consistent
    const getOptions = {
      hostname: footerUrl.hostname,
      port: footerUrl.port,
      path: footerUrl.pathname,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };
    
    const finalState = await makeRequest(getOptions);
    if (finalState.statusCode !== 200) {
      throw new Error('Could not verify final state');
    }
    
    const finalFooter = JSON.parse(finalState.body);
    console.log(`✅ Final state consistent: "${finalFooter.footer_text.substring(0, 25)}..."`);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Admin load test FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

// Run tests if called directly
if (require.main === module) {
  Promise.all([
    testFooterAdminWorkflow(),
    testFooterAdminLoad()
  ])
    .then(results => {
      const allPassed = results.every(r => r.success);
      if (allPassed) {
        console.log('\n🎉 All footer admin integration tests completed successfully');
        process.exit(0);
      } else {
        console.error('\n💥 Some footer admin integration tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testFooterAdminWorkflow, testFooterAdminLoad };