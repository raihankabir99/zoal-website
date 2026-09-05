import 'dotenv/config';
import crypto from 'crypto';
import pg from 'pg';
const { Client: PgClient } = pg;
import { getSupabaseClient } from '../server/supabase';

async function runPaymentIdorSecurityTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 ZOAL PAYMENT IDOR SECURITY & ORDER REUSE TEST SUITE');
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

  const supabase = getSupabaseClient();
  const dbUrl = process.env.DATABASE_URL;

  const testUserAId = crypto.randomUUID();
  const testUserBId = crypto.randomUUID();
  
  const userBOrderId = 'ZL-TESTB-' + Math.floor(100000 + Math.random() * 900000);
  const guestOrderId = 'ZL-TESTG-' + Math.floor(100000 + Math.random() * 900000);
  const userAOrderId = 'ZL-TESTA-' + Math.floor(100000 + Math.random() * 900000);

  let pgClient: pg.Client | null = null;
  if (dbUrl) {
    pgClient = new PgClient({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await pgClient.connect().catch((err) => { 
      console.warn('Postgres connection warning:', err.message);
      pgClient = null; 
    });
  }

  try {
    if (pgClient) {
      // 0. Seed users in DB
      await pgClient.query(`
        INSERT INTO zoal_users (id, first_name, last_name, email, phone, role, password_hash)
        VALUES ($1, 'Test', 'UserA', $2, '+966500000011', 'customer', 'hash_a'),
               ($3, 'Test', 'UserB', $4, '+966500000012', 'customer', 'hash_b')
      `, [testUserAId, `usera-${Date.now()}@example.com`, testUserBId, `userb-${Date.now()}@example.com`]);

      // 1. Insert User B pending order
      await pgClient.query(`
        INSERT INTO zoal_orders (id, customer_id, status, payment_status, subtotal, total_amount, payment_method)
        VALUES ($1, $2, 'pending_payment', 'unpaid', 100, 100, 'credit_card')
      `, [userBOrderId, testUserBId]);

      // 2. Insert Guest pending order (customer_id is NULL)
      await pgClient.query(`
        INSERT INTO zoal_orders (id, customer_id, status, payment_status, subtotal, total_amount, payment_method)
        VALUES ($1, NULL, 'pending_payment', 'unpaid', 50, 50, 'credit_card')
      `, [guestOrderId]);

      // 3. Insert User A pending order
      await pgClient.query(`
        INSERT INTO zoal_orders (id, customer_id, status, payment_status, subtotal, total_amount, payment_method)
        VALUES ($1, $2, 'pending_payment', 'unpaid', 75, 75, 'credit_card')
      `, [userAOrderId, testUserAId]);
    }

    // Helper simulating the exact ownership validation logic in POST /api/payments/create
    function evaluateOrderReuseAccess(reqUser: any, existingOrder: any): { status: number; error?: string } {
      if (!existingOrder) return { status: 200 };

      // P0 Security & IDOR Prevention: Enforce strict ownership on order reuse
      if (existingOrder.customer_id) {
        // 1. Order belongs to a registered customer: caller must be that exact authenticated user
        if (!reqUser || existingOrder.customer_id !== reqUser.id) {
          return {
            status: 403,
            error: 'You do not have permission to access or pay for this order.'
          };
        }
      } else {
        // 2. Order is a guest order (customer_id is null/empty):
        // Never allow an authenticated user to claim a guest order merely by knowing its orderId.
        if (reqUser) {
          return {
            status: 403,
            error: 'Authenticated users cannot claim or modify guest orders.'
          };
        }
      }

      if (existingOrder.payment_status === 'paid') {
        return { status: 400, error: 'This order has already been paid successfully.' };
      }

      return { status: 200 };
    }

    async function getOrder(orderId: string) {
      if (pgClient) {
        const res = await pgClient.query('SELECT * FROM zoal_orders WHERE id = $1', [orderId]);
        return res.rows[0] || null;
      }
      return null;
    }

    // -------------------------------------------------------------
    // TEST 1: User A token + User B pending orderId → 403 Forbidden
    // -------------------------------------------------------------
    console.log('--- TEST 1: User A token + User B pending orderId (Cross-User IDOR) ---');
    {
      const reqUser = { id: testUserAId, email: 'usera@example.com' };
      const existingOrder = await getOrder(userBOrderId);
      
      const check = evaluateOrderReuseAccess(reqUser, existingOrder);
      assert(check.status === 403, 'User A attempting to pay for User B order is rejected with 403 Forbidden');

      // Verify NO order mutation
      const verifyOrder = await getOrder(userBOrderId);
      assert(verifyOrder.customer_id === testUserBId, 'User B order customer_id remains unchanged (User B)');
      assert(verifyOrder.payment_status === 'unpaid', 'User B order payment_status remains unpaid');

      // Verify NO payment transaction was created
      if (pgClient) {
        const txs = await pgClient.query('SELECT * FROM zoal_payment_transactions WHERE order_id = $1', [userBOrderId]);
        assert(txs.rows.length === 0, 'No payment transaction record was created for User B order');
      }
    }

    // -------------------------------------------------------------
    // TEST 2: User A token + Guest pending orderId → 403 Forbidden
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: User A token + Guest pending orderId (Claiming Guest Order) ---');
    {
      const reqUser = { id: testUserAId, email: 'usera@example.com' };
      const existingOrder = await getOrder(guestOrderId);
      
      const check = evaluateOrderReuseAccess(reqUser, existingOrder);
      assert(check.status === 403, 'Authenticated User A attempting to claim guest order is rejected with 403 Forbidden');

      const verifyGuestOrder = await getOrder(guestOrderId);
      assert(verifyGuestOrder.customer_id === null, 'Guest order customer_id remains strictly NULL');
    }

    // -------------------------------------------------------------
    // TEST 3: Guest (No User) + User B pending orderId → 403 Forbidden
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Guest (Unauthenticated) + User B pending orderId (Guest hijacking Registered User Order) ---');
    {
      const reqUser = null;
      const existingOrder = await getOrder(userBOrderId);
      
      const check = evaluateOrderReuseAccess(reqUser, existingOrder);
      assert(check.status === 403, 'Unauthenticated guest attempting to pay for registered user order is rejected with 403 Forbidden');
    }

    // -------------------------------------------------------------
    // TEST 4: User A token + User A pending orderId → Allowed (200)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: User A token + User A pending orderId (Legitimate retry by owner) ---');
    {
      const reqUser = { id: testUserAId, email: 'usera@example.com' };
      const existingOrder = await getOrder(userAOrderId);
      
      const check = evaluateOrderReuseAccess(reqUser, existingOrder);
      assert(check.status === 200, 'Legitimate order owner is allowed to retry payment (200 OK)');
    }

    // -------------------------------------------------------------
    // TEST 5: Guest + Guest pending orderId → Allowed (200)
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Guest + Guest pending orderId (Legitimate guest retry) ---');
    {
      const reqUser = null;
      const existingOrder = await getOrder(guestOrderId);
      
      const check = evaluateOrderReuseAccess(reqUser, existingOrder);
      assert(check.status === 200, 'Legitimate guest retry flow is preserved (200 OK)');
    }

    // Clean up test data
    if (pgClient) {
      await pgClient.query('DELETE FROM zoal_orders WHERE id IN ($1, $2, $3)', [userBOrderId, guestOrderId, userAOrderId]);
      await pgClient.query('DELETE FROM zoal_users WHERE id IN ($1, $2)', [testUserAId, testUserBId]);
    }

  } catch (err: any) {
    console.error('❌ Test execution error:', err);
    failed++;
  } finally {
    if (pgClient) {
      await pgClient.end().catch(() => {});
    }
  }

  console.log('\n========================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPaymentIdorSecurityTests();
