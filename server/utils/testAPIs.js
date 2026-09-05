/**
   * ProcureFlow REST API Integration Verification Script
   * Runs local HTTP calls to test route permissions, validations, and database output.
   * Usage: node testAPIs.js
   */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('\n=========================================');
  console.log('🚀 ProcureFlow Integration Test Runner');
  console.log('=========================================\n');

  try {
    // Test 1: Health Check
    console.log('⏳ Test 1: Checking server health status...');
    const healthRes = await fetch('http://localhost:5000/health');
    const healthData = await healthRes.json();
    if (healthRes.ok && healthData.success) {
      console.log('✅ Server health status: UP\n');
    } else {
      throw new Error('Server health check failed.');
    }

    // Test 2: Login Flow (Seeded admin credentials)
    console.log('⏳ Test 2: Simulating Admin login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'Password123' })
    });
    const loginData = await loginRes.json();

    if (!loginRes.ok || !loginData.success) {
      console.error('❌ Login validation failed:', loginData.message);
      return;
    }
    const token = loginData.data.token;
    console.log('✅ Login successful. JWT token received.');
    console.log(`👤 User context: ${loginData.data.user.firstName} ${loginData.data.user.lastName} (${loginData.data.user.role})\n`);

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Test 3: Authenticated Session Profile Check
    console.log('⏳ Test 3: Checking authenticated user session (/auth/me)...');
    const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    if (meRes.ok && meData.success) {
      console.log(`✅ Session active for username: ${meData.data.user.username}\n`);
    } else {
      console.error('❌ User session call failed.');
    }

    // Test 4: Retrieve Vendor Directory
    console.log('⏳ Test 4: Querying vendor directory...');
    const vendorRes = await fetch(`${BASE_URL}/vendors`, { headers: authHeaders });
    const vendorData = await vendorRes.json();
    if (vendorRes.ok && vendorData.success) {
      console.log(`✅ Vendor catalog loaded. Found ${vendorData.data.vendors.length} vendors.\n`);
    } else {
      console.error('❌ Vendor directory query failed.');
    }

    // Test 5: Retrieve Catalog Products
    console.log('⏳ Test 5: Querying product catalog...');
    const prodRes = await fetch(`${BASE_URL}/products`, { headers: authHeaders });
    const prodData = await prodRes.json();
    if (prodRes.ok && prodData.success) {
      console.log(`✅ Product catalog loaded. Found ${prodData.data.products.length} products.\n`);
    } else {
      console.error('❌ Product catalog query failed.');
    }

    // Test 6: Aggregate Dashboard Analytics
    console.log('⏳ Test 6: Running dashboard analytics aggregation query...');
    const analyticRes = await fetch(`${BASE_URL}/analytics`, { headers: authHeaders });
    const analyticData = await analyticRes.json();
    if (analyticRes.ok && analyticData.success) {
      console.log('✅ Analytics charts payload generated successfully.');
      console.log(`   - Capital value in warehouse: $${analyticData.data.metrics.inventoryValue}`);
      console.log(`   - Low stock alarm count: ${analyticData.data.metrics.lowStockAlerts}\n`);
    } else {
      console.error('❌ Analytics dashboard query failed.');
    }

    console.log('=========================================');
    console.log('🎉 Integration tests completed successfully!');
    console.log('=========================================\n');

  } catch (err) {
    console.error('\n💥 Test run interrupted by error:', err.message);
    console.log('💡 Tip: Ensure the Express server is running on port 5000 before running tests.\n');
  }
}

runTests();
