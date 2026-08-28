import fetch from 'node-fetch';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function testRuntime() {
  console.log('=== RUNTIME API & DB TEST ===');
  
  // 1. Test GET /api/products
  try {
    const res = await fetch('http://localhost:3000/api/products');
    const status = res.status;
    const body = await res.json() as any;
    console.log(`GET /api/products -> Status: ${status}, Count: ${body.products ? body.products.length : 'N/A'}`);
  } catch (err) {
    console.error('GET /api/products failed:', err);
  }

  // 2. Test Database Directly
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const dbRes = await client.query('SELECT count(*) FROM zoal_supabase_products');
    console.log(`Database zoal_supabase_products row count: ${dbRes.rows[0].count}`);

    const storageBucketsRes = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'storage'
    `).catch(() => ({ rows: [] }));
    console.log('Storage schema tables / buckets check:', storageBucketsRes.rows);

  } catch (dbErr) {
    console.error('Database connection failed:', dbErr);
  } finally {
    await client.end();
  }
}

testRuntime();
