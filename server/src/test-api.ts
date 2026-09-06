/**
 * Integration tests for the QuickBiz API.
 *
 * Run with: node dist/test-api.js
 *
 * Requires the server to be running and MONGODB_URI to be set.
 * The JWT_SECRET env var must also match what the server was started with.
 */
export {};

const PORT = process.env.PORT || 5000;
const BASE = `http://localhost:${PORT}/api`;
const ROOT = `http://localhost:${PORT}`;

let passed = 0;
let failed = 0;
let token = '';
let contactId = '';
let secondContactId = '';

// ─── Test helpers ─────────────────────────────────────────────────────────────

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e: any) {
    console.error(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

function expect(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function post(path: string, body: object, authToken?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: res.status, data: await res.json() };
}

async function get(path: string, authToken?: string): Promise<any> {
  const headers: Record<string, string> = {};
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  return { status: res.status, data: await res.json() };
}

async function patch(path: string, body: object, authToken: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function del(path: string, authToken: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  return { status: res.status, data: await res.json() };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  console.log('\n=== QuickBiz API Integration Tests ===\n');

  // Root & Health checks
  await test('GET /health returns 200 and status ok', async () => {
    const res = await fetch(`${ROOT}/health`);
    expect(res.status === 200, `Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    expect(data.status?.toLowerCase() === 'ok', `Expected status "ok", got "${data.status}"`);
  });

  await test('GET / returns 200 and status OK', async () => {
    const res = await fetch(`${ROOT}/`);
    expect(res.status === 200, `Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    expect(data.status?.toUpperCase() === 'OK', `Expected status "OK", got "${data.status}"`);
  });

  await test('GET /api returns 200 and status OK', async () => {
    const res = await fetch(`${ROOT}/api`);
    expect(res.status === 200, `Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    expect(data.status?.toUpperCase() === 'OK', `Expected status "OK", got "${data.status}"`);
  });

  await test('GET /api/health returns 200 and status ok', async () => {
    const res = await fetch(`${ROOT}/api/health`);
    expect(res.status === 200, `Expected 200, got ${res.status}`);
    const data = (await res.json()) as any;
    expect(data.status?.toLowerCase() === 'ok', `Expected status "ok", got "${data.status}"`);
  });

  // Register
  await test('POST /auth/register creates a new user', async () => {
    const { status, data } = await post('/auth/register', {
      name: 'Test User',
      email: 'apitest@example.com',
      password: 'password123',
    });
    expect(status === 201, `Expected 201, got ${status}`);
    expect(data.success === true, 'Expected success: true');
    expect(typeof data.token === 'string', 'Expected a token string');
    token = data.token;
  });

  await test('POST /auth/register rejects duplicate email', async () => {
    const { status } = await post('/auth/register', {
      name: 'Test User',
      email: 'apitest@example.com',
      password: 'password123',
    });
    expect(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /auth/register rejects invalid name (too short)', async () => {
    const { status } = await post('/auth/register', {
      name: 'a',
      email: 'short@example.com',
      password: 'password123',
    });
    expect(status === 400, `Expected 400, got ${status}`);
  });

  await test('POST /auth/register rejects weak password', async () => {
    const { status } = await post('/auth/register', {
      name: 'Weak Pass',
      email: 'weak@example.com',
      password: 'abc',
    });
    expect(status === 400, `Expected 400, got ${status}`);
  });

  // Login
  await test('POST /auth/login returns a token', async () => {
    const { status, data } = await post('/auth/login', {
      email: 'apitest@example.com',
      password: 'password123',
    });
    expect(status === 200, `Expected 200, got ${status}`);
    expect(data.success === true, 'Expected success: true');
    token = data.token;
  });

  await test('POST /auth/login rejects wrong password', async () => {
    const { status } = await post('/auth/login', {
      email: 'apitest@example.com',
      password: 'wrongpassword',
    });
    expect(status === 401, `Expected 401, got ${status}`);
  });

  await test('POST /auth/login rejects invalid email format', async () => {
    const { status } = await post('/auth/login', {
      email: 'notanemail',
      password: 'password123',
    });
    expect(status === 400, `Expected 400, got ${status}`);
  });

  // Contacts
  await test('POST /contacts creates a contact', async () => {
    const { status, data } = await post(
      '/contacts',
      {
        name: 'John Doe',
        phones: [{ value: '+1234567890', type: 'mobile' }],
        emails: [{ value: 'john@example.com', type: 'work' }],
        category: 'Client',
      },
      token,
    );
    expect(status === 201, `Expected 201, got ${status}`);
    expect(data.success === true, 'Expected success: true');
    expect(typeof data.contact._id === 'string', 'Expected a contact _id');
    contactId = data.contact._id;
  });

  await test('POST /contacts creates a second contact for update tests', async () => {
    const { status, data } = await post(
      '/contacts',
      {
        name: 'Alice Smith',
        phones: [{ value: '+1987654321', type: 'mobile' }],
        emails: [{ value: 'alice@example.com', type: 'work' }],
        category: 'Investor',
      },
      token,
    );
    expect(status === 201, `Expected 201, got ${status}`);
    secondContactId = data.contact._id;
  });

  await test('POST /contacts detects duplicate phone or email (409 Conflict)', async () => {
    const { status, data } = await post(
      '/contacts',
      {
        name: 'Duplicate John',
        phones: [{ value: '+1234567890', type: 'mobile' }],
        emails: [{ value: 'john@example.com', type: 'work' }],
      },
      token,
    );
    expect(status === 409, `Expected 409, got ${status}`);
    expect(data.duplicate === true, 'Expected duplicate: true');
  });

  await test('POST /contacts allows forceSave=true to bypass duplicate detection', async () => {
    const { status, data } = await post(
      '/contacts',
      {
        name: 'Duplicate John Allowed',
        phones: [{ value: '+1234567890', type: 'mobile' }],
        emails: [{ value: 'john@example.com', type: 'work' }],
        forceSave: true,
      },
      token,
    );
    expect(status === 201, `Expected 201, got ${status}`);
    expect(data.success === true, 'Expected success: true');
    if (data.contact?._id) {
      await del(`/contacts/${data.contact._id}`, token);
    }
  });

  await test('GET /contacts returns the user contacts list', async () => {
    const { status, data } = await get('/contacts', token);
    expect(status === 200, `Expected 200, got ${status}`);
    expect(Array.isArray(data.contacts), 'Expected contacts array');
    expect(data.contacts.length >= 2, 'Expected at least 2 contacts');
  });

  await test('GET /contacts/:id returns a single contact', async () => {
    const { status, data } = await get(`/contacts/${contactId}`, token);
    expect(status === 200, `Expected 200, got ${status}`);
    expect(data.contact._id === contactId, 'Expected correct contact');
  });

  await test('GET /contacts/:id with invalid ObjectId returns 400 Bad Request', async () => {
    const { status } = await get('/contacts/invalid-id-123', token);
    expect(status === 400, `Expected 400, got ${status}`);
  });

  await test('PATCH /contacts/:id updates a contact and ignores forbidden fields', async () => {
    const { status, data } = await patch(
      `/contacts/${contactId}`,
      { company: 'ACME Corp', userId: '507f1f77bcf86cd799439011' },
      token
    );
    expect(status === 200, `Expected 200, got ${status}`);
    expect(data.contact.company === 'ACME Corp', 'Expected company to be updated');
    expect(data.contact.userId !== '507f1f77bcf86cd799439011', 'userId should not be overwritten');
  });

  await test('PATCH /contacts/:id detects duplicate phone/email of another contact (409 Conflict)', async () => {
    const { status, data } = await patch(
      `/contacts/${secondContactId}`,
      { emails: [{ value: 'john@example.com', type: 'work' }] },
      token
    );
    expect(status === 409, `Expected 409, got ${status}`);
    expect(data.duplicate === true, 'Expected duplicate: true');
  });

  await test('PATCH /contacts/:id with invalid ObjectId returns 400 Bad Request', async () => {
    const { status } = await patch('/contacts/invalid-id-123', { name: 'Test' }, token);
    expect(status === 400, `Expected 400, got ${status}`);
  });

  await test('GET /contacts supports search query with special regex characters safely', async () => {
    const { status, data } = await get('/contacts?q=[+*?()', token);
    expect(status === 200, `Expected 200, got ${status}`);
    expect(Array.isArray(data.contacts), 'Expected contacts array');
  });

  await test('GET /contacts handles invalid non-numeric pagination safely without NaN', async () => {
    const { status, data } = await get('/contacts?page=abc&limit=xyz', token);
    expect(status === 200, `Expected 200, got ${status}`);
    expect(data.pagination.page === 1, 'Expected page to default to 1');
    expect(data.pagination.limit === 20, 'Expected limit to default to 20');
  });

  await test('GET /contacts supports category filter', async () => {
    const { status, data } = await get('/contacts?category=Client', token);
    expect(status === 200, `Expected 200, got ${status}`);
    expect(Array.isArray(data.contacts), 'Expected contacts array');
  });

  await test('DELETE /contacts/:id with invalid ObjectId returns 400 Bad Request', async () => {
    const { status } = await del('/contacts/invalid-id-123', token);
    expect(status === 400, `Expected 400, got ${status}`);
  });

  await test('DELETE /contacts/:id deletes a contact', async () => {
    const { status, data } = await del(`/contacts/${contactId}`, token);
    expect(status === 200, `Expected 200, got ${status}`);
    expect(data.success === true, 'Expected success: true');
  });

  await test('GET /contacts/:id returns 404 after deletion', async () => {
    const { status } = await get(`/contacts/${contactId}`, token);
    expect(status === 404, `Expected 404, got ${status}`);
  });

  // Account deletion
  await test('DELETE /auth/account removes user and all contacts', async () => {
    const { status, data } = await del('/auth/account', token);
    expect(status === 200, `Expected 200, got ${status}`);
    expect(data.success === true, 'Expected success: true');
  });

  // Summary
  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error('\nTest suite crashed:', e.message);
  process.exit(1);
});
