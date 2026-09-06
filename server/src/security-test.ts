/**
 * Security tests for the QuickBiz API.
 *
 * Run with: npx ts-node src/security-test.ts
 *
 * Verifies that authentication, authorization, and input validation are
 * all working correctly. In particular it checks that one user cannot
 * read, modify, or delete another user's contacts.
 */
export {};

const BASE = `http://localhost:${process.env.PORT || 5000}/api`;

let passed = 0;
let failed = 0;

// ─── Tiny test helpers ────────────────────────────────────────────────────────

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

async function registerAndLogin(email: string, name: string): Promise<string> {
  await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: 'password123' }),
  });
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  const data = await res.json() as any;
  if (!data.token) throw new Error(`Login failed for ${email}`);
  return data.token;
}

async function deleteAccount(token: string): Promise<void> {
  await fetch(`${BASE}/auth/account`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ─── Security test suite ──────────────────────────────────────────────────────

async function run(): Promise<void> {
  console.log('\n=== QuickBiz Security Tests ===\n');

  // Authentication tests (no user data needed)
  await test('Protected route returns 401 when no token is provided', async () => {
    const res = await fetch(`${BASE}/contacts`);
    expect(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('Protected route returns 401 for a malformed token', async () => {
    const res = await fetch(`${BASE}/contacts`, {
      headers: { Authorization: 'Bearer invalid.token.here' },
    });
    expect(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test('Protected route returns 401 for a tampered token', async () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJmYWtlIn0.invalidsignature';
    const res = await fetch(`${BASE}/contacts`, {
      headers: { Authorization: `Bearer ${fakeToken}` },
    });
    expect(res.status === 401, `Expected 401, got ${res.status}`);
  });

  // Set up two separate users for isolation tests
  const tokenA = await registerAndLogin('security_a@test.com', 'User A');
  const tokenB = await registerAndLogin('security_b@test.com', 'User B');

  // Create a contact as User A
  const createRes = await fetch(`${BASE}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'User A Private Contact',
      phones: [{ value: '+9999999999', type: 'mobile' }],
    }),
  });
  const createData = await createRes.json() as any;
  const contactId: string = createData.contact._id;

  // Authorization / data isolation tests
  await test('User B cannot read User A\'s contact (returns 404)', async () => {
    const res = await fetch(`${BASE}/contacts/${contactId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(res.status === 404, `Expected 404, got ${res.status}`);
  });

  await test('User B cannot update User A\'s contact (returns 404)', async () => {
    const res = await fetch(`${BASE}/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ name: 'Hacked Name' }),
    });
    expect(res.status === 404, `Expected 404, got ${res.status}`);
  });

  await test('User B cannot delete User A\'s contact (returns 404)', async () => {
    const res = await fetch(`${BASE}/contacts/${contactId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(res.status === 404, `Expected 404, got ${res.status}`);
  });

  await test('User B\'s contact list does not include User A\'s contacts', async () => {
    const res = await fetch(`${BASE}/contacts`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const data = await res.json() as any;
    const hasUserAContact = data.contacts?.some((c: any) => c._id === contactId);
    expect(!hasUserAContact, 'User B should not see User A\'s contacts');
  });

  // Input validation tests
  await test('Register rejects invalid email format', async () => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name', email: 'notanemail', password: 'password123' }),
    });
    expect(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await test('Register rejects password without a number', async () => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name', email: 'nonum@test.com', password: 'onlyletters' }),
    });
    expect(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await test('Register rejects password shorter than 8 characters', async () => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Valid Name', email: 'short@test.com', password: 'ab1' }),
    });
    expect(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await test('Contact creation rejects invalid category', async () => {
    const res = await fetch(`${BASE}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'Test', category: 'NotAValidCategory' }),
    });
    expect(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // Cleanup
  await deleteAccount(tokenA);
  await deleteAccount(tokenB);

  // Summary
  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error('\nSecurity test suite crashed:', e.message);
  process.exit(1);
});
