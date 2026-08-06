import { Client } from 'pg';
import fsPromises from 'fs/promises';
import path from 'path';

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set.');
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔄 Running Database Migrations...');

    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations_tracker (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Smart seeding and self-healing of tracker table based on actual table existence
    const tablesCheck = await client.query(`
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'zoal_users') as has_users,
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branding_settings') as has_branding,
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'zoal_payment_transactions') as has_payments
    `);
    const { has_users, has_branding, has_payments } = tablesCheck.rows[0];

    if (has_users) {
      await client.query("INSERT INTO _migrations_tracker (name) VALUES ('001_core_schema.sql') ON CONFLICT (name) DO NOTHING");
      await client.query("INSERT INTO _migrations_tracker (name) VALUES ('003_storage_setup.sql') ON CONFLICT (name) DO NOTHING");
      await client.query("INSERT INTO _migrations_tracker (name) VALUES ('004_seed_data.sql') ON CONFLICT (name) DO NOTHING");
    } else {
      await client.query("DELETE FROM _migrations_tracker WHERE name IN ('001_core_schema.sql', '003_storage_setup.sql', '004_seed_data.sql')");
    }

    if (has_branding) {
      await client.query("INSERT INTO _migrations_tracker (name) VALUES ('002_branding_and_sync.sql') ON CONFLICT (name) DO NOTHING");
    } else {
      await client.query("DELETE FROM _migrations_tracker WHERE name = '002_branding_and_sync.sql'");
    }

    if (has_payments) {
      await client.query("INSERT INTO _migrations_tracker (name) VALUES ('005_payment_gateway_setup.sql') ON CONFLICT (name) DO NOTHING");
    } else {
      await client.query("DELETE FROM _migrations_tracker WHERE name = '005_payment_gateway_setup.sql'");
    }
    console.log('✅ Pre-existing migrations verified and synced in tracker table.');

    const migrationsDir = path.join(process.cwd(), 'migrations');
    const files = (await fsPromises.readdir(migrationsDir)).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        // Check if migration has already been executed
        const res = await client.query('SELECT 1 FROM _migrations_tracker WHERE name = $1', [file]);
        if (res.rows.length > 0) {
          console.log(`⏭️ Migration ${file} already executed. Skipping.`);
          continue;
        }

        console.log(`🚀 Executing migration: ${file}`);
        const sql = await fsPromises.readFile(path.join(migrationsDir, file), 'utf8');
        
        // Execute migration within a single transaction to ensure rollback-safety
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO _migrations_tracker (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`✅ Migration ${file} executed successfully.`);
        } catch (execErr: any) {
          await client.query('ROLLBACK');
          console.error(`❌ Error in migration ${file}:`, execErr.message || execErr);
          throw execErr;
        }
      }
    }

    console.log('✅ All migrations completed successfully.');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
