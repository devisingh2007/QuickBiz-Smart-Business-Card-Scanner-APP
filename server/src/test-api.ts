
const BASE_URL = 'http://127.0.0.1:5000/api';

const runTests = async () => {
  console.log('--- Starting QuickBiz API Verification Tests ---');

  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'password123';
  let token = '';
  let contactId = '';

  try {
    // 1. Test User Registration
    console.log('\n[Test 1] User Registration...');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Account',
        email: testEmail,
        password: testPassword,
      }),
    });
    const registerData: any = await registerRes.json();
    if (registerRes.ok && registerData.success) {
      console.log('✓ Registration Success! Token generated.');
      token = registerData.token;
    } else {
      throw new Error(`Registration Failed: ${JSON.stringify(registerData)}`);
    }

    // 2. Test User Login
    console.log('\n[Test 2] User Login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData: any = await loginRes.json();
    if (loginRes.ok && loginData.success) {
      console.log('✓ Login Success! Token verified.');
    } else {
      throw new Error(`Login Failed: ${JSON.stringify(loginData)}`);
    }

    // 3. Test Contact Creation
    console.log('\n[Test 3] Contact Creation...');
    const contactData = {
      name: 'John Doe',
      phones: [
        { value: '+91 98765 43210', type: 'mobile', label: 'Mobile' },
        { value: '+91 79 12345678', type: 'office', label: 'Office' }
      ],
      emails: [
        { value: 'johndoe@example.com', type: 'work' },
        { value: 'johndoe.personal@example.com', type: 'personal' }
      ],
      company: 'Antigravity Labs',
      designation: 'Staff AI Engineer',
      officeAddress: '100 Google Way, Mountain View, CA',
      websites: [
        { value: 'https://johndoe.me', type: 'work' }
      ],
      category: 'Developer',
    };
    const createRes = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(contactData),
    });
    const createData: any = await createRes.json();
    if (createRes.ok && createData.success) {
      console.log('✓ Contact Created Successfully! ID:', createData.contact._id);
      contactId = createData.contact._id;
    } else {
      throw new Error(`Contact Creation Failed: ${JSON.stringify(createData)}`);
    }

    // 4. Test Duplicate Contact Detection (should return 409 conflict)
    console.log('\n[Test 4] Duplicate Contact Detection...');
    const dupRes = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(contactData),
    });
    const dupData: any = await dupRes.json();
    if (dupRes.status === 409 && dupData.duplicate) {
      console.log('✓ Duplicate Detection Success! Warning triggered correctly.');
    } else {
      throw new Error(`Duplicate Detection Failed. Expected 409 Conflict, got ${dupRes.status}`);
    }

    // 5. Test Get Contacts & Search
    console.log('\n[Test 5] Get Contacts & Search...');
    const getRes = await fetch(`${BASE_URL}/contacts?q=Antigravity`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const getData: any = await getRes.json();
    if (getRes.ok && getData.success && getData.count > 0) {
      console.log(`✓ Get Contacts Success! Found ${getData.count} contact(s).`);
    } else {
      throw new Error(`Get Contacts Failed: ${JSON.stringify(getData)}`);
    }

    // 6. Test Update Contact
    console.log('\n[Test 6] Update Contact...');
    const updateRes = await fetch(`${BASE_URL}/contacts/${contactId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ designation: 'Principal AI Architect' }),
    });
    const updateData: any = await updateRes.json();
    if (updateRes.ok && updateData.success && updateData.contact.designation === 'Principal AI Architect') {
      console.log('✓ Contact Updated Successfully!');
    } else {
      throw new Error(`Contact Update Failed: ${JSON.stringify(updateData)}`);
    }

    // 7. Test Delete Contact
    console.log('\n[Test 7] Delete Contact...');
    const deleteRes = await fetch(`${BASE_URL}/contacts/${contactId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const deleteData: any = await deleteRes.json();
    if (deleteRes.ok && deleteData.success) {
      console.log('✓ Contact Deleted Successfully!');
    } else {
      throw new Error(`Contact Deletion Failed: ${JSON.stringify(deleteData)}`);
    }

    console.log('\n--- ALL API TESTS COMPLETED SUCCESSFULLY ---');
  } catch (error: any) {
    console.error('✗ Test failed with error:', error.message);
  }
};

runTests();
