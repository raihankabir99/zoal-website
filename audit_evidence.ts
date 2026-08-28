
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function audit() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- DATABASE AUDIT START ---');

    // 1. Check tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables found:', tablesRes.rows.map(r => r.table_name));

    // 2. Audit zoal_supabase_products
    if (tablesRes.rows.some(r => r.table_name === 'zoal_supabase_products')) {
      const prodCount = await client.query('SELECT COUNT(*) FROM zoal_supabase_products');
      console.log('Total Products in zoal_supabase_products:', prodCount.rows[0].count);

      const sample = await client.query('SELECT * FROM zoal_supabase_products LIMIT 1');
      if (sample.rows.length > 0) {
        console.log('Sample Product Record:', JSON.stringify(sample.rows[0], null, 2));
      }
    } else {
      console.log('zoal_supabase_products table NOT FOUND');
    }

    // 3. Audit migrations
    if (tablesRes.rows.some(r => r.table_name === '_migrations_tracker')) {
      const migs = await client.query('SELECT name, executed_at FROM _migrations_tracker ORDER BY id ASC');
      console.log('Executed Migrations:', JSON.stringify(migs.rows, null, 2));
    }

    console.log('--- DATABASE AUDIT END ---');
  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await client.end();
  }
}

audit();
