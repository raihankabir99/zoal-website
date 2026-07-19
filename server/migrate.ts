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

    // In a real enterprise app, we would track executed migrations in a table.
    // For this implementation, we will provide a safe sequence of files.
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const files = (await fsPromises.readdir(migrationsDir)).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Executing migration: ${file}`);
        const sql = await fsPromises.readFile(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
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
