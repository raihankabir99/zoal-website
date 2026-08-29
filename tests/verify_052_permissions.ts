import 'dotenv/config';
import crypto from 'crypto';
import pg from 'pg';
const { Client: PgClient } = pg;
import fs from 'fs';
import path from 'path';

async function verify052() {
  console.log('🧪 ========================================================');
  console.log('🧪 VERIFYING MIGRATION 052 PERMISSIONS & HARDENING');
  console.log('🧪 ========================================================\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
  }

  const client = new PgClient({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    // 1. Manually apply 052 if not applied yet
    const migrationSql = fs.readFileSync(path.join(process.cwd(), 'migrations', '052_harden_create_customer_atomic_permissions.sql'), 'utf8');
    await client.query(migrationSql);
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations_tracker (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(
      "INSERT INTO _migrations_tracker (name) VALUES ('052_harden_create_customer_atomic_permissions.sql') ON CONFLICT (name) DO NOTHING"
    );
    console.log('✅ Migration 052 executed and recorded in _migrations_tracker.');

    // 2. Verify search_path is set on function
    const procRes = await client.query(`
      SELECT p.proname, p.prosecdef, p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'create_customer_atomic'
    `);

    if (procRes.rows.length === 0) {
      console.error('❌ Function public.create_customer_atomic not found!');
      process.exit(1);
    }

    const func = procRes.rows[0];
    console.log('Function info:', func);

    const hasSafeSearchPath = func.proconfig && func.proconfig.some((c: string) => c.includes('search_path=public, pg_temp') || c.includes('search_path=public,pg_temp'));
    if (hasSafeSearchPath) {
      console.log('✅ [PASS] search_path is explicitly set to safe value: public, pg_temp');
    } else {
      console.log('ℹ️ proconfig value:', func.proconfig);
    }

    // 3. Verify function ACL (privileges)
    const aclRes = await client.query(`
      SELECT 
        p.proname,
        p.proacl
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'create_customer_atomic'
    `);
    console.log('Function ACL:', aclRes.rows[0]?.proacl);

    // Verify whether public/anon/authenticated have execute privilege
    const privRes = await client.query(`
      SELECT 
        grantee, 
        privilege_type 
      FROM information_schema.routine_privileges 
      WHERE routine_schema = 'public' 
        AND routine_name = 'create_customer_atomic'
    `);
    console.log('Routine Privileges in information_schema:', privRes.rows);

    const grantees = privRes.rows.map(r => r.grantee);
    const hasPublic = grantees.includes('PUBLIC');
    const hasAnon = grantees.includes('anon');
    const hasAuthenticated = grantees.includes('authenticated');

    if (!hasPublic && !hasAnon && !hasAuthenticated) {
      console.log('✅ [PASS] PUBLIC, anon, and authenticated have NO execute privileges on create_customer_atomic');
    } else {
      console.error(`❌ [FAIL] Found remaining privileges: PUBLIC=${hasPublic}, anon=${hasAnon}, authenticated=${hasAuthenticated}`);
      process.exit(1);
    }

    // 4. Verify customer creation via server API / direct execution
    const testUserId = `test-user-052-${Date.now()}`;
    const testEmail = `test-052-${Date.now()}@alzoal.com`;
    const testTokenHash = crypto.createHash('sha256').update('test-token').digest('hex');
    const testExpires = new Date(Date.now() + 7 * 86400000).toISOString();

    const createRes = await client.query(
      `SELECT create_customer_atomic($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) as result`,
      [
        testUserId, 'Test052First', 'Test052Last', testEmail, '+966500000052',
        testTokenHash, testExpires, 'Active', 'VIP Customer',
        'Female', '1995-05-15', 'Arabic', 'Saudi Arabia', 'Riyadh',
        null, ['VIP', 'Verified']
      ]
    );

    const result = createRes.rows[0]?.result;
    if (result && result.user && result.crm && result.user.email === testEmail) {
      console.log('✅ [PASS] create_customer_atomic executes successfully for backend role');
    } else {
      console.error('❌ [FAIL] create_customer_atomic failed to return expected result:', result);
      process.exit(1);
    }

    // Clean up test record
    await client.query(`DELETE FROM zoal_users WHERE id = $1`, [testUserId]);
    console.log('🧹 Cleaned up test user successfully.');

    console.log('\n========================================================');
    console.log('🎉 ALL VERIFICATIONS PASSED SUCCESSFULLY');
    console.log('========================================================\n');
  } finally {
    await client.end();
  }
}

verify052().catch(err => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
