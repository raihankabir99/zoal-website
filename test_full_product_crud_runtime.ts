import fetch from 'node-fetch';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const BASE_URL = 'http://localhost:3000';
const AUTH_HEADER = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer dev-preview-token'
};

async function runRuntimeCrudAudit() {
  console.log('====================================================');
  console.log('ENTERPRISE PRODUCT MANAGEMENT RUNTIME EXECUTION AUDIT');
  console.log('====================================================');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const testId = `e5548185-3424-56e5-b65a-${Date.now().toString().slice(-12)}`;
  const testProductPayload = {
    id: testId,
    friendly_id: `c-test-${Date.now().toString().slice(-4)}`,
    name: 'ZOAL Royal Saffron Reserve Blend',
    nameEn: 'ZOAL Royal Saffron Reserve Blend',
    nameAr: 'مزيج الزعفران الملكي الفاخر',
    price: 250,
    salePrice: 210,
    category: 'coffee',
    brand: 'ZOAL Specialty Roasters',
    sku: `ZL-TEST-${Date.now().toString().slice(-5)}`,
    barcode: `628${Date.now().toString().slice(-8)}`,
    inventory: 50,
    status: 'Published',
    visibility: 'Public',
    description: 'Runtime evidence validation product item for ZOAL Enterprise platform',
    images: ['/src/assets/images/coffee-rose-tea.jpg'],
    createdAt: new Date().toISOString()
  };

  // 1. Audit POST /api/products (Create with Authentication)
  console.log('\n--- 1. POST /api/products (CREATE PRODUCT) ---');
  let createResStatus = 0;
  let createResponseBody = null;
  try {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify(testProductPayload)
    });
    createResStatus = res.status;
    createResponseBody = await res.json();
    console.log(`HTTP Status: ${createResStatus}`);
    console.log(`Response Body:`, JSON.stringify(createResponseBody, null, 2));
  } catch (err: any) {
    console.error('POST /api/products error:', err.message);
  }

  // Verify DB after Create
  const dbCheckCreate = await client.query(
    'SELECT id, friendly_id, name, price, created_at, data FROM zoal_supabase_products WHERE id::text = $1 OR friendly_id = $1',
    [testId]
  );
  console.log(`Database Record Count for ID '${testId}':`, dbCheckCreate.rows.length);
  if (dbCheckCreate.rows.length > 0) {
    console.log('DB Row Data:', JSON.stringify(dbCheckCreate.rows[0], null, 2));
  }

  // 2. Audit GET /api/products (Read & Verification across store/collection)
  console.log('\n--- 2. GET /api/products (READ & SYNC CHECK) ---');
  try {
    const res = await fetch(`${BASE_URL}/api/products`);
    const data = await res.json() as any;
    const found = data.products?.find((p: any) => p.id === testId || p.friendly_id === testId);
    console.log(`GET /api/products Status: ${res.status}`);
    console.log(`Product '${testId}' present in GET /api/products API response:`, !!found);
  } catch (err: any) {
    console.error('GET /api/products error:', err.message);
  }

  // 3. Audit UPDATE Product
  console.log('\n--- 3. POST /api/products (UPDATE EXISTING PRODUCT) ---');
  const updatedPayload = {
    ...testProductPayload,
    name: 'ZOAL Royal Saffron Reserve Blend (Updated Edition)',
    price: 295
  };
  try {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: AUTH_HEADER,
      body: JSON.stringify(updatedPayload)
    });
    console.log(`HTTP Status: ${res.status}`);
    const body = await res.json();
    console.log(`Response Body:`, JSON.stringify(body, null, 2));
  } catch (err: any) {
    console.error('Update error:', err.message);
  }

  const dbCheckUpdate = await client.query(
    'SELECT id, name, price, updated_at FROM zoal_supabase_products WHERE id::text = $1 OR friendly_id = $1',
    [testId]
  );
  if (dbCheckUpdate.rows.length > 0) {
    console.log('DB Row Data After Update:', JSON.stringify(dbCheckUpdate.rows[0], null, 2));
  }

  // 4. Audit DELETE Product
  console.log('\n--- 4. DELETE /api/products/:id (DELETE PRODUCT) ---');
  try {
    const res = await fetch(`${BASE_URL}/api/products/${encodeURIComponent(testId)}`, {
      method: 'DELETE',
      headers: AUTH_HEADER
    });
    console.log(`DELETE HTTP Status: ${res.status}`);
    const body = await res.json();
    console.log(`DELETE Response Body:`, JSON.stringify(body, null, 2));
  } catch (err: any) {
    console.error('DELETE error:', err.message);
  }

  // Verify DB after Delete
  const dbCheckDelete = await client.query(
    'SELECT count(*) FROM zoal_supabase_products WHERE id::text = $1 OR friendly_id = $1',
    [testId]
  );
  console.log(`Database Record Count After DELETE:`, dbCheckDelete.rows[0].count);

  await client.end();
  console.log('\n====================================================');
  console.log('RUNTIME EXECUTION AUDIT COMPLETE');
  console.log('====================================================');
}

runRuntimeCrudAudit();
