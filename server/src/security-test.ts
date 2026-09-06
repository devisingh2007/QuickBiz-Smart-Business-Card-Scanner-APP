
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://127.0.0.1:5000/api';

const runSecurityTests = async () => {
  console.log('--- Starting QuickBiz Security Hardening Verification Tests ---');

  try {
    // 1. Test Missing Token
    console.log('\n[Security Test 1] Request with missing Authorization token...');
    const res1 = await fetch(`${BASE_URL}/contacts`, { method: 'GET' });
    const data1: any = await res1.json();
    console.log(`Status: ${res1.status} | Success: ${data1.success} | Message: ${data1.message}`);
    if (res1.status !== 401 || data1.success !== false) {
      throw new Error('Missing token test failed');
    }
    console.log('✓ Correctly rejected with 401 Unauthorized.');

    // 2. Test Malformed Token
    console.log('\n[Security Test 2] Request with malformed Authorization token...');
    const res2 = await fetch(`${BASE_URL}/contacts`, {
      method: 'GET',
      headers: { Authorization: 'Bearer malformedtokenhere123' },
    });
    const data2: any = await res2.json();
    console.log(`Status: ${res2.status} | Success: ${data2.success} | Message: ${data2.message}`);
    if (res2.status !== 401 || data2.success !== false) {
      throw new Error('Malformed token test failed');
    }
    console.log('✓ Correctly rejected with 401 Unauthorized.');

    // 3. Test Expired/Wrong JWT Key
    console.log('\n[Security Test 3] Request with token signed with invalid key...');
    const invalidToken = jwt.sign({ userId: '65c71bcf5e9c0b11e2f3a4b5' }, 'wrong_key_here', { expiresIn: '1h' });
    const res3 = await fetch(`${BASE_URL}/contacts`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${invalidToken}` },
    });
    const data3: any = await res3.json();
    console.log(`Status: ${res3.status} | Success: ${data3.success} | Message: ${data3.message}`);
    if (res3.status !== 401 || data3.success !== false) {
      throw new Error('Invalid JWT key test failed');
    }
    console.log('✓ Correctly rejected with 401 Unauthorized.');

    // 4. Test Invalid Registration (weak password)
    console.log('\n[Security Test 4] Register with weak password (only letters)...');
    const res4 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Security Test User', email: `sec_${Date.now()}@example.com`, password: 'weakpassword' }),
    });
    const data4: any = await res4.json();
    console.log(`Status: ${res4.status} | Success: ${data4.success} | Message: ${data4.message}`);
    if (res4.status !== 400 || data4.success !== false) {
      throw new Error('Weak password registration validation failed');
    }
    console.log('✓ Correctly rejected with 400 Bad Request.');

    // 5. Test Invalid Registration (short password)
    console.log('\n[Security Test 5] Register with short password (under 8 chars)...');
    const res5 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Security Test User', email: `sec_${Date.now()}@example.com`, password: 'sho1' }),
    });
    const data5: any = await res5.json();
    console.log(`Status: ${res5.status} | Success: ${data5.success} | Message: ${data5.message}`);
    if (res5.status !== 400 || data5.success !== false) {
      throw new Error('Short password registration validation failed');
    }
    console.log('✓ Correctly rejected with 400 Bad Request.');

    // 6. Test Invalid Contact Payload (malformed email)
    console.log('\n[Security Test 6] Create contact with invalid email format...');
    // Register valid user to get token
    const regMail = `sec_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid User', email: regMail, password: 'password123' }),
    });
    const regData: any = await regRes.json();
    const validToken = regData.token;

    const res6 = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        name: 'Bad Contact',
        emails: [{ value: 'not-an-email', type: 'work' }],
      }),
    });
    const data6: any = await res6.json();
    console.log(`Status: ${res6.status} | Success: ${data6.success} | Message: ${data6.message}`);
    if (res6.status !== 400 || data6.success !== false) {
      throw new Error('Invalid email payload validation failed');
    }
    console.log('✓ Correctly rejected with 400 Bad Request.');

    // 7. Test Invalid Contact Payload (malformed phone)
    console.log('\n[Security Test 7] Create contact with invalid phone format...');
    const res7 = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        name: 'Bad Contact',
        phones: [{ value: '123', type: 'mobile' }],
      }),
    });
    const data7: any = await res7.json();
    console.log(`Status: ${res7.status} | Success: ${data7.success} | Message: ${data7.message}`);
    if (res7.status !== 400 || data7.success !== false) {
      throw new Error('Invalid phone payload validation failed');
    }
    console.log('✓ Correctly rejected with 400 Bad Request.');

    // 8. Test Rate Limiting
    console.log('\n[Security Test 8] Verify rate limiting on auth register route...');
    let rateLimited = false;
    for (let i = 0; i < 25; i++) {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Brute Force User', email: `brute_${i}@example.com`, password: 'password123' }),
      });
      if (res.status === 429) {
        console.log(`✓ Triggered 429 Too Many Requests correctly at attempt ${i + 1}.`);
        rateLimited = true;
        break;
      }
    }
    if (!rateLimited) {
      throw new Error('Rate limiting test failed — did not trigger 429.');
    }

    console.log('\n--- ALL SECURITY TESTS COMPLETED SUCCESSFULLY ---');
  } catch (error: any) {
    console.error('✗ Security test failed with error:', error.message);
  }
};

runSecurityTests();