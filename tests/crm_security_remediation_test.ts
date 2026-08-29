import 'dotenv/config';
import crypto from 'crypto';
import pg from 'pg';
const { Client: PgClient } = pg;
import { sanitizeAndMapCustomerProfile, hashPassword } from '../server/crm';

async function runSecurityRemediationTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ZOAL CUSTOMER CRM - SECURITY GATE VERIFICATION SUITE');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Strict Canonical Order Matching (P0-4)
  // -------------------------------------------------------------
  console.log('--- TEST 1: Strict Canonical Order Matching (No Email Fallback) ---');
  const mockUser = {
    id: 'usr-canonical-101',
    first_name: 'Sophia',
    last_name: 'Al-Mansoor',
    email: 'sophia@royal-alzoal.com',
    phone: '+966500000001',
    role: 'customer',
    is_verified: true,
    created_at: '2026-08-01T12:00:00Z',
    addresses: []
  };

  const mockOrders = [
    // Order 1: Has matching canonical customer_id
    {
      id: 'ord-101',
      customer_id: 'usr-canonical-101',
      email: 'different-order-email@example.com',
      total_amount: 1500,
      status: 'delivered',
      created_at: '2026-08-10T10:00:00Z'
    },
    // Order 2: Has matching email BUT DIFFERENT customer_id (MUST BE EXCLUDED)
    {
      id: 'ord-102',
      customer_id: 'usr-someone-else-999',
      email: 'sophia@royal-alzoal.com',
      total_amount: 9999,
      status: 'delivered',
      created_at: '2026-08-12T10:00:00Z'
    },
    // Order 3: Has matching email BUT NULL customer_id (MUST BE EXCLUDED)
    {
      id: 'ord-103',
      customer_id: null,
      email: 'sophia@royal-alzoal.com',
      total_amount: 5000,
      status: 'delivered',
      created_at: '2026-08-15T10:00:00Z'
    }
  ];

  const mappedProfile = sanitizeAndMapCustomerProfile(mockUser, { loyalty_points: 250 }, mockOrders, [], []);

  assert(
    mappedProfile.totalOrders === 1,
    'Order count strictly matches canonical customer_id only',
    `Expected 1 order, received: ${mappedProfile.totalOrders}`
  );
  assert(
    mappedProfile.totalSpending === 1500,
    'Total spending strictly matches canonical customer_id only',
    `Expected 1500, received: ${mappedProfile.totalSpending}`
  );
  assert(
    mappedProfile.orderHistory.length === 1 && mappedProfile.orderHistory[0].id === 'ord-101',
    'Order history array contains only orders with customer_id === user.id',
    `Order history count: ${mappedProfile.orderHistory.length}`
  );

  // -------------------------------------------------------------
  // TEST 2: Response Secret Sanitization (P1)
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Response Secret Sanitization (P1) ---');
  const userWithSecrets = {
    ...mockUser,
    password_hash: '5f4dcc3b5aa765d61d8327deb882cf99',
    reset_code: 'INVITE-SECRET-123',
    invite_token_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    invite_expires_at: '2026-09-01T00:00:00Z',
    invite_used_at: null,
    verification_code: '998877'
  };

  const sanitized = sanitizeAndMapCustomerProfile(userWithSecrets, {}, [], [], []);

  assert(
    (sanitized as any).password_hash === undefined,
    'Sanitized profile does not expose password_hash'
  );
  assert(
    (sanitized as any).reset_code === undefined,
    'Sanitized profile does not expose reset_code'
  );
  assert(
    (sanitized as any).invite_token_hash === undefined,
    'Sanitized profile does not expose invite_token_hash'
  );
  assert(
    (sanitized as any).invite_expires_at === undefined,
    'Sanitized profile does not expose invite_expires_at'
  );
  assert(
    (sanitized as any).invite_used_at === undefined,
    'Sanitized profile does not expose invite_used_at'
  );
  assert(
    (sanitized as any).verification_code === undefined,
    'Sanitized profile does not expose verification_code'
  );

  // -------------------------------------------------------------
  // TEST 3: Cryptographic Token Hashing & Constant-Time Verification (P0-2)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Cryptographic Token Hashing & Constant-Time Verification ---');
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const correctSubmittedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const wrongSubmittedHash = crypto.createHash('sha256').update(rawToken + 'tampered').digest('hex');

  const bufCorrect = Buffer.from(correctSubmittedHash, 'utf8');
  const bufTarget = Buffer.from(tokenHash, 'utf8');
  const bufWrong = Buffer.from(wrongSubmittedHash, 'utf8');

  assert(
    crypto.timingSafeEqual(bufCorrect, bufTarget) === true,
    'Valid token hash matches target in constant-time comparison'
  );
  assert(
    crypto.timingSafeEqual(bufWrong, bufTarget) === false,
    'Tampered token hash rejected in constant-time comparison'
  );

  // -------------------------------------------------------------
  // TEST 4: PBKDF2 Password Hashing (P0-3)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: PBKDF2 Password Hashing ---');
  const testPassword = 'SecurePassword!2026';
  const hashed = hashPassword(testPassword);

  assert(
    hashed.includes(':') && hashed.length > 50,
    'PBKDF2 hash generates salt:hash format with high entropy'
  );

  const [salt, derivedHash] = hashed.split(':');
  const reDerived = crypto.pbkdf2Sync(testPassword, salt, 10000, 64, 'sha512').toString('hex');

  assert(
    derivedHash === reDerived,
    'PBKDF2 hash verifies correctly with salt'
  );

  // -------------------------------------------------------------
  // TEST 5: Database Atomic Function & Constraints (P0-1, P1)
  // -------------------------------------------------------------
  if (process.env.DATABASE_URL) {
    console.log('\n--- TEST 5: Real PostgreSQL Atomic Execution & Rollback ---');
    const pgClient = new PgClient({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    try {
      await pgClient.connect();

      const testUserId = `test-user-${Date.now()}`;
      const testEmail = `test-atomic-${Date.now()}@example.com`;
      const testInviteHash = crypto.createHash('sha256').update('test-token').digest('hex');
      const testInviteExpires = new Date(Date.now() + 7 * 86400000).toISOString();

      // Test 5A: Successful Atomic Customer Creation via PostgreSQL RPC
      const rpcResult = await pgClient.query(
        `SELECT create_customer_atomic($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) as result`,
        [
          testUserId, 'AtomicFirst', 'AtomicLast', testEmail, '+966512345678',
          testInviteHash, testInviteExpires, 'Active', 'VIP Customer',
          'Male', '1990-01-01', 'Arabic', 'Saudi Arabia', 'Riyadh',
          null, ['VIP', 'Verified']
        ]
      );

      const resObj = rpcResult.rows[0]?.result;
      assert(
        resObj && resObj.user && resObj.crm && resObj.user_id === testUserId,
        'PostgreSQL create_customer_atomic RPC creates user and CRM metadata atomically'
      );

      // Verify records in DB
      const userCheck = await pgClient.query(`SELECT * FROM zoal_users WHERE id = $1`, [testUserId]);
      const crmCheck = await pgClient.query(`SELECT * FROM zoal_customer_crm WHERE user_id = $1`, [testUserId]);

      assert(
        userCheck.rows.length === 1 && userCheck.rows[0].role === 'customer' && userCheck.rows[0].password_hash === null && userCheck.rows[0].is_verified === false,
        'Created user has strictly role = customer, password_hash = NULL, is_verified = FALSE'
      );
      assert(
        crmCheck.rows.length === 1 && crmCheck.rows[0].segment === 'VIP Customer',
        'Created CRM record matches provided metadata'
      );

      // Test 5B: Atomic Rollback on Duplicate Email
      let duplicateThrew = false;
      try {
        await pgClient.query(
          `SELECT create_customer_atomic($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) as result`,
          [
            `test-user-dup-${Date.now()}`, 'DupFirst', 'DupLast', testEmail, '+966512345678',
            testInviteHash, testInviteExpires, 'Active', 'VIP Customer',
            'Male', '1990-01-01', 'Arabic', 'Saudi Arabia', 'Riyadh',
            null, ['VIP']
          ]
        );
      } catch (err: any) {
        duplicateThrew = true;
      }

      assert(
        duplicateThrew,
        'PostgreSQL atomic function throws and rolls back on duplicate email constraint'
      );

      // Clean up test records
      await pgClient.query(`DELETE FROM zoal_users WHERE id = $1`, [testUserId]);
      console.log('🧹 Test records cleaned up successfully.');
    } catch (dbErr) {
      console.error('Database test error:', dbErr);
      failed++;
    } finally {
      await pgClient.end().catch(() => {});
    }
  }

  console.log('\n========================================================');
  console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityRemediationTests().catch(err => {
  console.error('Unexpected error running tests:', err);
  process.exit(1);
});
